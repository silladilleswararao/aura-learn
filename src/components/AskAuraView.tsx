import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  FileText,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ChatMessage,
  DocumentChunk,
  SourceCitation,
  StudyDocument,
  UploadStatus,
} from '../types/aura';
import { askAuraQuestion, AuraExplainStyle } from '../services/auraApi';
import { processUploadedFile } from '../services/documentProcessor';

interface AskAuraViewProps {
  documents: StudyDocument[];
  selectedDocIds: string[];
  onToggleSelectDoc: (id: string) => void;
  onSelectAllDocs: () => void;
  onAddDocuments?: (newDocs: StudyDocument[]) => void;
  messages: ChatMessage[];
  onUpdateMessages: (msgs: ChatMessage[]) => void;
  onQuestionAnswered: () => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

const EXPLAIN_STYLE_OPTIONS: { id: AuraExplainStyle; label: string; desc: string }[] = [
  { id: 'simple', label: 'Simple & Easy', desc: 'Simple words + real-life example' },
  { id: 'step_by_step', label: 'Step-by-Step', desc: 'Numbered stages from scratch' },
  { id: 'summary', label: 'Quick Summary', desc: 'Crisp bullet points & takeaways' },
  { id: 'exam', label: 'Exam Ready', desc: 'High-scoring exam format & Q&A' },
  { id: 'detailed', label: 'Detailed Deep-Dive', desc: 'Complete in-depth explanation' },
];

export const AskAuraView: React.FC<AskAuraViewProps> = ({
  documents,
  selectedDocIds,
  onToggleSelectDoc,
  onSelectAllDocs,
  onAddDocuments,
  messages,
  onUpdateMessages,
  onQuestionAnswered,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [input, setInput] = useState('');
  const [explainStyle, setExplainStyle] = useState<AuraExplainStyle>('simple');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('Thinking & preparing your explanation...');
  const [error, setError] = useState<string | null>(null);
  const [activeSourceModal, setActiveSourceModal] = useState<SourceCitation | null>(null);

  // Direct file upload state inside Ask Aura
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [justUploadedDoc, setJustUploadedDoc] = useState<StudyDocument | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Separate real user-uploaded documents from pre-loaded demo samples
  const userUploadedDocs = documents.filter((d) => !d.isSample);
  const hasUserDocs = userUploadedDocs.length > 0;

  // Only include chunks from user-uploaded documents by default so sample Machine Learning notes never pollute answers
  const activeDocs = hasUserDocs
    ? userUploadedDocs.filter((d) => selectedDocIds.includes(d.id))
    : documents.filter((d) => selectedDocIds.includes(d.id) && !d.isSample);

  const effectiveDocs =
    hasUserDocs && activeDocs.length === 0 ? [userUploadedDocs[0]] : activeDocs;

  const activeChunks: DocumentChunk[] = effectiveDocs.flatMap((d) => d.chunks);
  const primaryDoc = justUploadedDoc || effectiveDocs[0] || null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && !isLoading) {
      const promptToAsk = initialPrompt;
      if (onClearInitialPrompt) onClearInitialPrompt();
      handleSendQuestion(promptToAsk, explainStyle);
    }
  }, [initialPrompt]);

  const handleDirectFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !onAddDocuments) return;
    setError(null);
    const files = Array.from(fileList);
    const uploaded: StudyDocument[] = [];

    try {
      for (const file of files) {
        const doc = await processUploadedFile(file, (status, msg) => {
          setUploadStatus(status);
          setUploadMessage(`${file.name}: ${msg}`);
        });
        uploaded.push(doc);
      }
      onAddDocuments(uploaded);
      setJustUploadedDoc(uploaded[0]);
      setUploadStatus('ready');
      setUploadMessage(`Uploaded "${uploaded[0].name}" (${uploaded[0].chunkCount} sections ready)`);
    } catch (err: any) {
      setUploadStatus('error');
      setError(err?.message || 'Could not read the uploaded file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendQuestion = async (
    questionText?: string,
    customStyle?: AuraExplainStyle,
    overrideChunks?: DocumentChunk[]
  ) => {
    const query = (questionText ?? input).trim();
    if (!query || isLoading) return;

    const chosenStyle = customStyle || explainStyle;
    const chunksToUse = overrideChunks ?? activeChunks;

    setError(null);
    if (!questionText) setInput('');

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    onUpdateMessages(nextMessages);
    setIsLoading(true);
    setLoadingStepText(
      chunksToUse.length > 0
        ? `Analyzing "${effectiveDocs.map((d) => d.name).join(', ')}" & crafting your ${chosenStyle.replace(/_/g, ' ')} answer...`
        : 'Aura is writing a clear, simple explanation...'
    );

    try {
      const historyPayload = nextMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await askAuraQuestion(query, chunksToUse, historyPayload, chosenStyle);

      const assistantMsg: ChatMessage = {
        id: `msg-aura-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        timestamp: new Date().toISOString(),
        grounded: result.grounded,
        sources: result.sources,
        followUpSuggestions: result.followUpSuggestions,
        detectedTopics: result.detectedTopics,
      };

      onUpdateMessages([...nextMessages, assistantMsg]);
      onQuestionAnswered();
    } catch (err: any) {
      setError(err?.message || 'Unable to generate an answer right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    onUpdateMessages([]);
    setError(null);
  };

  const getDocumentActionPrompts = (docName: string) => [
    {
      label: '✨ Explain Simply with Examples',
      style: 'simple' as AuraExplainStyle,
      prompt: `Explain the uploaded document "${docName}" in simple, easy-to-understand words with real-life examples.`,
    },
    {
      label: '📋 Complete Summary & Key Points',
      style: 'summary' as AuraExplainStyle,
      prompt: `Summarize all the main topics and key takeaways from "${docName}" clearly.`,
    },
    {
      label: '🪜 Step-by-Step Topic Breakdown',
      style: 'step_by_step' as AuraExplainStyle,
      prompt: `Break down every concept in "${docName}" step-by-step from beginning to end so I can understand it easily.`,
    },
    {
      label: '🎯 Important Exam Questions & Answers',
      style: 'exam' as AuraExplainStyle,
      prompt: `Give me the most important short and long exam questions and answers based on "${docName}".`,
    },
    {
      label: '📖 Key Definitions & Formulas',
      style: 'simple' as AuraExplainStyle,
      prompt: `List and explain all important definitions, terms, and formulas in "${docName}".`,
    },
    {
      label: '🧠 Ask Me 5 Practice Questions',
      style: 'simple' as AuraExplainStyle,
      prompt: `Create 5 practice questions based on "${docName}" and provide clear answers and explanations for each.`,
    },
  ];

  const GENERAL_CHATGPT_PROMPTS = [
    'Explain any topic in simple words with a real-life example',
    'Help me understand a difficult concept step-by-step',
    'Write clean code with line-by-line explanation',
    'Give me exam-ready notes and important questions on any subject',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] min-h-[600px] space-y-3.5">
      {/* Hidden File Input for ChatGPT-style Direct Upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleDirectFileUpload(e.target.files)}
      />

      {/* Top Header & Direct Upload / Chat Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Ask Aura (AI Tutor &amp; ChatGPT)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Ask any question on any subject like ChatGPT — or upload a PDF/picture to get it
            explained exactly how you want.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onAddDocuments && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF / Picture</span>
            </button>
          )}
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111827] hover:bg-slate-800 border border-white/10 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Chat</span>
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 bg-[#111827] border border-white/10 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Progress Banner if uploading directly in Ask Aura */}
      {uploadStatus !== 'idle' && uploadStatus !== 'ready' && uploadStatus !== 'error' && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3 text-xs text-emerald-200 shrink-0">
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* How Do You Want Aura To Explain? (Answer Style Bar + Active File Selector) */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
        {/* Explanation Style Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1 font-medium">How to explain:</span>
          {EXPLAIN_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setExplainStyle(opt.id)}
              title={opt.desc}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                explainStyle === opt.id
                  ? 'bg-emerald-400 text-slate-950 font-semibold'
                  : 'bg-[#090D16] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Active Uploaded File Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {userUploadedDocs.length > 0 ? (
            <>
              <span className="text-xs text-slate-400">Your File:</span>
              {userUploadedDocs.map((doc) => {
                const active = effectiveDocs.some((d) => d.id === doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => onToggleSelectDoc(doc.id)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer max-w-[210px] truncate ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                        : 'bg-[#090D16] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                    }`}
                    title={doc.name}
                  >
                    📄 {doc.name}
                  </button>
                );
              })}
            </>
          ) : (
            <span className="text-xs text-emerald-400 font-mono">
              Mode: ChatGPT General AI Tutor (Upload a PDF anytime to explain it)
            </span>
          )}
        </div>
      </div>

      {/* Main Chat Viewport */}
      <div className="flex-1 bg-[#111827] border border-white/[0.08] rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-4 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>

            {primaryDoc ? (
              <div className="space-y-4 w-full">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ready to explain: {primaryDoc.name}</span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    How would you like Aura to explain your file?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Select one option below for an instant explanation of{' '}
                    <strong className="text-slate-200">{primaryDoc.name}</strong>, or type any
                    question in the box below.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                  {getDocumentActionPrompts(primaryDoc.name).map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setExplainStyle(item.style);
                        handleSendQuestion(item.prompt, item.style, primaryDoc.chunks);
                      }}
                      className="p-3.5 text-xs sm:text-sm font-medium text-slate-100 bg-[#090D16] hover:bg-slate-900 border border-white/10 hover:border-emerald-400/50 rounded-xl transition-colors text-left cursor-pointer flex items-center justify-between gap-2"
                    >
                      <span>{item.label}</span>
                      <span className="text-emerald-400 text-xs shrink-0">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5 w-full">
                <div className="space-y-2">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Ask anything like ChatGPT — or upload a PDF to explain it.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
                    Type any question below to get simple, clear answers on any topic, or upload a
                    PDF, photo of notes, or document and choose how you want it explained.
                  </p>
                </div>

                {onAddDocuments && (
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload PDF, Picture or Notes to Explain</span>
                    </button>
                  </div>
                )}

                <div className="w-full space-y-2 pt-2">
                  <div className="text-xs text-slate-400 font-medium">
                    Or try asking any question below:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                    {GENERAL_CHATGPT_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q + ': ')}
                        className="p-3 text-xs sm:text-sm text-slate-200 bg-[#090D16] hover:bg-slate-900 border border-white/[0.07] hover:border-emerald-500/40 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        &ldquo;{q}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-4 sm:p-5 ${
                  msg.role === 'user'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                    : 'bg-[#090D16] border border-white/[0.08] text-slate-100 w-full'
                }`}
              >
                {/* Header Metadata */}
                <div className="flex items-center justify-between gap-4 text-xs text-slate-400 mb-2.5">
                  <span className="font-semibold text-slate-300">
                    {msg.role === 'user' ? 'You' : 'Aura AI'}
                  </span>
                  {msg.role === 'assistant' && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {msg.grounded
                          ? 'Explained from your uploaded file'
                          : 'Aura AI Tutor · Clear Explanation'}
                      </span>
                    </span>
                  )}
                </div>

                {/* Message Content */}
                <div className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</div>

                {/* Quick Style Re-Explain Buttons on Assistant Messages */}
                {msg.role === 'assistant' && (
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400">Explain this differently:</span>
                    <button
                      onClick={() =>
                        handleSendQuestion(
                          'Explain that again in even simpler words with an everyday example',
                          'simple'
                        )
                      }
                      className="px-2.5 py-1 text-xs text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors cursor-pointer"
                    >
                      Simpler + Example
                    </button>
                    <button
                      onClick={() =>
                        handleSendQuestion('Break that down step-by-step in numbered points', 'step_by_step')
                      }
                      className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#111827] border border-white/10 rounded-md transition-colors cursor-pointer"
                    >
                      Step-by-Step
                    </button>
                    <button
                      onClick={() =>
                        handleSendQuestion('Give me short exam-ready notes and likely questions on this', 'exam')
                      }
                      className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#111827] border border-white/10 rounded-md transition-colors cursor-pointer"
                    >
                      Exam Notes
                    </button>
                  </div>
                )}

                {/* Supporting Sources Section */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">
                        Uploaded File Reference ({msg.sources.length} sections)
                      </span>
                      <span>Click to view extracted text</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.sources.map((src, idx) => (
                        <button
                          key={`${src.chunkId}-${idx}`}
                          onClick={() => setActiveSourceModal(src)}
                          className="text-left bg-[#111827] hover:bg-slate-800/80 border border-white/[0.07] hover:border-emerald-500/40 rounded-xl p-3 transition-colors space-y-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-white truncate">
                              📄 {src.documentName}
                            </span>
                            <span className="font-mono tabular-nums text-emerald-400 shrink-0">
                              Page {src.pageNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2 italic">
                            &ldquo;{src.snippet}&rdquo;
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Question Suggestions */}
                {msg.role === 'assistant' &&
                  msg.followUpSuggestions &&
                  msg.followUpSuggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400 mr-1">Ask next:</span>
                      {msg.followUpSuggestions.map((followUp, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendQuestion(followUp)}
                          className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#111827] hover:bg-slate-800 border border-white/10 rounded-lg transition-colors cursor-pointer"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-[#090D16] border border-white/[0.08] rounded-2xl p-4 max-w-md flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
            <span className="text-xs sm:text-sm text-slate-300">{loadingStepText}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Form with Direct File Upload Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuestion();
        }}
        className="bg-[#111827] border border-white/10 rounded-2xl p-2 flex items-center gap-2 shrink-0"
      >
        {onAddDocuments && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload PDF, Picture, or Study File"
            className="p-2.5 text-slate-300 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            primaryDoc
              ? `Ask anything about ${primaryDoc.name} or any other topic...`
              : 'Ask any question like ChatGPT (or click the clip icon to upload a PDF/picture)...'
          }
          className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <span>Ask Aura</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Source Snippet Modal */}
      {activeSourceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-3">
              <div>
                <div className="text-xs text-emerald-400 font-medium">
                  Uploaded Document Reference
                </div>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  📄 {activeSourceModal.documentName} · Page {activeSourceModal.pageNumber}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Section / Topic: {activeSourceModal.topic}
                </div>
              </div>
              <button
                onClick={() => setActiveSourceModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 text-sm text-slate-200 leading-relaxed max-h-80 overflow-y-auto">
              &ldquo;{activeSourceModal.snippet}&rdquo;
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>From your uploaded file</span>
              <button
                onClick={() => {
                  const topicToAsk = activeSourceModal.topic;
                  setActiveSourceModal(null);
                  handleSendQuestion(
                    `Explain ${topicToAsk} in simple words with an example based on Page ${activeSourceModal.pageNumber}`
                  );
                }}
                className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                Explain this section simply →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
