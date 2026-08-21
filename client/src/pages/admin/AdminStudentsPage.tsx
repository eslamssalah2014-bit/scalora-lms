import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, StudentStats, StudentActivity } from '../../types';
import { Modal } from '../../components/Modal';
import {
  Users,
  Search,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  Loader2,
  Award,
  RefreshCw,
  AlertCircle,
  MoreVertical,
  Edit2,
  KeyRound,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Lock,
  ChevronRight,
  X,
  History,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

interface StudentData extends User {
  phone?: string | null;
  status?: string;
  lastLoginAt?: string | null;
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
      price?: number;
      category?: string;
    };
  }[];
}

interface StudentDetailData extends User {
  stats: StudentStats;
  enrollments: {
    id: string;
    status: string;
    amount: number;
    enrolledAt: string;
    progressPercent: number;
    completedCount: number;
    totalLessons: number;
    isCompleted: boolean;
    course: {
      id: string;
      title: string;
      slug: string;
      thumbnail?: string | null;
      instructor: string;
      category: string;
      level: string;
      modulesCount: number;
      quizzesCount: number;
    };
    payment?: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      provider: string;
      transactionId: string;
    } | null;
  }[];
  quizResults: {
    id: string;
    quizId: string;
    quizTitle: string;
    courseTitle: string;
    score: number;
    passed: boolean;
    createdAt: string;
  }[];
  certificates: {
    id: string;
    certificateNumber: string;
    courseTitle: string;
    courseId: string;
    instructorName: string;
    verificationUrl: string;
    createdAt: string;
  }[];
}

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals & Drawer State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [studentDetail, setStudentDetail] = useState<StudentDetailData | null>(null);
  const [drawerTab, setDrawerTab] = useState<'ENROLLMENTS' | 'ACTIVITY'>('ENROLLMENTS');
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
    bio: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset Password Modal State
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetTargetStudent, setResetTargetStudent] = useState<StudentData | null>(null);
  const [resetForm, setResetForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Actions Dropdown State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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

  // Open Details Drawer
  const handleOpenDrawer = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerTab('ENROLLMENTS');
    try {
      const res = await api.get<{ success: boolean; student: StudentDetailData }>(`/admin/students/${studentId}`);
      if (res.success) {
        setStudentDetail(res.student);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load student details', 'error');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Fetch Activity Log for Drawer
  const fetchStudentActivities = async (studentId: string) => {
    setActivitiesLoading(true);
    try {
      const res = await api.get<{ success: boolean; activities: StudentActivity[] }>(
        `/admin/students/${studentId}/activity`
      );
      if (res.success) {
        setActivities(res.activities);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load activity log', 'error');
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleTabChange = (tab: 'ENROLLMENTS' | 'ACTIVITY') => {
    setDrawerTab(tab);
    if (tab === 'ACTIVITY' && selectedStudentId) {
      fetchStudentActivities(selectedStudentId);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (student: StudentData) => {
    setEditForm({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      status: student.status || 'ACTIVE',
      bio: student.bio || '',
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const res = await api.put<{ success: boolean; message: string; student: StudentData }>(
        `/admin/students/${editForm.id}`,
        {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone || null,
          status: editForm.status,
          bio: editForm.bio || null,
        }
      );

      if (res.success) {
        showToast(res.message || 'Student profile updated successfully');
        setIsEditModalOpen(false);
        // Refresh local table
        fetchStudents();
        // If drawer is open for this student, update drawer state
        if (selectedStudentId === editForm.id) {
          handleOpenDrawer(editForm.id);
        }
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update student profile.');
    } finally {
      setEditLoading(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPasswordModal = (student: StudentData) => {
    setResetTargetStudent(student);
    setResetForm({ password: '', confirmPassword: '' });
    setResetError(null);
    setShowPassword(false);
    setIsResetPasswordOpen(true);
  };

  // Submit Reset Password Form
  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetStudent) return;

    if (resetForm.password.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }

    if (resetForm.password !== resetForm.confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const res = await api.post<{ success: boolean; message: string }>(
        `/admin/students/${resetTargetStudent.id}/reset-password`,
        {
          password: resetForm.password,
          confirmPassword: resetForm.confirmPassword,
        }
      );

      if (res.success) {
        showToast(res.message || 'Password has been reset successfully');
        setIsResetPasswordOpen(false);
        if (selectedStudentId === resetTargetStudent.id && drawerTab === 'ACTIVITY') {
          fetchStudentActivities(resetTargetStudent.id);
        }
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset student password.');
    } finally {
      setResetLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && (s.status === 'ACTIVE' || !s.status)) ||
      (statusFilter === 'INACTIVE' && s.status === 'INACTIVE');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 backdrop-blur-md'
                : 'bg-rose-950/90 text-rose-300 border-rose-500/40 backdrop-blur-md'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-scalora-blue/20">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white">Student Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-scalora-blue/20 border border-scalora-blue/30 text-scalora-blue font-bold text-xs">
              {students.length} Learners
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Edit learner profiles, reset credentials, inspect learning statistics, and track audit history
          </p>
        </div>

        <button
          onClick={fetchStudents}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-scalora-navy border border-scalora-blue/30 hover:border-scalora-blue text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-scalora-blue' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-scalora-navy/80 border border-scalora-blue/20 self-start sm:self-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-scalora-blue text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {status === 'ALL' ? 'All Status' : status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStudents}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-bold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Students Table */}
      <div className="glass-panel rounded-2xl border border-scalora-blue/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-scalora-blue/20 bg-scalora-navy/50 text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Student</th>
                <th className="py-3.5 px-4 font-semibold">Email & Phone</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Enrolled Tracks</th>
                <th className="py-3.5 px-4 font-semibold">Assessments</th>
                <th className="py-3.5 px-4 font-semibold">Joined Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-scalora-blue/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-scalora-blue mb-2" />
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    No students match your query.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                    {/* Student Name + Avatar */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      <button
                        onClick={() => handleOpenDrawer(s.id)}
                        className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={
                            s.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              s.name
                            )}&background=2D8CFF&color=fff`
                          }
                          alt={s.name}
                          className="w-9 h-9 rounded-xl object-cover border border-scalora-blue/30 shadow-sm"
                        />
                        <div>
                          <div className="font-bold text-white group-hover:text-scalora-blue transition-colors flex items-center gap-1.5">
                            <span>{s.name}</span>
                            <ChevronRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {s.id.slice(-6)}</span>
                        </div>
                      </button>
                    </td>

                    {/* Email & Phone */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-mono text-[11px] flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{s.email}</span>
                      </div>
                      {s.phone ? (
                        <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
                          <span>{s.phone}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">No phone set</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          s.status === 'INACTIVE'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.status === 'INACTIVE' ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                        {s.status === 'INACTIVE' ? 'Inactive' : 'Active'}
                      </span>
                    </td>

                    {/* Enrolled Courses */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {s.enrollments && s.enrollments.length > 0 ? (
                          s.enrollments.slice(0, 2).map((enr, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-scalora-navy text-slate-200 border border-scalora-blue/30 truncate max-w-[140px]"
                            >
                              {enr.course.title}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px]">0 tracks</span>
                        )}
                        {s.enrollments && s.enrollments.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-scalora-blue/20 text-scalora-blue border border-scalora-blue/30">
                            +{s.enrollments.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quiz Attempts */}
                    <td className="py-3.5 px-4 font-semibold text-scalora-accent">
                      {s._count?.quizResults ?? s._count?.quizAttempts ?? 0} assessments
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Recent'}
                    </td>

                    {/* Actions Dropdown / Menu */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === s.id && (
                          <div className="absolute right-0 mt-1 w-44 rounded-xl glass-panel bg-[#081B38] border border-scalora-blue/40 shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenDrawer(s.id);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:text-white hover:bg-scalora-blue/20 flex items-center gap-2 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-scalora-blue" />
                              <span>View Profile</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenEditModal(s);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:text-white hover:bg-scalora-blue/20 flex items-center gap-2 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Edit Student</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenResetPasswordModal(s);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:text-white hover:bg-scalora-blue/20 flex items-center gap-2 transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                              <span>Reset Password</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FEATURE 1: EDIT STUDENT MODAL                                  */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !editLoading && setIsEditModalOpen(false)}
        title="Edit Student Account"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              placeholder="e.g. Shahd Ashraf"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
              placeholder="e.g. student@gmail.com"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Email must be unique. Changing this will update the student's login credential.
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Phone Number (Optional)
            </label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
              placeholder="e.g. +20 100 123 4567"
            />
          </div>

          {/* Account Status */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Account Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, status: 'ACTIVE' })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  editForm.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg'
                    : 'bg-scalora-navy/50 border-scalora-blue/20 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Account</span>
              </button>

              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, status: 'INACTIVE' })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  editForm.status === 'INACTIVE'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg'
                    : 'bg-scalora-navy/50 border-scalora-blue/20 text-slate-400 hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Inactive / Disabled</span>
              </button>
            </div>
          </div>

          {/* Bio (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Bio / Administrative Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              placeholder="Notes on student progress or background..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-scalora-blue/20">
            <button
              type="button"
              disabled={editLoading}
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-5 py-2.5 rounded-xl bg-scalora-blue hover:bg-scalora-accent text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-scalora-blue/30 active:scale-95 transition-all"
            >
              {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* FEATURE 2: RESET PASSWORD MODAL                                */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isResetPasswordOpen}
        onClose={() => !resetLoading && setIsResetPasswordOpen(false)}
        title={`Reset Password for ${resetTargetStudent?.name || 'Student'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveResetPassword} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              The student's password will be encrypted using bcrypt. Make sure to share the new credential securely.
            </span>
          </div>

          {resetError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={resetForm.password}
                onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl glass-input text-xs font-mono"
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={resetForm.confirmPassword}
              onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
              placeholder="Re-enter password"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-scalora-blue/20">
            <button
              type="button"
              disabled={resetLoading}
              onClick={() => setIsResetPasswordOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetLoading}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            >
              {resetLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Reset Password</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* FEATURES 3, 4, 5: STUDENT DETAILS & AUDIT DRAWER               */}
      {/* ------------------------------------------------------------- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-[#061833] border-l border-scalora-blue/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-scalora-blue/20 bg-scalora-navy/80 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-scalora-blue/20 border border-scalora-blue/30 flex items-center justify-center text-scalora-blue">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Student Profile & Progress</h2>
                    <p className="text-[11px] text-slate-400">Complete learning metrics, subscriptions, and audit log</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {drawerLoading ? (
                  <div className="py-24 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-scalora-blue mb-3" />
                    Loading student records...
                  </div>
                ) : studentDetail ? (
                  <>
                    {/* Student Info Card */}
                    <div className="p-5 rounded-2xl glass-panel border border-scalora-blue/30 bg-gradient-to-r from-scalora-navy/90 to-[#0A264F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            studentDetail.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              studentDetail.name
                            )}&background=2D8CFF&color=fff`
                          }
                          alt={studentDetail.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-scalora-blue/50 shadow-md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white">{studentDetail.name}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                studentDetail.status === 'INACTIVE'
                                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {studentDetail.status === 'INACTIVE' ? 'Inactive' : 'Active'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 font-mono mt-0.5 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{studentDetail.email}</span>
                          </div>
                          {studentDetail.phone && (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <Phone className="w-2.5 h-2.5 text-slate-500" />
                              <span>{studentDetail.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenEditModal(studentDetail)}
                          className="px-3 py-1.5 rounded-xl bg-scalora-blue/20 hover:bg-scalora-blue/30 text-scalora-blue border border-scalora-blue/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleOpenResetPasswordModal(studentDetail)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Password</span>
                        </button>
                      </div>
                    </div>

                    {/* Learning Statistics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl glass-panel border border-scalora-blue/20 bg-scalora-navy/40">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Tracks</span>
                          <BookOpen className="w-3.5 h-3.5 text-scalora-blue" />
                        </div>
                        <div className="text-xl font-black text-white">{studentDetail.stats.totalEnrollments}</div>
                        <span className="text-[10px] text-slate-400">
                          {studentDetail.stats.activeCourses} active subscriptions
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl glass-panel border border-scalora-blue/20 bg-scalora-navy/40">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-xl font-black text-white">{studentDetail.stats.completedCourses}</div>
                        <span className="text-[10px] text-slate-400">100% course completions</span>
                      </div>

                      <div className="p-3.5 rounded-2xl glass-panel border border-scalora-blue/20 bg-scalora-navy/40">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Certificates</span>
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div className="text-xl font-black text-white">{studentDetail.stats.certificatesEarned}</div>
                        <span className="text-[10px] text-slate-400">Verified credentials</span>
                      </div>

                      <div className="p-3.5 rounded-2xl glass-panel border border-scalora-blue/20 bg-scalora-navy/40">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Quizzes</span>
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="text-xl font-black text-white">{studentDetail.stats.quizAttempts}</div>
                        <span className="text-[10px] text-slate-400">Submitted attempts</span>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-scalora-blue/20 pb-1">
                      <button
                        onClick={() => handleTabChange('ENROLLMENTS')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                          drawerTab === 'ENROLLMENTS'
                            ? 'bg-scalora-blue text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Enrolled Tracks ({studentDetail.enrollments.length})</span>
                      </button>

                      <button
                        onClick={() => handleTabChange('ACTIVITY')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                          drawerTab === 'ACTIVITY'
                            ? 'bg-scalora-blue text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Activity & Audit Log</span>
                      </button>
                    </div>

                    {/* TAB 1: ENROLLED COURSES */}
                    {drawerTab === 'ENROLLMENTS' && (
                      <div className="space-y-3">
                        {studentDetail.enrollments.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 glass-panel rounded-2xl border border-scalora-blue/20 p-6">
                            <BookOpen className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                            <p className="font-bold text-white text-xs">No active track enrollments</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              This learner has not enrolled in any course track yet.
                            </p>
                          </div>
                        ) : (
                          studentDetail.enrollments.map((enr) => (
                            <div
                              key={enr.id}
                              className="p-4 rounded-2xl glass-panel border border-scalora-blue/20 bg-scalora-navy/30 hover:border-scalora-blue/40 transition-all space-y-3"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  {enr.course.thumbnail ? (
                                    <img
                                      src={enr.course.thumbnail}
                                      alt={enr.course.title}
                                      className="w-12 h-12 rounded-xl object-cover border border-scalora-blue/30 flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-scalora-navy border border-scalora-blue/30 flex items-center justify-center text-scalora-blue flex-shrink-0">
                                      <BookOpen className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-bold text-white text-xs">{enr.course.title}</h4>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                      <span className="text-scalora-accent font-semibold">{enr.course.category}</span>
                                      <span>•</span>
                                      <span>{enr.course.modulesCount} modules</span>
                                      <span>•</span>
                                      <span>{enr.totalLessons} lessons</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                      enr.isCompleted
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : 'bg-scalora-blue/10 text-scalora-blue border-scalora-blue/30'
                                    }`}
                                  >
                                    {enr.isCompleted ? 'COMPLETED' : enr.status}
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                                    Enrolled: {new Date(enr.enrolledAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                                  <span className="text-slate-400">
                                    {enr.completedCount} of {enr.totalLessons} lessons finished
                                  </span>
                                  <span className="text-white font-bold">{enr.progressPercent}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-scalora-blue/20">
                                  <div
                                    className="h-full bg-gradient-to-r from-scalora-blue to-scalora-accent rounded-full transition-all duration-500"
                                    style={{ width: `${enr.progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* TAB 2: ACTIVITY & AUDIT LOG */}
                    {drawerTab === 'ACTIVITY' && (
                      <div className="space-y-3">
                        {activitiesLoading ? (
                          <div className="py-12 text-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-scalora-blue mb-2" />
                            Loading activity timeline...
                          </div>
                        ) : activities.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 glass-panel rounded-2xl border border-scalora-blue/20 p-6">
                            <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                            <p className="font-bold text-white text-xs">No activity records found</p>
                          </div>
                        ) : (
                          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-scalora-blue/20">
                            {activities.map((act) => (
                              <div key={act.id} className="relative group">
                                {/* Timeline Dot */}
                                <div
                                  className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                                    act.type === 'PASSWORD_RESET'
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                                      : act.type === 'STUDENT_UPDATED'
                                      ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                                      : act.type === 'CERTIFICATE_ISSUED'
                                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                                      : act.type === 'QUIZ_SUBMISSION'
                                      ? 'bg-purple-500/20 border-purple-400 text-purple-400'
                                      : 'bg-scalora-navy border-scalora-blue text-scalora-blue'
                                  }`}
                                >
                                  {act.type === 'PASSWORD_RESET' && <KeyRound className="w-2.5 h-2.5" />}
                                  {act.type === 'STUDENT_UPDATED' && <UserCheck className="w-2.5 h-2.5" />}
                                  {act.type === 'CERTIFICATE_ISSUED' && <Award className="w-2.5 h-2.5" />}
                                  {act.type === 'QUIZ_SUBMISSION' && <Sparkles className="w-2.5 h-2.5" />}
                                  {act.type === 'ENROLLMENT' && <BookOpen className="w-2.5 h-2.5" />}
                                </div>

                                <div className="p-3.5 rounded-2xl glass-panel border border-scalora-blue/20 bg-scalora-navy/30">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-white text-xs">{act.title}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(act.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 mt-1">{act.description}</p>
                                  {act.actor && (
                                    <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                                      <span>Actor:</span>
                                      <span className="text-slate-400 font-semibold">{act.actor}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
