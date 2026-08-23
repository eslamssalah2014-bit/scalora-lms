import { api } from './api';

export type PwaTrackingEventType = 'PROMPT_SHOWN' | 'PROMPT_CLICKED' | 'APP_INSTALLED' | 'PWA_ACTIVE';

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const KEY = 'scalora_pwa_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function detectPlatform(): string {
  if (typeof window === 'undefined') return 'OTHER';
  const ua = window.navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'ANDROID';
  if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
    return 'IOS';
  if (/windows|win32|win64/.test(ua)) return 'WINDOWS';
  if (/macintosh|mac os x/.test(ua)) return 'MACOS';
  if (/linux/.test(ua)) return 'LINUX';
  return 'OTHER';
}

export function detectDeviceType(): string {
  if (typeof window === 'undefined') return 'DESKTOP';
  const ua = window.navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'TABLET';
  if (/mobi|android|iphone|ipod/.test(ua)) return 'MOBILE';
  return 'DESKTOP';
}

export async function trackPwaEvent(eventType: PwaTrackingEventType): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const deviceId = getOrCreateDeviceId();
    const platform = detectPlatform();
    const deviceType = detectDeviceType();

    // Prevent spamming the same event repeatedly in one session
    const sessionKey = `scalora_pwa_evt_${eventType}_${new Date().toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(sessionKey) && eventType !== 'PROMPT_CLICKED') {
      return;
    }
    sessionStorage.setItem(sessionKey, '1');

    await api.post('/pwa/track', {
      eventType,
      deviceId,
      platform,
      deviceType,
      userAgent: window.navigator.userAgent,
    });
  } catch {
    // Non-blocking telemetry
  }
}

// Track active session if running as standalone PWA
export function initPwaAnalytics(): void {
  if (typeof window === 'undefined') return;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone) {
    trackPwaEvent('PWA_ACTIVE');
  }

  window.addEventListener('beforeinstallprompt', () => {
    trackPwaEvent('PROMPT_SHOWN');
  });

  window.addEventListener('appinstalled', () => {
    trackPwaEvent('APP_INSTALLED');
  });
}
