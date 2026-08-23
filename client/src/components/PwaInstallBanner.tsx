import React, { useState, useEffect } from 'react';
import { pwa } from '../lib/pwa';
import { Download, X, Smartphone, Sparkles, Share, PlusSquare } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (within 7 days)
    const dismissedUntil = localStorage.getItem('scalora_pwa_dismissed');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      setDismissed(true);
      return;
    }

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone === true;

    if (isIosDevice && !isStandalone) {
      setIsIos(true);
    }

    // Listen to PWA installable availability
    const unsub = pwa.onInstallChange((available) => {
      setCanInstall(available);
    });

    return () => unsub();
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    const outcome = await pwa.promptInstall();
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Dismiss for 7 days
    localStorage.setItem(
      'scalora_pwa_dismissed',
      (Date.now() + 7 * 24 * 60 * 60 * 1000).toString()
    );
  };

  if (dismissed || (!canInstall && !isIos) || pwa.getIsInstalled()) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Install Bar */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-subtle">
        <div className="bg-[#071324]/95 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-4 shadow-2xl shadow-cyan-950/50 flex items-center justify-between gap-3.5 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#04152D] border border-cyan-500/40 p-2 flex items-center justify-center flex-shrink-0 shadow-md">
              <img
                src="/scalora-icon-transparent.png"
                alt="Scalora App"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-black text-white flex items-center gap-1.5 leading-tight">
                <span>Install Scalora App</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Fast, fullscreen app with offline access & push notifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-scalora-blue hover:from-cyan-400 hover:to-blue-600 text-white font-bold text-xs shadow-glow-accent transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1528] w-full max-w-sm rounded-3xl border border-white/15 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Install Scalora on iOS</h3>
              <p className="text-xs text-slate-300">
                Install as a native application on your iPhone or iPad in 2 easy steps:
              </p>
            </div>

            <div className="space-y-2 text-left bg-[#071324] p-4 rounded-2xl border border-white/5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                  1
                </span>
                <p>
                  Tap the <strong className="text-white">Share</strong> button <Share className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /> in the Safari toolbar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" />.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-xs shadow-glow-accent"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
