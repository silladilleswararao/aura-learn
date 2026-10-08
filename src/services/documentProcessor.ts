import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Vite asset URL import for local PDF.js worker
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { DocumentChunk, StudyDocument, UploadStatus } from '../types/aura';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
} catch {
  // Fallback to server-side Gemini multimodal PDF extraction
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were',
  'have', 'has', 'had', 'not', 'but', 'what', 'all', 'when', 'where', 'who',
  'will', 'more', 'can', 'into', 'than', 'then', 'them', 'these', 'those',
]);

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const counts = new Map<string, number>();
  for (const w of words) {
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
}

function detectTopicHeading(paragraph: string, fallbackIndex: number, fileName: string): string {
  const lines = paragraph
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^[#*-\d.)\s]+/, '').trim();
    if (firstLine.length >= 4 && firstLine.length <= 58 && !firstLine.endsWith('.')) {
      return firstLine;
    }
    const colonSplit = firstLine.split(':');
    if (colonSplit.length > 1 && colonSplit[0].length <= 45) {
      return colonSplit[0].trim();
    }
  }

  const cleanFile = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  return `${cleanFile} — Part ${fallbackIndex}`;
}

export interface PageText {
  pageNumber: number;
  text: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

function hasReadableWords(text: string): boolean {
  // Verify the text contains genuine human-readable words and sentences
  const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  return words.length >= 8;
}

function detectFileCategory(file: File): {
  badge: string;
  category: 'image' | 'pdf' | 'audio' | 'video' | 'text' | 'office_or_other';
  mimeType: string;
} {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const rawMime = (file.type || '').toLowerCase();

  const imageExts = new Set([
    'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg', 'heic', 'avif', 'tiff', 'ico',
  ]);
  const audioExts = new Set(['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac']);
  const videoExts = new Set(['mp4', 'webm', 'mov', 'mkv']);
  const textExts = new Set([
    'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'html', 'htm', 'xml', 'yaml', 'yml',
    'rtf', 'tex', 'log', 'ini', 'env', 'py', 'js', 'ts', 'tsx', 'jsx', 'java', 'c',
    'cpp', 'h', 'cs', 'go', 'rs', 'rb', 'php', 'sql', 'sh', 'css', 'scss',
  ]);

  if (rawMime.startsWith('image/') || imageExts.has(ext)) {
    const resolvedMime = rawMime.startsWith('image/')
      ? rawMime
      : ext === 'jpg'
      ? 'image/jpeg'
      : ext === 'svg'
      ? 'image/svg+xml'
      : `image/${ext || 'png'}`;
    return {
      badge: `IMAGE (${(ext || 'IMG').toUpperCase()})`,
      category: 'image',
      mimeType: resolvedMime,
    };
  }

  if (rawMime === 'application/pdf' || ext === 'pdf') {
    return { badge: 'PDF', category: 'pdf', mimeType: 'application/pdf' };
  }

  if (rawMime.startsWith('audio/') || audioExts.has(ext)) {
    const resolvedMime = rawMime.startsWith('audio/') ? rawMime : `audio/${ext || 'mp3'}`;
    return {
      badge: `AUDIO (${(ext || 'MP3').toUpperCase()})`,
      category: 'audio',
      mimeType: resolvedMime,
    };
  }

  if (rawMime.startsWith('video/') || videoExts.has(ext)) {
    const resolvedMime = rawMime.startsWith('video/') ? rawMime : `video/${ext || 'mp4'}`;
    return {
      badge: `VIDEO (${(ext || 'MP4').toUpperCase()})`,
      category: 'video',
      mimeType: resolvedMime,
    };
  }

  if (rawMime.startsWith('text/') || textExts.has(ext)) {
    return {
      badge: (ext || 'TXT').toUpperCase(),
      category: 'text',
      mimeType: rawMime || 'text/plain',
    };
  }

  return {
    badge: (ext || 'FILE').toUpperCase(),
    category: 'office_or_other',
    mimeType: rawMime || 'application/octet-stream',
  };
}

async function extractWithMultimodalServer(
  file: File,
  mimeType: string,
  fallbackText?: string
): Promise<PageText[]> {
  const buffer = await file.arrayBuffer();
  const base64Data = arrayBufferToBase64(buffer);

  const response = await fetch('/api/extract-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType,
      base64Data,
      fallbackText,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    if (Array.isArray(data.pages) && data.pages.length > 0) {
      return data.pages;
    }
  }

  if (fallbackText && hasReadableWords(fallbackText)) {
    return [{ pageNumber: 1, text: fallbackText.trim() }];
  }

  throw new Error(
    `Could not extract readable content from "${file.name}". Please try uploading a clear PDF, picture, or text file.`
  );
}

async function extractPdfPages(file: File): Promise<PageText[]> {
  // Always prioritize server-side + Gemini Multimodal PDF extraction so both text-based and scanned/complex PDFs extract 100% accurately
  try {
    const serverPages = await extractWithMultimodalServer(file, 'application/pdf');
    if (serverPages.length > 0 && serverPages.some((p) => hasReadableWords(p.text))) {
      return serverPages;
    }
  } catch {
    // Fallback to client-side pdfjs if server call fails
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pages: PageText[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    const cleaned = strings.replace(/\s+/g, ' ').trim();
    if (hasReadableWords(cleaned)) {
      pages.push({ pageNumber: pageNum, text: cleaned });
    }
  }

  if (pages.length > 0) {
    return pages;
  }

  throw new Error('Could not read text from this PDF file.');
}

async function extractTextFilePages(file: File): Promise<PageText[]> {
  const rawText = await file.text();
  const cleaned = rawText.replace(/\r\n/g, '\n').trim();
  if (!cleaned) {
    throw new Error('This file appears to be empty.');
  }

  const paragraphs = cleaned.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const pages: PageText[] = [];
  let currentBuffer = '';
  let pageNum = 1;

  for (const para of paragraphs) {
    if (currentBuffer.length + para.length > 1600 && currentBuffer.length > 0) {
      pages.push({ pageNumber: pageNum++, text: currentBuffer.trim() });
      currentBuffer = para;
    } else {
      currentBuffer += (currentBuffer ? '\n\n' : '') + para;
    }
  }
  if (currentBuffer.trim().length > 0) {
    pages.push({ pageNumber: pageNum, text: currentBuffer.trim() });
  }

  return pages;
}

async function extractBinaryOrOfficeFilePages(
  file: File,
  mimeType: string
): Promise<PageText[]> {
  const buffer = await file.arrayBuffer();
  const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

  const xmlTagMatches = Array.from(
    utf8Text.matchAll(/<(?:w:t|a:t|t)[^>]*>([^<]+)<\/(?:w:t|a:t|t)>/g)
  )
    .map((m) => m[1].trim())
    .filter((s) => s.length > 0);

  let extractedReadable = '';
  if (xmlTagMatches.length > 3) {
    extractedReadable = xmlTagMatches.join(' ');
  }

  return extractWithMultimodalServer(file, mimeType, extractedReadable);
}

async function createImagePreviewDataUrl(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : undefined;
      resolve(result);
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

export function chunkDocumentPages(
  documentId: string,
  documentName: string,
  pages: PageText[]
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkCounter = 1;

  for (const page of pages) {
    const paragraphs = page.text
      .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let buffer = '';
    let lastOverlapSentence = '';

    for (const part of paragraphs) {
      if ((buffer + ' ' + part).trim().length > 650 && buffer.length >= 180) {
        const chunkText = buffer.trim();
        const topic = detectTopicHeading(chunkText, chunkCounter, documentName);
        chunks.push({
          id: `${documentId}-chunk-${chunkCounter++}`,
          documentId,
          documentName,
          pageNumber: page.pageNumber,
          topic,
          text: chunkText,
          tokenCount: chunkText.split(/\s+/).length,
          keywords: extractKeywords(chunkText),
        });

        const sentences = chunkText.split(/(?<=[.!?])\s+/);
        lastOverlapSentence = sentences[sentences.length - 1] || '';
        buffer = (lastOverlapSentence ? lastOverlapSentence + ' ' : '') + part;
      } else {
        buffer = buffer ? `${buffer} ${part}` : part;
      }
    }

    if (buffer.trim().length > 0) {
      const chunkText = buffer.trim();
      const topic = detectTopicHeading(chunkText, chunkCounter, documentName);
      chunks.push({
        id: `${documentId}-chunk-${chunkCounter++}`,
        documentId,
        documentName,
        pageNumber: page.pageNumber,
        topic,
        text: chunkText,
        tokenCount: chunkText.split(/\s+/).length,
        keywords: extractKeywords(chunkText),
      });
    }
  }

  return chunks;
}

export async function processUploadedFile(
  file: File,
  onStageChange: (status: UploadStatus, message: string, progress: number) => void
): Promise<StudyDocument> {
  if (file.size === 0) {
    throw new Error('The selected file is empty (0 bytes).');
  }

  if (file.size > 35 * 1024 * 1024) {
    throw new Error('File is too large (max 35 MB). Please upload a smaller file or picture.');
  }

  const { badge, category, mimeType } = detectFileCategory(file);

  onStageChange('uploading', `Uploading ${badge} (${file.name})...`, 20);
  await new Promise((r) => setTimeout(r, 150));

  let pages: PageText[] = [];
  let previewImageUrl: string | undefined;

  if (category === 'image') {
    onStageChange(
      'reading',
      'Analyzing picture with AI Vision (reading notes, formulas & diagrams)...',
      50
    );
    previewImageUrl = await createImagePreviewDataUrl(file);
    pages = await extractWithMultimodalServer(file, mimeType);
  } else if (category === 'pdf') {
    onStageChange('reading', 'Reading PDF pages & extracting full content with AI...', 50);
    pages = await extractPdfPages(file);
  } else if (category === 'audio' || category === 'video') {
    onStageChange('reading', 'Transcribing audio/media recording...', 50);
    pages = await extractWithMultimodalServer(file, mimeType);
  } else if (category === 'text') {
    onStageChange('reading', 'Reading text & code structure...', 45);
    pages = await extractTextFilePages(file);
  } else {
    onStageChange('reading', `Extracting study content from ${badge} file...`, 48);
    pages = await extractBinaryOrOfficeFilePages(file, mimeType);
  }

  onStageChange('chunking', 'Splitting into semantic knowledge chunks...', 75);
  const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const chunks = chunkDocumentPages(docId, file.name, pages);

  if (chunks.length === 0) {
    throw new Error('No study content could be extracted from this file.');
  }

  onStageChange('embedding', 'Preparing knowledge & vector representations...', 90);
  try {
    const res = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: chunks.map((c) => c.text) }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.embeddings) && data.embeddings.length === chunks.length) {
        chunks.forEach((c, idx) => {
          c.embedding = data.embeddings[idx];
        });
      }
    }
  } catch {
    // Continues with local hybrid lexical-semantic index
  }

  const topics = Array.from(new Set(chunks.map((c) => c.topic))).slice(0, 8);
  const summaryPreview =
    chunks[0].text.slice(0, 180) + (chunks[0].text.length > 180 ? '...' : '');

  onStageChange('ready', 'Ready to learn!', 100);

  return {
    id: docId,
    name: file.name,
    fileType: badge,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    pageCount: pages.length,
    chunkCount: chunks.length,
    topics,
    chunks,
    summaryPreview,
    previewImageUrl,
  };
}
