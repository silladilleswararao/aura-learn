import React, { useState } from 'react';
import { CheckCircle2, Download, Globe, Laptop, Smartphone, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const directAppUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-4rtdu62mvbqdo4uunnzuwp-108903315765.asia-east1.run.app';

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (isInstalled && variant !== 'card') {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isIOS ? 'Install on iOS' : 'Download App'}</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-xl transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Download Mobile / PC App</span>
          </span>
          <Download className="w-3.5 h-3.5" />
        </button>
      )}

      {variant === 'card' && (
        <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-emerald-400">
              WEB + MOBILE APP (PWA READY)
            </div>
            <h3 className="text-base font-bold text-white">
              {isInstalled
                ? 'Aura Learn is installed on your device'
                : 'Use in Chrome / Browser OR Download as an App'}
            </h3>
            <p className="text-xs text-slate-400">
              Works instantly in Chrome or Google without downloading — or install it to your Phone
              Home Screen / Desktop for full-screen app mode and offline caching.
            </p>
          </div>
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalled ? 'Installation Guide' : 'Download / Install App'}</span>
          </button>
        </div>
      )}

      {/* Interactive Multi-Platform Install & Browser Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <div className="text-xs font-mono text-emerald-400">
                  HYBRID WEB &amp; MOBILE APPLICATION
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  How to Use or Download Aura Learn
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm max-h-[65vh] overflow-y-auto pr-1">
              {/* Crucial Step: Direct Website Link vs AI Studio Editor Link */}
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Send Friends ONLY the App/Website (Not Google AI Studio Editor)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  The <strong>&ldquo;Share&rdquo;</strong> link inside AI Studio opens the AI Studio
                  code workspace. If you want your friends to see <strong>ONLY the Aura Learn website/app</strong>:
                </p>
                <ol className="list-decimal list-inside text-xs text-emerald-200 space-y-1">
                  <li>
                    Click the <strong>&ldquo;Deploy&rdquo;</strong> button (rocket/cloud icon at the
                    top-right of Google AI Studio) → <strong>Deploy to Cloud Run</strong>, OR use
                    the direct `.run.app` URL below after setting Share to Public:
                  </li>
                </ol>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={directAppUrl}
                    className="flex-1 bg-[#090D16] border border-white/15 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyDirectLink}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    {copiedLink ? 'Copied!' : 'Copy Direct App Link'}
                  </button>
                </div>
              </div>

              {/* Option 1: Direct Browser */}
              <div className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-emerald-400">
                  <Globe className="w-4 h-4" />
                  <span>1. Use Directly in Chrome / Google (No Download Needed)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You can use every feature right now in your browser on Laptop, Desktop, Tablet, or
                  Phone without installing anything.
                </p>
              </div>

              {/* Option 2: Android / Chrome */}
              <div className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>2. Download as Android / Chrome Mobile App</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open this site link in <strong>Google Chrome</strong> on your phone → Tap the{' '}
                  <strong>⋮ (Three Dots menu)</strong> at the top right → Tap{' '}
                  <strong>&ldquo;Install app&rdquo;</strong> or{' '}
                  <strong>&ldquo;Add to Home screen&rdquo;</strong>.
                </p>
              </div>

              {/* Option 3: iPhone / iPad Safari */}
              <div className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>3. Download on iPhone / iPad (iOS Safari)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open this site in <strong>Safari</strong> → Tap the <strong>Share</strong> button
                  at the bottom → Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                </p>
              </div>

              {/* Option 4: Laptop / Desktop App */}
              <div className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Laptop className="w-4 h-4 text-amber-400" />
                  <span>4. Install on Windows / Mac Desktop (Chrome / Edge)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open the public URL in Chrome or Edge → Click the{' '}
                  <strong>Install icon (⊕)</strong> on the right side of the address bar to launch
                  Aura Learn in its own standalone desktop window.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg cursor-pointer"
                >
                  Trigger Instant Install Now
                </button>
              )}
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-lg">
      <span className="h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
      <span>Offline Mode — Using cached study documents &amp; local data</span>
    </div>
  );
};
