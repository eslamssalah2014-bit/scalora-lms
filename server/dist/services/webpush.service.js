"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webPushService = exports.VAPID_SUBJECT = exports.VAPID_PRIVATE_KEY = exports.VAPID_PUBLIC_KEY = void 0;
const web_push_1 = __importDefault(require("web-push"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Scalora VAPID Configuration
exports.VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ||
    'BJSK8YOzvaowKK_erUBu-2kDc1WNdOUEHZ2fzlV0zkm0af-Zo99PH_AsFTlotbVMs9Z0MZuBhIrqntS9IA6YvrY';
exports.VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ||
    'l3ku2cJ5JhV22flJCe2wxWYv8Y1CIPvAsh8NHt3Sfo4';
exports.VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@scalora.com';
// Initialize web-push
web_push_1.default.setVapidDetails(exports.VAPID_SUBJECT, exports.VAPID_PUBLIC_KEY, exports.VAPID_PRIVATE_KEY);
class WebPushService {
    storageFile;
    subscriptions = [];
    constructor() {
        const dataDir = path_1.default.resolve(process.cwd(), 'data');
        if (!fs_1.default.existsSync(dataDir)) {
            try {
                fs_1.default.mkdirSync(dataDir, { recursive: true });
            }
            catch { }
        }
        this.storageFile = path_1.default.join(dataDir, 'push_subscriptions.json');
        this.loadSubscriptions();
    }
    loadSubscriptions() {
        try {
            if (fs_1.default.existsSync(this.storageFile)) {
                const raw = fs_1.default.readFileSync(this.storageFile, 'utf-8');
                this.subscriptions = JSON.parse(raw);
                console.log(`[WebPush] Loaded ${this.subscriptions.length} push subscriptions from storage`);
            }
        }
        catch (err) {
            console.error('[WebPush] Error loading subscriptions:', err);
            this.subscriptions = [];
        }
    }
    saveSubscriptions() {
        try {
            fs_1.default.writeFileSync(this.storageFile, JSON.stringify(this.subscriptions, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('[WebPush] Error saving subscriptions:', err);
        }
    }
    /**
     * Save or update a PushSubscription for a user
     */
    saveSubscription(userId, subscription, userAgent) {
        const existingIndex = this.subscriptions.findIndex((s) => s.endpoint === subscription.endpoint);
        const record = {
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
        }
        else {
            this.subscriptions.push(record);
        }
        this.saveSubscriptions();
        console.log(`[WebPush] Push subscription registered for user ${userId} [Total active endpoints: ${this.subscriptions.length}]`);
        return record;
    }
    /**
     * Remove an invalid or expired subscription
     */
    removeSubscription(endpoint) {
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
    getSubscriptionsForUser(userId) {
        return this.subscriptions.filter((s) => s.userId === userId);
    }
    /**
     * Send Web Push notification to a specific user across all their registered devices
     */
    async sendPushToUser(userId, payload) {
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
    async sendPushToUsers(userIds, payload) {
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
    async sendPushToAll(payload) {
        if (this.subscriptions.length === 0) {
            return { success: 0, failed: 0 };
        }
        console.log(`[WebPush] Global broadcast to all ${this.subscriptions.length} active device subscriptions`);
        return this.dispatchPushToSubscriptions(this.subscriptions, payload);
    }
    /**
     * Dispatch push messages to an array of subscriptions in parallel
     */
    async dispatchPushToSubscriptions(subs, payload) {
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
        await Promise.all(subs.map(async (sub) => {
            try {
                await web_push_1.default.sendNotification({
                    endpoint: sub.endpoint,
                    keys: sub.keys,
                }, jsonPayload, {
                    TTL: 86400, // 24 hours
                    urgency: 'high',
                });
                success++;
                console.log(`[WebPush] Successfully delivered native push to endpoint: ${sub.endpoint.slice(0, 45)}...`);
            }
            catch (err) {
                failed++;
                console.error(`[WebPush] Push delivery failed for endpoint: ${sub.endpoint.slice(0, 45)}... status=${err.statusCode}`);
                // If subscription is expired or unsubscribed, automatically prune it
                if (err.statusCode === 404 || err.statusCode === 410) {
                    this.removeSubscription(sub.endpoint);
                }
            }
        }));
        return { success, failed };
    }
}
exports.webPushService = new WebPushService();
