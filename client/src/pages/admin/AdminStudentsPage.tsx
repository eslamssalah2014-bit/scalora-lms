import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User } from '../../types';
import { Users, Search, BookOpen, Calendar, Mail, Loader2, Award, RefreshCw, AlertCircle } from 'lucide-react';

interface StudentData extends User {
  _count?: {
    enrollments: number;
    quizResults?: number;
    quizAttempts?: number;
    certificates?: number;
  };
  enrollments?: {
    course: {
      id: string;
      title: string;
    };
  }[];
}

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; students: StudentData[] }>('/admin/students');
      if (res.success && Array.isArray(res.students)) {
        setStudents(res.students);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load student directory from server.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-scalora-blue/20">
        <div>
          <h1 className="text-2xl font-black text-white">Student Directory</h1>
          <p className="text-xs text-slate-400">
            Registered learners, active track subscriptions, and assessment participation
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter students by name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
        />
      </div>

      {/* Students Table */}
      <div className="glass-panel rounded-2xl border border-scalora-blue/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-scalora-blue/20 bg-scalora-navy/50 text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Student</th>
                <th className="py-3.5 px-4 font-semibold">Email Address</th>
                <th className="py-3.5 px-4 font-semibold">Enrolled Tracks</th>
                <th className="py-3.5 px-4 font-semibold">Quiz Submissions</th>
                <th className="py-3.5 px-4 font-semibold text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-scalora-blue/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-scalora-blue mb-2" />
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    {/* Student Name + Avatar */}
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            s.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              s.name
                            )}&background=2D8CFF&color=fff`
                          }
                          alt={s.name}
                          className="w-8 h-8 rounded-lg object-cover border border-scalora-blue/30"
                        />
                        <span className="font-bold text-white">{s.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 text-slate-300 font-mono text-[11px]">
                      {s.email}
                    </td>

                    {/* Enrolled Courses */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {s.enrollments && s.enrollments.length > 0 ? (
                          s.enrollments.map((enr, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-scalora-navy text-slate-200 border border-scalora-blue/30 truncate max-w-[160px]"
                            >
                              {enr.course.title}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px]">None</span>
                        )}
                      </div>
                    </td>

                    {/* Quiz Attempts */}
                    <td className="py-4 px-4 font-semibold text-scalora-accent">
                      {s._count?.quizResults ?? s._count?.quizAttempts ?? 0} assessments
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-4 text-right text-slate-400">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
