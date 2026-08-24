import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Enrollment } from '../../types';
import { StudyPlanMetrics } from '../../types/study-plan';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Bell,
  ArrowRight,
  Target,
  Sparkles,
} from 'lucide-react';
import { usePwa } from '../../hooks/usePwa';
import { PwaHeroCard } from '../pwa/PwaHeroCard';

export const MobileNativeHome: React.FC = () => {
  const { user } = useAuth();
  const { isInstalled } = usePwa();

  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlanMetrics | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Fetch active enrollment
    api
      .get<{ success: boolean; enrollments: Enrollment[] }>('/enrollments/my')
      .then((res) => {
        if (res.success && Array.isArray(res.enrollments) && res.enrollments.length > 0) {
          const inProgress = res.enrollments.find((e) => e.progressPercent < 100) || res.enrollments[0];
          setActiveEnrollment(inProgress);

          // 2. Fetch study plan for the active course
          if (inProgress?.course?.id) {
            api
              .get<{ success: boolean; plan: StudyPlanMetrics }>(
                `/study-planner/plan?courseId=${inProgress.course.id}`
              )
              .then((pRes) => {
                if (pRes.success && pRes.plan) {
                  setStudyPlan(pRes.plan);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 3. Fetch latest 3 notifications
    api
      .get<{ success: boolean; notifications: any[] }>('/notifications?limit=3')
      .then((res) => {
        if (res.success && Array.isArray(res.notifications)) {
          setNotifications(res.notifications.slice(0, 3));
        }
      })
      .catch(() => {});
  }, [user]);

  // Guest Mobile Landing
  if (!user) {
    return (
      <div className="md:hidden space-y-6 px-4 pt-6 pb-20">
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#082B5B] to-[#04152D] border border-cyan-500/30 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#04152D] border border-cyan-500/40 p-2.5 mx-auto shadow-md">
            <img src="/scalora-icon-transparent.png" alt="Scalora" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Scalora LMS</h2>
            <p className="text-xs text-slate-300">Executive Systems & Technical Academy</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              to="/login"
              className="py-3 rounded-xl bg-scalora-navy border border-white/10 text-white font-bold text-xs"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="py-3 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-xs shadow-glow-blue"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Show Install CTA only if NOT installed */}
        {!isInstalled && <PwaHeroCard />}
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-4 px-4 pt-4 pb-24">
      {/* ========================================================================= */}
      {/* SECTION 1: WELCOME CARD                                                  */}
      {/* Show: Profile photo, User name, Level (Only. Remove extra buttons.)      */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-[#031124] border border-scalora-blue/20 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src={
              user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284C7&color=fff`
            }
            alt={user.name}
            className="w-12 h-12 rounded-2xl object-cover border border-cyan-400/40 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Welcome Back</div>
            <h2 className="text-base font-black text-white truncate">{user.name}</h2>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 text-[10px] font-black uppercase border border-cyan-500/30 flex-shrink-0">
          {user.role || 'STUDENT'}
        </span>
      </div>

      {/* Show Install Banner ONLY if NOT installed */}
      {!isInstalled && <PwaHeroCard />}

      {/* ========================================================================= */}
      {/* SECTION 2: CONTINUE LEARNING                                             */}
      {/* Show only: Current course, Progress bar, Resume button. Nothing else.    */}
      {/* ========================================================================= */}
      {activeEnrollment && (
        <div className="p-4 rounded-2xl bg-[#031124] border border-scalora-blue/20 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Continue Learning
            </span>
            <span className="text-xs font-black text-cyan-300">
              {activeEnrollment.progressPercent}%
            </span>
          </div>

          <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
            {activeEnrollment.course.title}
          </h3>

          <div className="w-full bg-[#04152D] h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-cyan-400 to-scalora-blue h-full rounded-full transition-all duration-500"
              style={{ width: `${activeEnrollment.progressPercent}%` }}
            />
          </div>

          <Link
            to={`/learn/${activeEnrollment.course.slug}`}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Resume</span>
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: TODAY'S LEARNING GOAL (Single Clean Card)                     */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-[#031124] border border-scalora-blue/20 space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">Today's Goal</span>
          </div>

          {studyPlan ? (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                studyPlan.scheduleStatus === 'AHEAD'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : studyPlan.scheduleStatus === 'BEHIND'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}
            >
              {studyPlan.scheduleStatus === 'BEHIND'
                ? `You are ${Math.abs(studyPlan.daysDifference || 1)} days behind schedule`
                : studyPlan.scheduleStatus === 'AHEAD'
                ? `You are ${Math.abs(studyPlan.daysDifference || 1)} days ahead`
                : 'You are on track'}
            </span>
          ) : (
            <span className="text-[10px] text-cyan-400 font-bold">You are on track</span>
          )}
        </div>

        <p className="text-xs text-slate-300">
          {studyPlan
            ? `${studyPlan.adaptiveDailyTargetMinutes || studyPlan.dailyTargetMinutes || 10} minutes remaining today.`
            : '10 minutes remaining today to maintain your weekly learning consistency.'}
        </p>

        <Link
          to="/my-study-plan"
          className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-1"
        >
          <span>View Study Schedule</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: RECENT NOTIFICATIONS                                          */}
      {/* Show only latest 3 notifications. "View All" button.                     */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-[#031124] border border-scalora-blue/20 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">Recent Notifications</span>
          </div>
          <Link
            to="/notifications"
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
          >
            View All
          </Link>
        </div>

        {notifications.length === 0 ? (
          <p className="text-xs text-slate-400 py-1">No new notifications.</p>
        ) : (
          <div className="space-y-2 divide-y divide-white/5">
            {notifications.map((n) => (
              <div key={n.id} className="pt-2 first:pt-0 space-y-0.5">
                <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                  {n.message || 'New notification update'}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
