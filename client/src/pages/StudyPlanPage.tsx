import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StudyPlanMetrics, DailyTask } from '../types/study-plan';
import { Course } from '../types';
import { Modal } from '../components/Modal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  BookOpen,
  PlayCircle,
  Flame,
  Zap,
  ChevronRight,
  RefreshCw,
  Award,
  Layers,
  HelpCircle,
  Compass,
  Smile,
  ShieldCheck,
  BarChart3,
  CalendarDays,
  Plus,
} from 'lucide-react';

export const StudyPlanPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const courseParam = searchParams.get('course');

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [metrics, setMetrics] = useState<StudyPlanMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customization Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetDaysOption, setTargetDaysOption] = useState<number>(14);
  const [customDate, setCustomDate] = useState<string>('');
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchPlanMetrics(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchEnrolledCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; enrollments: any[] }>('/enrollments/my');
      if (res.success && Array.isArray(res.enrollments) && res.enrollments.length > 0) {
        const courses = res.enrollments
          .map((e) => e.course)
          .filter((c): c is Course => Boolean(c && c.id));
        setEnrolledCourses(courses);

        // Pick course from search param or default to first enrolled
        const targetCourse = courseParam
          ? courses.find((c) => c.id === courseParam || c.slug === courseParam)
          : courses[0];

        const initialId = targetCourse ? targetCourse.id : courses[0]?.id || '';
        setSelectedCourseId(initialId);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to load student enrollments:', err);
      setError(err.message || 'Failed to load study plan.');
      setLoading(false);
    }
  };

  const fetchPlanMetrics = async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; plan: StudyPlanMetrics }>(
        `/study-planner/plan?courseId=${courseId}`
      );
      if (res.success && res.plan) {
        setMetrics(res.plan);
        setTargetDaysOption(res.plan.targetDays || 14);
      } else {
        setError('Unable to load personalized study pace for this course.');
      }
    } catch (err: any) {
      console.error('Failed to fetch plan metrics:', err);
      setError(err.message || 'Failed to load study plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setSavingPlan(true);
    try {
      const res = await api.post<{ success: boolean; plan: StudyPlanMetrics }>('/study-planner/plan', {
        courseId: selectedCourseId,
        targetDays: targetDaysOption,
        customTargetDate: targetDaysOption === 0 && customDate ? customDate : undefined,
      });

      if (res.success && res.plan) {
        setMetrics(res.plan);
        setModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save customized study plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper for circular progress SVG
  const calculateCircleOffset = (percent: number, radius = 54) => {
    const circumference = 2 * Math.PI * radius;
    return circumference - (percent / 100) * circumference;
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-scalora-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-400">
          Calculating personalized learning pace & milestones...
        </p>
      </div>
    );
  }

  if (enrolledCourses.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 glass-panel rounded-3xl text-center space-y-5 border border-scalora-blue/20">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">No Active Course Plans Yet</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Personalized study plans are generated automatically when you enroll in a course. Browse our executive programs to start your journey.
          </p>
        </div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-xs shadow-glow-blue hover:opacity-95 transition-all"
        >
          <span>Explore Executive Courses</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 1. Top Header & Course Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-scalora-blue/15 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Learning Pace Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Personalized Study Plan
          </h1>
          <p className="text-xs text-slate-400">
            Intelligent daily milestones, completion forecasting, and adaptive catch-up schedules.
          </p>
        </div>

        {/* Course Dropdown & Goal Customizer */}
        <div className="flex flex-wrap items-center gap-3">
          {enrolledCourses.length > 1 && (
            <div className="relative min-w-[200px]">
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSearchParams({ course: e.target.value });
                }}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs bg-[#04152D] font-bold text-white pr-8 border border-scalora-blue/30"
              >
                {enrolledCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 transition-all flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            <span>Set Target Pace</span>
          </button>
        </div>
      </div>

      {metrics && (
        <>
          {/* 2. Schedule Status & Dynamic Motivation Banner */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl ${
              metrics.scheduleStatus === 'AHEAD'
                ? 'bg-gradient-to-r from-emerald-950/40 via-[#04152D] to-teal-950/30 border-emerald-500/40'
                : metrics.scheduleStatus === 'BEHIND'
                ? 'bg-gradient-to-r from-amber-950/40 via-[#04152D] to-rose-950/30 border-amber-500/40'
                : 'bg-gradient-to-r from-cyan-950/40 via-[#04152D] to-blue-950/30 border-cyan-500/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  metrics.scheduleStatus === 'AHEAD'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : metrics.scheduleStatus === 'BEHIND'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {metrics.scheduleStatus === 'AHEAD' && <Zap className="w-6 h-6" />}
                {metrics.scheduleStatus === 'BEHIND' && <AlertTriangle className="w-6 h-6 animate-pulse" />}
                {metrics.scheduleStatus === 'ON_TRACK' && <CheckCircle2 className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{metrics.statusMessage}</span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {metrics.motivationalMessage}
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <Link
                to={`/learn/${metrics.courseSlug}`}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-slate-950 text-xs font-black hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <PlayCircle className="w-4 h-4 text-cyan-600" />
                <span>Continue Learning</span>
              </Link>
            </div>
          </div>

          {/* 3. Hero Visual KPI & Pace Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Circular Progress & Completion Ring (1/3) */}
            <div className="glass-panel p-6 rounded-3xl border border-scalora-blue/20 flex flex-col items-center justify-center text-center space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-scalora-blue/10 rounded-full blur-3xl" />

              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Course Progress
              </h3>

              {/* SVG Circular Ring */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className="text-slate-800"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className="text-cyan-400 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={calculateCircleOffset(metrics.completionPercent, 50)}
                    strokeLinecap="round"
                    stroke="url(#progressGradient)"
                    fill="transparent"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00E5FF" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{metrics.completionPercent}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Completed
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-scalora-blue/15 text-xs">
                <div className="text-center">
                  <span className="text-slate-400 text-[11px] block">Completed</span>
                  <strong className="text-emerald-400 font-black">{metrics.completedMinutes} mins</strong>
                </div>
                <div className="text-center border-l border-scalora-blue/15">
                  <span className="text-slate-400 text-[11px] block">Remaining</span>
                  <strong className="text-white font-black">{metrics.remainingMinutes} mins</strong>
                </div>
              </div>
            </div>

            {/* Target vs Actual Pace & Forecast (2/3) */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-scalora-blue/20 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-scalora-blue/15 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Pace Intelligence & Deadlines
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {metrics.daysRemaining} Days Left
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Duration */}
                <div className="p-4 rounded-2xl bg-[#04152D]/80 border border-scalora-blue/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Duration</span>
                  <div className="text-lg sm:text-xl font-black text-white">
                    {metrics.totalCourseMinutes} <span className="text-xs font-normal text-slate-400">min</span>
                  </div>
                </div>

                {/* Daily Target */}
                <div className="p-4 rounded-2xl bg-[#04152D]/80 border border-scalora-blue/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Daily Target</span>
                  <div className="text-lg sm:text-xl font-black text-cyan-400">
                    {metrics.dailyTargetMinutes} <span className="text-xs font-normal text-slate-400">min/day</span>
                  </div>
                </div>

                {/* Current Actual Pace */}
                <div className="p-4 rounded-2xl bg-[#04152D]/80 border border-scalora-blue/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Current Pace</span>
                  <div className="text-lg sm:text-xl font-black text-emerald-400">
                    {metrics.currentPaceMinutesPerDay} <span className="text-xs font-normal text-slate-400">min/day</span>
                  </div>
                </div>

                {/* Adaptive Recovery Target */}
                <div className="p-4 rounded-2xl bg-[#04152D]/80 border border-amber-500/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-300">Adaptive Today</span>
                  <div className="text-lg sm:text-xl font-black text-amber-400">
                    {metrics.adaptiveDailyTargetMinutes} <span className="text-xs font-normal text-slate-400">min</span>
                  </div>
                </div>
              </div>

              {/* Goal Date vs Expected Forecast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                      🎯 Goal Finish Date
                    </span>
                    <strong className="text-sm font-black text-white">{formatDate(metrics.targetDate)}</strong>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Planned</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                      ⚡ Expected Forecast
                    </span>
                    <strong className="text-sm font-black text-white">
                      {formatDate(metrics.expectedFinishDate)}
                    </strong>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">At Current Pace</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Day-by-Day Timeline Progress Component */}
          <div className="glass-panel p-6 rounded-3xl border border-scalora-blue/20 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Course Timeline Progress
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Completed
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Missed
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Today
                </span>
              </div>
            </div>

            {/* Timeline Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
              {metrics.timeline.slice(0, 14).map((day) => {
                let badgeStyle = 'bg-[#04152D] border-scalora-blue/20 text-slate-400';
                let icon = <Clock className="w-3.5 h-3.5 text-slate-500" />;

                if (day.status === 'COMPLETED') {
                  badgeStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
                  icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
                } else if (day.status === 'MISSED') {
                  badgeStyle = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
                  icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
                } else if (day.isToday) {
                  badgeStyle = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/30';
                  icon = <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />;
                }

                return (
                  <div
                    key={day.dayNumber}
                    className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2 transition-all ${badgeStyle}`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Day {day.dayNumber}</span>
                      {icon}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {new Date(day.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[11px] font-black text-white">
                        {day.status === 'COMPLETED' ? '✓ Finished' : `${day.targetMinutes} min`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Today's Recommended Daily Study Tasks */}
          <div className="glass-panel p-6 rounded-3xl border border-scalora-blue/20 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Today's Recommended Study Tasks
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Target: {metrics.adaptiveDailyTargetMinutes} min
              </span>
            </div>

            {metrics.todayTasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">All Course Modules Completed!</h4>
                <p className="text-xs text-slate-300">
                  You have successfully finished all curriculum lessons for this course. Claim your graduation certificate!
                </p>
                <Link
                  to={`/learn/${metrics.courseSlug}`}
                  className="inline-block px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold mt-2"
                >
                  View Certificate
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {metrics.todayTasks.map((task, idx) => (
                  <div
                    key={task.lessonId}
                    className="p-4 rounded-2xl bg-[#04152D] border border-scalora-blue/20 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-scalora-navy text-scalora-accent flex items-center justify-center flex-shrink-0 font-black text-xs border border-scalora-blue/30">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                            {task.moduleTitle || 'Curriculum'}
                          </span>
                          <span className="text-[10px] text-slate-500">• {task.durationMinutes} min</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    <Link
                      to={`/learn/${metrics.courseSlug}?lesson=${task.lessonId}`}
                      className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 border border-cyan-500/30"
                    >
                      <span>Start</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Smart Missed-Day Adaptive Recovery Callout */}
          <div className="p-5 rounded-2xl bg-[#031024] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">Smart Missed-Day Recovery Active</span>
                <span className="text-slate-400">
                  If you miss study days, Scalora automatically recalibrates your remaining time across your remaining days.
                </span>
              </div>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-scalora-navy text-slate-300 hover:text-white border border-scalora-blue/20 text-[11px] font-semibold whitespace-nowrap"
            >
              Adjust Plan
            </button>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* PACE CUSTOMIZATION MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Personalize Your Study Goal">
        <form onSubmit={handleSavePlan} className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs text-slate-300">
              When would you like to complete <strong className="text-white">"{metrics?.courseTitle}"</strong>?
            </p>
            <span className="text-[11px] text-slate-400 block">
              Total Course Duration: {metrics?.totalCourseMinutes} minutes
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { days: 7, label: '7 Days', badge: 'Intensive Sprint' },
              { days: 14, label: '14 Days', badge: 'Recommended' },
              { days: 30, label: '30 Days', badge: 'Steady Pace' },
            ].map((opt) => (
              <button
                type="button"
                key={opt.days}
                onClick={() => setTargetDaysOption(opt.days)}
                className={`p-4 rounded-2xl border text-left transition-all space-y-1 ${
                  targetDaysOption === opt.days
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-glow-blue'
                    : 'bg-[#04152D] border-scalora-blue/20 hover:border-scalora-blue/40'
                }`}
              >
                <span className="text-[10px] font-bold text-cyan-400 uppercase block">{opt.badge}</span>
                <div className="text-base font-black text-white">{opt.label}</div>
                <span className="text-[10px] text-slate-400 block">
                  ~{Math.ceil((metrics?.totalCourseMinutes || 60) / opt.days)} min / day
                </span>
              </button>
            ))}
          </div>

          {/* Custom Date Input */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Or Choose Custom Finish Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                const picked = new Date(e.target.value);
                const diffDays = Math.max(1, Math.ceil((picked.getTime() - Date.now()) / 86400000));
                setTargetDaysOption(diffDays);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#04152D] text-white"
            />
          </div>

          {/* Live Calculated Target Preview */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs flex items-center justify-between">
            <span className="text-slate-300">
              Target Pace: <strong className="text-emerald-400">{Math.ceil((metrics?.totalCourseMinutes || 60) / Math.max(1, targetDaysOption))} min/day</strong>
            </span>
            <span className="text-white font-bold">{targetDaysOption} Days Target</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-scalora-blue/20">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-scalora-navy text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPlan}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue flex items-center gap-2 hover:opacity-95"
            >
              {savingPlan && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save & Activate Plan</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
