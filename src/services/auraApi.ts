import {
  DocumentChunk,
  ExamAnswerStyle,
  ExamDifficulty,
  ExamPrepData,
  QuizGameMode,
  QuizQuestion,
  SourceCitation,
  StudyGuideData,
} from '../types/aura';

export interface AskAuraResponse {
  answer: string;
  grounded: boolean;
  sources: SourceCitation[];
  followUpSuggestions: string[];
  detectedTopics: string[];
}

export type AuraExplainStyle = 'simple' | 'step_by_step' | 'summary' | 'exam' | 'detailed';

export async function askAuraQuestion(
  question: string,
  chunks: DocumentChunk[],
  history: { role: string; content: string }[],
  explainStyle: AuraExplainStyle = 'simple'
): Promise<AskAuraResponse> {
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      chunks,
      history,
      explainStyle,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get an answer from Aura.');
  }

  return response.json();
}

export async function generateStudyGuide(
  chunks: DocumentChunk[],
  scopeLabel: string
): Promise<StudyGuideData> {
  const response = await fetch('/api/study-guide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chunks,
      scopeLabel,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate study notes.');
  }

  return response.json();
}

export async function generateExamPrep(
  chunks: DocumentChunk[],
  difficulty: ExamDifficulty,
  answerStyle: ExamAnswerStyle,
  scopeLabel: string
): Promise<ExamPrepData> {
  const response = await fetch('/api/exam-prep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chunks,
      difficulty,
      answerStyle,
      scopeLabel,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate exam preparation pack.');
  }

  return response.json();
}

export async function generateQuizQuestions(
  chunks: DocumentChunk[],
  mode: QuizGameMode,
  focusTopic?: string,
  count = 8
): Promise<QuizQuestion[]> {
  const response = await fetch('/api/quiz/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chunks,
      mode,
      focusTopic,
      count,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to build your quiz.');
  }

  const data = await response.json();
  return data.questions || [];
}

export function searchChunksInDocuments(
  query: string,
  chunks: DocumentChunk[]
): SourceCitation[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const terms = trimmed.split(/\s+/).filter((t) => t.length > 1);

  return chunks
    .map((chunk) => {
      const textLower = chunk.text.toLowerCase();
      const topicLower = chunk.topic.toLowerCase();
      let score = 0;

      if (textLower.includes(trimmed)) score += 6;
      if (topicLower.includes(trimmed)) score += 5;

      for (const term of terms) {
        if (textLower.includes(term)) score += 2;
        if (topicLower.includes(term)) score += 2.5;
      }

      return {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        pageNumber: chunk.pageNumber,
        topic: chunk.topic,
        snippet: chunk.text,
        relevanceScore: score,
      };
    })
    .filter((item) => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
