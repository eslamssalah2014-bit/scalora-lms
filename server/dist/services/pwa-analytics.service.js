"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pwaAnalyticsService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_js_1 = require("../lib/prisma.js");
class PwaAnalyticsService {
    storageFile;
    events = [];
    installs = [];
    constructor() {
        const dataDir = path_1.default.resolve(process.cwd(), 'data');
        if (!fs_1.default.existsSync(dataDir)) {
            try {
                fs_1.default.mkdirSync(dataDir, { recursive: true });
            }
            catch { }
        }
        this.storageFile = path_1.default.join(dataDir, 'pwa_analytics.json');
        this.loadData();
    }
    loadData() {
        try {
            if (fs_1.default.existsSync(this.storageFile)) {
                const raw = fs_1.default.readFileSync(this.storageFile, 'utf-8');
                const parsed = JSON.parse(raw);
                this.events = Array.isArray(parsed.events) ? parsed.events : [];
                this.installs = Array.isArray(parsed.installs) ? parsed.installs : [];
                console.log(`[PwaAnalytics] Loaded ${this.events.length} events and ${this.installs.length} unique installs from storage.`);
            }
            else {
                this.saveData();
            }
        }
        catch (err) {
            console.warn('[PwaAnalytics] Error loading analytics data:', err);
            this.events = [];
            this.installs = [];
        }
    }
    saveData() {
        try {
            fs_1.default.writeFileSync(this.storageFile, JSON.stringify({
                events: this.events.slice(-5000), // keep latest 5k events
                installs: this.installs,
                lastUpdated: new Date().toISOString(),
            }, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('[PwaAnalytics] Failed to persist analytics:', err);
        }
    }
    /**
     * Record a PWA Lifecycle Event
     */
    async recordEvent(data) {
        const now = new Date().toISOString();
        const platform = this.normalizePlatform(data.platform || data.userAgent);
        const deviceType = this.normalizeDeviceType(data.deviceType || data.userAgent);
        const eventRecord = {
            id: `pwa-evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            eventType: data.eventType,
            userId: data.userId || null,
            userName: data.userName || null,
            userEmail: data.userEmail || null,
            deviceId: data.deviceId,
            platform,
            deviceType,
            userAgent: data.userAgent || '',
            ip: data.ip || '',
            timestamp: now,
        };
        this.events.push(eventRecord);
        let isNewInstall = false;
        // Handle Install & Active updates with duplicate prevention
        if (data.eventType === 'APP_INSTALLED') {
            const existing = this.installs.find((i) => i.deviceId === data.deviceId ||
                (Boolean(data.userId) && i.userId === data.userId && i.platform === platform));
            if (!existing) {
                const newInstall = {
                    id: `pwa-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    deviceId: data.deviceId,
                    userId: data.userId || null,
                    userName: data.userName || null,
                    userEmail: data.userEmail || null,
                    platform,
                    deviceType,
                    installedAt: now,
                    lastActiveAt: now,
                    userAgent: data.userAgent || '',
                };
                this.installs.unshift(newInstall);
                isNewInstall = true;
                console.log(`🎉 [PwaAnalytics] New Unique PWA Install recorded: [${platform}] Device: ${data.deviceId}`);
            }
            else {
                existing.lastActiveAt = now;
                if (data.userId && !existing.userId) {
                    existing.userId = data.userId;
                    existing.userName = data.userName || existing.userName;
                    existing.userEmail = data.userEmail || existing.userEmail;
                }
            }
        }
        else if (data.eventType === 'PWA_ACTIVE') {
            const existing = this.installs.find((i) => i.deviceId === data.deviceId);
            if (existing) {
                existing.lastActiveAt = now;
                if (data.userId && !existing.userId) {
                    existing.userId = data.userId;
                    existing.userName = data.userName || existing.userName;
                    existing.userEmail = data.userEmail || existing.userEmail;
                }
            }
            else {
                // Installed on standalone but missed initial tracking event
                const newInstall = {
                    id: `pwa-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    deviceId: data.deviceId,
                    userId: data.userId || null,
                    userName: data.userName || null,
                    userEmail: data.userEmail || null,
                    platform,
                    deviceType,
                    installedAt: now,
                    lastActiveAt: now,
                    userAgent: data.userAgent || '',
                };
                this.installs.unshift(newInstall);
                isNewInstall = true;
            }
        }
        this.saveData();
        return { success: true, isNewInstall };
    }
    /**
     * Get Aggregated PWA Analytics Summary
     */
    async getAnalyticsSummary() {
        // 1. Safe read-only total registered users from database
        let totalRegisteredUsers = 1;
        try {
            totalRegisteredUsers = await prisma_js_1.prisma.user.count();
            if (totalRegisteredUsers <= 0)
                totalRegisteredUsers = 1;
        }
        catch {
            totalRegisteredUsers = 10;
        }
        const totalInstalls = this.installs.length;
        const androidInstalls = this.installs.filter((i) => i.platform === 'ANDROID').length;
        const iosInstalls = this.installs.filter((i) => i.platform === 'IOS').length;
        const windowsInstalls = this.installs.filter((i) => i.platform === 'WINDOWS').length;
        const macosInstalls = this.installs.filter((i) => i.platform === 'MACOS').length;
        const otherInstalls = this.installs.filter((i) => !['ANDROID', 'IOS', 'WINDOWS', 'MACOS'].includes(i.platform)).length;
        // Active calculations
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * oneDayMs;
        const activeToday = this.installs.filter((i) => {
            const activeTime = new Date(i.lastActiveAt).getTime();
            return now - activeTime <= oneDayMs;
        }).length;
        const activeThisWeek = this.installs.filter((i) => {
            const activeTime = new Date(i.lastActiveAt).getTime();
            return now - activeTime <= sevenDaysMs;
        }).length;
        // Conversion rate (Installs / Registered Users * 100)
        const conversionRate = Number(((totalInstalls / totalRegisteredUsers) * 100).toFixed(1));
        // Funnel counts (Unique device/user counts per stage)
        const promptShownUnique = new Set(this.events.filter((e) => e.eventType === 'PROMPT_SHOWN').map((e) => e.deviceId || e.userId)).size;
        const promptClickedUnique = new Set(this.events.filter((e) => e.eventType === 'PROMPT_CLICKED').map((e) => e.deviceId || e.userId)).size;
        // Daily Trend (last 14 days)
        const dailyMap = new Map();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now - i * oneDayMs);
            const key = d.toISOString().split('T')[0];
            dailyMap.set(key, { installs: 0, active: 0 });
        }
        this.installs.forEach((inst) => {
            const dayKey = inst.installedAt.split('T')[0];
            if (dailyMap.has(dayKey)) {
                dailyMap.get(dayKey).installs += 1;
            }
            const activeKey = inst.lastActiveAt.split('T')[0];
            if (dailyMap.has(activeKey)) {
                dailyMap.get(activeKey).active += 1;
            }
        });
        const dailyTrend = Array.from(dailyMap.entries()).map(([date, counts]) => ({
            date,
            installs: counts.installs,
            active: counts.active,
        }));
        // Platform Breakdown
        const total = totalInstalls > 0 ? totalInstalls : 1;
        const platformBreakdown = [
            {
                platform: 'Android',
                count: androidInstalls,
                percentage: Number(((androidInstalls / total) * 100).toFixed(1)),
            },
            {
                platform: 'iOS',
                count: iosInstalls,
                percentage: Number(((iosInstalls / total) * 100).toFixed(1)),
            },
            {
                platform: 'Windows',
                count: windowsInstalls,
                percentage: Number(((windowsInstalls / total) * 100).toFixed(1)),
            },
            {
                platform: 'macOS',
                count: macosInstalls,
                percentage: Number(((macosInstalls / total) * 100).toFixed(1)),
            },
            {
                platform: 'Other',
                count: otherInstalls,
                percentage: Number(((otherInstalls / total) * 100).toFixed(1)),
            },
        ];
        return {
            totalInstalls,
            androidInstalls,
            iosInstalls,
            windowsInstalls,
            macosInstalls,
            otherInstalls,
            activeToday,
            activeThisWeek,
            conversionRate,
            funnel: {
                registeredUsers: totalRegisteredUsers,
                promptShown: Math.max(promptShownUnique, totalInstalls),
                promptClicked: Math.max(promptClickedUnique, totalInstalls),
                successfullyInstalled: totalInstalls,
            },
            dailyTrend,
            platformBreakdown,
            recentInstalls: this.installs.slice(0, 50),
            recentEvents: this.events.slice(-50).reverse(),
        };
    }
    normalizePlatform(input) {
        if (!input)
            return 'OTHER';
        const s = input.toLowerCase();
        if (s.includes('android'))
            return 'ANDROID';
        if (s.includes('iphone') || s.includes('ipad') || s.includes('ipod') || s.includes('ios'))
            return 'IOS';
        if (s.includes('win'))
            return 'WINDOWS';
        if (s.includes('mac') || s.includes('darwin') || s.includes('os x'))
            return 'MACOS';
        if (s.includes('linux'))
            return 'LINUX';
        return 'OTHER';
    }
    normalizeDeviceType(input) {
        if (!input)
            return 'DESKTOP';
        const s = input.toLowerCase();
        if (s.includes('tablet') || s.includes('ipad'))
            return 'TABLET';
        if (s.includes('mobi') || s.includes('android') || s.includes('phone') || s.includes('iphone'))
            return 'MOBILE';
        return 'DESKTOP';
    }
}
exports.pwaAnalyticsService = new PwaAnalyticsService();
