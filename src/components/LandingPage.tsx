import React from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Flame,
  Gamepad2,
  GraduationCap,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { NavigationTab } from '../types/aura';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  onEnterApp: (initialTab?: NavigationTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Bar Contract: Zone 1 Brand | Zone 2 Nav Links | Zone 3 Primary Action */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-12 py-4 bg-[#090D16]/90 backdrop-blur-md border-b border-white/[0.07]">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap"
        >
          AURA LEARN
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('journey')}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Learning Loop
          </button>
          <button
            onClick={() => onEnterApp('quiz')}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Quiz Arena
          </button>
        </nav>

        <div className="flex items-center gap-2.5">
          <PWAInstallButton variant="header" />
          <button
            onClick={() => onEnterApp('dashboard')}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Start Learning
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main id="top" className="flex-1">
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Hero Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-mono tracking-wider text-emerald-400">
                LEARN. PLAY. MASTER. · GROUNDED STUDENT KNOWLEDGE ASSISTANT
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.08]">
                Turn your study material into an interactive learning experience.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Upload your notes, ask questions, prepare for exams, and challenge yourself with
                AI-powered quizzes — all from your own study material.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onEnterApp('dashboard')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-transform active:scale-[0.99] whitespace-nowrap cursor-pointer"
                >
                  <span>Start Learning</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Explore Features</span>
                </button>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <span>100% Grounded in Your Notes</span>
                <span aria-hidden="true">·</span>
                <span>Exact Page Citations</span>
                <span aria-hidden="true">·</span>
                <span>4 Interactive Quiz Modes</span>
                <span aria-hidden="true">·</span>
                <span>Adaptive Weak-Topic Practice</span>
              </div>
            </div>

            {/* Right Column: Interactive Dashboard Preview */}
            <div className="lg:col-span-6">
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl">
                {/* Preview Header */}
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                  <div>
                    <div className="text-xs text-slate-400">Active Study Workspace</div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      Unit-2-Machine-Learning-Notes.pdf · 6 Pages Indexed
                    </div>
                  </div>
                  <button
                    onClick={() => onEnterApp('ask')}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 whitespace-nowrap cursor-pointer"
                  >
                    Open Live Workspace →
                  </button>
                </div>

                {/* Ask Aura Grounded Answer Preview */}
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Student Question · <span className="text-slate-200">&ldquo;How does regularization prevent overfitting?&rdquo;</span>
                  </div>

                  <div className="bg-[#0B111E] border border-white/[0.06] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-emerald-400">
                      <span>Aura Answer · Grounded in your study material</span>
                      <span className="font-mono tabular-nums">Page 3</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      Regularization combats overfitting by adding a penalty term to the loss
                      function. <strong className="text-white">L1 Regularization (Lasso)</strong>{' '}
                      adds absolute weights (λ∑|w|) to drive irrelevant features to zero, while{' '}
                      <strong className="text-white">L2 Regularization (Ridge)</strong> adds squared
                      weights (λ∑w²) to shrink large weights smoothly.
                    </p>
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                      <span>Source: Unit-2-Machine-Learning-Notes.pdf · Page 3 · Overfitting &amp; Regularization</span>
                    </div>
                  </div>
                </div>

                {/* Quiz Arena + Weak Topic Detection Preview Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="bg-[#0B111E] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Quiz Arena · Quick Fire</span>
                      <span className="text-amber-400 font-mono tabular-nums">Streak x4</span>
                    </div>
                    <div className="my-2">
                      <div className="text-2xl font-bold font-mono tabular-nums text-white">
                        850 PTS
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        80% Accuracy · 8 / 10 Correct
                      </div>
                    </div>
                    <button
                      onClick={() => onEnterApp('quiz')}
                      className="text-left text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                    >
                      Enter Quiz Arena →
                    </button>
                  </div>

                  <div className="bg-[#0B111E] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-xs text-slate-400">Learning Map Detection</div>
                    <div className="space-y-2 my-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-200">Supervised Learning</span>
                          <span className="font-mono tabular-nums text-emerald-400">Strong · 88%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 w-[88%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-200">Functions &amp; Scope</span>
                          <span className="font-mono tabular-nums text-rose-400">Needs Practice · 40%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 w-[40%]" />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onEnterApp('progress')}
                      className="text-left text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                    >
                      Practice Weak Topics →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section id="features" className="py-20 bg-[#0C121E] border-y border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-mono text-emerald-400 mb-2">
                01. PLATFORM CAPABILITIES
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                Everything you need to learn smarter
              </h2>
              <p className="text-slate-400 mt-3 text-base">
                Most document tools stop after answering a single question. Aura Learn turns your
                uploaded files into a complete study, exam, and game loop.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                onClick={() => onEnterApp('ask')}
                className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Ask AI</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Ask anything about your lecture PDFs or notes. Supports multi-turn follow-up
                    questions while remaining strictly grounded in your uploaded text.
                  </p>
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-5">
                  Ask Aura · RAG Retrieval →
                </div>
              </div>

              <div
                onClick={() => onEnterApp('study')}
                className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Study Mode</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Instantly distill dense documents into Quick Summaries, Key Concept cards,
                    Important Definitions, Topic Breakdowns, and Quick Revision flashcards.
                  </p>
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-5">
                  Open Study Mode →
                </div>
              </div>

              <div
                onClick={() => onEnterApp('exam')}
                className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Exam Mode</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Generate short-answer and long-answer exam questions with customizable
                    difficulty (Easy, Medium, Hard) and answer styles, complete with source proofs.
                  </p>
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-5">
                  Prepare for Exams →
                </div>
              </div>

              <div
                onClick={() => onEnterApp('quiz')}
                className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Quiz Game</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Challenge yourself in Quiz Arena across 4 modes: Quick Fire (60s timer),
                    Survival (3 lives), Boss Battle (5 hard questions), and Mix It Up.
                  </p>
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-5">
                  Play Quiz Arena →
                </div>
              </div>

              <div
                onClick={() => onEnterApp('progress')}
                className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Progress Tracking</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Automatically detects weak topics based on your quiz answers and generates
                    targeted 5-question adaptive practice rounds to turn weaknesses into strengths.
                  </p>
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-5">
                  View Learning Map →
                </div>
              </div>

              <div
                onClick={() => onEnterApp('search')}
                className="bg-[#111827] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Source-Based Answers</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Zero hallucination policy. Every answer shows the exact document name, page
                    number, and extracted snippet—or clearly states when info is not in your notes.
                  </p>
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-5">
                  Search Document Chunks →
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-mono text-emerald-400 mb-2">
              02. THE 5-STEP WORKFLOW
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              How Aura Learn works
            </h2>
            <p className="text-slate-400 mt-3 text-base">
              From raw lecture PDFs to complete topic mastery in five structured stages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                step: '01. Upload',
                title: 'Drop your PDFs or TXT notes',
                desc: 'Aura extracts text page-by-page, cleans formatting, and splits content into semantic chunks.',
              },
              {
                step: '02. Understand',
                title: 'Study Mode & Concept Cards',
                desc: 'Review structured summaries, definitions, and topic breakdowns grounded in your files.',
              },
              {
                step: '03. Ask',
                title: 'Grounded RAG Q&A',
                desc: 'Ask specific questions and inspect the exact page snippets used to construct every answer.',
              },
              {
                step: '04. Practice',
                title: 'Compete in Quiz Arena',
                desc: 'Test your recall under pressure with Quick Fire, Survival, Boss Battle, and Mix It Up.',
              },
              {
                step: '05. Master',
                title: 'Adaptive Weak-Topic Loop',
                desc: 'Aura pinpoints the exact topics you missed and builds targeted practice quizzes.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-mono text-emerald-400 mb-2">{item.step}</div>
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Product Differentiator / Closed-Loop Learning Banner */}
        <section id="journey" className="pb-24 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="text-xs font-mono text-emerald-400">
                03. CLOSED-LOOP MASTERY ARCHITECTURE
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Understand → Study → Practice → Play → Identify Weakness → Improve
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Pre-loaded with 3 university sample documents (Machine Learning, Python Core
                Concepts, and Operating Systems Lab Manual) so you can test the entire RAG pipeline,
                Quiz Arena, and Weak Topic Detector immediately — or upload your own files right now.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <button
                onClick={() => onEnterApp('dashboard')}
                className="px-6 py-3.5 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                Launch Aura Learn
              </button>
              <button
                onClick={() => onEnterApp('documents')}
                className="px-5 py-3.5 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                Upload Study Material
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 lg:px-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>AURA LEARN · Learn. Play. Master.</div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => onEnterApp('dashboard')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <button
            onClick={() => onEnterApp('ask')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Ask Aura
          </button>
          <button
            onClick={() => onEnterApp('quiz')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Quiz Arena
          </button>
        </div>
      </footer>
    </div>
  );
};
