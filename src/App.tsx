/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  FileText,
  Flame,
  Gamepad2,
  GraduationCap,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  ChatMessage,
  NavigationTab,
  QuizAttemptResult,
  StudentProgress,
  StudyDocument,
  TopicMastery,
  TopicStatus,
} from './types/aura';
import { INITIAL_STUDENT_PROGRESS, SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { LandingPage } from './components/LandingPage';
import { DashboardHomeView } from './components/DashboardHomeView';
import { DocumentsView } from './components/DocumentsView';
import { AskAuraView } from './components/AskAuraView';
import { StudyModeView } from './components/StudyModeView';
import { ExamModeView } from './components/ExamModeView';
import { QuizArenaView } from './components/QuizArenaView';
import { SearchView } from './components/SearchView';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';

const STORAGE_KEYS = {
  DOCS: 'aura_learn_documents_v4',
  SELECTED_DOCS: 'aura_learn_selected_docs_v4',
  PROGRESS: 'aura_learn_progress_v4',
  CHAT: 'aura_learn_chat_v4',
};

// Cleanup old stale storage versions
try {
  ['v1', 'v2', 'v3'].forEach((ver) => {
    localStorage.removeItem(`aura_learn_documents_${ver}`);
    localStorage.removeItem(`aura_learn_selected_docs_${ver}`);
    localStorage.removeItem(`aura_learn_chat_${ver}`);
  });
} catch {
  // Ignore
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);

  const [documents, setDocuments] = useState<StudyDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_DOCS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [progress, setProgress] = useState<StudentProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_STUDENT_PROGRESS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [pendingAskPrompt, setPendingAskPrompt] = useState<string | null>(null);
  const [pendingQuizTopic, setPendingQuizTopic] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(documents));
    } catch {
      // Ignore quota errors
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_DOCS, JSON.stringify(selectedDocIds));
    } catch {
      // Ignore
    }
  }, [selectedDocIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    } catch {
      // Ignore
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatMessages));
    } catch {
      // Ignore
    }
  }, [chatMessages]);

  const handleNavigate = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        return next.length > 0 ? next : [id];
      }
      return [...prev, id];
    });
  };

  const handleSelectAllDocs = () => {
    setSelectedDocIds(documents.map((d) => d.id));
  };

  const handleAddDocuments = (newDocs: StudyDocument[]) => {
    setDocuments((prev) => {
      // Remove pre-loaded demo sample documents as soon as the student uploads their own file
      const userOnlyDocs = prev.filter((d) => !d.isSample);
      return [...newDocs, ...userOnlyDocs];
    });
    // Select ONLY the newly uploaded document(s) so Ask Aura, Study Mode, Exam Mode & Quiz Arena focus 100% on what the user uploaded
    setSelectedDocIds(newDocs.map((d) => d.id));
    setChatMessages([]);
    setProgress((prev) => {
      const freshTopicMastery: Record<string, TopicMastery> = {};
      for (const doc of newDocs) {
        for (const topic of doc.topics) {
          freshTopicMastery[topic] = {
            topic,
            documentName: doc.name,
            correct: 0,
            attempts: 0,
            masteryPercent: 50,
            status: 'Improving',
          };
        }
      }
      return {
        ...prev,
        xp: prev.xp + newDocs.length * 50,
        level: Math.max(1, Math.floor((prev.xp + newDocs.length * 50) / 250) + 1),
        topicMastery:
          Object.keys(freshTopicMastery).length > 0 ? freshTopicMastery : prev.topicMastery,
      };
    });
  };

  const handleRenameDocument = (id: string, newName: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              name: newName,
              chunks: doc.chunks.map((c) => ({ ...c, documentName: newName })),
            }
          : doc
      )
    );
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => {
      const remaining = prev.filter((d) => d.id !== id);
      setSelectedDocIds((sel) => {
        const filteredSel = sel.filter((s) => s !== id);
        return filteredSel.length > 0
          ? filteredSel
          : remaining.map((r) => r.id);
      });
      return remaining;
    });
  };

  const handleRestoreSampleDocs = () => {
    setDocuments(SAMPLE_DOCUMENTS);
    setSelectedDocIds(SAMPLE_DOCUMENTS.map((d) => d.id));
  };

  const handleQuestionAnswered = () => {
    setProgress((prev) => {
      const nextXp = prev.xp + 25;
      return {
        ...prev,
        xp: nextXp,
        level: Math.max(1, Math.floor(nextXp / 250) + 1),
        questionsAsked: prev.questionsAsked + 1,
      };
    });
  };

  const handleCompleteQuiz = (result: QuizAttemptResult) => {
    setProgress((prev) => {
      const updatedMastery: Record<string, TopicMastery> = { ...prev.topicMastery };

      for (const item of result.topicBreakdown) {
        const existing = updatedMastery[item.topic] || {
          topic: item.topic,
          documentName: documents[0]?.name || 'Uploaded Notes',
          correct: 0,
          attempts: 0,
          masteryPercent: 0,
          status: 'Improving' as TopicStatus,
        };

        const newCorrect = existing.correct + item.correct;
        const newAttempts = existing.attempts + item.total;
        const pct = newAttempts > 0 ? Math.round((newCorrect / newAttempts) * 100) : 50;
        const status: TopicStatus =
          pct >= 75 ? 'Strong' : pct >= 55 ? 'Improving' : 'Needs Practice';

        updatedMastery[item.topic] = {
          ...existing,
          correct: newCorrect,
          attempts: newAttempts,
          masteryPercent: pct,
          status,
          lastPracticedAt: result.completedAt,
        };
      }

      const nextXp = prev.xp + Math.max(50, Math.round(result.score / 5));
      const nextTotalCorrect = prev.totalQuizCorrect + result.correctCount;
      const nextTotalAnswered = prev.totalQuizQuestionsAnswered + result.totalQuestions;
      const nextBestStreak = Math.max(prev.bestStreak, result.bestStreak);
      const nextHighScore = Math.max(prev.highScore, result.score);
      const nextCurrentStreak =
        result.accuracy >= 60 ? prev.currentStreak + 1 : Math.max(1, result.bestStreak);

      const updatedBadges = prev.badges.map((b) => {
        if (b.id === 'badge-quiz-master' && (result.score >= 800 || result.mode === 'boss_battle')) {
          return { ...b, unlocked: true, unlockedAt: result.completedAt };
        }
        if (b.id === 'badge-10-correct' && nextTotalCorrect >= 10) {
          return { ...b, unlocked: true, unlockedAt: result.completedAt };
        }
        if (b.id === 'badge-first-streak' && nextBestStreak >= 3) {
          return { ...b, unlocked: true, unlockedAt: result.completedAt };
        }
        return b;
      });

      return {
        ...prev,
        xp: nextXp,
        level: Math.max(1, Math.floor(nextXp / 250) + 1),
        quizzesCompleted: prev.quizzesCompleted + 1,
        totalQuizQuestionsAnswered: nextTotalAnswered,
        totalQuizCorrect: nextTotalCorrect,
        highScore: nextHighScore,
        currentStreak: nextCurrentStreak,
        bestStreak: nextBestStreak,
        topicMastery: updatedMastery,
        quizHistory: [result, ...prev.quizHistory].slice(0, 20),
        badges: updatedBadges,
      };
    });
  };

  const triggerAskAboutTopic = (prompt: string) => {
    setPendingAskPrompt(prompt);
    setActiveTab('ask');
  };

  const triggerPracticeWeakTopic = (topic: string) => {
    setPendingQuizTopic(topic);
    setActiveTab('quiz');
  };

  if (activeTab === 'landing') {
    return (
      <LandingPage
        onEnterApp={(initialTab) => handleNavigate(initialTab || 'dashboard')}
      />
    );
  }

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'documents', label: 'My Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'ask', label: 'Ask Aura', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'study', label: 'Study Mode', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'exam', label: 'Exam Mode', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'quiz', label: 'Quiz Arena', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'search', label: 'Search Notes', icon: <Search className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row ${
        highContrastMode ? 'bg-black text-white' : 'bg-[#090D16] text-slate-100'
      }`}
    >
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0C121E] border-r border-white/[0.07] justify-between p-5 z-30">
        <div className="space-y-6">
          {/* Aura Learn Brand Logo */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={() => handleNavigate('landing')}
              className="text-left group cursor-pointer"
            >
              <div className="font-display text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                AURA LEARN
              </div>
              <div className="text-[11px] font-mono text-slate-400">LEARN. PLAY. MASTER.</div>
            </button>
          </div>

          {/* Primary Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Install App + Streak Status + Settings */}
        <div className="space-y-2.5 pt-4 border-t border-white/[0.07]">
          <PWAInstallButton variant="sidebar" />

          <div className="bg-[#111827] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-400">Level {progress.level}</span>
            <span className="text-amber-400 font-semibold">🔥 x{progress.currentStreak}</span>
            <span className="text-emerald-400">{progress.xp} XP</span>
          </div>

          <button
            onClick={() => handleNavigate('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-400 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => handleNavigate('landing')}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (Non-sticky so only bottom nav is fixed, respecting <=15% sticky cap) */}
      <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-[#0C121E] border-b border-white/[0.08]">
        <button
          onClick={() => handleNavigate('dashboard')}
          className="font-display text-lg font-bold tracking-tight text-white"
        >
          AURA LEARN
        </button>

        <div className="flex items-center gap-2.5">
          <PWAInstallButton variant="header" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 text-slate-300 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#090D16]/95 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-display text-lg font-bold text-white">AURA LEARN MENU</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-300 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                      isActive
                        ? 'bg-emerald-400 text-slate-950 font-semibold'
                        : 'text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <PWAInstallButton variant="sidebar" />
            <button
              onClick={() => handleNavigate('settings')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white rounded-xl"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => handleNavigate('landing')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-white rounded-xl"
            >
              <Home className="w-4 h-4" />
              <span>Back to Landing Page</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area (with pb-20 on mobile for bottom tab bar clearance) */}
      <main className="flex-1 lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          {activeTab === 'dashboard' && (
            <DashboardHomeView
              documents={documents}
              progress={progress}
              onNavigate={handleNavigate}
              onPracticeWeakTopic={triggerPracticeWeakTopic}
              onAskPrompt={triggerAskAboutTopic}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              documents={documents}
              selectedDocIds={selectedDocIds}
              onToggleSelectDoc={handleToggleSelectDoc}
              onSelectAllDocs={handleSelectAllDocs}
              onAddDocuments={handleAddDocuments}
              onRenameDocument={handleRenameDocument}
              onDeleteDocument={handleDeleteDocument}
              onRestoreSampleDocs={handleRestoreSampleDocs}
              onNavigate={handleNavigate}
              onAskAboutDocument={triggerAskAboutTopic}
            />
          )}

          {activeTab === 'ask' && (
            <AskAuraView
              documents={documents}
              selectedDocIds={selectedDocIds}
              onToggleSelectDoc={handleToggleSelectDoc}
              onSelectAllDocs={handleSelectAllDocs}
              onAddDocuments={handleAddDocuments}
              messages={chatMessages}
              onUpdateMessages={setChatMessages}
              onQuestionAnswered={handleQuestionAnswered}
              initialPrompt={pendingAskPrompt}
              onClearInitialPrompt={() => setPendingAskPrompt(null)}
            />
          )}

          {activeTab === 'study' && (
            <StudyModeView
              documents={documents}
              selectedDocIds={selectedDocIds}
              onAskAboutTopic={triggerAskAboutTopic}
            />
          )}

          {activeTab === 'exam' && (
            <ExamModeView documents={documents} selectedDocIds={selectedDocIds} />
          )}

          {activeTab === 'quiz' && (
            <QuizArenaView
              documents={documents}
              selectedDocIds={selectedDocIds}
              initialFocusTopic={pendingQuizTopic}
              onClearInitialFocus={() => setPendingQuizTopic(null)}
              onCompleteQuiz={handleCompleteQuiz}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'search' && (
            <SearchView
              documents={documents}
              selectedDocIds={selectedDocIds}
              onAskAboutSnippet={triggerAskAboutTopic}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressView
              progress={progress}
              documentsCount={documents.length}
              onPracticeWeakTopic={triggerPracticeWeakTopic}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              highContrastMode={highContrastMode}
              onToggleHighContrast={() => setHighContrastMode((prev) => !prev)}
              onClearChatHistory={() => setChatMessages([])}
              onResetProgress={() => setProgress(INITIAL_STUDENT_PROGRESS)}
              onRestoreSampleData={handleRestoreSampleDocs}
              onNavigate={handleNavigate}
            />
          )}
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (5 Thumb-Zone Tabs, 56px height) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C121E]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-5 items-center h-14 px-1">
        {[
          { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'documents', label: 'Files', icon: <FileText className="w-4 h-4" /> },
          { id: 'ask', label: 'Ask Aura', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'quiz', label: 'Quiz', icon: <Gamepad2 className="w-4 h-4" /> },
          { id: 'study', label: 'Study', icon: <BookOpen className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.id as NavigationTab)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Offline Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}
