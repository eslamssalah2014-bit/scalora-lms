import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Enrollment } from '../types';
import { api } from '../lib/api';
import { CertificateModal } from '../components/CertificateModal';
import { NotificationPreferencesModal } from '../components/NotificationPreferencesModal';
import { Modal } from '../components/Modal';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Users,
  Target,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Flame,
  Zap,
  Mail,
  Calendar,
  Smartphone,
  Check,
  Lock,
} from 'lucide-react';
import { usePwa } from '../hooks/usePwa';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isInstalled } = usePwa();
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  // Native Mobile Modals
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    fetchMyEnrollments();
  }, []);

  const fetchMyEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      let res: { success: boolean; enrollments: Enrollment[] };
      try {
        res = await api.get<{ success: boolean; enrollments: Enrollment[] }>('/enrollments/my');
      } catch {
        res = await api.get<{ success: boolean; enrollments: Enrollment[] }>('/enrollments/my-courses');
      }
      if (res && res.success && Array.isArray(res.enrollments)) {
        setEnrollments(res.enrollments);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load enrolled tracks from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCertificate = async (courseId: string) => {
    try {
      const res = await api.get<{ success: boolean; certificate: any }>(`/progress/certificate/${courseId}`);
      if (res.success && res.certificate) {
        setSelectedCert(res.certificate);
      }
    } catch (err) {
      console.error('Error fetching certificate:', err);
    }
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      navigate('/login');
    }
  };

  const totalEnrolled = enrollments.length;
  const completedCoursesList = enrollments.filter((e) => e.progressPercent === 100);
  const inProgressCoursesList = enrollments.filter((e) => e.progressPercent < 100);
  const completedCoursesCount = completedCoursesList.length;
  const inProgressCoursesCount = inProgressCoursesList.length;
  const totalLessonsCompleted = enrollments.reduce((sum, e) => sum + (e.completedCount || 0), 0);

  // Active track for resume
  const activeEnrollment = inProgressCoursesList[0] || enrollments[0];

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Aug 2026';

  return (
    <div>
      {/* ========================================================================= */}
      {/* 📱 MOBILE APP NATIVE PROFILE VIEW (Visible on Mobile Viewport <md)        */}
      {/* Facebook / LinkedIn / Discord Style Authenticated Profile                */}
      {/* ========================================================================= */}
      <div className="block md:hidden px-4 py-6 space-y-6 max-w-lg mx-auto pb-24">
        {/* 1. User Profile Card */}
        <div className="relative p-5 rounded-3xl bg-gradient-to-b from-[#082B5B] via-[#061D3D] to-[#04152D] border border-cyan-500/30 shadow-2xl overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || 'Student'
                  )}&background=0284C7&color=fff`
                }
                alt={user?.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#04152D] rounded-full" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black text-white truncate">{user?.name}</h2>
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-300 truncate font-mono">{user?.email}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {user?.role || 'STUDENT'}
                </span>
                <span className="text-[11px] text-slate-400">Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Learning Stats Grid (2x2) */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Learning Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#031124] border border-scalora-blue/20 space-y-1 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">Enrolled</span>
                <BookOpen className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{totalEnrolled}</div>
              <span className="text-[10px] text-slate-400 block">{inProgressCoursesCount} In Progress</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#031124] border border-emerald-500/30 space-y-1 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-emerald-400">Completed</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{completedCoursesCount}</div>
              <span className="text-[10px] text-slate-400 block">100% Finished</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#031124] border border-amber-500/30 space-y-1 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-amber-300">Certificates</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300">{completedCoursesCount}</div>
              <span className="text-[10px] text-slate-400 block">Earned</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#031124] border border-scalora-blue/20 space-y-1 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-cyan-300">Checkpoints</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400">{totalLessonsCompleted}</div>
              <span className="text-[10px] text-slate-400 block">Lessons Passed</span>
            </div>
          </div>
        </div>

        {/* 3. My Learning Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              My Learning Progress
            </h3>
            <Link
              to="/my-study-plan"
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Smart Study Plan</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-6 rounded-2xl bg-[#031124] animate-pulse space-y-2">
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#031124] border border-scalora-blue/20 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">You are not enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="inline-block px-4 py-2 rounded-xl bg-scalora-blue text-white text-xs font-bold"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {enrollments.slice(0, 3).map((enr) => (
                <div
                  key={enr.enrollmentId}
                  className="p-4 rounded-2xl bg-[#031124] border border-scalora-blue/20 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                        {enr.course.category}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{enr.course.title}</h4>
                    </div>
                    <span className="text-xs font-black text-cyan-300 flex-shrink-0">
                      {enr.progressPercent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        enr.progressPercent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-scalora-blue'
                      }`}
                      style={{ width: `${enr.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      {enr.completedCount} of {enr.totalLessons} lessons
                    </span>

                    <Link
                      to={`/learn/${enr.course.slug}`}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{enr.progressPercent === 100 ? 'Review' : 'Continue'}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. My Certificates */}
        {completedCoursesList.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 px-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>My Accredited Certificates</span>
            </h3>

            <div className="space-y-2">
              {completedCoursesList.map((enr) => (
                <div
                  key={`cert_${enr.enrollmentId}`}
                  className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{enr.course.title}</h4>
                      <span className="text-[10px] text-amber-300 font-mono block">
                        Verified Credential ✓
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCertificate(enr.course.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold flex-shrink-0 shadow-sm"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Mobile App Settings & Actions (Native List Menu) */}
        <div className="space-y-2.5 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Preferences & Settings
          </h3>

          <div className="rounded-3xl bg-[#031124] border border-scalora-blue/20 divide-y divide-scalora-blue/15 overflow-hidden shadow-xl">
            {/* Notification Settings */}
            <button
              onClick={() => setNotifModalOpen(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Notification Settings</span>
                  <span className="text-[10px] text-slate-400">Push alerts, daily study reminders</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            {/* Account Settings */}
            <button
              onClick={() => setAccountModalOpen(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-scalora-blue/20 text-scalora-accent flex items-center justify-center border border-scalora-blue/30">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Account Settings</span>
                  <span className="text-[10px] text-slate-400">Profile details, password, email</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            {/* Privacy & Security */}
            <button
              onClick={() => setSecurityModalOpen(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Privacy & Security</span>
                  <span className="text-[10px] text-slate-400">256-Bit SSL, active sessions, PWA</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            {/* Logout */}
            <button
              onClick={() => setLogoutModalOpen(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-500/10 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-500/20">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-400 block">Sign Out</span>
                  <span className="text-[10px] text-slate-400">Log out from this device</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400/50" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💻 DESKTOP STUDENT WORKSPACE (Visible on Desktop Viewport md+)            */}
      {/* Kept EXACTLY AS IS for full desktop workspace consistency                */}
      {/* ========================================================================= */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchMyEnrollments}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 1. Welcome & Greeting Banner */}
        <div className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#082B5B] via-[#0D3E82] to-[#04152D] border border-scalora-blue/30 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-scalora-accent/15 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || 'Student'
                  )}&background=2D8CFF&color=fff`
                }
                alt={user?.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-scalora-blue/40 shadow-xl"
              />
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-scalora-blue/20 text-scalora-accent text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Student Learner Workspace</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  You've completed <strong className="text-white">{totalLessonsCompleted}</strong> engineering lessons. Keep pushing forward!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
              <Link
                to="/my-study-plan"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white text-xs font-bold shadow-glow-accent hover:opacity-95 transition-all flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                <span>Smart Study Plan</span>
              </Link>

              <Link
                to="/community"
                className="px-5 py-3 rounded-xl bg-scalora-navy/80 hover:bg-scalora-navy text-white text-xs font-bold border border-scalora-blue/30 shadow-lg transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Community Feed</span>
              </Link>

              <Link
                to="/courses"
                className="px-5 py-3 rounded-xl bg-scalora-navy/80 hover:bg-scalora-navy text-white text-xs font-bold border border-scalora-blue/30 shadow-lg transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-scalora-blue" />
                <span>Browse More Tracks</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Top Stats Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Tracks</span>
              <div className="w-8 h-8 rounded-lg bg-scalora-blue/20 text-scalora-blue flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalEnrolled}</div>
            <p className="text-[11px] text-slate-400">{inProgressCoursesCount} in progress</p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lessons Completed</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-scalora-accent">{totalLessonsCompleted}</div>
            <p className="text-[11px] text-slate-400">Mastery checkpoints</p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Courses</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{completedCoursesCount}</div>
            <p className="text-[11px] text-slate-400">100% finished</p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Certificates</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">{completedCoursesCount}</div>
            <p className="text-[11px] text-slate-400">Accredited credentials</p>
          </div>
        </div>

        {/* 3. Continue Learning Active Banner (If enrolled in courses) */}
        {activeEnrollment && (
          <div className="p-6 rounded-2xl glass-panel border border-scalora-blue/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-scalora-accent">
                  Resume Active Track
                </span>
                <h3 className="text-xl font-bold text-white">{activeEnrollment.course.title}</h3>
                <p className="text-xs text-slate-400">
                  {activeEnrollment.completedCount} of {activeEnrollment.totalLessons} lessons completed ({activeEnrollment.progressPercent}%)
                </p>
              </div>

              <Link
                to={`/learn/${activeEnrollment.course.slug}${
                  activeEnrollment.nextLessonId ? `?lesson=${activeEnrollment.nextLessonId}` : ''
                }`}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-xs shadow-glow-blue hover:opacity-95 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Resume Classroom</span>
              </Link>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-scalora-navy/80 overflow-hidden border border-scalora-blue/20">
              <div
                className="h-full bg-gradient-to-r from-scalora-blue to-scalora-accent rounded-full transition-all duration-700"
                style={{ width: `${activeEnrollment.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 4. Enrolled Courses Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-scalora-blue/20">
            <div>
              <h2 className="text-2xl font-black text-white">My Enrolled Courses</h2>
              <p className="text-xs text-slate-400">All registered tracks and curriculum checkpoints</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-80 rounded-2xl glass-card animate-pulse bg-scalora-navy/40" />
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl space-y-4 max-w-md mx-auto">
              <GraduationCap className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Enrolled Courses Yet</h3>
              <p className="text-xs text-slate-400">
                You haven't enrolled in any tracks yet. Explore our enterprise catalog to start learning.
              </p>
              <Link
                to="/courses"
                className="inline-block px-5 py-2.5 rounded-xl bg-scalora-blue text-white text-xs font-bold shadow-glow-blue"
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enr) => (
                <div key={enr.enrollmentId} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div>
                    {/* Thumbnail */}
                    <div className="relative aspect-square w-full overflow-hidden bg-[#04152D]">
                      <img
                        src={
                          enr.course.thumbnail ||
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                        }
                        alt={enr.course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-scalora-blue/15 text-scalora-accent border border-scalora-blue/30">
                          {enr.course.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                        {enr.course.title}
                      </h3>
                      <p className="text-xs text-slate-400">Instructor: {enr.course.instructor}</p>

                      {/* Progress details */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Progress</span>
                          <span className="font-bold text-white">{enr.progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-scalora-navy overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              enr.progressPercent === 100
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-scalora-blue to-scalora-accent'
                            }`}
                            style={{ width: `${enr.progressPercent}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 text-right">
                          {enr.completedCount} / {enr.totalLessons} lessons
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    <Link
                      to={`/learn/${enr.course.slug}`}
                      className="flex-1 py-2.5 rounded-xl bg-scalora-blue hover:bg-scalora-hover text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>{enr.progressPercent === 100 ? 'Review' : 'Continue'}</span>
                    </Link>

                    <Link
                      to="/community"
                      className="px-3 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Course Community Channel"
                    >
                      <Users className="w-4 h-4" />
                    </Link>

                    {enr.progressPercent === 100 && (
                      <button
                        onClick={() => handleOpenCertificate(enr.course.id)}
                        className="px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="View Certificate"
                      >
                        <Award className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS (Shared across Mobile & Desktop)                                   */}
      {/* ========================================================================= */}
      {/* Certificate Modal */}
      <CertificateModal
        isOpen={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
      />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
      />

      {/* Account Settings Modal */}
      <Modal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        title="Account Settings"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#031124] border border-scalora-blue/20 space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Full Name</span>
              <p className="text-sm font-bold text-white">{user?.name}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
              <p className="text-sm font-bold text-white font-mono">{user?.email}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Account Role</span>
              <p className="text-sm font-bold text-cyan-400">{user?.role}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            To change your password or update your verified legal name on certificates, contact support at{' '}
            <strong className="text-cyan-300">support@scaloraa.online</strong>.
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setAccountModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-scalora-navy text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Privacy & Security Modal */}
      <Modal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        title="Privacy & Security"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span>256-Bit SSL Enterprise Security Active</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              All your session keys, course check-ins, and study milestones are encrypted in-flight and at rest.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#031124] border border-scalora-blue/20 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">PWA Status</span>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">{isInstalled ? 'App Installed ✓' : 'Web Browser Session'}</span>
              <span className="text-emerald-400 font-bold">{isOnline ? 'Online (Real-Time)' : 'Offline Cache'}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSecurityModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-scalora-navy text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Sign Out"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to sign out of <strong className="text-white">Scalora LMS</strong> on this device?
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setLogoutModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-scalora-navy text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleLogoutConfirm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
