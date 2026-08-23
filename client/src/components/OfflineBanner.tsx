import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-rose-700 text-white px-4 py-2 text-xs font-bold shadow-md sticky top-0 z-50 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-200 animate-pulse flex-shrink-0" />
          <span>You are offline. Please reconnect to continue.</span>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/40 text-white text-[11px] font-bold border border-white/20 transition-all flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
};
