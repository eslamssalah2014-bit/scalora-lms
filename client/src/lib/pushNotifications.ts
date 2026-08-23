/**
 * Scalora Web & PWA Native Push Notification Manager
 * Compatible with Android Chrome PWA, iPhone Safari (iOS 16.4+), Windows & Mac Desktop
 */

export interface NotificationPreferences {
  messages: boolean;
  community: boolean;
  mentions: boolean;
  courses: boolean;
  announcements: boolean;
  sound: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  messages: true,
  community: true,
  mentions: true,
  courses: true,
  announcements: true,
  sound: true,
};

const PREFS_KEY = 'scalora_notification_prefs';

export const getNotificationPreferences = (): NotificationPreferences => {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_PREFS;
};

export const saveNotificationPreferences = (prefs: NotificationPreferences): void => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
};

/**
 * Check if the browser / PWA supports native Push Notifications
 */
export const isPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current browser notification permission status ('default' | 'granted' | 'denied')
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Request native notification permission from the user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
};

/**
 * Show a native Desktop / Mobile PWA Notification
 */
export const showNativeNotification = async (params: {
  title: string;
  body: string;
  type?: string;
  icon?: string;
  actionUrl?: string;
}) => {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  const prefs = getNotificationPreferences();
  const typeUpper = (params.type || '').toUpperCase();

  // Filter based on user preferences
  if (typeUpper.includes('MESSAGE') && !prefs.messages) return;
  if ((typeUpper.includes('COMMENT') || typeUpper.includes('LIKE') || typeUpper.includes('REPLY')) && !prefs.community) return;
  if (typeUpper.includes('MENTION') && !prefs.mentions) return;
  if ((typeUpper.includes('COURSE') || typeUpper.includes('LESSON')) && !prefs.courses) return;
  if ((typeUpper.includes('ANNOUNCEMENT') || typeUpper.includes('GLOBAL') || typeUpper.includes('SYSTEM')) && !prefs.announcements) return;

  const title = params.title.startsWith('Scalora') ? params.title : `Scalora • ${params.title}`;
  const options: NotificationOptions = {
    body: params.body,
    icon: params.icon || '/scalora-icon-transparent.png',
    badge: '/scalora-icon-transparent.png',
    data: {
      url: params.actionUrl || '/notifications',
    },
    silent: !prefs.sound,
  };

  try {
    // If service worker is active, dispatch via registration (best on Android PWA)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, options);
        return;
      }
    }

    // Fallback to desktop window Notification
    const notif = new Notification(title, options);
    notif.onclick = (e) => {
      e.preventDefault();
      window.focus();
      if (params.actionUrl) {
        window.location.href = params.actionUrl;
      }
      notif.close();
    };
  } catch (err) {
    console.warn('[PushNotifications] Failed to display native notification:', err);
  }
};
