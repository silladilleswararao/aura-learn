import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Square,
} from 'lucide-react';
import {
  DocumentChunk,
  ExamAnswerStyle,
  ExamDifficulty,
  ExamPrepData,
  StudyDocument,
} from '../types/aura';
import { generateExamPrep } from '../services/auraApi';

interface ExamModeViewProps {
  documents: StudyDocument[];
  selectedDocIds: string[];
}

export const ExamModeView: React.FC<ExamModeViewProps> = ({
  documents,
  selectedDocIds,
}) => {
  const activeDocs =
    selectedDocIds.length > 0
      ? documents.filter((d) => selectedDocIds.includes(d.id))
      : documents;

  const [difficulty, setDifficulty] = useState<ExamDifficulty>('Medium');
  const [answerStyle, setAnswerStyle] = useState<ExamAnswerStyle>('Exam-ready');
  const [examData, setExamData] = useState<ExamPrepData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSources, setOpenSources] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleSource = (id: string) => {
    setOpenSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChecklist = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerateExamPack = async () => {
    const chunks: DocumentChunk[] = activeDocs.flatMap((d) => d.chunks);
    if (chunks.length === 0) return;

    setIsLoading(true);
    setError(null);
    try {
      const scopeLabel = activeDocs.map((d) => d.name).join(', ');
      const data = await generateExamPrep(chunks, difficulty, answerStyle, scopeLabel);
      setExamData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate exam pack.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateExamPack();
  }, [difficulty, answerStyle, selectedDocIds.join(',')]);

  return (
    <div className="space-y-6">
      {/* Header & Configuration Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Exam Mode</h1>
          <p className="text-sm text-slate-400 mt-1">
            Convert your uploaded study material into short-answer and long-answer exam questions,
            definitions, and a revision checklist.
          </p>
        </div>

        <button
          onClick={handleGenerateExamPack}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl transition-colors whitespace-nowrap self-start lg:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Generate New Exam Pack</span>
        </button>
      </div>

      {/* Difficulty & Answer Style Selector Controls */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Difficulty:</span>
          {(['Easy', 'Medium', 'Hard'] as ExamDifficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                difficulty === level
                  ? 'bg-emerald-400 text-slate-950 font-semibold'
                  : 'bg-[#090D16] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Answer Style:</span>
          {(['Very short', 'Exam-ready', 'Detailed'] as ExamAnswerStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => setAnswerStyle(style)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                answerStyle === style
                  ? 'bg-emerald-400 text-slate-950 font-semibold'
                  : 'bg-[#090D16] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3">
          <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
          <div className="text-base font-semibold text-white">
            Preparing your {difficulty.toLowerCase()} exam questions ({answerStyle} style)...
          </div>
          <p className="text-xs text-slate-400">
            Extracting verifiable answers and page citations from your notes.
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-200">
          {error}
        </div>
      )}

      {!isLoading && examData && (
        <div className="space-y-8">
          {/* 1. Short-Answer Questions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white">
                01. Short-Answer Exam Questions
              </h2>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {examData.difficulty} · {examData.answerStyle}
              </span>
            </div>

            <div className="space-y-4">
              {examData.shortAnswerQuestions.map((q, idx) => {
                const showSrc = Boolean(openSources[q.id]);
                return (
                  <div
                    key={q.id}
                    className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                      <span className="text-emerald-400">
                        Short Question #{idx + 1} · {q.topic}
                      </span>
                      <span>[{q.marks || 3} Marks]</span>
                    </div>

                    <h3 className="text-base font-semibold text-white">{q.question}</h3>

                    <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {q.answer}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500">
                        Grounded in your study material
                      </span>
                      <button
                        onClick={() => toggleSource(q.id)}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        {showSrc ? 'Hide source' : 'Show source'}
                      </button>
                    </div>

                    {showSrc && (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 text-xs space-y-1">
                        <div className="font-semibold text-emerald-300 font-mono tabular-nums">
                          📄 {q.documentName} · Page {q.pageNumber}
                        </div>
                        <p className="text-slate-300 italic">&ldquo;{q.sourceSnippet}&rdquo;</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Long-Answer Questions */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold text-white">
              02. Long-Answer &amp; Analytical Questions
            </h2>

            <div className="space-y-4">
              {examData.longAnswerQuestions.map((q, idx) => {
                const showSrc = Boolean(openSources[q.id]);
                return (
                  <div
                    key={q.id}
                    className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                      <span className="text-emerald-400">
                        Long Question #{idx + 1} · {q.topic}
                      </span>
                      <span>[{q.marks || 10} Marks]</span>
                    </div>

                    <h3 className="text-base font-semibold text-white">{q.question}</h3>

                    <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-4 space-y-3">
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                        {q.answer}
                      </p>

                      {q.keyPointsToInclude && q.keyPointsToInclude.length > 0 && (
                        <div className="pt-3 border-t border-white/[0.06]">
                          <div className="text-xs font-semibold text-emerald-400 mb-1.5">
                            Examiner Marking Rubric Checkpoints:
                          </div>
                          <ul className="space-y-1">
                            {q.keyPointsToInclude.map((kp, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-emerald-400">✓</span>
                                <span>{kp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500">
                        Grounded in your study material
                      </span>
                      <button
                        onClick={() => toggleSource(q.id)}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        {showSrc ? 'Hide source' : 'Show source'}
                      </button>
                    </div>

                    {showSrc && (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 text-xs space-y-1">
                        <div className="font-semibold text-emerald-300 font-mono tabular-nums">
                          📄 {q.documentName} · Page {q.pageNumber}
                        </div>
                        <p className="text-slate-300 italic">&ldquo;{q.sourceSnippet}&rdquo;</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Exam Definitions & Revision Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exam Definitions */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">03. Exam Definitions</h2>
              <div className="bg-[#111827] border border-white/[0.08] rounded-2xl divide-y divide-white/[0.06]">
                {examData.definitions.map((def, idx) => {
                  const srcKey = `def-${idx}`;
                  const showSrc = Boolean(openSources[srcKey]);
                  return (
                    <div key={idx} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{def.term}</span>
                        <button
                          onClick={() => toggleSource(srcKey)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          {showSrc ? 'Hide source' : 'Show source'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{def.examDefinition}</p>
                      {showSrc && (
                        <div className="bg-[#090D16] border border-white/10 rounded-lg p-2.5 text-xs text-slate-400 font-mono">
                          📄 {def.documentName} · Page {def.pageNumber}: &ldquo;{def.sourceSnippet}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Revision Checklist */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">
                04. Exam Revision Checklist
              </h2>
              <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4 space-y-2.5">
                {examData.revisionChecklist.map((item) => {
                  const checked = Boolean(checkedItems[item.id]);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className="w-full text-left p-3 rounded-xl bg-[#090D16] hover:bg-slate-900 border border-white/[0.06] flex items-start gap-3 transition-colors cursor-pointer"
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div
                          className={`text-xs sm:text-sm ${
                            checked ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {item.item}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Topic: {item.topic} · Priority: {item.priority}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
