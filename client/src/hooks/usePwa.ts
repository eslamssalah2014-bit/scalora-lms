import { useState, useEffect, useCallback } from 'react';
import { pwa } from '../lib/pwa';
import { trackPwaEvent } from '../lib/pwaAnalytics';

export interface UsePwaReturn {
  isInstalled: boolean;
  canInstall: boolean;
  isIos: boolean;
  showIosGuide: boolean;
  setShowIosGuide: (show: boolean) => void;
  installApp: () => Promise<'accepted' | 'dismissed' | 'unsupported'>;
}

export const usePwa = (): UsePwaReturn => {
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      pwa.getIsInstalled()
    );
  });

  const [canInstall, setCanInstall] = useState<boolean>(() => pwa.canInstall());
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone === true;

    if (isIosDevice && !isStandalone) {
      setIsIos(true);
      trackPwaEvent('PROMPT_SHOWN');
    }

    if (canInstall) {
      trackPwaEvent('PROMPT_SHOWN');
    }

    // Subscribe to installable availability
    const unsub = pwa.onInstallChange((available) => {
      setCanInstall(available);
      setIsInstalled(pwa.getIsInstalled());
      if (available) {
        trackPwaEvent('PROMPT_SHOWN');
      }
    });

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      trackPwaEvent('APP_INSTALLED');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      unsub();
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    trackPwaEvent('PROMPT_CLICKED');

    if (isIos) {
      setShowIosGuide(true);
      return 'unsupported';
    }

    const outcome = await pwa.promptInstall();
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
      trackPwaEvent('APP_INSTALLED');
    }
    return outcome;
  }, [isIos]);

  return {
    isInstalled,
    canInstall,
    isIos,
    showIosGuide,
    setShowIosGuide,
    installApp,
  };
};
