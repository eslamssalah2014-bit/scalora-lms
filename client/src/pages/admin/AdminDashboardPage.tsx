import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { AdminStats } from '../../types';
import {
  BookOpen,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Award,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

interface DashboardData {
  stats: AdminStats;
  categoryDistribution: { category: string; count: number }[];
  topCourses: any[];
  recentEnrollments: any[];
}

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{
        success: boolean;
        stats: AdminStats;
        categoryDistribution: { category: string; count: number }[];
        topCourses: any[];
        recentEnrollments: any[];
      }>('/admin/stats');

      if (res.success && res.stats) {
        setData(res);
      } else {
        setError('Failed to retrieve live platform statistics.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server for statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="h-40 rounded-3xl glass-card animate-pulse bg-scalora-navy/40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 rounded-2xl glass-card animate-pulse bg-scalora-navy/40" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, categoryDistribution, topCourses, recentEnrollments } = data;

  return (
    <div className="space-y-8">
      {/* 1. Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-scalora-blue/20">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-scalora-accent mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Executive Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">LMS Analytics & Operations</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/courses"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Course</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Courses</span>
            <BookOpen className="w-4 h-4 text-scalora-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalCourses}</div>
          <p className="text-[11px] text-emerald-400 font-semibold">
            {stats.publishedCoursesCount} Published
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalStudents}</div>
          <p className="text-[11px] text-slate-400">Registered learners</p>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrollments</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-scalora-accent">{stats.totalEnrollments}</div>
          <p className="text-[11px] text-slate-400">Course seat allocations</p>
        </div>

        {/* Revenue (EGP) */}
        <div className="glass-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue (EGP)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              ج.م
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {formatCurrency(stats.totalRevenue, { showDecimals: true })}
          </div>
          <p className="text-[11px] text-slate-400">Gross processed volume</p>
        </div>
      </div>

      {/* 3. Mid Grid: Categories (1/3) & Top Courses (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-scalora-blue/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-scalora-accent" />
              <span>Category Distribution</span>
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {(categoryDistribution || []).map((item: any) => (
              <div key={item.category || item.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{item.category || item.name}</span>
                  <span className="text-scalora-accent">{item.count} courses</span>
                </div>
                <div className="w-full bg-scalora-navy/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-scalora-blue to-scalora-accent rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((item.count / (stats.totalCourses || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-scalora-blue/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-scalora-blue" />
              <span>Top Enrolled Courses</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-scalora-blue/15 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Course Title</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Price (EGP)</th>
                  <th className="pb-3 font-semibold text-right">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scalora-blue/10">
                {(topCourses || []).map((c: any) => {
                  const p = typeof c.price === 'number' ? c.price : 0;
                  const stdCount = c.enrollmentsCount ?? c.studentsCount ?? 0;
                  return (
                    <tr key={c.id || c.title} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-bold text-white max-w-xs truncate">{c.title}</td>
                      <td className="py-3 text-slate-300">{c.category || 'General'}</td>
                      <td className="py-3 font-semibold text-white">
                        {p === 0 ? 'Free' : formatCurrency(p)}
                      </td>
                      <td className="py-3 text-right font-black text-scalora-accent">{stdCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Recent Enrollments Table */}
      <div className="glass-panel p-6 rounded-2xl border border-scalora-blue/20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-scalora-accent" />
            <span>Recent Student Enrollments</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-scalora-blue/15 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Student</th>
                <th className="pb-3 font-semibold">Course</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-scalora-blue/10">
              {(recentEnrollments || []).map((enr: any) => {
                const amt = typeof enr.amount === 'number' ? enr.amount : (enr.course?.price || 0);
                const userName = enr.user?.name || 'Student Learner';
                const dateStr = enr.createdAt || enr.enrolledAt || new Date().toISOString();
                return (
                  <tr key={enr.id || Math.random()} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            enr.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2D8CFF&color=fff`
                          }
                          alt={userName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{userName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300 truncate max-w-xs">{enr.course?.title || 'Enrolled Course'}</td>
                    <td className="py-3 font-bold text-white">
                      {amt === 0 ? 'Free' : formatCurrency(amt)}
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(dateStr).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {enr.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
