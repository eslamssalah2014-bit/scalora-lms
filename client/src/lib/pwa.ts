/**
 * Progressive Web App (PWA) Registration & Install Manager
 */

type InstallPromptCallback = (e: any) => void;

class PwaManager {
  private deferredPrompt: any = null;
  private listeners: Set<InstallPromptCallback> = new Set();
  private isInstalled: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check if already running in standalone PWA mode
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      this.isInstalled = isStandalone;

      // Listen for browser install prompt trigger
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.notifyListeners();
      });

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        this.isInstalled = true;
        this.deferredPrompt = null;
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
            console.log('✅ Scalora PWA Service Worker Registered:', reg.scope);

            // Check for updates
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🚀 New Scalora PWA update available.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('⚠️ Service Worker Registration failed:', err);
          });
      });
    }
  }

  /**
   * Check if prompt is available to install
   */
  public canInstall(): boolean {
    return Boolean(this.deferredPrompt) && !this.isInstalled;
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
    if (!this.deferredPrompt) {
      return 'unsupported';
    }

    try {
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notifyListeners();
      return choice.outcome;
    } catch {
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
    this.listeners.forEach((cb) => cb(this.canInstall()));
  }

  /**
   * Request Web Push Notification Permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    const permission = await Notification.requestPermission();
    return permission;
  }
}

export const pwa = new PwaManager();
