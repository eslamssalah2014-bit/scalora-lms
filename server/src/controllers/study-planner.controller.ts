import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { studyPlannerService } from '../services/study-planner.service.js';

/**
 * GET /api/study-planner/plan?courseId=...
 * Retrieve or auto-generate plan metrics for a course
 */
export const getStudentPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const courseId = req.query.courseId as string;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!courseId) {
      res.status(400).json({ success: false, message: 'courseId query parameter is required' });
      return;
    }

    const metrics = await studyPlannerService.getPlanMetrics(userId, courseId);
    if (!metrics) {
      res.status(404).json({ success: false, message: 'Course not found or study plan unavailable' });
      return;
    }

    res.json({
      success: true,
      plan: metrics,
    });
  } catch (err: any) {
    console.error('[StudyPlannerController] getStudentPlan error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to retrieve study plan' });
  }
};

/**
 * POST /api/study-planner/plan
 * Create or customize target days or completion date
 */
export const saveStudentPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { courseId, targetDays, customTargetDate } = req.body as {
      courseId: string;
      targetDays: number;
      customTargetDate?: string;
    };

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!courseId) {
      res.status(400).json({ success: false, message: 'courseId is required' });
      return;
    }

    const days = Number(targetDays) || 14;
    await studyPlannerService.createOrUpdatePlan(userId, courseId, days, customTargetDate);
    const metrics = await studyPlannerService.getPlanMetrics(userId, courseId);

    res.json({
      success: true,
      message: 'Study plan updated successfully',
      plan: metrics,
    });
  } catch (err: any) {
    console.error('[StudyPlannerController] saveStudentPlan error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to save study plan' });
  }
};

/**
 * GET /api/study-planner/all
 * Retrieve all active plans for enrolled courses of the logged-in student
 */
export const getAllStudentPlans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const plans = await studyPlannerService.getAllPlansForStudent(userId);
    res.json({
      success: true,
      plans,
    });
  } catch (err: any) {
    console.error('[StudyPlannerController] getAllStudentPlans error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to load study plans' });
  }
};

/**
 * GET /api/study-planner/analytics
 * Executive analytics for Admin Dashboard
 */
export const getAdminAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const analytics = await studyPlannerService.getAnalytics();
    res.json({
      success: true,
      analytics,
    });
  } catch (err: any) {
    console.error('[StudyPlannerController] getAdminAnalytics error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to load study planner analytics' });
  }
};

/**
 * POST /api/study-planner/trigger-reminders
 * Admin / Cron trigger for daily 9:00 AM reminders
 */
export const triggerDailyReminders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const result = await studyPlannerService.sendDailyStudyReminders();
    res.json({
      success: true,
      message: `Dispatched daily reminders to ${result.delivered} students`,
      delivered: result.delivered,
    });
  } catch (err: any) {
    console.error('[StudyPlannerController] triggerDailyReminders error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to dispatch reminders' });
  }
};
