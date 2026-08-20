import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Enrollment } from '../types';
import { api } from '../lib/api';
import { CertificateModal } from '../components/CertificateModal';
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
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  useEffect(() => {
    fetchMyEnrollments();
  }, []);

  const fetchMyEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; enrollments: Enrollment[] }>('/enrollments/my-courses');
      if (res.success && Array.isArray(res.enrollments)) {
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

  const totalEnrolled = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.progressPercent === 100).length;
  const inProgressCourses = totalEnrolled - completedCourses;
  const totalLessonsCompleted = enrollments.reduce((sum, e) => sum + (e.completedCount || 0), 0);

  // Find active course for "Continue Learning"
  const activeEnrollment = enrollments.find((e) => e.progressPercent < 100) || enrollments[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
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

          <Link
            to="/courses"
            className="self-start md:self-auto px-5 py-3 rounded-xl bg-scalora-navy/80 hover:bg-scalora-navy text-white text-xs font-bold border border-scalora-blue/30 shadow-lg transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-scalora-blue" />
            <span>Browse More Tracks</span>
          </Link>
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
          <p className="text-[11px] text-slate-400">{inProgressCourses} in progress</p>
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
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{completedCourses}</div>
          <p className="text-[11px] text-slate-400">100% finished</p>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Certificates</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">{completedCourses}</div>
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
                  <div className="relative h-44 w-full overflow-hidden bg-scalora-navy">
                    <img
                      src={
                        enr.course.thumbnail ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={enr.course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#04152D] via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-scalora-navy/90 text-scalora-accent border border-scalora-blue/30">
                        {enr.course.category}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
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
                    <span>{enr.progressPercent === 100 ? 'Review Course' : 'Continue'}</span>
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

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
      />
    </div>
  );
};
