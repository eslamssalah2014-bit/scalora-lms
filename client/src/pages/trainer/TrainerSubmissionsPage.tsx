import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Award,
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileEdit,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface Submission {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  fullDescription: string | null;
  thumbnail: string | null;
  level: string;
  price: number;
  currency: string;
  numberOfSessions: number;
  totalDurationMinutes: number;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  submissionNotes: string | null;
  adminFeedback: string | null;
  rejectionReason: string | null;
  suggestedImprovements: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  convertedCourseId: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  track?: { name: string; slug: string };
  sessions: any[];
}

interface SubmissionStats {
  all: number;
  draft: number;
  pending: number;
  approved: number;
  needsRevision: number;
  rejected: number;
}

export const TrainerSubmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<SubmissionStats>({
    all: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    needsRevision: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubmissions = async (statusTab: string) => {
    try {
      setLoading(true);
      const res = await api.get<{
        success: boolean;
        data: { submissions: Submission[]; stats: SubmissionStats };
      }>(`/trainer-submissions/my-submissions?status=${statusTab}`);

      if (res.success && res.data) {
        setSubmissions(res.data.submissions);
        setStats(res.data.stats);
      }
    } catch (err: any) {
      console.error('Error fetching trainer submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(activeTab);
  }, [activeTab]);

  const handleDeleteDraft = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove the draft "${title}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await api.delete<{ success: boolean; message: string }>(`/trainer-submissions/${id}`);
      if (res.success) {
        fetchSubmissions(activeTab);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete draft');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: Submission['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved & Live</span>
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review (48h SLA)</span>
          </span>
        );
      case 'NEEDS_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
            <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Needs Revision</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Not Approved</span>
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
            <FileEdit className="w-3.5 h-3.5 text-slate-500" />
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Trainer Course Submissions</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Submissions Workspace</h1>
              <p className="text-slate-600 text-sm mt-1">
                Track review progress, respond to revision feedback, and manage your course drafts.
              </p>
            </div>

            <Link
              to="/become-trainer"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Course</span>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
            {[
              { label: 'All Courses', count: stats.all, tab: 'ALL', color: 'text-slate-900' },
              { label: 'Pending Review', count: stats.pending, tab: 'PENDING_REVIEW', color: 'text-amber-600' },
              { label: 'Approved & Live', count: stats.approved, tab: 'APPROVED', color: 'text-emerald-600' },
              { label: 'Needs Revision', count: stats.needsRevision, tab: 'NEEDS_REVISION', color: 'text-purple-600' },
              { label: 'Drafts', count: stats.draft, tab: 'DRAFT', color: 'text-slate-600' },
            ].map((s) => (
              <button
                key={s.tab}
                type="button"
                onClick={() => setActiveTab(s.tab)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  activeTab === s.tab
                    ? 'bg-blue-50/80 border-blue-600 shadow-sm ring-1 ring-blue-600/30'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-semibold text-slate-500 block truncate">{s.label}</span>
                <span className={`text-2xl font-black ${s.color} block mt-0.5`}>{s.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 font-semibold text-sm">Loading your submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-5 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">No Submissions Found</h3>
              <p className="text-slate-600 text-sm mt-1">
                {activeTab === 'ALL'
                  ? 'You have not submitted any courses yet. Get started and share your knowledge with thousands of learners!'
                  : `No courses currently in "${activeTab}" status.`}
              </p>
            </div>
            <Link
              to="/become-trainer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit Your First Course</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {sub.thumbnail ? (
                      <img
                        src={sub.thumbnail}
                        alt={sub.title}
                        className="w-20 h-16 sm:w-28 sm:h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-16 sm:w-28 sm:h-20 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 border border-slate-200">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(sub.status)}
                        {sub.track && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {sub.track.name}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                          {sub.sessions.length} {sub.sessions.length === 1 ? 'Session' : 'Sessions'} • {sub.level}
                        </span>
                      </div>

                      <h3 className="font-black text-slate-900 text-lg sm:text-xl truncate">{sub.title}</h3>
                      {sub.shortDescription && (
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{sub.shortDescription}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-start flex-shrink-0">
                    {sub.status === 'APPROVED' && sub.convertedCourseId ? (
                      <Link
                        to={`/courses/${sub.slug}`}
                        className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-all flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Live Course</span>
                      </Link>
                    ) : sub.status === 'NEEDS_REVISION' || sub.status === 'DRAFT' ? (
                      <>
                        <Link
                          to={`/become-trainer?edit=${sub.id}`}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>{sub.status === 'NEEDS_REVISION' ? 'Revise & Resubmit' : 'Edit Draft'}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(sub.id, sub.title)}
                          disabled={deletingId === sub.id}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/become-trainer?edit=${sub.id}`}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Revision / Feedback Notice Box */}
                {sub.status === 'NEEDS_REVISION' && sub.adminFeedback && (
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs sm:text-sm space-y-2">
                    <div className="font-bold flex items-center gap-2 text-purple-950">
                      <AlertCircle className="w-4 h-4 text-purple-700" />
                      <span>Reviewer Feedback — Action Required</span>
                    </div>
                    <p className="text-purple-800 leading-relaxed whitespace-pre-wrap">{sub.adminFeedback}</p>
                    {sub.suggestedImprovements && (
                      <div className="pt-2 border-t border-purple-200 text-xs text-purple-700">
                        <strong>Suggested Improvements:</strong> {sub.suggestedImprovements}
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Notice Box */}
                {sub.status === 'REJECTED' && sub.rejectionReason && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm space-y-2">
                    <div className="font-bold flex items-center gap-2 text-rose-950">
                      <XCircle className="w-4 h-4 text-rose-700" />
                      <span>Submission Not Approved</span>
                    </div>
                    <p className="text-rose-800 leading-relaxed whitespace-pre-wrap">{sub.rejectionReason}</p>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Last updated: {new Date(sub.updatedAt).toLocaleDateString()}</span>
                  {sub.price > 0 ? (
                    <span className="font-bold text-slate-700">${sub.price.toFixed(2)} USD</span>
                  ) : (
                    <span className="font-bold text-emerald-600">Free Course</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
