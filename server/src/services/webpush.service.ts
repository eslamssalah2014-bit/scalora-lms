import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Scalora VAPID Configuration
export const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BJSK8YOzvaowKK_erUBu-2kDc1WNdOUEHZ2fzlV0zkm0af-Zo99PH_AsFTlotbVMs9Z0MZuBhIrqntS9IA6YvrY';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'l3ku2cJ5JhV22flJCe2wxWYv8Y1CIPvAsh8NHt3Sfo4';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:support@scalora.com';

// Initialize web-push
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface StoredPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  type?: string;
  data?: Record<string, any>;
}

class WebPushService {
  private storageFile: string;
  private subscriptions: StoredPushSubscription[] = [];

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    this.storageFile = path.join(dataDir, 'push_subscriptions.json');
    this.loadSubscriptions();
  }

  private loadSubscriptions(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        this.subscriptions = JSON.parse(raw);
        console.log(`[WebPush] Loaded ${this.subscriptions.length} push subscriptions from storage`);
      }
    } catch (err) {
      console.error('[WebPush] Error loading subscriptions:', err);
      this.subscriptions = [];
    }
  }

  private saveSubscriptions(): void {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.subscriptions, null, 2), 'utf-8');
    } catch (err) {
      console.error('[WebPush] Error saving subscriptions:', err);
    }
  }

  /**
   * Save or update a PushSubscription for a user
   */
  public saveSubscription(
    userId: string,
    subscription: { endpoint: string; keys: PushSubscriptionKeys },
    userAgent?: string
  ): StoredPushSubscription {
    const existingIndex = this.subscriptions.findIndex((s) => s.endpoint === subscription.endpoint);

    const record: StoredPushSubscription = {
      id: existingIndex >= 0 ? this.subscriptions[existingIndex].id : `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: userAgent || 'Unknown Browser/PWA',
      createdAt: existingIndex >= 0 ? this.subscriptions[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.subscriptions[existingIndex] = record;
    } else {
      this.subscriptions.push(record);
    }

    this.saveSubscriptions();
    console.log(`[WebPush] Push subscription registered for user ${userId} [Total active endpoints: ${this.subscriptions.length}]`);
    return record;
  }

  /**
   * Remove an invalid or expired subscription
   */
  public removeSubscription(endpoint: string): void {
    const initialLen = this.subscriptions.length;
    this.subscriptions = this.subscriptions.filter((s) => s.endpoint !== endpoint);
    if (this.subscriptions.length !== initialLen) {
      this.saveSubscriptions();
      console.log(`[WebPush] Removed expired subscription endpoint: ${endpoint}`);
    }
  }

  /**
   * Get all active subscriptions for a specific user
   */
  public getSubscriptionsForUser(userId: string): StoredPushSubscription[] {
    return this.subscriptions.filter((s) => s.userId === userId);
  }

  /**
   * Send Web Push notification to a specific user across all their registered devices
   */
  public async sendPushToUser(userId: string, payload: PushPayload): Promise<{ success: number; failed: number }> {
    const userSubs = this.getSubscriptionsForUser(userId);
    if (userSubs.length === 0) {
      return { success: 0, failed: 0 };
    }

    console.log(`[WebPush] Dispatching Web Push to user ${userId} (${userSubs.length} registered device endpoints)`);
    return this.dispatchPushToSubscriptions(userSubs, payload);
  }

  /**
   * Send Web Push notification to multiple users
   */
  public async sendPushToUsers(userIds: string[], payload: PushPayload): Promise<{ success: number; failed: number }> {
    const targetSet = new Set(userIds);
    const targetSubs = this.subscriptions.filter((s) => targetSet.has(s.userId));
    if (targetSubs.length === 0) {
      return { success: 0, failed: 0 };
    }

    console.log(`[WebPush] Dispatching Web Push to ${userIds.length} users across ${targetSubs.length} device endpoints`);
    return this.dispatchPushToSubscriptions(targetSubs, payload);
  }

  /**
   * Send Web Push notification to all active device subscriptions (Global broadcast)
   */
  public async sendPushToAll(payload: PushPayload): Promise<{ success: number; failed: number }> {
    if (this.subscriptions.length === 0) {
      return { success: 0, failed: 0 };
    }

    console.log(`[WebPush] Global broadcast to all ${this.subscriptions.length} active device subscriptions`);
    return this.dispatchPushToSubscriptions(this.subscriptions, payload);
  }

  /**
   * Dispatch push messages to an array of subscriptions in parallel
   */
  private async dispatchPushToSubscriptions(
    subs: StoredPushSubscription[],
    payload: PushPayload
  ): Promise<{ success: number; failed: number }> {
    const jsonPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/notification-icon-192.png',
      badge: payload.badge || '/icons/badge-icon.png',
      image: payload.image || undefined,
      url: payload.url || '/',
      tag: payload.tag || `scalora-${Date.now()}`,
      type: payload.type,
      data: payload.data,
    });

    let success = 0;
    let failed = 0;

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            jsonPayload,
            {
              TTL: 86400, // 24 hours
              urgency: 'high',
            }
          );
          success++;
          console.log(`[WebPush] Successfully delivered native push to endpoint: ${sub.endpoint.slice(0, 45)}...`);
        } catch (err: any) {
          failed++;
          console.error(`[WebPush] Push delivery failed for endpoint: ${sub.endpoint.slice(0, 45)}... status=${err.statusCode}`);
          // If subscription is expired or unsubscribed, automatically prune it
          if (err.statusCode === 404 || err.statusCode === 410) {
            this.removeSubscription(sub.endpoint);
          }
        }
      })
    );

    return { success, failed };
  }
}

export const webPushService = new WebPushService();
