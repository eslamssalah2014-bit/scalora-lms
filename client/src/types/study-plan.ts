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
  daysDifference: number;
  statusMessage: string;
  motivationalMessage: string;
  daysElapsed: number;
  daysRemaining: number;
  todayTasks: DailyTask[];
  timeline: TimelineDay[];
}

export interface CourseStudyAnalytics {
  courseId: string;
  courseTitle: string;
  activePlansCount: number;
  avgPlannedDays: number;
  avgActualPace: number;
  percentOnTrack: number;
  percentBehind: number;
  percentAhead: number;
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
  courseAnalytics: CourseStudyAnalytics[];
}
