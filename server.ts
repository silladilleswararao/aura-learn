import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper that automatically retries across active Gemini Flash models if one returns 503/429
const MODEL_CANDIDATES = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

async function generateWithFallback(
  ai: GoogleGenAI,
  params: { contents: any; config?: any }
) {
  let lastError: any = null;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} returned error (${err?.status || err?.message}), trying next...`);
    }
  }
  throw lastError || new Error('All Gemini model candidates failed');
}

// Server-side PDF text extraction using pdfjs-dist legacy build
async function extractPdfBufferServerSide(
  base64Data: string
): Promise<{ pageNumber: number; text: string }[]> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const binary = Buffer.from(base64Data, 'base64');
    const uint8 = new Uint8Array(binary);
    const loadingTask = pdfjs.getDocument({
      data: uint8,
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;
    const pages: { pageNumber: number; text: string }[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 0) {
        pages.push({ pageNumber: pageNum, text });
      }
    }
    return pages;
  } catch (err) {
    console.warn('Server-side pdfjs extraction warning:', err);
    return [];
  }
}

interface IncomingChunk {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  topic: string;
  text: string;
  keywords?: string[];
  embedding?: number[];
}

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'of', 'for',
  'with', 'as', 'by', 'that', 'this', 'it', 'from', 'or', 'are', 'be', 'was',
  'were', 'what', 'how', 'why', 'when', 'where', 'who', 'can', 'you', 'explain',
  'tell', 'me', 'about', 'give', 'example', 'notes', 'according', 'document',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function rankChunksLexically(
  query: string,
  chunks: IncomingChunk[],
  conversationContext = ''
): { chunk: IncomingChunk; score: number }[] {
  const queryTokens = tokenize(query);
  const contextTokens = tokenize(conversationContext);

  const isGeneralSummaryQuery =
    queryTokens.length === 0 ||
    /summarize|summary|key points|overview|important|exam|everything|main topics|explain|simply|example|notes|topic/i.test(
      query
    );

  return chunks
    .map((chunk, idx) => {
      const chunkLower = chunk.text.toLowerCase();
      const topicLower = (chunk.topic || '').toLowerCase();
      const chunkTokens = new Set(tokenize(chunk.text + ' ' + chunk.topic));

      let score = 0;
      for (const qt of queryTokens) {
        if (chunkTokens.has(qt)) {
          score += 3.0;
        } else if (chunkLower.includes(qt)) {
          score += 1.8;
        }
        if (topicLower.includes(qt)) {
          score += 2.5;
        }
      }

      if (score < 3 && contextTokens.length > 0) {
        for (const ct of contextTokens) {
          if (chunkTokens.has(ct)) {
            score += 0.9;
          }
          if (topicLower.includes(ct)) {
            score += 1.2;
          }
        }
      }

      if (isGeneralSummaryQuery && score === 0) {
        score = 2.0 + (chunks.length - idx) * 0.05;
      }

      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score);
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );
  res.json({ ok: true, geminiConfigured: hasKey });
});

// Universal Multimodal File, PDF & Picture Extractor
app.post('/api/extract-media', async (req, res) => {
  try {
    const { fileName, mimeType, base64Data, fallbackText } = req.body as {
      fileName: string;
      mimeType: string;
      base64Data?: string;
      fallbackText?: string;
    };

    const cleanMime = (mimeType || 'application/octet-stream').toLowerCase();

    // 1. If it's a PDF, first try fast server-side PDF.js text extraction AND check that real readable words were found
    if ((cleanMime === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf')) && base64Data) {
      const serverPdfPages = await extractPdfBufferServerSide(base64Data);
      const totalWords = serverPdfPages
        .map((p) => (p.text.match(/\b[a-zA-Z]{3,}\b/g) || []).length)
        .reduce((a, b) => a + b, 0);
      if (serverPdfPages.length > 0 && totalWords >= 15) {
        res.json({ pages: serverPdfPages, method: 'server-pdfjs' });
        return;
      }
    }

    // 2. Use Gemini Multimodal Vision / Audio / Document extraction
    const ai = getAiClient();
    const isSupportedInlineMime =
      cleanMime.startsWith('image/') ||
      cleanMime === 'application/pdf' ||
      cleanMime.startsWith('audio/') ||
      cleanMime.startsWith('video/') ||
      cleanMime.startsWith('text/');

    if (ai && base64Data && isSupportedInlineMime) {
      try {
        const extractionPrompt = cleanMime.startsWith('image/')
          ? `You are an expert academic OCR and visual study assistant. Examine this uploaded image ("${fileName}") carefully.
1. Extract ALL readable text, handwritten notes, printed text, equations, formulas, code snippets, and table values verbatim.
2. Describe any diagrams, charts, graphs, flowcharts, or visual structures in detail so a student can ask questions and be quizzed on every concept shown in the picture.
3. Organize the extracted knowledge into clear logical sections separated by "=== PAGE 1 ===", "=== PAGE 2 ===", etc.`
          : cleanMime.startsWith('audio/')
          ? `Transcribe this study audio recording ("${fileName}") accurately and organize the transcript into logical study sections.`
          : `Extract all readable text, headings, definitions, formulas, and key concepts from this document ("${fileName}") clearly and completely. Separate pages or major sections with "=== PAGE 1 ===", "=== PAGE 2 ===", etc.`;

        const response = await generateWithFallback(ai, {
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: base64Data,
                },
              },
              {
                text: extractionPrompt,
              },
            ],
          },
          config: {
            temperature: 0.1,
          },
        });

        const rawText = (response.text || '').trim();
        if (rawText.length > 0) {
          const splitBlocks = rawText
            .split(/===\s*PAGE\s*\d+\s*===/i)
            .map((b) => b.trim())
            .filter((b) => b.length > 0);
          const validPages =
            splitBlocks.length > 0
              ? splitBlocks.map((text, idx) => ({ pageNumber: idx + 1, text }))
              : [{ pageNumber: 1, text: rawText }];
          res.json({ pages: validPages, method: 'gemini-multimodal' });
          return;
        }
      } catch (err) {
        console.error('Multimodal extraction error, falling back:', err);
      }
    }

    if (fallbackText && fallbackText.trim().length > 0) {
      res.json({
        pages: [{ pageNumber: 1, text: fallbackText.trim() }],
        method: 'fallback-text',
      });
      return;
    }

    res.status(422).json({
      error: `Could not extract readable text from "${fileName}". Please try another file or clear picture.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to extract media content.' });
  }
});

// 1. Embeddings endpoint
app.post('/api/embeddings', async (req, res) => {
  try {
    const { texts } = req.body as { texts: string[] };
    if (!Array.isArray(texts) || texts.length === 0) {
      res.status(400).json({ error: 'texts array is required' });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.json({ embeddings: [], mode: 'lexical-hybrid' });
      return;
    }

    const batch = texts.slice(0, 32);
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: batch,
    });

    const vectors = (result.embeddings || []).map((e) => e.values || []);
    res.json({ embeddings: vectors, mode: 'gemini-embedding-2-preview' });
  } catch (err: any) {
    res.json({
      embeddings: [],
      mode: 'lexical-hybrid',
      warning: err?.message || 'Using hybrid lexical-semantic indexing',
    });
  }
});

// 2. Ask Aura (Smart ChatGPT + Document Knowledge Assistant)
app.post('/api/ask', async (req, res) => {
  try {
    const {
      question,
      chunks = [],
      history = [],
      explainStyle = 'simple',
    } = req.body as {
      question: string;
      chunks?: IncomingChunk[];
      history?: { role: string; content: string }[];
      explainStyle?: string;
    };

    if (!question || !question.trim()) {
      res.status(400).json({ error: 'Please enter a valid question.' });
      return;
    }

    const recentContext = history
      .slice(-4)
      .map((m) => m.content)
      .join(' ');

    const lexicalRanked =
      Array.isArray(chunks) && chunks.length > 0
        ? rankChunksLexically(question, chunks, recentContext)
        : [];

    const ai = getAiClient();
    let finalRanked = lexicalRanked;

    if (ai && chunks.some((c) => Array.isArray(c.embedding) && c.embedding.length > 0)) {
      try {
        const embedRes = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: [question],
        });
        const queryVector = embedRes.embeddings?.[0]?.values;
        if (queryVector && queryVector.length > 0) {
          finalRanked = lexicalRanked
            .map((item) => {
              const vecScore = item.chunk.embedding
                ? cosineSimilarity(queryVector, item.chunk.embedding) * 10
                : 0;
              return {
                chunk: item.chunk,
                score: item.score + vecScore,
              };
            })
            .sort((a, b) => b.score - a.score);
        }
      } catch {
        // Use lexical ranking if query embedding fails
      }
    }

    // Retrieve up to 10 chunks so entire uploaded PDFs/files are thoroughly covered
    const topMatches = finalRanked.filter((m) => m.score > 0).slice(0, 10);
    const retrievedChunks =
      topMatches.length > 0 ? topMatches.map((m) => m.chunk) : chunks.slice(0, 10);

    const contextBlock =
      retrievedChunks.length > 0
        ? retrievedChunks
            .map(
              (c) =>
                `[CHUNK_ID: ${c.id}] [Document: ${c.documentName} | Page: ${c.pageNumber} | Topic: ${c.topic}]\n${c.text}`
            )
            .join('\n\n---\n\n')
        : 'No uploaded document selected.';

    const historyText = history
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'Student' : 'Aura'}: ${h.content}`)
      .join('\n');

    const styleInstruction =
      explainStyle === 'step_by_step'
        ? 'Explain step-by-step in numbered stages so a beginner can follow every single part easily.'
        : explainStyle === 'summary'
        ? 'Provide a crisp, well-organized summary with key bullet points and main takeaways.'
        : explainStyle === 'exam'
        ? 'Format the response as high-scoring exam notes with clear definitions, key points to write in an exam, and likely exam questions.'
        : explainStyle === 'detailed'
        ? 'Provide a deep, comprehensive explanation covering all nuances, theory, formulas/mechanisms, and practical examples.'
        : 'Explain in very simple, friendly, easy-to-understand words (just like ChatGPT teaching a student) with clear bullet points and a relatable real-life example.';

    if (ai) {
      try {
        const prompt = `You are Aura, an intelligent, friendly ChatGPT-style AI assistant and personal study tutor inside Aura Learn.

PREFERRED EXPLANATION STYLE:
${styleInstruction}

CRITICAL INSTRUCTIONS:
1. Answer ANY question the user asks — whether it is about their uploaded PDF/picture/notes OR any general question on any subject (science, coding, math, history, language, daily life, exam prep, etc.) just like ChatGPT!
2. If the user asks to explain, summarize, or answer from their uploaded file/PDF (or if their question matches the UPLOADED STUDY MATERIAL CHUNKS below):
   - Base your explanation on their uploaded document chunks and explain the content clearly, simply, and thoroughly according to the Preferred Explanation Style above.
   - Do NOT mention unrelated subjects that are not in the user's question or uploaded file.
3. If the user asks a general question that is NOT in the uploaded chunks (or if no document is uploaded):
   - Completely ignore any unrelated document chunks and answer the user's question directly, accurately, and simply just like ChatGPT!
4. Format your response cleanly using readable paragraphs, bullet points (•), and **bold** key terms.
5. At the very end of your response, add these two metadata lines on their own lines:
GROUNDED_IN_FILE: YES (if you used the uploaded chunks) or NO (if you answered from general AI knowledge)
FOLLOW_UPS: Question 1? | Question 2? | Question 3?

RECENT CONVERSATION HISTORY:
${historyText || 'None'}

UPLOADED STUDY MATERIAL CHUNKS:
${contextBlock}

USER QUESTION:
${question}`;

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            temperature: 0.4,
          },
        });

        const rawOutput = (response.text || '').trim();
        if (rawOutput.length > 0) {
          let cleanAnswer = rawOutput;
          let groundedFlag = false;
          let followUps: string[] = [];

          const groundedMatch = cleanAnswer.match(/GROUNDED_IN_FILE:\s*(YES|NO)/i);
          if (groundedMatch) {
            groundedFlag = groundedMatch[1].toUpperCase() === 'YES';
            cleanAnswer = cleanAnswer.replace(/GROUNDED_IN_FILE:\s*(YES|NO).*/gi, '').trim();
          } else if (retrievedChunks.length > 0 && /pdf|document|file|notes|summarize|explain this/i.test(question)) {
            groundedFlag = true;
          }

          const followUpMatch = cleanAnswer.match(/FOLLOW_UPS:\s*(.+)/i);
          if (followUpMatch) {
            followUps = followUpMatch[1]
              .split('|')
              .map((s) => s.trim())
              .filter((s) => s.length > 3)
              .slice(0, 3);
            cleanAnswer = cleanAnswer.replace(/FOLLOW_UPS:\s*.+/gi, '').trim();
          }

          const isGrounded = groundedFlag && retrievedChunks.length > 0;
          const sources = isGrounded
            ? retrievedChunks.slice(0, 3).map((c, idx) => ({
                chunkId: c.id,
                documentId: c.documentId,
                documentName: c.documentName,
                pageNumber: c.pageNumber,
                topic: c.topic,
                snippet: c.text.slice(0, 280) + (c.text.length > 280 ? '...' : ''),
                relevanceScore: Math.max(0.78, 0.96 - idx * 0.05),
              }))
            : [];

          res.json({
            answer: cleanAnswer,
            grounded: isGrounded,
            sources,
            followUpSuggestions:
              followUps.length > 0
                ? followUps
                : [
                    'Explain this in even simpler words with an example',
                    'Give me short bullet points for quick revision',
                    'What are the most important exam questions on this?',
                  ],
            detectedTopics: isGrounded
              ? Array.from(new Set(retrievedChunks.slice(0, 3).map((c) => c.topic)))
              : [],
          });
          return;
        }
      } catch (apiErr) {
        console.error('Gemini /api/ask error:', apiErr);
      }
    }

    const topThree = retrievedChunks.slice(0, 3);
    const synthesized =
      topThree.length > 0
        ? `Here is the key information from **${topThree[0].documentName}** (Page ${topThree[0].pageNumber}):\n\n` +
          topThree.map((c) => `• ${c.text}`).join('\n\n')
        : 'I am ready to help! Please try asking your question again in a moment.';

    res.json({
      answer: synthesized,
      grounded: topThree.length > 0,
      sources: topThree.map((c, idx) => ({
        chunkId: c.id,
        documentId: c.documentId,
        documentName: c.documentName,
        pageNumber: c.pageNumber,
        topic: c.topic,
        snippet: c.text.slice(0, 280) + (c.text.length > 280 ? '...' : ''),
        relevanceScore: Math.max(0.75, 0.94 - idx * 0.07),
      })),
      followUpSuggestions: [
        'Explain this concept simply with an example',
        'What should I remember for the exam?',
        'Summarize the key points',
      ],
      detectedTopics: Array.from(new Set(topThree.map((c) => c.topic))),
    });
  } catch (err: any) {
    res.status(500).json({
      error: err?.message || 'Failed to process your question. Please try again.',
    });
  }
});

// 3. Study Mode Generator
app.post('/api/study-guide', async (req, res) => {
  try {
    const { chunks, scopeLabel = 'Selected Study Material' } = req.body as {
      chunks: IncomingChunk[];
      scopeLabel?: string;
    };

    if (!Array.isArray(chunks) || chunks.length === 0) {
      res.status(400).json({ error: 'No study chunks provided.' });
      return;
    }

    const sampledChunks = chunks.slice(0, 14);
    const contextBlock = sampledChunks
      .map(
        (c) =>
          `[Document: ${c.documentName} | Page: ${c.pageNumber} | Topic: ${c.topic}]\n${c.text}`
      )
      .join('\n\n---\n\n');

    const ai = getAiClient();
    if (ai) {
      try {
        const prompt = `You are Aura, a student revision assistant. Generate a comprehensive, structured Study Guide grounded strictly and exclusively in the following uploaded study material chunks. Do NOT include outside information or mention topics not in the chunks.

STUDY MATERIAL CHUNKS (${scopeLabel}):
${contextBlock}`;

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            temperature: 0.25,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                quickSummary: { type: Type.STRING },
                keyConcepts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      remember: { type: Type.STRING },
                      important: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      documentName: { type: Type.STRING },
                      pageNumber: { type: Type.INTEGER },
                      sourceSnippet: { type: Type.STRING },
                    },
                    required: [
                      'title',
                      'definition',
                      'remember',
                      'important',
                      'topic',
                      'documentName',
                      'pageNumber',
                      'sourceSnippet',
                    ],
                  },
                },
                importantDefinitions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      documentName: { type: Type.STRING },
                      pageNumber: { type: Type.INTEGER },
                    },
                    required: ['term', 'definition', 'topic', 'documentName', 'pageNumber'],
                  },
                },
                importantPoints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      point: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      documentName: { type: Type.STRING },
                      pageNumber: { type: Type.INTEGER },
                    },
                    required: ['point', 'topic', 'documentName', 'pageNumber'],
                  },
                },
                topicBreakdown: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      topic: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                      pageRange: { type: Type.STRING },
                      documentName: { type: Type.STRING },
                    },
                    required: ['topic', 'summary', 'keyTakeaways', 'pageRange', 'documentName'],
                  },
                },
                importantQuestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      briefAnswer: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      documentName: { type: Type.STRING },
                      pageNumber: { type: Type.INTEGER },
                    },
                    required: ['question', 'briefAnswer', 'topic', 'documentName', 'pageNumber'],
                  },
                },
                quickRevision: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      prompt: { type: Type.STRING },
                      flashAnswer: { type: Type.STRING },
                      topic: { type: Type.STRING },
                    },
                    required: ['prompt', 'flashAnswer', 'topic'],
                  },
                },
              },
              required: [
                'quickSummary',
                'keyConcepts',
                'importantDefinitions',
                'importantPoints',
                'topicBreakdown',
                'importantQuestions',
                'quickRevision',
              ],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        res.json({
          generatedAt: new Date().toISOString(),
          scopeLabel,
          ...parsed,
        });
        return;
      } catch (err) {
        console.error('Gemini /api/study-guide error, using deterministic chunk extractor:', err);
      }
    }

    const topics = Array.from(new Set(sampledChunks.map((c) => c.topic)));
    res.json({
      generatedAt: new Date().toISOString(),
      scopeLabel,
      quickSummary: sampledChunks
        .slice(0, 3)
        .map((c) => c.text.split('.').slice(0, 2).join('.') + '.')
        .join(' '),
      keyConcepts: sampledChunks.slice(0, 4).map((c) => {
        const sentences = c.text.split(/(?<=[.!?])\s+/);
        return {
          title: c.topic,
          definition: sentences[0] || c.text.slice(0, 140),
          remember: sentences[1] || 'Core principle emphasized in your uploaded notes.',
          important: sentences[2] || sentences[0] || c.text.slice(0, 120),
          topic: c.topic,
          documentName: c.documentName,
          pageNumber: c.pageNumber,
          sourceSnippet: c.text.slice(0, 220),
        };
      }),
      importantDefinitions: sampledChunks.slice(0, 5).map((c) => ({
        term: c.topic,
        definition: c.text.split(/(?<=[.!?])\s+/)[0] || c.text.slice(0, 160),
        topic: c.topic,
        documentName: c.documentName,
        pageNumber: c.pageNumber,
      })),
      importantPoints: sampledChunks.slice(0, 6).map((c) => ({
        point: c.text.split(/(?<=[.!?])\s+/).slice(0, 2).join(' '),
        topic: c.topic,
        documentName: c.documentName,
        pageNumber: c.pageNumber,
      })),
      topicBreakdown: topics.map((t) => {
        const matching = sampledChunks.filter((c) => c.topic === t);
        const first = matching[0];
        return {
          topic: t,
          summary: first.text.slice(0, 240),
          keyTakeaways: matching
            .flatMap((m) => m.text.split(/(?<=[.!?])\s+/).slice(0, 2))
            .slice(0, 3),
          pageRange: `Page ${first.pageNumber}`,
          documentName: first.documentName,
        };
      }),
      importantQuestions: sampledChunks.slice(0, 4).map((c) => ({
        question: `Explain the core principles of ${c.topic} as covered in ${c.documentName}.`,
        briefAnswer: c.text.slice(0, 220),
        topic: c.topic,
        documentName: c.documentName,
        pageNumber: c.pageNumber,
      })),
      quickRevision: sampledChunks.slice(0, 5).map((c) => ({
        prompt: `What is the key takeaway from ${c.topic} (Page ${c.pageNumber})?`,
        flashAnswer: c.text.split(/(?<=[.!?])\s+/)[0] || c.text.slice(0, 140),
        topic: c.topic,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate study guide.' });
  }
});

// 4. Exam Mode Generator
app.post('/api/exam-prep', async (req, res) => {
  try {
    const {
      chunks,
      difficulty = 'Medium',
      answerStyle = 'Exam-ready',
      scopeLabel = 'Selected Study Material',
    } = req.body as {
      chunks: IncomingChunk[];
      difficulty?: 'Easy' | 'Medium' | 'Hard';
      answerStyle?: 'Very short' | 'Exam-ready' | 'Detailed';
      scopeLabel?: string;
    };

    if (!Array.isArray(chunks) || chunks.length === 0) {
      res.status(400).json({ error: 'No study chunks provided.' });
      return;
    }

    const sampledChunks = chunks.slice(0, 14);
    const contextBlock = sampledChunks
      .map(
        (c) =>
          `[Document: ${c.documentName} | Page: ${c.pageNumber} | Topic: ${c.topic}]\n${c.text}`
      )
      .join('\n\n---\n\n');

    const styleInstruction =
      answerStyle === 'Very short'
        ? 'Keep answers concise (1–2 crisp sentences for rapid recall).'
        : answerStyle === 'Detailed'
        ? 'Provide comprehensive, multi-point explanations with clear step-by-step reasoning from the text.'
        : 'Structure answers in clean, high-scoring university exam format with key terminology highlighted.';

    const ai = getAiClient();
    if (ai) {
      try {
        const prompt = `You are Aura, an academic exam preparation assistant. Convert the following study material into an Exam Preparation Pack.
CRITICAL RULE: Every question, answer, definition, and checklist item MUST be strictly grounded in the provided STUDY MATERIAL CHUNKS below. Do NOT invent outside facts or use topics from other subjects.
Target Difficulty: ${difficulty}
Target Answer Style: ${answerStyle} (${styleInstruction})

STUDY MATERIAL CHUNKS (${scopeLabel}):
${contextBlock}`;

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            temperature: 0.25,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                shortAnswerQuestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      question: { type: Type.STRING },
                      answer: { type: Type.STRING },
                      marks: { type: Type.INTEGER },
                      keyPointsToInclude: { type: Type.ARRAY, items: { type: Type.STRING } },
                      topic: { type: Type.STRING },
                      documentName: { type: Type.STRING },
                      pageNumber: { type: Type.INTEGER },
                      sourceSnippet: { type: Type.STRING },
                    },
                    required: [
                      'id',
                      'question',
                      'answer',
                      'marks',
                      'keyPointsToInclude',
                      'topic',
                      'documentName',
                      'pageNumber',
                      'sourceSnippet',
                    ],
                  },
                },
                longAnswerQuestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      question: { type: Type.STRING },
                      answer: { type: Type.STRING },
                      marks: { type: Type.INTEGER },
                      keyPointsToInclude: { type: Type.ARRAY, items: { type: Type.STRING } },
                      topic: { type: Type.STRING },
                      documentName: { type: Type.STRING },
                      pageNumber: { type: Type.INTEGER },
                      sourceSnippet: { type: Type.STRING },
                    },
                    required: [
                      'id',
                      'question',
                      'answer',
                      'marks',
                      'keyPointsToInclude',
                      'topic',
                      'documentName',
                      'pageNumber',
                      'sourceSnippet',
                    ],
                  },
                },
                definitions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      examDefinition: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      documentName: { type: Type.STRING },
                      pageNumber: { type: Type.INTEGER },
                      sourceSnippet: { type: Type.STRING },
                    },
                    required: [
                      'term',
                      'examDefinition',
                      'topic',
                      'documentName',
                      'pageNumber',
                      'sourceSnippet',
                    ],
                  },
                },
                keyPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                revisionChecklist: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      item: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      priority: { type: Type.STRING },
                    },
                    required: ['id', 'item', 'topic', 'priority'],
                  },
                },
              },
              required: [
                'shortAnswerQuestions',
                'longAnswerQuestions',
                'definitions',
                'keyPoints',
                'revisionChecklist',
              ],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        res.json({
          generatedAt: new Date().toISOString(),
          difficulty,
          answerStyle,
          scopeLabel,
          shortAnswerQuestions: (parsed.shortAnswerQuestions || []).map((q: any, i: number) => ({
            ...q,
            id: q.id || `sa-${i}`,
            type: 'short',
            difficulty,
          })),
          longAnswerQuestions: (parsed.longAnswerQuestions || []).map((q: any, i: number) => ({
            ...q,
            id: q.id || `la-${i}`,
            type: 'long',
            difficulty,
          })),
          definitions: parsed.definitions || [],
          keyPoints: parsed.keyPoints || [],
          revisionChecklist: (parsed.revisionChecklist || []).map((c: any, i: number) => ({
            ...c,
            id: c.id || `chk-${i}`,
            priority: ['High', 'Medium', 'Core'].includes(c.priority) ? c.priority : 'High',
          })),
        });
        return;
      } catch (err) {
        console.error('Gemini /api/exam-prep error, using grounded fallback:', err);
      }
    }

    res.json({
      generatedAt: new Date().toISOString(),
      difficulty,
      answerStyle,
      scopeLabel,
      shortAnswerQuestions: sampledChunks.slice(0, 4).map((c, idx) => ({
        id: `sa-${idx}`,
        type: 'short',
        question: `Define and explain the significance of ${c.topic}.`,
        answer:
          answerStyle === 'Very short'
            ? c.text.split(/(?<=[.!?])\s+/)[0] || c.text.slice(0, 120)
            : c.text.slice(0, 260),
        marks: 3,
        keyPointsToInclude: c.text
          .split(/(?<=[.!?])\s+/)
          .slice(0, 2)
          .map((s) => s.trim()),
        topic: c.topic,
        difficulty,
        documentName: c.documentName,
        pageNumber: c.pageNumber,
        sourceSnippet: c.text.slice(0, 220),
      })),
      longAnswerQuestions: sampledChunks.slice(0, 3).map((c, idx) => ({
        id: `la-${idx}`,
        type: 'long',
        question: `Provide a comprehensive analysis of ${c.topic} with supporting details from ${c.documentName}.`,
        answer: c.text,
        marks: 10,
        keyPointsToInclude: c.text
          .split(/(?<=[.!?])\s+/)
          .slice(0, 3)
          .map((s) => s.trim()),
        topic: c.topic,
        difficulty,
        documentName: c.documentName,
        pageNumber: c.pageNumber,
        sourceSnippet: c.text.slice(0, 260),
      })),
      definitions: sampledChunks.slice(0, 4).map((c) => ({
        term: c.topic,
        examDefinition: c.text.split(/(?<=[.!?])\s+/)[0] || c.text.slice(0, 160),
        topic: c.topic,
        documentName: c.documentName,
        pageNumber: c.pageNumber,
        sourceSnippet: c.text.slice(0, 200),
      })),
      keyPoints: sampledChunks.slice(0, 5).map((c) => c.text.split(/(?<=[.!?])\s+/)[0] || c.text),
      revisionChecklist: sampledChunks.slice(0, 5).map((c, idx) => ({
        id: `chk-${idx}`,
        item: `Review ${c.topic} in ${c.documentName} (Page ${c.pageNumber})`,
        topic: c.topic,
        priority: idx < 2 ? 'High' : 'Core',
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate exam preparation material.' });
  }
});

// 5. Quiz Arena Question Generator
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const {
      chunks,
      mode = 'quick_fire',
      focusTopic,
      count = 8,
    } = req.body as {
      chunks: IncomingChunk[];
      mode?: string;
      focusTopic?: string;
      count?: number;
    };

    if (!Array.isArray(chunks) || chunks.length === 0) {
      res.status(400).json({ error: 'No study material available to generate quiz.' });
      return;
    }

    const filteredChunks = focusTopic
      ? chunks.filter(
          (c) =>
            c.topic.toLowerCase().includes(focusTopic.toLowerCase()) ||
            c.text.toLowerCase().includes(focusTopic.toLowerCase())
        )
      : chunks;

    const workingChunks = filteredChunks.length > 0 ? filteredChunks : chunks;
    const targetCount =
      mode === 'boss_battle' || mode === 'weak_topic' ? 5 : Math.min(10, Math.max(5, count));

    const contextBlock = workingChunks
      .slice(0, 14)
      .map(
        (c) =>
          `[Document: ${c.documentName} | Page: ${c.pageNumber} | Topic: ${c.topic}]\n${c.text}`
      )
      .join('\n\n---\n\n');

    const modeInstructions =
      mode === 'boss_battle'
        ? 'Generate 5 Hard conceptual & reasoning boss-level questions that test deep understanding.'
        : mode === 'mix_it_up'
        ? 'Mix question types across "mcq" (4 options), "true_false" (2 options: ["True", "False"]), "fill_blank" (4 options for the missing keyword), and "concept" (4 options).'
        : mode === 'weak_topic'
        ? `Generate 5 targeted practice questions specifically focused on strengthening the topic "${focusTopic || workingChunks[0].topic}", progressing from Easy to Hard.`
        : 'Generate engaging questions that progress from Easy (recall/definitions) to Medium (application) to Hard (conceptual reasoning). Each question must have 4 distinct options.';

    const ai = getAiClient();
    if (ai) {
      try {
        const prompt = `You are the Quiz Arena Game Master inside Aura Learn.
Generate ${targetCount} interactive quiz questions strictly grounded ONLY in the uploaded STUDY MATERIAL CHUNKS below.
Do NOT ask general knowledge questions or questions from outside the provided chunks.
${modeInstructions}
Important rules:
1. "options" must be an array of strings (4 options for mcq/fill_blank/concept, or ["True", "False"] for true_false).
2. "correctAnswer" must match ONE of the strings in "options" EXACTLY.
3. "explanation" must be a concise 1–2 sentence explanation citing the concept from the document.

STUDY MATERIAL CHUNKS:
${contextBlock}`;

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            temperature: 0.35,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: {
                        type: Type.STRING,
                        description: 'One of: mcq, true_false, fill_blank, concept',
                      },
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctAnswer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      difficulty: {
                        type: Type.STRING,
                        description: 'One of: Easy, Medium, Hard',
                      },
                      documentName: { type: Type.STRING },
                      pageNumber: { type: Type.INTEGER },
                      sourceSnippet: { type: Type.STRING },
                    },
                    required: [
                      'id',
                      'type',
                      'question',
                      'options',
                      'correctAnswer',
                      'explanation',
                      'topic',
                      'difficulty',
                      'documentName',
                      'pageNumber',
                      'sourceSnippet',
                    ],
                  },
                },
              },
              required: ['questions'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          const sanitized = parsed.questions.map((q: any, idx: number) => {
            const opts: string[] =
              Array.isArray(q.options) && q.options.length >= 2
                ? q.options
                : [q.correctAnswer || 'True', 'False'];
            const exactMatch = opts.includes(q.correctAnswer) ? q.correctAnswer : opts[0];
            return {
              id: q.id || `quiz-q-${Date.now()}-${idx}`,
              type: ['mcq', 'true_false', 'fill_blank', 'concept'].includes(q.type)
                ? q.type
                : 'mcq',
              question: q.question,
              options: opts,
              correctAnswer: exactMatch,
              explanation: q.explanation,
              topic: q.topic || workingChunks[idx % workingChunks.length].topic,
              difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty)
                ? q.difficulty
                : idx < 2
                ? 'Easy'
                : idx < 4
                ? 'Medium'
                : 'Hard',
              documentName:
                q.documentName || workingChunks[idx % workingChunks.length].documentName,
              pageNumber: q.pageNumber || workingChunks[idx % workingChunks.length].pageNumber,
              sourceSnippet:
                q.sourceSnippet ||
                workingChunks[idx % workingChunks.length].text.slice(0, 200),
            };
          });

          res.json({ questions: sanitized });
          return;
        }
      } catch (err) {
        console.error('Gemini /api/quiz/generate error, using grounded chunk generator:', err);
      }
    }

    const fallbackQuestions = Array.from({ length: targetCount }).map((_, idx) => {
      const chunk = workingChunks[idx % workingChunks.length];
      const sentences = chunk.text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 25);
      const targetSentence = sentences[0] || chunk.text.slice(0, 140);

      const otherTopics = Array.from(new Set(chunks.map((c) => c.topic))).filter(
        (t) => t !== chunk.topic
      );
      const distractors = [
        otherTopics[0] || 'Unrelated External System',
        otherTopics[1] || 'Static Hardware Allocation',
        otherTopics[2] || 'Random Unindexed Process',
      ];

      const options = [chunk.topic, ...distractors.slice(0, 3)].sort((a, b) =>
        a.localeCompare(b)
      );

      return {
        id: `fallback-q-${idx}`,
        type: mode === 'mix_it_up' && idx % 2 === 1 ? 'concept' : 'mcq',
        question: `According to ${chunk.documentName} (Page ${chunk.pageNumber}), which topic directly addresses the following statement: "${targetSentence.slice(0, 150)}"?`,
        options,
        correctAnswer: chunk.topic,
        explanation: `Found in ${chunk.documentName} on Page ${chunk.pageNumber} under the section "${chunk.topic}".`,
        topic: chunk.topic,
        difficulty: mode === 'boss_battle' ? 'Hard' : idx < 2 ? 'Easy' : idx < 4 ? 'Medium' : 'Hard',
        documentName: chunk.documentName,
        pageNumber: chunk.pageNumber,
        sourceSnippet: chunk.text.slice(0, 200),
      };
    });

    res.json({ questions: fallbackQuestions });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate quiz questions.' });
  }
});

async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const distIndex = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && fs.existsSync(distIndex)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aura Learn server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
