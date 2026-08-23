/**
 * Scalora Web & PWA Native Push Notification Manager
 * Compatible with Android Chrome PWA, iPhone Safari (iOS 16.4+), Windows & Mac Desktop
 */

import { api } from './api';

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

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

/**
 * Check if the browser / PWA supports native Push Notifications
 */
export const isPushSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

/**
 * Get current browser notification permission status ('default' | 'granted' | 'denied')
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
};

/**
 * Subscribe device to Web Push notifications and sync with backend
 */
export const subscribeToPushNotifications = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    console.warn('[PushManager] Native Web Push is not supported in this browser environment');
    return false;
  }

  try {
    console.log('[PushManager] Initializing native Push Subscription flow...');

    // 1. Request/Verify Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[PushManager] User did not grant notification permission:', permission);
      return false;
    }
    console.log('[PushManager] Permission verified: granted ✓');

    // 2. Fetch VAPID Public Key from backend
    const vapidRes = await api.get<{ success: boolean; publicKey: string }>('/notifications/vapid-public-key');
    if (!vapidRes.success || !vapidRes.publicKey) {
      console.error('[PushManager] Failed to retrieve VAPID public key from backend');
      return false;
    }
    console.log('[PushManager] Retrieved VAPID Public Key:', vapidRes.publicKey);

    // 3. Wait for Service Worker Registration
    const registration = await navigator.serviceWorker.ready;
    console.log('[PushManager] Service Worker registration ready:', registration.scope);

    // 4. Check existing subscription or create new
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(vapidRes.publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
      console.log('[PushManager] Generated new native PushSubscription on device:', subscription.endpoint);
    } else {
      console.log('[PushManager] Re-using existing PushSubscription:', subscription.endpoint);
    }

    // 5. Send subscription to Scalora backend
    const subJSON = subscription.toJSON();
    const registerRes = await api.post<{ success: boolean; message: string }>('/notifications/push-subscription', {
      subscription: subJSON,
      userAgent: navigator.userAgent,
    });

    if (registerRes.success) {
      console.log('[PushManager] Push Subscription successfully registered on server ✓');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PushManager] Error during push subscription lifecycle:', error);
    return false;
  }
};

/**
 * Request native notification permission and subscribe
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  return subscribeToPushNotifications();
};

/**
 * Trigger a server test push notification directly to current device
 */
export const sendTestPush = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await api.post<{ success: boolean; message: string; result: any }>('/notifications/test-push', {});
    return res;
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to send test push' };
  }
};

/**
 * Show a native Desktop / Mobile PWA Notification (Foreground fallback)
 */
export const showNativeNotification = async (params: {
  title: string;
  body: string;
  type?: string;
  icon?: string;
  actionUrl?: string;
}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

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
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, options);
        return;
      }
    }

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
