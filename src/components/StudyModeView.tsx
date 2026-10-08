import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Eye,
  HelpCircle,
  Layers,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DocumentChunk, StudyDocument, StudyGuideData } from '../types/aura';
import { generateStudyGuide } from '../services/auraApi';

interface StudyModeViewProps {
  documents: StudyDocument[];
  selectedDocIds: string[];
  onAskAboutTopic: (prompt: string) => void;
}

type StudySectionTab =
  | 'all'
  | 'concepts'
  | 'definitions'
  | 'points'
  | 'breakdown'
  | 'questions'
  | 'revision';

export const StudyModeView: React.FC<StudyModeViewProps> = ({
  documents,
  selectedDocIds,
  onAskAboutTopic,
}) => {
  const activeDocs =
    selectedDocIds.length > 0
      ? documents.filter((d) => selectedDocIds.includes(d.id))
      : documents;

  const allTopics = Array.from(new Set(activeDocs.flatMap((d) => d.topics)));

  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<StudySectionTab>('all');
  const [studyData, setStudyData] = useState<StudyGuideData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedFlashcards, setRevealedFlashcards] = useState<Record<number, boolean>>({});

  const getFilteredChunks = (): DocumentChunk[] => {
    const chunks = activeDocs.flatMap((d) => d.chunks);
    if (selectedTopic === 'ALL') return chunks;
    const filtered = chunks.filter((c) => c.topic === selectedTopic);
    return filtered.length > 0 ? filtered : chunks;
  };

  const handleGenerateStudyGuide = async () => {
    const chunks = getFilteredChunks();
    if (chunks.length === 0) return;

    setIsLoading(true);
    setError(null);
    try {
      const scopeLabel =
        selectedTopic === 'ALL'
          ? `${activeDocs.map((d) => d.name).join(', ')}`
          : `${selectedTopic}`;
      const data = await generateStudyGuide(chunks, scopeLabel);
      setStudyData(data);
      setRevealedFlashcards({});
    } catch (err: any) {
      setError(err?.message || 'Could not generate study notes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateStudyGuide();
  }, [selectedTopic, selectedDocIds.join(',')]);

  const toggleFlashcard = (idx: number) => {
    setRevealedFlashcards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Study Mode</h1>
          <p className="text-sm text-slate-400 mt-1">
            Structured study cards, definitions, topic breakdowns, and quick revision flashcards
            built strictly from your uploaded material.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Topic Scope Selector */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            aria-label="Select topic scope"
            className="bg-[#111827] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="ALL">Entire Selected Material ({allTopics.length} Topics)</option>
            {allTopics.map((topic) => (
              <option key={topic} value={topic}>
                Topic: {topic}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateStudyGuide}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Notes</span>
          </button>
        </div>
      </div>

      {/* Section Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#111827] border border-white/[0.08] rounded-xl">
        {[
          { id: 'all', label: 'All Study Tools' },
          { id: 'concepts', label: 'Key Concepts' },
          { id: 'definitions', label: 'Important Definitions' },
          { id: 'points', label: 'Important Points' },
          { id: 'breakdown', label: 'Topic Breakdown' },
          { id: 'questions', label: 'Important Questions' },
          { id: 'revision', label: 'Quick Revision' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as StudySectionTab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-400 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3">
          <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
          <div className="text-base font-semibold text-white">
            Finding the important parts in your notes...
          </div>
          <p className="text-xs text-slate-400">
            Synthesizing concept cards, definitions, and quick revision flashcards.
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-200">
          {error}
        </div>
      )}

      {!isLoading && studyData && (
        <div className="space-y-8">
          {/* 1. Quick Summary */}
          <section className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-emerald-400">
              <span>01. Quick Summary · Grounded in your study material</span>
              <span className="text-slate-400 truncate max-w-xs">{studyData.scopeLabel}</span>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              {studyData.quickSummary}
            </p>
          </section>

          {/* 2. Key Concepts Cards */}
          {(activeTab === 'all' || activeTab === 'concepts') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-white">02. Key Concepts</h2>
                <span className="text-xs text-slate-400">
                  {studyData.keyConcepts.length} Concept Cards
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {studyData.keyConcepts.map((card, idx) => (
                  <div
                    key={idx}
                    className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-emerald-400 font-mono tabular-nums">
                        <span>KEY CONCEPT · {card.topic}</span>
                        <span>
                          {card.documentName} · Page {card.pageNumber}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white">{card.title}</h3>

                      <div className="space-y-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-slate-400 font-medium">Definition: </span>
                          <span className="text-slate-200">{card.definition}</span>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-medium">Remember: </span>
                          <span className="text-slate-200">{card.remember}</span>
                        </div>
                        <div>
                          <span className="text-amber-400 font-medium">Important: </span>
                          <span className="text-slate-200">{card.important}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[240px]">
                        Source: &ldquo;{card.sourceSnippet}&rdquo;
                      </span>
                      <button
                        onClick={() =>
                          onAskAboutTopic(`Explain the key concept "${card.title}" with an example`)
                        }
                        className="text-emerald-400 hover:text-emerald-300 font-medium shrink-0 cursor-pointer"
                      >
                        Ask Aura →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Important Definitions */}
          {(activeTab === 'all' || activeTab === 'definitions') && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">
                03. Important Definitions
              </h2>
              <div className="bg-[#111827] border border-white/[0.08] rounded-2xl divide-y divide-white/[0.06]">
                {studyData.importantDefinitions.map((def, idx) => (
                  <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div className="space-y-1 max-w-3xl">
                      <div className="text-sm font-semibold text-white">{def.term}</div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {def.definition}
                      </p>
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                      {def.documentName} · Page {def.pageNumber}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Important Points */}
          {(activeTab === 'all' || activeTab === 'points') && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">04. Important Points</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyData.importantPoints.map((pt, idx) => (
                  <div
                    key={idx}
                    className="bg-[#111827] border border-white/[0.08] rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                      <span className="text-emerald-400">{pt.topic}</span>
                      <span>
                        {pt.documentName} · Page {pt.pageNumber}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{pt.point}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Topic Breakdown */}
          {(activeTab === 'all' || activeTab === 'breakdown') && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">05. Topic Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {studyData.topicBreakdown.map((tb, idx) => (
                  <div
                    key={idx}
                    className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                      <span>{tb.documentName}</span>
                      <span>{tb.pageRange}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{tb.topic}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {tb.summary}
                    </p>
                    <ul className="space-y-1.5 pt-1">
                      {tb.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-400">•</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Important Questions */}
          {(activeTab === 'all' || activeTab === 'questions') && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">
                06. Important Questions
              </h2>
              <div className="space-y-3">
                {studyData.importantQuestions.map((iq, idx) => (
                  <div
                    key={idx}
                    className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                      <span className="text-emerald-400">Question #{idx + 1} · {iq.topic}</span>
                      <span>
                        {iq.documentName} · Page {iq.pageNumber}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      {iq.question}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                      {iq.briefAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Quick Revision Flashcards */}
          {(activeTab === 'all' || activeTab === 'revision') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-white">
                  07. Quick Revision Flashcards
                </h2>
                <span className="text-xs text-slate-400">Click any card to reveal answer</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {studyData.quickRevision.map((rev, idx) => {
                  const revealed = Boolean(revealedFlashcards[idx]);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleFlashcard(idx)}
                      className="text-left bg-[#111827] hover:bg-slate-800/70 border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-5 transition-colors flex flex-col justify-between min-h-[150px] cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="text-xs text-emerald-400 font-mono">{rev.topic}</div>
                        <div className="text-sm font-semibold text-white">{rev.prompt}</div>
                        {revealed && (
                          <p className="text-xs text-emerald-200 pt-2 border-t border-white/10 leading-relaxed">
                            {rev.flashAnswer}
                          </p>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-3">
                        {revealed ? 'Hide answer' : 'Tap to reveal grounded answer →'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
