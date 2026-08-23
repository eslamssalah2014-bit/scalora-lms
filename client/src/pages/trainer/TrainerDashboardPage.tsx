import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  BookOpen,
  Users,
  MessageSquare,
  Mail,
  PlayCircle,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Loader2,
  Calendar,
  CheckCircle,
  GraduationCap,
  Award,
  ArrowRight,
} from 'lucide-react';

interface TrainerStats {
  totalAssignedCourses: number;
  totalEnrolledStudents: number;
  totalLessons: number;
  unreadMessagesCount: number;
}

interface AssignedCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string | null;
  category: string;
  isPublished: boolean;
  studentsCount: number;
  lessonsCount: number;
  communityChannelId?: string | null;
  students: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    createdAt: string;
  }[];
}

export const TrainerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [courses, setCourses] = useState<AssignedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainerData();
  }, []);

  const fetchTrainerData = async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        success: boolean;
        stats: TrainerStats;
        courses: AssignedCourse[];
      }>('/trainers/dashboard/stats');

      if (res.success) {
        setStats(res.stats);
        setCourses(res.courses);
        if (res.courses.length > 0) {
          setSelectedCourseId(res.courses[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching trainer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs text-slate-400">Loading Instructor Workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#071A36] via-[#0B254E] to-[#041226] border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Trainer')}&background=0284C7&color=fff`
            }
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-glow-accent"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider border border-cyan-400/30">
              <Shield className="w-3 h-3" />
              <span>Certified Scalora Trainer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Welcome back, {user?.name}</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {user?.title || 'Lead Instructor & Cloud Architect'} • Instructing {courses.length} Active Tracks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link
            to="/messages"
            className="px-5 py-3 rounded-xl bg-[#0B1528] hover:bg-[#0F1D38] text-white text-xs font-bold border border-cyan-500/40 transition-all flex items-center gap-2 shadow-lg"
          >
            <Mail className="w-4 h-4 text-cyan-400" />
            <span>Student Inquiries</span>
            {stats && stats.unreadMessagesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                {stats.unreadMessagesCount}
              </span>
            )}
          </Link>

          <Link
            to="/community"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white text-xs font-black shadow-glow-accent hover:opacity-95 transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Community Feed</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B1528] p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats?.totalAssignedCourses || 0}</div>
            <div className="text-xs font-semibold text-slate-400">Assigned Tracks</div>
          </div>
        </div>

        <div className="bg-[#0B1528] p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats?.totalEnrolledStudents || 0}</div>
            <div className="text-xs font-semibold text-slate-400">Enrolled Students</div>
          </div>
        </div>

        <div className="bg-[#0B1528] p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats?.totalLessons || 0}</div>
            <div className="text-xs font-semibold text-slate-400">Classroom Lessons</div>
          </div>
        </div>

        <div className="bg-[#0B1528] p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats?.unreadMessagesCount || 0}</div>
            <div className="text-xs font-semibold text-slate-400">Unread Student DMs</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Assigned Courses & Student Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Assigned Courses List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>My Assigned Courses</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{courses.length} courses</span>
          </div>

          {courses.length === 0 ? (
            <div className="p-8 text-center bg-[#0B1528] rounded-3xl border border-white/10 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No courses assigned yet</h3>
              <p className="text-xs text-slate-400">The administrator will assign you to courses soon.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`p-5 rounded-3xl transition-all border ${
                      isSelected
                        ? 'bg-[#0B1E3B] border-cyan-400 shadow-glow-accent'
                        : 'bg-[#0B1528] border-white/10 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <img
                          src={
                            c.thumbnail ||
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                          }
                          alt={c.title}
                          className="w-16 h-16 rounded-2xl object-cover border border-cyan-500/30 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                            {c.category}
                          </span>
                          <h3 className="text-base font-bold text-white truncate mt-1">{c.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-cyan-400" />
                              {c.studentsCount} Students
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-purple-400" />
                              {c.lessonsCount} Lessons
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Course Shortcuts */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedCourseId(c.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          View Students
                        </button>

                        <Link
                          to={`/community?channel=${c.communityChannelId}`}
                          className="p-2 rounded-xl bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all border border-cyan-500/20"
                          title="Open Course Community"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>

                        <Link
                          to={`/learn/${c.slug}`}
                          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                          title="Preview Classroom"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Enrolled Students Roster for selected course */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Enrolled Students</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              {selectedCourse ? selectedCourse.studentsCount : 0} enrolled
            </span>
          </div>

          <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 space-y-4 shadow-xl">
            <div className="text-xs font-bold text-slate-300 pb-2 border-b border-white/10">
              {selectedCourse?.title || 'Selected Track'}
            </div>

            {!selectedCourse || selectedCourse.students.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 italic">
                No students enrolled in this course yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                {selectedCourse.students.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 rounded-2xl bg-[#091324] border border-white/5 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          student.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0284C7&color=fff`
                        }
                        alt={student.name}
                        className="w-8 h-8 rounded-xl object-cover border border-white/10 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{student.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{student.email}</div>
                      </div>
                    </div>

                    <Link
                      to={`/messages?student=${student.id}`}
                      className="p-2 rounded-xl bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold transition-all flex items-center gap-1 border border-cyan-500/20 flex-shrink-0"
                      title="Send Private Message"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
