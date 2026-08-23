import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Course, User } from '../../types';
import { Modal } from '../../components/Modal';
import {
  CreditCard,
  UserPlus,
  Search,
  CheckCircle2,
  Calendar,
  DollarSign,
  Loader2,
  GraduationCap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

interface EnrollmentRow {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  amount: number;
  paymentId?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  course: {
    id: string;
    title: string;
    price: number;
    category: string;
  };
}

export const AdminEnrollmentsPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Manual Enroll Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [enrRes, stdRes, crsRes] = await Promise.all([
        api.get<{ success: boolean; enrollments: EnrollmentRow[] }>('/enrollments/admin/all'),
        api.get<{ success: boolean; students: User[] }>('/admin/students'),
        api.get<{ success: boolean; courses: Course[] }>('/courses/admin/all'),
      ]);

      if (enrRes.success && Array.isArray(enrRes.enrollments)) {
        setEnrollments(enrRes.enrollments);
      }
      if (stdRes.success && Array.isArray(stdRes.students)) {
        setStudents(stdRes.students);
        if (stdRes.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(stdRes.students[0].id);
        }
      }
      if (crsRes.success && Array.isArray(crsRes.courses)) {
        setCourses(crsRes.courses);
        if (crsRes.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(crsRes.courses[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load enrollment data from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const targetStudentId = selectedStudentId || students[0]?.id;
    const targetCourseId = selectedCourseId || courses[0]?.id;

    if (!targetStudentId || !targetCourseId) {
      setFormError('Please select both a student and a course.');
      setFormLoading(false);
      return;
    }

    try {
      await api.post('/enrollments/admin/manual', {
        userId: targetStudentId,
        courseId: targetCourseId,
      });

      await fetchData();
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to enroll student on server.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter(
    (enr) =>
      enr.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      enr.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      enr.course?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-scalora-blue/20">
        <div>
          <h1 className="text-2xl font-black text-white">Enrollment & Transaction Ledger</h1>
          <p className="text-xs text-slate-400">
            Monitor course subscriptions, payment logs, and manually grant student access
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Manual Enroll Student</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, email, or course..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
        />
      </div>

      {/* Enrollments Table */}
      <div className="glass-panel rounded-2xl border border-scalora-blue/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-scalora-blue/20 bg-scalora-navy/50 text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Student Name</th>
                <th className="py-3.5 px-4 font-semibold">Email</th>
                <th className="py-3.5 px-4 font-semibold">Enrolled Course</th>
                <th className="py-3.5 px-4 font-semibold">Tuition Paid</th>
                <th className="py-3.5 px-4 font-semibold">Payment / Ref ID</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-scalora-blue/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-scalora-blue mb-2" />
                    Loading enrollments...
                  </td>
                </tr>
              ) : filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No enrollments found.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-scalora-blue/20 text-scalora-accent font-bold flex items-center justify-center text-xs">
                          {enr.user?.name?.[0] || 'U'}
                        </div>
                        <span>{enr.user?.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {enr.user?.email}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-200 truncate max-w-xs">
                      {enr.course?.title}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {enr.amount === 0 ? 'Free' : `$${enr.amount.toFixed(2)}`}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px] truncate max-w-[140px]">
                      {enr.paymentId || 'sandbox_instant'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(enr.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {enr.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Enroll Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Manually Enroll Student"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleManualEnroll} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          {/* Student Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Select Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#04152D]"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          {/* Course Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Select Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#04152D]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.price === 0 ? 'Free' : formatCurrency(c.price)})
                </option>
              ))}
            </select>
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
              disabled={formLoading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue flex items-center gap-2"
            >
              {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Enrollment</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
