"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPwaAnalytics = exports.trackPwaEvent = void 0;
const pwa_analytics_service_js_1 = require("../services/pwa-analytics.service.js");
const trackPwaEvent = async (req, res) => {
    try {
        const { eventType, deviceId, platform, deviceType, userAgent } = req.body;
        if (!eventType || !deviceId) {
            return res.status(400).json({
                success: false,
                message: 'eventType and deviceId are required.',
            });
        }
        const validEvents = ['PROMPT_SHOWN', 'PROMPT_CLICKED', 'APP_INSTALLED', 'PWA_ACTIVE'];
        if (!validEvents.includes(eventType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid eventType: ${eventType}`,
            });
        }
        const userId = req.user?.id || req.body.userId || null;
        const userName = req.user?.name || req.body.userName || null;
        const userEmail = req.user?.email || req.body.userEmail || null;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const result = await pwa_analytics_service_js_1.pwaAnalyticsService.recordEvent({
            eventType: eventType,
            userId,
            userName,
            userEmail,
            deviceId,
            platform,
            deviceType,
            userAgent: userAgent || req.headers['user-agent'],
            ip,
        });
        return res.status(200).json({
            success: true,
            isNewInstall: result.isNewInstall,
        });
    }
    catch (error) {
        console.error('[PwaAnalyticsController] Track event error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to record PWA analytics event',
            error: error.message,
        });
    }
};
exports.trackPwaEvent = trackPwaEvent;
const getPwaAnalytics = async (req, res) => {
    try {
        const summary = await pwa_analytics_service_js_1.pwaAnalyticsService.getAnalyticsSummary();
        return res.status(200).json({
            success: true,
            analytics: summary,
        });
    }
    catch (error) {
        console.error('[PwaAnalyticsController] Get analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve PWA analytics',
            error: error.message,
        });
    }
};
exports.getPwaAnalytics = getPwaAnalytics;
