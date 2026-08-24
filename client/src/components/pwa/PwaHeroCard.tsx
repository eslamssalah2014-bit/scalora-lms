import React from 'react';
import { usePwa } from '../../hooks/usePwa';
import { Download, CheckCircle2, Smartphone, Share, PlusSquare, Sparkles } from 'lucide-react';

export const PwaHeroCard: React.FC = () => {
  const { isInstalled, isIos, showIosGuide, setShowIosGuide, installApp } = usePwa();

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-xl mx-auto pt-6 animate-fadeIn">
        <div className="bg-[#071428]/80 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-cyan-950/40 relative overflow-hidden group hover:border-cyan-400/50 transition-all">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            {/* Left: Official Icon & Text */}
            <div className="flex items-center gap-3.5 text-center sm:text-left min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#04152D] border border-cyan-500/40 p-2 flex items-center justify-center flex-shrink-0 shadow-glow-blue group-hover:scale-105 transition-transform">
                <img
                  src="/scalora-icon-transparent.png"
                  alt="Scalora Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center justify-center sm:justify-start gap-1.5 leading-tight">
                  <span>Install Scalora App</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Learn, connect and chat from your phone.
                </p>
              </div>
            </div>

            {/* Right: CTA or Installed Status */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              {isInstalled ? (
                <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Scalora App Installed ✓</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={installApp}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-scalora-blue hover:from-cyan-400 hover:to-blue-600 text-white font-black text-xs sm:text-sm shadow-glow-accent hover:opacity-95 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Modal */}
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
                  Tap the <strong className="text-white">Share</strong> button{' '}
                  <Share className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /> in the Safari toolbar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-white">Add to Home Screen</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" />.
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
