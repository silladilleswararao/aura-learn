import React from 'react';
import {
  ArrowRight,
  BookOpen,
  FileText,
  Flame,
  Gamepad2,
  GraduationCap,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Upload,
} from 'lucide-react';
import {
  NavigationTab,
  StudentProgress,
  StudyDocument,
  TopicMastery,
} from '../types/aura';

interface DashboardHomeViewProps {
  documents: StudyDocument[];
  progress: StudentProgress;
  onNavigate: (tab: NavigationTab) => void;
  onPracticeWeakTopic: (topic: string) => void;
  onAskPrompt: (prompt: string) => void;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  documents,
  progress,
  onNavigate,
  onPracticeWeakTopic,
  onAskPrompt,
}) => {
  const topicsList = Object.values(progress.topicMastery) as TopicMastery[];
  const weakTopics = topicsList.filter((t) => t.status === 'Needs Practice');
  const strongTopics = topicsList.filter((t) => t.status === 'Strong');
  const improvingTopics = topicsList.filter((t) => t.status === 'Improving');

  return (
    <div className="space-y-8">
      {/* Greeting & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-emerald-400">
            LEVEL {progress.level} SCHOLAR · {progress.xp} XP
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-0.5">
            Good to see you.
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ready when you are. Pick up where you left off or challenge your weak topics in Quiz
            Arena.
          </p>
        </div>

        <button
          onClick={() => onNavigate('documents')}
          className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Study Material</span>
        </button>
      </div>

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('documents')}
          className="bg-[#111827] border border-white/[0.08] hover:border-white/15 rounded-2xl p-5 cursor-pointer transition-colors"
        >
          <div className="text-xs text-slate-400">Documents</div>
          <div className="text-3xl font-bold font-mono tabular-nums text-white mt-1.5">
            {documents.length}
          </div>
          <div className="text-xs text-emerald-400 mt-2">
            {documents.reduce((sum, d) => sum + d.chunkCount, 0)} Knowledge Chunks Indexed
          </div>
        </div>

        <div
          onClick={() => onNavigate('ask')}
          className="bg-[#111827] border border-white/[0.08] hover:border-white/15 rounded-2xl p-5 cursor-pointer transition-colors"
        >
          <div className="text-xs text-slate-400">Questions Asked</div>
          <div className="text-3xl font-bold font-mono tabular-nums text-white mt-1.5">
            {progress.questionsAsked}
          </div>
          <div className="text-xs text-slate-400 mt-2">100% Source-Grounded RAG</div>
        </div>

        <div
          onClick={() => onNavigate('quiz')}
          className="bg-[#111827] border border-white/[0.08] hover:border-white/15 rounded-2xl p-5 cursor-pointer transition-colors"
        >
          <div className="text-xs text-slate-400">Best Quiz Score</div>
          <div className="text-3xl font-bold font-mono tabular-nums text-emerald-400 mt-1.5">
            {progress.highScore}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {progress.quizzesCompleted} Arena Rounds Completed
          </div>
        </div>

        <div
          onClick={() => onNavigate('progress')}
          className="bg-[#111827] border border-white/[0.08] hover:border-white/15 rounded-2xl p-5 cursor-pointer transition-colors"
        >
          <div className="text-xs text-slate-400">Current Streak</div>
          <div className="text-3xl font-bold font-mono tabular-nums text-amber-400 mt-1.5">
            🔥 x{progress.currentStreak}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Best Streak: x{progress.bestStreak}
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('ask')}
          className="text-left bg-[#111827] hover:bg-slate-800/80 border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-5 transition-colors flex items-center justify-between cursor-pointer"
        >
          <div className="space-y-1">
            <div className="text-xs font-mono text-emerald-400">QUICK ACTION 01</div>
            <div className="text-base font-bold text-white">Ask Aura</div>
            <p className="text-xs text-slate-400">
              Get answers with exact page snippets from your notes.
            </p>
          </div>
          <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />
        </button>

        <button
          onClick={() => onNavigate('study')}
          className="text-left bg-[#111827] hover:bg-slate-800/80 border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-5 transition-colors flex items-center justify-between cursor-pointer"
        >
          <div className="space-y-1">
            <div className="text-xs font-mono text-emerald-400">QUICK ACTION 02</div>
            <div className="text-base font-bold text-white">Study Mode</div>
            <p className="text-xs text-slate-400">
              Review concept cards, definitions, and flashcards.
            </p>
          </div>
          <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
        </button>

        <button
          onClick={() => onNavigate('quiz')}
          className="text-left bg-[#111827] hover:bg-slate-800/80 border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-5 transition-colors flex items-center justify-between cursor-pointer"
        >
          <div className="space-y-1">
            <div className="text-xs font-mono text-emerald-400">QUICK ACTION 03</div>
            <div className="text-base font-bold text-white">Take Quiz</div>
            <p className="text-xs text-slate-400">
              Compete in Quick Fire, Survival, or Boss Battle.
            </p>
          </div>
          <Gamepad2 className="w-5 h-5 text-emerald-400 shrink-0" />
        </button>
      </section>

      {/* Main Two-Column Grid: Weak Topics & Continue Learning + Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Weak Topics & Learning Map */}
        <div className="lg:col-span-7 bg-[#111827] border border-white/[0.08] rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-emerald-400">WEAK TOPIC DETECTION</div>
                <h2 className="font-display text-xl font-bold text-white">Your Learning Map</h2>
              </div>
              <button
                onClick={() => onNavigate('progress')}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                Full Progress →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-semibold text-emerald-400">🟢 Strong</div>
                {strongTopics.slice(0, 3).map((t) => (
                  <div key={t.topic} className="text-xs text-slate-200 flex justify-between">
                    <span className="truncate">{t.topic}</span>
                    <span className="font-mono tabular-nums text-emerald-400">
                      {t.masteryPercent}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-semibold text-amber-400">🟡 Improving</div>
                {improvingTopics.slice(0, 3).map((t) => (
                  <div key={t.topic} className="text-xs text-slate-200 flex justify-between">
                    <span className="truncate">{t.topic}</span>
                    <span className="font-mono tabular-nums text-amber-400">
                      {t.masteryPercent}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#090D16] border border-rose-500/30 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-semibold text-rose-400">🔴 Needs Practice</div>
                {weakTopics.slice(0, 3).map((t) => (
                  <div key={t.topic} className="text-xs text-slate-200 flex justify-between">
                    <span className="truncate">{t.topic}</span>
                    <span className="font-mono tabular-nums text-rose-400">
                      {t.masteryPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {weakTopics.length > 0 && (
              <div className="bg-[#090D16] border border-white/[0.08] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-white">
                    We noticed you&rsquo;re struggling with &ldquo;{weakTopics[0].topic}&rdquo; (
                    {weakTopics[0].masteryPercent}% Mastery).
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Let&rsquo;s strengthen that topic with a focused 5-question adaptive quiz from{' '}
                    {weakTopics[0].documentName}.
                  </p>
                </div>

                <button
                  onClick={() => onPracticeWeakTopic(weakTopics[0].topic)}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Practice {weakTopics[0].topic}
                </button>
              </div>
            )}
          </div>

          {/* Continue Learning Prompts */}
          <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
            <div className="text-xs text-slate-400 font-medium">
              Continue Learning · One-Click Grounded Questions
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Compare L1 and L2 regularization from Unit 2 Notes',
                'Explain Python LEGB scope rule and mutable default arguments',
                'What are the four Coffman conditions for Deadlock?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => onAskPrompt(q)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#090D16] hover:bg-slate-900 border border-white/[0.07] rounded-lg transition-colors cursor-pointer"
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Recent Study Documents */}
        <div className="lg:col-span-5 bg-[#111827] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-emerald-400">KNOWLEDGE BASE</div>
                <h2 className="font-display text-xl font-bold text-white">Recent Documents</h2>
              </div>
              <button
                onClick={() => onNavigate('documents')}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                Manage All →
              </button>
            </div>

            <div className="space-y-3">
              {documents.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onNavigate('documents')}
                  className="bg-[#090D16] hover:bg-slate-900 border border-white/[0.06] rounded-xl p-3.5 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      📄 {doc.name}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-emerald-400 shrink-0">
                      {doc.pageCount}p · {doc.chunkCount} chunks
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    Topics: {doc.topics.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={() => onNavigate('search')}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Search inside documents →
            </button>
            <button
              onClick={() => onNavigate('exam')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              Open Exam Mode →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
