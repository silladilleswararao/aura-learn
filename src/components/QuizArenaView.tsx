import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Gamepad2,
  Heart,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Swords,
  Target,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  DocumentChunk,
  NavigationTab,
  QuizAttemptResult,
  QuizGameMode,
  QuizQuestion,
  StudyDocument,
} from '../types/aura';
import { generateQuizQuestions } from '../services/auraApi';

interface QuizArenaViewProps {
  documents: StudyDocument[];
  selectedDocIds: string[];
  initialMode?: QuizGameMode;
  initialFocusTopic?: string | null;
  onClearInitialFocus?: () => void;
  onCompleteQuiz: (result: QuizAttemptResult) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({
  documents,
  selectedDocIds,
  initialMode,
  initialFocusTopic,
  onClearInitialFocus,
  onCompleteQuiz,
  onNavigate,
}) => {
  const activeDocs =
    selectedDocIds.length > 0
      ? documents.filter((d) => selectedDocIds.includes(d.id))
      : documents;

  const activeChunks: DocumentChunk[] = activeDocs.flatMap((d) => d.chunks);

  const [gameState, setGameState] = useState<'lobby' | 'loading' | 'playing' | 'results'>('lobby');
  const [selectedMode, setSelectedMode] = useState<QuizGameMode>(initialMode || 'quick_fire');
  const [focusTopic, setFocusTopic] = useState<string | undefined>(
    initialFocusTopic || undefined
  );

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [topicStats, setTopicStats] = useState<Record<string, { correct: number; total: number }>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialFocusTopic) {
      setSelectedMode('weak_topic');
      setFocusTopic(initialFocusTopic);
      startQuiz('weak_topic', initialFocusTopic);
      if (onClearInitialFocus) onClearInitialFocus();
    }
  }, [initialFocusTopic]);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      if (selectedMode === 'quick_fire') {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [gameState, selectedMode]);

  const startQuiz = async (modeToStart: QuizGameMode, topicToFocus?: string) => {
    if (activeChunks.length === 0) {
      setError('Please upload or select at least one study document first.');
      return;
    }

    setError(null);
    setSelectedMode(modeToStart);
    setFocusTopic(topicToFocus);
    setGameState('loading');

    try {
      const count =
        modeToStart === 'boss_battle' || modeToStart === 'weak_topic'
          ? 5
          : modeToStart === 'quick_fire'
          ? 10
          : 8;
      const generated = await generateQuizQuestions(
        activeChunks,
        modeToStart,
        topicToFocus,
        count
      );

      setQuestions(generated);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setLives(3);
      setCorrectCount(0);
      setWrongCount(0);
      setTimeRemaining(60);
      setElapsedSeconds(0);
      setTopicStats({});
      setGameState('playing');
    } catch (err: any) {
      setError(err?.message || 'Could not generate quiz questions. Please try again.');
      setGameState('lobby');
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (isAnswered) return;

    const currentQ = questions[currentIndex];
    const isCorrect = option === currentQ.correctAnswer;
    setSelectedOption(option);
    setIsAnswered(true);

    const basePoints =
      selectedMode === 'boss_battle'
        ? 250
        : currentQ.difficulty === 'Hard'
        ? 150
        : currentQ.difficulty === 'Medium'
        ? 120
        : 100;

    const nextStreak = isCorrect ? streak + 1 : 0;
    const nextBestStreak = Math.max(bestStreak, nextStreak);
    const streakBonus = isCorrect && nextStreak >= 2 ? nextStreak * 25 : 0;
    const nextScore = isCorrect ? score + basePoints + streakBonus : score;
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount;
    const nextWrong = isCorrect ? wrongCount : wrongCount + 1;
    const nextLives = selectedMode === 'survival' && !isCorrect ? lives - 1 : lives;

    setStreak(nextStreak);
    setBestStreak(nextBestStreak);
    setScore(nextScore);
    setCorrectCount(nextCorrect);
    setWrongCount(nextWrong);
    setLives(nextLives);

    setTopicStats((prev) => {
      const existing = prev[currentQ.topic] || { correct: 0, total: 0 };
      return {
        ...prev,
        [currentQ.topic]: {
          correct: existing.correct + (isCorrect ? 1 : 0),
          total: existing.total + 1,
        },
      };
    });
  };

  const finishGame = (
    overrideScore = score,
    overrideCorrect = correctCount,
    overrideWrong = wrongCount,
    overrideBestStreak = bestStreak,
    overrideStats = topicStats
  ) => {
    if (timerRef.current) window.clearInterval(timerRef.current);

    const totalAnswered = overrideCorrect + overrideWrong;
    const accuracy =
      totalAnswered > 0 ? Math.round((overrideCorrect / totalAnswered) * 100) : 0;

    const breakdown = Object.entries(overrideStats).map(([topic, stat]) => ({
      topic,
      correct: stat.correct,
      total: stat.total,
    }));

    const result: QuizAttemptResult = {
      id: `quiz-${Date.now()}`,
      mode: selectedMode,
      focusTopic,
      score: overrideScore,
      accuracy,
      correctCount: overrideCorrect,
      wrongCount: overrideWrong,
      totalQuestions: questions.length,
      bestStreak: overrideBestStreak,
      timeSeconds: Math.max(1, elapsedSeconds),
      completedAt: new Date().toISOString(),
      topicBreakdown: breakdown,
    };

    onCompleteQuiz(result);
    setGameState('results');
  };

  const handleNextQuestion = () => {
    if (selectedMode === 'survival' && lives <= 0) {
      finishGame();
      return;
    }

    if (currentIndex + 1 >= questions.length) {
      finishGame();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  // Mode Selection Lobby
  if (gameState === 'lobby') {
    return (
      <div className="space-y-8">
        <div>
          <div className="text-xs font-mono text-emerald-400 mb-1">
            INTERACTIVE KNOWLEDGE CHALLENGE
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Quiz Arena</h1>
          <p className="text-sm text-slate-400 mt-1">
            Let&rsquo;s test what you know. Every question is generated directly from your uploaded
            study material.
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* 4 Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mode 1: Quick Fire */}
          <div className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-emerald-400">60-SECOND TIMER</span>
              </div>
              <h2 className="font-display text-xl font-bold text-white">Mode 1 — Quick Fire</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Answer as many grounded questions as possible before the 60-second clock runs out.
                Chain correct answers to multiply your streak bonus!
              </p>
            </div>
            <button
              onClick={() => startQuiz('quick_fire')}
              className="mt-6 w-full py-3 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
            >
              Play Quick Fire →
            </button>
          </div>

          {/* Mode 2: Survival */}
          <div className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-rose-400">3 LIVES · HIGH STAKES</span>
              </div>
              <h2 className="font-display text-xl font-bold text-white">Mode 2 — Survival</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Start with 3 lives (❤️ ❤️ ❤️). Every wrong answer costs one life. Keep the streak
                alive and survive all questions to claim victory.
              </p>
            </div>
            <button
              onClick={() => startQuiz('survival')}
              className="mt-6 w-full py-3 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Play Survival →
            </button>
          </div>

          {/* Mode 3: Boss Battle */}
          <div className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Swords className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-amber-400">5 HARD QUESTIONS · 2.5X PTS</span>
              </div>
              <h2 className="font-display text-xl font-bold text-white">Mode 3 — Boss Battle</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Face 5 deep conceptual and reasoning questions extracted from the hardest sections
                of your uploaded notes. Massive XP and score rewards!
              </p>
            </div>
            <button
              onClick={() => startQuiz('boss_battle')}
              className="mt-6 w-full py-3 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Challenge the Boss →
            </button>
          </div>

          {/* Mode 4: Mix It Up */}
          <div className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-cyan-400">MULTI-FORMAT VARIETY</span>
              </div>
              <h2 className="font-display text-xl font-bold text-white">Mode 4 — Mix It Up</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Dynamic blend of Multiple Choice, True/False, Fill in the Blank, and Concept-based
                application questions from your selected documents.
              </p>
            </div>
            <button
              onClick={() => startQuiz('mix_it_up')}
              className="mt-6 w-full py-3 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Play Mix It Up →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (gameState === 'loading') {
    return (
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-14 text-center space-y-4 my-8">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
        <h2 className="font-display text-xl font-bold text-white">
          {focusTopic
            ? `Building your targeted practice quiz on "${focusTopic}"...`
            : 'Building your quiz from your uploaded study material...'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Aura is selecting verifiable facts, crafting options, and linking page citations.
        </p>
      </div>
    );
  }

  // Results Screen
  if (gameState === 'results') {
    const totalAnswered = correctCount + wrongCount;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    const strongTopics = Object.entries(topicStats)
      .filter(([, s]) => s.total > 0 && s.correct / s.total >= 0.7)
      .map(([t]) => t);

    const weakTopics = Object.entries(topicStats)
      .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.7)
      .map(([t]) => t);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2 border-b border-white/[0.08] pb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-emerald-400 tracking-wider">QUIZ COMPLETE</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white font-mono tabular-nums">
              {score} PTS
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {accuracy >= 80
                ? "Outstanding mastery! You're getting stronger."
                : 'Solid effort! Review the topic breakdown below to sharpen weak areas.'}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-3.5">
              <div className="text-xs text-slate-400">Accuracy</div>
              <div className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1">
                {accuracy}%
              </div>
            </div>
            <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-3.5">
              <div className="text-xs text-slate-400">Correct</div>
              <div className="text-lg font-bold font-mono tabular-nums text-white mt-1">
                {correctCount}
              </div>
            </div>
            <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-3.5">
              <div className="text-xs text-slate-400">Wrong</div>
              <div className="text-lg font-bold font-mono tabular-nums text-rose-400 mt-1">
                {wrongCount}
              </div>
            </div>
            <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-3.5">
              <div className="text-xs text-slate-400">Best Streak</div>
              <div className="text-lg font-bold font-mono tabular-nums text-amber-400 mt-1">
                x{bestStreak}
              </div>
            </div>
            <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-3.5 col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-400">Time</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-200 mt-1">
                {elapsedSeconds} sec
              </div>
            </div>
          </div>

          {/* Topic Performance Breakdown */}
          <div className="space-y-4 pt-2">
            <div className="text-xs font-mono text-slate-400">TOPIC PERFORMANCE</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold text-emerald-400">🟢 Strong</div>
                {strongTopics.length > 0 ? (
                  <ul className="space-y-1 text-xs sm:text-sm text-slate-200">
                    {strongTopics.map((t) => (
                      <li key={t}>• {t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">
                    Keep practicing to move topics into Strong mastery.
                  </p>
                )}
              </div>

              <div className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold text-rose-400">🔴 Needs Practice</div>
                {weakTopics.length > 0 ? (
                  <ul className="space-y-1 text-xs sm:text-sm text-slate-200">
                    {weakTopics.map((t) => (
                      <li key={t}>• {t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">
                    Zero weak topics in this round! Great job.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {weakTopics.length > 0 && (
                <button
                  onClick={() => startQuiz('weak_topic', weakTopics[0])}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
                >
                  Practice Weak Topics ({weakTopics[0]})
                </button>
              )}

              <button
                onClick={() => startQuiz(selectedMode, focusTopic)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors cursor-pointer"
              >
                Play Again
              </button>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Gameplay State
  const currentQ = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);
  const isCorrectSelection = selectedOption === currentQ?.correctAnswer;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Adaptive Practice Banner if focused on a weak topic */}
      {selectedMode === 'weak_topic' && focusTopic && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-emerald-200">
          <span>
            We noticed you&rsquo;re strengthening <strong>{focusTopic}</strong>. Let&rsquo;s master
            this topic!
          </span>
          <span className="font-mono">ADAPTIVE PRACTICE</span>
        </div>
      )}

      {/* Top HUD Bar */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono tabular-nums text-slate-300">
            QUESTION {currentIndex + 1} / {questions.length} ·{' '}
            <span className="text-emerald-400">{currentQ.difficulty}</span>
          </div>

          <div className="flex items-center gap-5 font-mono tabular-nums text-xs sm:text-sm">
            {/* Streak */}
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <span>🔥 STREAK x{streak}</span>
            </div>

            {/* Lives in Survival Mode */}
            {selectedMode === 'survival' && (
              <div className="flex items-center gap-1" aria-label={`${lives} lives remaining`}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <span key={idx} className={idx < lives ? 'opacity-100' : 'opacity-25'}>
                    ❤️
                  </span>
                ))}
              </div>
            )}

            {/* Timer */}
            <div className="flex items-center gap-1.5 text-slate-200">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>
                {selectedMode === 'quick_fire' ? `${timeRemaining}s` : `${elapsedSeconds}s`}
              </span>
            </div>

            {/* Score */}
            <div className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold">
              {score} PTS
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Topic: {currentQ.topic} · 📄 {currentQ.documentName} (Page {currentQ.pageNumber})
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
            {currentQ.question}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = selectedOption === option;
            const isRightOption = option === currentQ.correctAnswer;

            let btnStyle =
              'bg-[#090D16] hover:bg-slate-900 border-white/10 text-slate-200';
            if (isAnswered) {
              if (isRightOption) {
                btnStyle =
                  'bg-emerald-950/50 border-emerald-400 text-emerald-200 font-semibold';
              } else if (isSelected && !isRightOption) {
                btnStyle = 'bg-rose-950/50 border-rose-500 text-rose-200';
              } else {
                btnStyle = 'bg-[#090D16] border-white/5 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(option)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${btnStyle}`}
              >
                <span className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                  {letter}
                </span>
                <span className="text-sm leading-relaxed flex-1">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback + Short Grounded Explanation */}
        {isAnswered && (
          <div
            className={`rounded-xl p-4 border space-y-2 ${
              isCorrectSelection
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-rose-950/30 border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`text-sm font-bold ${
                  isCorrectSelection ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {isCorrectSelection ? 'Nice! 🔥' : 'Not this time.'}
              </div>
              <span className="text-xs font-mono text-slate-400">
                📄 {currentQ.documentName} · Page {currentQ.pageNumber}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {currentQ.explanation}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                <span>
                  {selectedMode === 'survival' && lives <= 0
                    ? 'See Final Results'
                    : currentIndex + 1 >= questions.length
                    ? 'Finish Quiz'
                    : 'Next Question'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
