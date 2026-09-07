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
      <div className="w-full max-w-xl mx-auto pt-4 animate-fadeIn">
        <div className="bg-white/95 backdrop-blur-md border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            {/* Left: Official Icon & Text */}
            <div className="flex items-center gap-3.5 text-center sm:text-left min-w-0">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 p-2 flex items-center justify-center flex-shrink-0 shadow-sm">
                <img
                  src="/scalora-icon-transparent.png"
                  alt="Scalora Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5 leading-tight">
                  <span>Install Scalora Mobile App</span>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Offline learning, instant push updates, and direct messaging.
                </p>
              </div>
            </div>

            {/* Right: CTA or Installed Status */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              {isInstalled ? (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center justify-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Scalora App Installed ✓</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={installApp}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Install Scalora on iOS</h3>
              <p className="text-xs text-slate-600">
                Install as a native application on your iPhone or iPad in 2 easy steps:
              </p>
            </div>

            <div className="space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                  1
                </span>
                <p>
                  Tap the <strong className="text-slate-900">Share</strong> button{' '}
                  <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> in the Safari toolbar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" />.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
