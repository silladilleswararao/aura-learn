export type NavigationTab =
  | 'landing'
  | 'dashboard'
  | 'documents'
  | 'ask'
  | 'study'
  | 'exam'
  | 'quiz'
  | 'search'
  | 'progress'
  | 'settings';

export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'reading'
  | 'chunking'
  | 'embedding'
  | 'ready'
  | 'error';

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  topic: string;
  text: string;
  tokenCount: number;
  embedding?: number[];
  keywords: string[];
}

export interface StudyDocument {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  pageCount: number;
  chunkCount: number;
  topics: string[];
  chunks: DocumentChunk[];
  isSample?: boolean;
  summaryPreview?: string;
  previewImageUrl?: string;
}

export interface SourceCitation {
  chunkId: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  topic: string;
  snippet: string;
  relevanceScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  grounded?: boolean;
  sources?: SourceCitation[];
  followUpSuggestions?: string[];
  detectedTopics?: string[];
}

export interface StudyConceptCard {
  title: string;
  definition: string;
  remember: string;
  important: string;
  topic: string;
  documentName: string;
  pageNumber: number;
  sourceSnippet: string;
}

export interface StudyDefinition {
  term: string;
  definition: string;
  topic: string;
  documentName: string;
  pageNumber: number;
}

export interface StudyTopicBreakdown {
  topic: string;
  summary: string;
  keyTakeaways: string[];
  pageRange: string;
  documentName: string;
}

export interface StudyImportantQuestion {
  question: string;
  briefAnswer: string;
  topic: string;
  documentName: string;
  pageNumber: number;
}

export interface StudyRevisionCard {
  prompt: string;
  flashAnswer: string;
  topic: string;
}

export interface StudyGuideData {
  generatedAt: string;
  scopeLabel: string;
  quickSummary: string;
  keyConcepts: StudyConceptCard[];
  importantDefinitions: StudyDefinition[];
  importantPoints: { point: string; topic: string; documentName: string; pageNumber: number }[];
  topicBreakdown: StudyTopicBreakdown[];
  importantQuestions: StudyImportantQuestion[];
  quickRevision: StudyRevisionCard[];
}

export type ExamDifficulty = 'Easy' | 'Medium' | 'Hard';
export type ExamAnswerStyle = 'Very short' | 'Exam-ready' | 'Detailed';

export interface ExamQuestionItem {
  id: string;
  type: 'short' | 'long';
  question: string;
  answer: string;
  marks: number;
  keyPointsToInclude: string[];
  topic: string;
  difficulty: ExamDifficulty;
  documentName: string;
  pageNumber: number;
  sourceSnippet: string;
}

export interface ExamDefinitionItem {
  term: string;
  examDefinition: string;
  topic: string;
  documentName: string;
  pageNumber: number;
  sourceSnippet: string;
}

export interface ExamChecklistItem {
  id: string;
  item: string;
  topic: string;
  priority: 'High' | 'Medium' | 'Core';
  completed?: boolean;
}

export interface ExamPrepData {
  generatedAt: string;
  difficulty: ExamDifficulty;
  answerStyle: ExamAnswerStyle;
  scopeLabel: string;
  shortAnswerQuestions: ExamQuestionItem[];
  longAnswerQuestions: ExamQuestionItem[];
  definitions: ExamDefinitionItem[];
  keyPoints: string[];
  revisionChecklist: ExamChecklistItem[];
}

export type QuizGameMode = 'quick_fire' | 'survival' | 'boss_battle' | 'mix_it_up' | 'weak_topic';
export type QuizQuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'concept';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: ExamDifficulty;
  documentName: string;
  pageNumber: number;
  sourceSnippet: string;
}

export interface QuizAttemptResult {
  id: string;
  mode: QuizGameMode;
  focusTopic?: string;
  score: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  bestStreak: number;
  timeSeconds: number;
  completedAt: string;
  topicBreakdown: {
    topic: string;
    correct: number;
    total: number;
  }[];
}

export type TopicStatus = 'Strong' | 'Improving' | 'Needs Practice';

export interface TopicMastery {
  topic: string;
  documentName: string;
  correct: number;
  attempts: number;
  masteryPercent: number;
  status: TopicStatus;
  lastPracticedAt?: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface StudentProgress {
  xp: number;
  level: number;
  questionsAsked: number;
  quizzesCompleted: number;
  totalQuizQuestionsAnswered: number;
  totalQuizCorrect: number;
  highScore: number;
  currentStreak: number;
  bestStreak: number;
  topicMastery: Record<string, TopicMastery>;
  quizHistory: QuizAttemptResult[];
  badges: BadgeItem[];
}
