import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { notificationService } from './notification.service.js';
import { webPushService } from './webpush.service.js';

export interface StudyPlanRecord {
  id: string;
  userId: string;
  courseId: string;
  targetDays: number; // e.g. 7, 10, 14, 30
  targetDate: string; // ISO date string (Goal Finish Date)
  createdAt: string;
  updatedAt: string;
}

export interface DailyTask {
  lessonId: string;
  title: string;
  durationMinutes: number;
  type: string;
  isCompleted: boolean;
  moduleId?: string;
  moduleTitle?: string;
}

export interface TimelineDay {
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  status: 'COMPLETED' | 'MISSED' | 'IN_PROGRESS' | 'UPCOMING';
  isToday: boolean;
  targetMinutes: number;
  studiedMinutes: number;
}

export interface StudyPlanMetrics {
  planId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail?: string;
  targetDays: number;
  targetDate: string;
  startDate: string;
  totalCourseMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
  completionPercent: number;
  dailyTargetMinutes: number;
  currentPaceMinutesPerDay: number;
  adaptiveDailyTargetMinutes: number;
  expectedFinishDate: string;
  scheduleStatus: 'ON_TRACK' | 'BEHIND' | 'AHEAD';
  daysDifference: number; // positive = ahead, negative = behind, 0 = on track
  statusMessage: string;
  motivationalMessage: string;
  daysElapsed: number;
  daysRemaining: number;
  todayTasks: DailyTask[];
  timeline: TimelineDay[];
}

export interface StudyPlanAnalytics {
  totalActivePlans: number;
  studentsOnTrack: number;
  studentsBehind: number;
  studentsAhead: number;
  percentOnTrack: number;
  percentBehind: number;
  percentAhead: number;
  averageDailyTargetMinutes: number;
  averageActualPaceMinutes: number;
  courseAnalytics: {
    courseId: string;
    courseTitle: string;
    activePlansCount: number;
    avgPlannedDays: number;
    avgActualPace: number;
    percentOnTrack: number;
    percentBehind: number;
    percentAhead: number;
  }[];
}

class StudyPlannerService {
  private storageFile: string;
  private plans: Map<string, StudyPlanRecord> = new Map(); // key: `${userId}_${courseId}`

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    this.storageFile = path.join(dataDir, 'study_plans.json');
    this.loadData();
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.entries(parsed).forEach(([key, record]: [string, any]) => {
            this.plans.set(key, {
              id: record.id || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              userId: record.userId,
              courseId: record.courseId,
              targetDays: Number(record.targetDays) || 14,
              targetDate: record.targetDate || new Date(Date.now() + 14 * 86400000).toISOString(),
              createdAt: record.createdAt || new Date().toISOString(),
              updatedAt: record.updatedAt || new Date().toISOString(),
            });
          });
        }
        console.log(`[StudyPlanner] Loaded ${this.plans.size} personalized study plans.`);
      } else {
        this.saveData();
      }
    } catch (err) {
      console.warn('[StudyPlanner] Error loading study plans file:', err);
    }
  }

  private saveData(): void {
    try {
      const obj: Record<string, StudyPlanRecord> = {};
      this.plans.forEach((val, key) => {
        obj[key] = val;
      });
      fs.writeFileSync(this.storageFile, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StudyPlanner] Failed to save study plans:', err);
    }
  }

  /**
   * Helper to parse textual durations like "15 min", "1 hour", "1.5h", "45" into minutes.
   */
  public parseDurationMinutes(duration?: string | null): number {
    if (!duration) return 12; // Standard default 12 minutes per lesson if unspecified
    const str = String(duration).trim().toLowerCase();
    
    // Check hours and minutes e.g. "1h 30m" or "1 hour 20 mins"
    const hrMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hour|hours)/);
    const minMatch = str.match(/(\d+)\s*(?:m|min|minute|minutes)/);

    let total = 0;
    if (hrMatch && hrMatch[1]) {
      total += parseFloat(hrMatch[1]) * 60;
    }
    if (minMatch && minMatch[1]) {
      total += parseInt(minMatch[1], 10);
    }

    if (total > 0) return Math.round(total);

    // If pure number string e.g. "25"
    const num = parseInt(str, 10);
    if (!isNaN(num) && num > 0) return num;

    return 12;
  }

  /**
   * Creates or updates a personalized study plan for a student
   */
  public async createOrUpdatePlan(
    userId: string,
    courseId: string,
    targetDays: number,
    customTargetDate?: string
  ): Promise<StudyPlanRecord> {
    const key = `${userId}_${courseId}`;
    const now = new Date();
    
    let targetDateStr: string;
    if (customTargetDate) {
      targetDateStr = new Date(customTargetDate).toISOString();
    } else {
      const days = Math.max(1, targetDays);
      const goalDate = new Date(now.getTime() + days * 86400000);
      targetDateStr = goalDate.toISOString();
    }

    const existing = this.plans.get(key);
    const plan: StudyPlanRecord = {
      id: existing?.id || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      courseId,
      targetDays: Math.max(1, targetDays),
      targetDate: targetDateStr,
      createdAt: existing?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.plans.set(key, plan);
    this.saveData();

    return plan;
  }

  /**
   * Retrieves or auto-initializes a study plan and calculates full dynamic pace metrics
   */
  public async getPlanMetrics(userId: string, courseId: string): Promise<StudyPlanMetrics | null> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!course) return null;

    const key = `${userId}_${courseId}`;
    let plan = this.plans.get(key);

    // Auto-create default 14-day study plan if not existing yet
    if (!plan) {
      plan = await this.createOrUpdatePlan(userId, courseId, 14);
    }

    // 1. Calculate Course Duration Breakdown
    const allLessons: (DailyTask & { order: number; createdAt: Date })[] = [];
    let totalCourseMinutes = 0;

    course.modules.forEach((mod) => {
      mod.lessons.forEach((les) => {
        const mins = this.parseDurationMinutes(les.duration);
        totalCourseMinutes += mins;
        allLessons.push({
          lessonId: les.id,
          title: les.title,
          durationMinutes: mins,
          type: les.type,
          isCompleted: false,
          moduleId: mod.id,
          moduleTitle: mod.title,
          order: les.order,
          createdAt: les.createdAt,
        });
      });
    });

    // Fallback if course has no lessons yet
    if (totalCourseMinutes === 0) totalCourseMinutes = 60;

    // 2. Fetch Completed Progress for Student
    const completedProgress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: allLessons.map((l) => l.lessonId) },
        isCompleted: true,
      },
    });

    const completedLessonIdSet = new Set(completedProgress.map((p) => p.lessonId));
    let completedMinutes = 0;

    allLessons.forEach((l) => {
      if (completedLessonIdSet.has(l.lessonId)) {
        l.isCompleted = true;
        completedMinutes += l.durationMinutes;
      }
    });

    const remainingMinutes = Math.max(0, totalCourseMinutes - completedMinutes);
    const completionPercent = totalCourseMinutes > 0 ? Math.round((completedMinutes / totalCourseMinutes) * 100) : 0;

    // 3. Date & Pace Calculation
    const startDate = new Date(plan.createdAt);
    const targetDate = new Date(plan.targetDate);
    const today = new Date();

    const daysElapsed = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1);
    const daysRemaining = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / 86400000));
    const totalPlanDays = Math.max(1, plan.targetDays);

    const dailyTargetMinutes = Math.max(1, Math.round(totalCourseMinutes / totalPlanDays));
    const currentPaceMinutesPerDay = daysElapsed > 0 ? Math.round((completedMinutes / daysElapsed) * 10) / 10 : completedMinutes;

    // Smart Adaptive Recovery: Remaining minutes divided by remaining days
    const adaptiveDailyTargetMinutes = remainingMinutes > 0 ? Math.max(1, Math.ceil(remainingMinutes / daysRemaining)) : 0;

    // Expected Finish Date Calculation
    let expectedFinishDate: Date;
    let daysDifference = 0;
    let scheduleStatus: 'ON_TRACK' | 'BEHIND' | 'AHEAD' = 'ON_TRACK';

    if (completionPercent >= 100) {
      expectedFinishDate = today;
      scheduleStatus = 'AHEAD';
      daysDifference = daysRemaining;
    } else if (currentPaceMinutesPerDay > 0) {
      const daysNeededAtPace = Math.ceil(remainingMinutes / currentPaceMinutesPerDay);
      expectedFinishDate = new Date(today.getTime() + daysNeededAtPace * 86400000);
      daysDifference = daysRemaining - daysNeededAtPace;

      if (daysDifference >= 2) {
        scheduleStatus = 'AHEAD';
      } else if (daysDifference <= -2) {
        scheduleStatus = 'BEHIND';
      } else {
        scheduleStatus = 'ON_TRACK';
      }
    } else {
      // 0 pace so far
      const daysNeededAtTarget = Math.ceil(remainingMinutes / dailyTargetMinutes);
      expectedFinishDate = new Date(today.getTime() + daysNeededAtTarget * 86400000);
      if (daysElapsed > 2 && completedMinutes === 0) {
        scheduleStatus = 'BEHIND';
        daysDifference = -Math.abs(daysElapsed);
      } else {
        scheduleStatus = 'ON_TRACK';
        daysDifference = 0;
      }
    }

    // 4. Motivational Copy & Status Header
    let statusMessage = '✅ You are on track.';
    let motivationalMessage = "You're progressing exactly as planned. Stay consistent and keep learning!";

    if (scheduleStatus === 'AHEAD') {
      const diff = Math.abs(daysDifference);
      statusMessage = `🚀 You are ${diff} ${diff === 1 ? 'day' : 'days'} ahead of schedule.`;
      motivationalMessage = `Great work 🎉 You're ahead of schedule by ${diff} days. Keep going!`;
    } else if (scheduleStatus === 'BEHIND') {
      const diff = Math.abs(daysDifference);
      statusMessage = `⚠️ You are ${diff} ${diff === 1 ? 'day' : 'days'} behind schedule.`;
      if (diff > 5) {
        motivationalMessage = `You are ${diff} days behind your target completion date. Recommended study time today: ${adaptiveDailyTargetMinutes} minutes.`;
      } else {
        motivationalMessage = `A short study session of ${adaptiveDailyTargetMinutes} minutes today will get you right back on track.`;
      }
    }

    // 5. Daily Study Tasks for Today
    const uncompletedLessons = allLessons.filter((l) => !l.isCompleted);
    const todayTasks: DailyTask[] = [];
    let accumulatedTaskMinutes = 0;
    const taskTarget = adaptiveDailyTargetMinutes > 0 ? adaptiveDailyTargetMinutes : dailyTargetMinutes;

    for (const lesson of uncompletedLessons) {
      todayTasks.push(lesson);
      accumulatedTaskMinutes += lesson.durationMinutes;
      if (accumulatedTaskMinutes >= taskTarget && todayTasks.length >= 2) {
        break;
      }
    }

    // 6. Day-by-Day Timeline Generation
    const timeline: TimelineDay[] = [];
    const timelineLength = Math.max(totalPlanDays, daysElapsed);

    for (let d = 1; d <= timelineLength; d++) {
      const dayDate = new Date(startDate.getTime() + (d - 1) * 86400000);
      const isToday = dayDate.toDateString() === today.toDateString();
      const isPast = dayDate < today && !isToday;
      const isFuture = dayDate > today && !isToday;

      let dayStatus: TimelineDay['status'] = 'UPCOMING';
      
      // Calculate studied minutes proportionality
      const targetForDay = dailyTargetMinutes;
      const expectedCompletedByDay = d * dailyTargetMinutes;

      if (isPast) {
        if (completedMinutes >= expectedCompletedByDay) {
          dayStatus = 'COMPLETED';
        } else {
          dayStatus = 'MISSED';
        }
      } else if (isToday) {
        dayStatus = completionPercent >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
      } else if (isFuture) {
        dayStatus = 'UPCOMING';
      }

      timeline.push({
        dayNumber: d,
        dateStr: dayDate.toISOString().split('T')[0],
        status: dayStatus,
        isToday,
        targetMinutes: targetForDay,
        studiedMinutes: isPast ? (dayStatus === 'COMPLETED' ? targetForDay : 0) : 0,
      });
    }

    return {
      planId: plan.id,
      courseId: course.id,
      courseTitle: course.title,
      courseSlug: course.slug,
      courseThumbnail: course.thumbnail || undefined,
      targetDays: totalPlanDays,
      targetDate: targetDate.toISOString(),
      startDate: startDate.toISOString(),
      totalCourseMinutes,
      completedMinutes,
      remainingMinutes,
      completionPercent,
      dailyTargetMinutes,
      currentPaceMinutesPerDay,
      adaptiveDailyTargetMinutes,
      expectedFinishDate: expectedFinishDate.toISOString(),
      scheduleStatus,
      daysDifference,
      statusMessage,
      motivationalMessage,
      daysElapsed,
      daysRemaining,
      todayTasks,
      timeline,
    };
  }

  /**
   * Retrieves all study plans for a student across their enrolled courses
   */
  public async getAllPlansForStudent(userId: string): Promise<StudyPlanMetrics[]> {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: { course: true },
    });

    const metricsList: StudyPlanMetrics[] = [];
    for (const enr of enrollments) {
      if (enr.courseId) {
        const metrics = await this.getPlanMetrics(userId, enr.courseId);
        if (metrics) metricsList.push(metrics);
      }
    }

    return metricsList;
  }

  /**
   * Admin Analytics: Aggregated learning pace & study plan stats across the entire LMS
   */
  public async getAnalytics(): Promise<StudyPlanAnalytics> {
    const allCourses = await prisma.course.findMany({
      select: { id: true, title: true },
    });

    let totalActivePlans = 0;
    let studentsOnTrack = 0;
    let studentsBehind = 0;
    let studentsAhead = 0;
    let sumDailyTarget = 0;
    let sumActualPace = 0;

    const courseMap = new Map<
      string,
      {
        courseId: string;
        courseTitle: string;
        plansCount: number;
        sumTargetDays: number;
        sumPace: number;
        onTrack: number;
        behind: number;
        ahead: number;
      }
    >();

    allCourses.forEach((c) => {
      courseMap.set(c.id, {
        courseId: c.id,
        courseTitle: c.title,
        plansCount: 0,
        sumTargetDays: 0,
        sumPace: 0,
        onTrack: 0,
        behind: 0,
        ahead: 0,
      });
    });

    for (const [key, plan] of this.plans.entries()) {
      try {
        const metrics = await this.getPlanMetrics(plan.userId, plan.courseId);
        if (metrics) {
          totalActivePlans++;
          sumDailyTarget += metrics.dailyTargetMinutes;
          sumActualPace += metrics.currentPaceMinutesPerDay;

          if (metrics.scheduleStatus === 'ON_TRACK') studentsOnTrack++;
          else if (metrics.scheduleStatus === 'BEHIND') studentsBehind++;
          else if (metrics.scheduleStatus === 'AHEAD') studentsAhead++;

          const cEntry = courseMap.get(plan.courseId);
          if (cEntry) {
            cEntry.plansCount++;
            cEntry.sumTargetDays += plan.targetDays;
            cEntry.sumPace += metrics.currentPaceMinutesPerDay;
            if (metrics.scheduleStatus === 'ON_TRACK') cEntry.onTrack++;
            else if (metrics.scheduleStatus === 'BEHIND') cEntry.behind++;
            else if (metrics.scheduleStatus === 'AHEAD') cEntry.ahead++;
          }
        }
      } catch (err) {
        console.error('[StudyPlanner] Error computing metrics for plan:', err);
      }
    }

    const percentOnTrack = totalActivePlans > 0 ? Math.round((studentsOnTrack / totalActivePlans) * 100) : 100;
    const percentBehind = totalActivePlans > 0 ? Math.round((studentsBehind / totalActivePlans) * 100) : 0;
    const percentAhead = totalActivePlans > 0 ? Math.round((studentsAhead / totalActivePlans) * 100) : 0;

    const courseAnalytics = Array.from(courseMap.values())
      .filter((c) => c.plansCount > 0)
      .map((c) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        activePlansCount: c.plansCount,
        avgPlannedDays: Math.round(c.sumTargetDays / (c.plansCount || 1)),
        avgActualPace: Math.round((c.sumPace / (c.plansCount || 1)) * 10) / 10,
        percentOnTrack: Math.round((c.onTrack / (c.plansCount || 1)) * 100),
        percentBehind: Math.round((c.behind / (c.plansCount || 1)) * 100),
        percentAhead: Math.round((c.ahead / (c.plansCount || 1)) * 100),
      }));

    return {
      totalActivePlans,
      studentsOnTrack,
      studentsBehind,
      studentsAhead,
      percentOnTrack,
      percentBehind,
      percentAhead,
      averageDailyTargetMinutes: totalActivePlans > 0 ? Math.round(sumDailyTarget / totalActivePlans) : 15,
      averageActualPaceMinutes: totalActivePlans > 0 ? Math.round((sumActualPace / totalActivePlans) * 10) / 10 : 12,
      courseAnalytics,
    };
  }

  /**
   * Daily 9:00 AM Smart Notification Engine
   * Sends personalized in-app notifications and Web Push reminders to students
   */
  public async sendDailyStudyReminders(): Promise<{ delivered: number }> {
    let delivered = 0;

    for (const [key, plan] of this.plans.entries()) {
      try {
        const metrics = await this.getPlanMetrics(plan.userId, plan.courseId);
        if (!metrics || metrics.completionPercent >= 100) continue;

        let title = 'Scalora Study Goal ☀️';
        let body = `Good morning! Today's target for "${metrics.courseTitle}" is ${metrics.dailyTargetMinutes} minutes. Stay consistent!`;

        if (metrics.scheduleStatus === 'BEHIND') {
          title = 'Scalora Learning Catch-Up ⚠️';
          body = `You're currently behind schedule on "${metrics.courseTitle}". Study ${metrics.adaptiveDailyTargetMinutes} minutes today to finish on time!`;
        } else if (metrics.scheduleStatus === 'AHEAD') {
          title = 'Scalora Momentum 🚀';
          body = `Great work! You're ahead of schedule by ${Math.abs(metrics.daysDifference)} days on "${metrics.courseTitle}". Keep going!`;
        }

        // 1. In-App Notification
        await notificationService.createNotification({
          userId: plan.userId,
          type: 'STUDY_PLAN_REMINDER',
          message: body,
          actionUrl: `/my-study-plan?course=${plan.courseId}`,
        });

        // 2. Native OS Web Push (Android System Tray / PWA Desktop)
        await webPushService.sendPushToUser(plan.userId, {
          title,
          body,
          url: `/my-study-plan?course=${plan.courseId}`,
          type: 'STUDY_PLAN_REMINDER',
        });

        delivered++;
      } catch (err) {
        console.error(`[StudyPlanner] Failed to send reminder to user ${plan.userId}:`, err);
      }
    }

    console.log(`[StudyPlanner] Dispatched morning study reminders to ${delivered} active learners.`);
    return { delivered };
  }
}

export const studyPlannerService = new StudyPlannerService();
