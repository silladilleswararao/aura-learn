import React from 'react';
import {
  Award,
  BookOpen,
  Flame,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { StudentProgress, TopicMastery } from '../types/aura';

interface ProgressViewProps {
  progress: StudentProgress;
  documentsCount: number;
  onPracticeWeakTopic: (topic: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  documentsCount,
  onPracticeWeakTopic,
}) => {
  const topicsList = Object.values(progress.topicMastery) as TopicMastery[];
  const overallMastery =
    topicsList.length > 0
      ? Math.round(
          topicsList.reduce((acc, t) => acc + t.masteryPercent, 0) / topicsList.length
        )
      : 0;

  const quizAccuracy =
    progress.totalQuizQuestionsAnswered > 0
      ? Math.round((progress.totalQuizCorrect / progress.totalQuizQuestionsAnswered) * 100)
      : 0;

  const strongTopics = topicsList.filter((t) => t.status === 'Strong');
  const improvingTopics = topicsList.filter((t) => t.status === 'Improving');
  const weakTopics = topicsList.filter((t) => t.status === 'Needs Practice');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Learning Progress &amp; Mastery
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time statistics based on your study sessions, questions asked, and Quiz Arena
            performance.
          </p>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-4 font-mono tabular-nums text-xs">
          <div>
            <span className="text-slate-400">Level </span>
            <strong className="text-emerald-400 text-sm">{progress.level}</strong>
          </div>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <div>
            <span className="text-slate-400">XP </span>
            <strong className="text-white text-sm">{progress.xp}</strong>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-xs text-slate-400">Overall Mastery</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {overallMastery}%
          </div>
        </div>

        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-xs text-slate-400">Quiz Accuracy</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {quizAccuracy}%
          </div>
        </div>

        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-xs text-slate-400">Questions Answered</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {progress.totalQuizQuestionsAnswered + progress.questionsAsked}
          </div>
        </div>

        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-xs text-slate-400">Current Streak</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
            x{progress.currentStreak}
          </div>
        </div>

        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-xs text-slate-400">Best Streak</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-300 mt-1">
            x{progress.bestStreak}
          </div>
        </div>

        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-xs text-slate-400">Documents Studied</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {documentsCount}
          </div>
        </div>
      </div>

      {/* YOUR LEARNING MAP (Weak Topic Detection) */}
      <section className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono text-emerald-400">ADAPTIVE DIAGNOSTICS</div>
            <h2 className="font-display text-xl font-bold text-white">Your Learning Map</h2>
          </div>
          <span className="text-xs text-slate-400">
            Automatically updated after every Quiz Arena round
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Strong */}
          <div className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-emerald-400">🟢 Strong (75%+)</div>
            {strongTopics.length === 0 ? (
              <p className="text-xs text-slate-500">Complete quizzes to unlock Strong topics.</p>
            ) : (
              <div className="space-y-2">
                {strongTopics.map((t) => (
                  <div
                    key={t.topic}
                    className="flex items-center justify-between text-xs text-slate-200"
                  >
                    <span>{t.topic}</span>
                    <span className="font-mono tabular-nums text-emerald-400">
                      {t.masteryPercent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improving */}
          <div className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-amber-400">🟡 Improving (55%–74%)</div>
            {improvingTopics.length === 0 ? (
              <p className="text-xs text-slate-500">No topics currently in Improving tier.</p>
            ) : (
              <div className="space-y-2">
                {improvingTopics.map((t) => (
                  <div
                    key={t.topic}
                    className="flex items-center justify-between text-xs text-slate-200"
                  >
                    <span>{t.topic}</span>
                    <span className="font-mono tabular-nums text-amber-400">
                      {t.masteryPercent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Needs Practice */}
          <div className="bg-[#090D16] border border-rose-500/25 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-rose-400">🔴 Needs Practice (&lt;55%)</div>
            {weakTopics.length === 0 ? (
              <p className="text-xs text-slate-500">
                All tracked topics are above 55% mastery!
              </p>
            ) : (
              <div className="space-y-2.5">
                {weakTopics.map((t) => (
                  <div
                    key={t.topic}
                    className="flex items-center justify-between gap-2 text-xs text-slate-200"
                  >
                    <div>
                      <div className="font-medium text-white">{t.topic}</div>
                      <div className="text-[11px] font-mono tabular-nums text-rose-400">
                        {t.masteryPercent}% Mastery
                      </div>
                    </div>
                    <button
                      onClick={() => onPracticeWeakTopic(t.topic)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Practice {t.topic}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Topic Mastery Progress Bars */}
      <section className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-white">Topic Mastery Breakdown</h2>

        <div className="space-y-4">
          {topicsList.map((item) => {
            const barColor =
              item.status === 'Strong'
                ? 'bg-emerald-400'
                : item.status === 'Improving'
                ? 'bg-amber-400'
                : 'bg-rose-400';

            return (
              <div key={item.topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{item.topic}</span>
                    <span className="text-xs text-slate-500">· {item.documentName}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                    <span className="text-slate-400">
                      {item.correct}/{item.attempts} Correct
                    </span>
                    <span className="font-bold text-white">{item.masteryPercent}%</span>
                  </div>
                </div>
                <div className="h-2 bg-[#090D16] rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className={`h-full ${barColor} transition-all duration-300`}
                    style={{ width: `${item.masteryPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gamification Badges */}
      <section className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-white">Student Milestones &amp; Badges</h2>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {progress.badges.filter((b) => b.unlocked).length} / {progress.badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {progress.badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-xl p-4 border transition-colors ${
                badge.unlocked
                  ? 'bg-[#090D16] border-emerald-500/30 text-white'
                  : 'bg-[#090D16]/50 border-white/[0.05] text-slate-500 opacity-60'
              }`}
            >
              <div className="text-xs font-mono text-emerald-400 mb-1">
                {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
              </div>
              <div className="text-sm font-bold">{badge.name}</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{badge.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
