/**
 * Progressive Web App (PWA) Registration & Forensic Install Manager
 */

type InstallPromptCallback = (canInstall: boolean) => void;

class PwaManager {
  private deferredPrompt: any = null;
  private listeners: Set<InstallPromptCallback> = new Set();
  private isInstalled: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Check if already running in standalone PWA mode
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      this.isInstalled = isStandalone;

      // 2. Pick up early captured prompt if available
      if ((window as any).deferredPrompt) {
        this.deferredPrompt = (window as any).deferredPrompt;
        console.log('⚡ [PWA-DIAGNOSTIC] Picked up early deferredPrompt from window');
      }

      // 3. Listen to early trap custom events
      window.addEventListener('pwa-prompt-ready', () => {
        this.deferredPrompt = (window as any).deferredPrompt;
        console.log('⚡ [PWA-DIAGNOSTIC] Received pwa-prompt-ready event');
        this.notifyListeners();
      });

      window.addEventListener('pwa-installed', () => {
        this.isInstalled = true;
        this.deferredPrompt = null;
        console.log('🎉 [PWA-DIAGNOSTIC] Received pwa-installed event');
        this.notifyListeners();
      });

      // 4. Also keep direct beforeinstallprompt listener
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('⚡ [PWA-DIAGNOSTIC] beforeinstallprompt fired directly in PwaManager');
        e.preventDefault();
        this.deferredPrompt = e;
        (window as any).deferredPrompt = e;
        this.notifyListeners();
      });

      window.addEventListener('appinstalled', (e) => {
        console.log('🎉 [PWA-DIAGNOSTIC] appinstalled event fired directly in PwaManager:', e);
        this.isInstalled = true;
        this.deferredPrompt = null;
        (window as any).deferredPrompt = null;
        this.notifyListeners();
      });
    }
  }

  /**
   * Register Service Worker
   */
  public registerServiceWorker(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('✅ [PWA-DIAGNOSTIC] Scalora PWA Service Worker Registered. Scope:', reg.scope);

            // Check for updates
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🚀 [PWA-DIAGNOSTIC] New Scalora PWA update available.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('⚠️ [PWA-DIAGNOSTIC] Service Worker Registration failed:', err);
          });
      });
    }
  }

  /**
   * Check if prompt is available to install
   */
  public canInstall(): boolean {
    const hasPrompt = Boolean(this.deferredPrompt || (typeof window !== 'undefined' && (window as any).deferredPrompt));
    return hasPrompt && !this.isInstalled;
  }

  /**
   * Check if already installed
   */
  public getIsInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Prompt user to install
   */
  public async promptInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
    console.log('⚡ [PWA-DIAGNOSTIC] install button clicked');

    const promptEvent = this.deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredPrompt : null);

    if (!promptEvent) {
      console.warn('⚠️ [PWA-DIAGNOSTIC] prompt() cannot be called: deferredPrompt is null');
      return 'unsupported';
    }

    try {
      console.log('⚡ [PWA-DIAGNOSTIC] prompt() called on native event');
      await promptEvent.prompt();

      console.log('⚡ [PWA-DIAGNOSTIC] awaiting userChoice...');
      const choiceResult = await promptEvent.userChoice;

      console.log('⚡ [PWA-DIAGNOSTIC] userChoice result:', choiceResult.outcome);

      this.deferredPrompt = null;
      if (typeof window !== 'undefined') {
        (window as any).deferredPrompt = null;
      }
      this.notifyListeners();

      return choiceResult.outcome;
    } catch (err) {
      console.error('❌ [PWA-DIAGNOSTIC] Error during prompt() execution:', err);
      return 'unsupported';
    }
  }

  /**
   * Subscribe to install state changes
   */
  public onInstallChange(callback: InstallPromptCallback): () => void {
    this.listeners.add(callback);
    callback(this.canInstall());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const installable = this.canInstall();
    console.log('⚡ [PWA-DIAGNOSTIC] Notifying listeners. canInstall =', installable);
    this.listeners.forEach((cb) => cb(installable));
  }
}

export const pwa = new PwaManager();
