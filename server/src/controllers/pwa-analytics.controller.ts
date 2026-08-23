import { Request, Response } from 'express';
import { pwaAnalyticsService, PwaEventType } from '../services/pwa-analytics.service.js';

export const trackPwaEvent = async (req: Request, res: Response) => {
  try {
    const { eventType, deviceId, platform, deviceType, userAgent } = req.body;

    if (!eventType || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'eventType and deviceId are required.',
      });
    }

    const validEvents: PwaEventType[] = ['PROMPT_SHOWN', 'PROMPT_CLICKED', 'APP_INSTALLED', 'PWA_ACTIVE'];
    if (!validEvents.includes(eventType as PwaEventType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid eventType: ${eventType}`,
      });
    }

    const userId = (req as any).user?.id || req.body.userId || null;
    const userName = (req as any).user?.name || req.body.userName || null;
    const userEmail = (req as any).user?.email || req.body.userEmail || null;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    const result = await pwaAnalyticsService.recordEvent({
      eventType: eventType as PwaEventType,
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
  } catch (error: any) {
    console.error('[PwaAnalyticsController] Track event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record PWA analytics event',
      error: error.message,
    });
  }
};

export const getPwaAnalytics = async (req: Request, res: Response) => {
  try {
    const summary = await pwaAnalyticsService.getAnalyticsSummary();
    return res.status(200).json({
      success: true,
      analytics: summary,
    });
  } catch (error: any) {
    console.error('[PwaAnalyticsController] Get analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve PWA analytics',
      error: error.message,
    });
  }
};
