import React, { useState } from 'react';
import {
  CheckCircle2,
  FolderOpen,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
} from 'lucide-react';
import { NavigationTab } from '../types/aura';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  highContrastMode: boolean;
  onToggleHighContrast: () => void;
  onClearChatHistory: () => void;
  onResetProgress: () => void;
  onRestoreSampleData: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  highContrastMode,
  onToggleHighContrast,
  onClearChatHistory,
  onResetProgress,
  onRestoreSampleData,
  onNavigate,
}) => {
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setFeedbackBanner(msg);
    window.setTimeout(() => setFeedbackBanner(null), 3000);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your display theme, local study session data, documents, and RAG pipeline
          configuration.
        </p>
      </div>

      {feedbackBanner && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Install as Mobile / Desktop App or Use in Browser */}
      <PWAInstallButton variant="card" />

      {/* Theme & Appearance */}
      <section className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Visual Theme &amp; Contrast</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Switch between default Deep Charcoal and High-Contrast Obsidian mode.
            </p>
          </div>
          <button
            onClick={() => {
              onToggleHighContrast();
              showNotice('Visual theme updated.');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-[#090D16] hover:bg-slate-800 border border-white/10 rounded-xl transition-colors cursor-pointer"
          >
            {highContrastMode ? (
              <>
                <Moon className="w-4 h-4 text-emerald-400" />
                <span>High-Contrast Obsidian</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-emerald-400" />
                <span>Deep Charcoal Default</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Data & Session Management */}
      <section className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">Study Data &amp; Persistence</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Your uploaded documents, chat history, quiz scores, and topic mastery are persisted
            locally in your browser session so you can refresh without losing work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              onClearChatHistory();
              showNotice('Ask Aura chat history has been cleared.');
            }}
            className="flex items-center justify-between p-4 rounded-xl bg-[#090D16] hover:bg-slate-900 border border-white/[0.07] text-left transition-colors cursor-pointer"
          >
            <div>
              <div className="text-xs sm:text-sm font-semibold text-white">Clear Chat History</div>
              <div className="text-xs text-slate-400 mt-0.5">Reset Ask Aura conversation</div>
            </div>
            <Trash2 className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onResetProgress();
              showNotice('Learning progress and topic mastery reset to baseline.');
            }}
            className="flex items-center justify-between p-4 rounded-xl bg-[#090D16] hover:bg-slate-900 border border-white/[0.07] text-left transition-colors cursor-pointer"
          >
            <div>
              <div className="text-xs sm:text-sm font-semibold text-white">
                Reset Learning Progress
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Reset XP, streaks, and scores</div>
            </div>
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigate('documents')}
            className="flex items-center justify-between p-4 rounded-xl bg-[#090D16] hover:bg-slate-900 border border-white/[0.07] text-left transition-colors cursor-pointer"
          >
            <div>
              <div className="text-xs sm:text-sm font-semibold text-white">Manage Documents</div>
              <div className="text-xs text-slate-400 mt-0.5">Upload, rename, or remove files</div>
            </div>
            <FolderOpen className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={() => {
              onRestoreSampleData();
              showNotice('Sample university study documents restored.');
            }}
            className="flex items-center justify-between p-4 rounded-xl bg-[#090D16] hover:bg-slate-900 border border-white/[0.07] text-left transition-colors cursor-pointer"
          >
            <div>
              <div className="text-xs sm:text-sm font-semibold text-white">
                Restore Demo Bundle
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Reload sample ML, Python &amp; OS docs</div>
            </div>
            <RotateCcw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </section>

      {/* Architecture & Grounding Info */}
      <section className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>SERVER-SIDE RAG &amp; GEMINI ARCHITECTURE</span>
        </div>
        <h2 className="text-base font-semibold text-white">
          How Aura Learn Protects Grounding &amp; Security
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          All AI requests run through secure server-side endpoints (<code>/api/ask</code>,{' '}
          <code>/api/study-guide</code>, <code>/api/exam-prep</code>,{' '}
          <code>/api/quiz/generate</code>, and <code>/api/embeddings</code>) powered by the official{' '}
          <code>@google/genai</code> SDK. Uploaded documents are split into semantic chunks with
          page metadata, ranked via hybrid vector + lexical similarity, and verified against strict
          source-grounding rules so Aura never invents facts outside your study material.
        </p>
      </section>
    </div>
  );
};
