import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import {
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  RefreshCw,
  Layers,
  Settings,
  Shield,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  PlayCircle,
  ChevronRight,
  User,
  Phone,
  Mail,
  Linkedin,
  Calendar,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Minus,
  Table as TableIcon,
  Palette,
  Code2,
  Maximize2,
  Type,
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
  trainer: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    trainerProfile?: {
      fullName: string;
      email: string;
      mobile: string;
      country: string | null;
      linkedin: string | null;
      yearsExperience: number;
      professionalTitle: string | null;
      bio: string | null;
    } | null;
    policyAcceptances?: any[];
  };
  track?: { id: string; name: string; slug: string } | null;
  sessions: any[];
}

interface Track {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  _count?: { submissions: number };
}

interface Policy {
  id: string;
  title: string;
  content: string;
  version: number;
  isActive: boolean;
  publishedAt: string | null;
  lastUpdatedBy: string | null;
  revisions?: Array<{
    id: string;
    version: number;
    title: string;
    content: string;
    note: string | null;
    author: string | null;
    createdAt: string;
  }>;
  _count?: { acceptances: number };
}

function isArabicText(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
}

export const AdminTrainerSubmissionsPage: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'SUBMISSIONS' | 'TRACKS' | 'POLICY'>('SUBMISSIONS');

  // Submissions State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    needsRevision: 0,
    rejected: 0,
    draft: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackFilter, setTrackFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Submission Modal for Review
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Reject / Revision Prompt state
  const [rejectPromptOpen, setRejectPromptOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [revisionPromptOpen, setRevisionPromptOpen] = useState<boolean>(false);
  const [revisionFeedback, setRevisionFeedback] = useState<string>('');
  const [suggestedImprovements, setSuggestedImprovements] = useState<string>('');

  // Tracks Management State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackModalOpen, setTrackModalOpen] = useState<boolean>(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [trackFormName, setTrackFormName] = useState<string>('');
  const [trackFormSlug, setTrackFormSlug] = useState<string>('');
  const [trackFormDesc, setTrackFormDesc] = useState<string>('');
  const [trackFormIcon, setTrackFormIcon] = useState<string>('Briefcase');
  const [trackFormOrder, setTrackFormOrder] = useState<number>(1);
  const [trackFormActive, setTrackFormActive] = useState<boolean>(true);

  // Policy Rich Editor State
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policyTitle, setPolicyTitle] = useState<string>('');
  const [policyContent, setPolicyContent] = useState<string>('');
  const [policyNote, setPolicyNote] = useState<string>('');
  const [policySaving, setPolicySaving] = useState<boolean>(false);
  const [policySuccess, setPolicySuccess] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'VISUAL' | 'HTML' | 'PREVIEW'>('VISUAL');
  const [editorDirection, setEditorDirection] = useState<'rtl' | 'ltr'>('rtl');
  const editorRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Submissions & Stats
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const [subsRes, statsRes] = await Promise.all([
        api.get<{ success: boolean; data: { submissions: Submission[] } }>(
          `/admin/trainer-submissions?status=${statusFilter}&search=${encodeURIComponent(
            searchQuery
          )}&trackId=${trackFilter}`
        ),
        api.get<{ success: boolean; data: any }>('/admin/trainer-submissions/stats'),
      ]);

      if (subsRes.success && subsRes.data?.submissions) {
        setSubmissions(subsRes.data.submissions);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching admin submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Tracks
  const fetchTracks = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Track[] }>('/admin/trainer-submissions/tracks');
      if (res.success && res.data) {
        setTracks(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching admin tracks:', err);
    }
  };

  // 3. Fetch Policy
  const fetchPolicy = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Policy }>('/admin/trainer-submissions/policy');
      if (res.success && res.data) {
        setPolicy(res.data);
        setPolicyTitle(res.data.title || 'Scalora Trainer & Academic Standards Policy');
        setPolicyContent(res.data.content || '');
        if (editorRef.current) {
          editorRef.current.innerHTML = res.data.content || '';
        }
        if (isArabicText(res.data.content || '')) {
          setEditorDirection('rtl');
        }
      }
    } catch (err: any) {
      console.error('Error fetching admin policy:', err);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'SUBMISSIONS') {
      fetchSubmissions();
    } else if (activeMainTab === 'TRACKS') {
      fetchTracks();
    } else if (activeMainTab === 'POLICY') {
      fetchPolicy();
    }
  }, [activeMainTab, statusFilter, trackFilter]);

  // Sync content with editorRef when switching to VISUAL mode
  useEffect(() => {
    if (editorMode === 'VISUAL' && editorRef.current) {
      editorRef.current.innerHTML = policyContent;
    }
  }, [editorMode]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeMainTab === 'SUBMISSIONS') {
        fetchSubmissions();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute Rich Text Command
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setPolicyContent(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter URL (e.g. https://example.com):', 'https://');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table style="width:100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #334155;">
        <thead>
          <tr style="background: rgba(37,99,235,0.15); text-align: ${editorDirection === 'rtl' ? 'right' : 'left'};">
            <th style="border: 1px solid #334155; padding: 10px; font-weight: bold;">Standard / المعيار</th>
            <th style="border: 1px solid #334155; padding: 10px; font-weight: bold;">Requirement / المتطلب</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #334155; padding: 10px;">Audio / Video Quality</td>
            <td style="border: 1px solid #334155; padding: 10px;">1080p HD, Crystal Clear Audio</td>
          </tr>
          <tr>
            <td style="border: 1px solid #334155; padding: 10px;">Practical Outcomes</td>
            <td style="border: 1px solid #334155; padding: 10px;">Real-world blueprints and hands-on deliverables</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    execCmd('insertHTML', tableHtml);
  };

  // Open Full Review Modal
  const openReviewModal = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await api.get<{ success: boolean; data: Submission }>(`/admin/trainer-submissions/${id}`);
      if (res.success && res.data) {
        setSelectedSub(res.data);
        setReviewModalOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to fetch submission details');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Course
  const handleApprove = async (id: string) => {
    if (!window.confirm('Approve this course and convert it into a live published course in the Scalora catalog?')) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post<{ success: boolean; message: string }>(
        `/admin/trainer-submissions/${id}/approve`,
        {}
      );
      if (res.success) {
        alert(res.message);
        setReviewModalOpen(false);
        fetchSubmissions();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve course');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Course
  const handleReject = async () => {
    if (!selectedSub || !rejectionReason.trim()) {
      alert('Please specify a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post<{ success: boolean; message: string }>(
        `/admin/trainer-submissions/${selectedSub.id}/reject`,
        {
          rejectionReason: rejectionReason.trim(),
        }
      );
      if (res.success) {
        alert('Course rejected successfully');
        setRejectPromptOpen(false);
        setReviewModalOpen(false);
        setRejectionReason('');
        fetchSubmissions();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject submission');
    } finally {
      setActionLoading(false);
    }
  };

  // Request Revision
  const handleRequestRevision = async () => {
    if (!selectedSub || !revisionFeedback.trim()) {
      alert('Please specify the revision feedback');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post<{ success: boolean; message: string }>(
        `/admin/trainer-submissions/${selectedSub.id}/request-revision`,
        {
          adminFeedback: revisionFeedback.trim(),
          suggestedImprovements: suggestedImprovements.trim(),
        }
      );
      if (res.success) {
        alert('Revision requested from trainer');
        setRevisionPromptOpen(false);
        setReviewModalOpen(false);
        setRevisionFeedback('');
        setSuggestedImprovements('');
        fetchSubmissions();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to request revision');
    } finally {
      setActionLoading(false);
    }
  };

  // Track Form Save
  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackFormName.trim()) return;

    try {
      if (editingTrack) {
        await api.put(`/admin/trainer-submissions/tracks/${editingTrack.id}`, {
          name: trackFormName.trim(),
          slug: trackFormSlug.trim() || undefined,
          description: trackFormDesc.trim(),
          icon: trackFormIcon,
          order: trackFormOrder,
          isActive: trackFormActive,
        });
      } else {
        await api.post('/admin/trainer-submissions/tracks', {
          name: trackFormName.trim(),
          slug: trackFormSlug.trim() || undefined,
          description: trackFormDesc.trim(),
          icon: trackFormIcon,
          order: trackFormOrder,
          isActive: trackFormActive,
        });
      }
      setTrackModalOpen(false);
      setEditingTrack(null);
      fetchTracks();
    } catch (err: any) {
      alert(err.message || 'Failed to save track');
    }
  };

  // Policy Save
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalContent = editorMode === 'VISUAL' && editorRef.current ? editorRef.current.innerHTML : policyContent;
    if (!finalContent.trim()) return;

    try {
      setPolicySaving(true);
      const res = await api.put<{ success: boolean; message: string; data: Policy }>(
        '/admin/trainer-submissions/policy',
        {
          title: policyTitle.trim(),
          content: finalContent.trim(),
          note: policyNote.trim() || undefined,
        }
      );
      if (res.success && res.data) {
        setPolicy(res.data);
        setPolicySuccess(`Policy successfully published to Version ${res.data.version}!`);
        setPolicyNote('');
        setTimeout(() => setPolicySuccess(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update policy');
    } finally {
      setPolicySaving(false);
    }
  };

  const getStatusBadge = (status: Submission['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Approved & Live</span>
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Review (48h SLA)</span>
          </span>
        );
      case 'NEEDS_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>Needs Revision</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Rejected</span>
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            <span>Faculty & Self-Service Submissions</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Trainer Submissions Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review external course submissions, inspect curriculum video streams, and manage teaching tracks & academic policy.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center p-1.5 bg-[#04152D] rounded-2xl border border-scalora-blue/20">
          {[
            { id: 'SUBMISSIONS', label: 'Course Submissions', icon: BookOpen },
            { id: 'TRACKS', label: 'Teaching Tracks', icon: Layers },
            { id: 'POLICY', label: 'Trainer Policy', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMainTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: SUBMISSIONS REVIEW */}
      {/* ==================================================================== */}
      {activeMainTab === 'SUBMISSIONS' && (
        <div className="space-y-6">
          {/* Stats Cluster */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {[
              { label: 'All Submissions', count: stats.all, tab: 'ALL', color: 'text-white' },
              { label: 'Pending Review (48h)', count: stats.pending, tab: 'PENDING_REVIEW', color: 'text-amber-400' },
              { label: 'Approved & Live', count: stats.approved, tab: 'APPROVED', color: 'text-emerald-400' },
              { label: 'Needs Revision', count: stats.needsRevision, tab: 'NEEDS_REVISION', color: 'text-purple-400' },
              { label: 'Rejected', count: stats.rejected, tab: 'REJECTED', color: 'text-rose-400' },
              { label: 'Drafts', count: stats.draft, tab: 'DRAFT', color: 'text-slate-400' },
            ].map((s) => (
              <button
                key={s.tab}
                type="button"
                onClick={() => setStatusFilter(s.tab)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  statusFilter === s.tab
                    ? 'bg-blue-600/20 border-blue-500 shadow-glow-blue ring-1 ring-blue-500/40'
                    : 'bg-[#04152D] border-scalora-blue/15 hover:border-scalora-blue/30'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-400 block truncate">{s.label}</span>
                <span className={`text-2xl font-black ${s.color} block mt-0.5`}>{s.count}</span>
              </button>
            ))}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#04152D] border border-scalora-blue/15">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, trainer name, email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-white placeholder-slate-500 text-xs font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-slate-300 text-xs font-semibold focus:border-blue-500"
              >
                <option value="ALL">All Teaching Tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={fetchSubmissions}
                className="p-2.5 rounded-xl bg-scalora-navy hover:bg-scalora-navy/80 text-slate-300 hover:text-white border border-scalora-blue/20 transition-all"
                title="Refresh List"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Submissions List */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 font-semibold text-sm">Loading course submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#04152D] border border-scalora-blue/15 text-center space-y-3 max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Submissions Found</h3>
              <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 sm:p-6 rounded-2xl bg-[#04152D] border border-scalora-blue/15 hover:border-scalora-blue/30 transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-cyan-300 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-7 h-7" />
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(sub.status)}
                          {sub.track && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                              {sub.track.name}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-medium">
                            {sub.sessions.length} {sub.sessions.length === 1 ? 'Session' : 'Sessions'} • {sub.level}
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base sm:text-lg truncate">{sub.title}</h3>

                        {/* Trainer Info */}
                        <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                          <span className="flex items-center gap-1.5 font-semibold text-white">
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            <span>{sub.trainer.name}</span>
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{sub.trainer.email}</span>
                          </span>
                          {sub.trainer.trainerProfile?.mobile && (
                            <span className="flex items-center gap-1 text-slate-400 font-mono">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{sub.trainer.trainerProfile.mobile}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2.5 flex-shrink-0 self-end lg:self-center">
                      <button
                        type="button"
                        onClick={() => openReviewModal(sub.id)}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-glow-blue transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Review</span>
                      </button>

                      {sub.status === 'PENDING_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(sub.id)}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Quick Approve</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: TEACHING TRACKS MANAGEMENT */}
      {/* ==================================================================== */}
      {activeMainTab === 'TRACKS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dynamic Teaching Tracks</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage subject categories available for trainer course submissions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTrack(null);
                setTrackFormName('');
                setTrackFormSlug('');
                setTrackFormDesc('');
                setTrackFormIcon('Briefcase');
                setTrackFormOrder(tracks.length + 1);
                setTrackFormActive(true);
                setTrackModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-glow-blue transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Track</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="p-5 rounded-2xl bg-[#04152D] border border-scalora-blue/15 hover:border-scalora-blue/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center">
                      #{track.order}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        track.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {track.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">{track.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">slug: {track.slug}</p>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {track.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-scalora-blue/15 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {track._count?.submissions || 0} Submissions
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTrack(track);
                      setTrackFormName(track.name);
                      setTrackFormSlug(track.slug);
                      setTrackFormDesc(track.description || '');
                      setTrackFormIcon(track.icon || 'Briefcase');
                      setTrackFormOrder(track.order);
                      setTrackFormActive(track.isActive);
                      setTrackModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-scalora-navy hover:bg-blue-600/30 text-cyan-300 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TRAINER POLICY RICH TEXT EDITOR (Notion / Medium Style) */}
      {/* ==================================================================== */}
      {activeMainTab === 'POLICY' && (
        <div className="space-y-6">
          {policySuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{policySuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rich Editor Main Area */}
            <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-scalora-blue/15 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white">Trainer Policy & Academic Standards</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Currently published: <strong className="text-cyan-300">Version {policy?.version || 1}.0</strong>
                  </p>
                </div>

                {/* Editor Mode Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[#020C1B] rounded-xl border border-scalora-blue/20">
                  <button
                    type="button"
                    onClick={() => setEditorMode('VISUAL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      editorMode === 'VISUAL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Visual Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editorRef.current) setPolicyContent(editorRef.current.innerHTML);
                      setEditorMode('HTML');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      editorMode === 'HTML' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>HTML Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editorRef.current) setPolicyContent(editorRef.current.innerHTML);
                      setEditorMode('PREVIEW');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      editorMode === 'PREVIEW' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Student View</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSavePolicy} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Policy Title
                  </label>
                  <input
                    type="text"
                    required
                    value={policyTitle}
                    onChange={(e) => setPolicyTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-white text-sm font-bold focus:border-blue-500"
                  />
                </div>

                {/* RICH TEXT TOOLBAR (Enabled in Visual Mode) */}
                {editorMode === 'VISUAL' && (
                  <div className="p-3 rounded-2xl bg-[#020C1B] border border-scalora-blue/20 flex flex-wrap items-center gap-1.5 text-slate-300">
                    {/* Headings */}
                    <button
                      type="button"
                      onClick={() => execCmd('formatBlock', '<h1>')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Heading 1"
                    >
                      <Heading1 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('formatBlock', '<h2>')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Heading 2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('formatBlock', '<h3>')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Heading 3"
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('formatBlock', '<p>')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white text-xs font-bold"
                      title="Normal Paragraph"
                    >
                      ¶ Text
                    </button>

                    <div className="w-[1px] h-5 bg-slate-700 mx-1" />

                    {/* Inline Styles */}
                    <button
                      type="button"
                      onClick={() => execCmd('bold')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('italic')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('underline')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('strikeThrough')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Strikethrough"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>

                    <div className="w-[1px] h-5 bg-slate-700 mx-1" />

                    {/* Lists & Quote */}
                    <button
                      type="button"
                      onClick={() => execCmd('insertUnorderedList')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('insertOrderedList')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('formatBlock', '<blockquote>')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Quote Block"
                    >
                      <Quote className="w-4 h-4" />
                    </button>

                    <div className="w-[1px] h-5 bg-slate-700 mx-1" />

                    {/* Alignment */}
                    <button
                      type="button"
                      onClick={() => execCmd('justifyRight')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Align Right (Arabic)"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('justifyCenter')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Align Center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('justifyLeft')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Align Left (English)"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>

                    <div className="w-[1px] h-5 bg-slate-700 mx-1" />

                    {/* Direction Toggle */}
                    <button
                      type="button"
                      onClick={() => setEditorDirection(editorDirection === 'rtl' ? 'ltr' : 'rtl')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                        editorDirection === 'rtl' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-slate-400'
                      }`}
                      title="Toggle Writing Direction"
                    >
                      {editorDirection === 'rtl' ? '🌐 RTL (عربي)' : '🌐 LTR (English)'}
                    </button>

                    <div className="w-[1px] h-5 bg-slate-700 mx-1" />

                    {/* Insert Tools */}
                    <button
                      type="button"
                      onClick={handleInsertLink}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Insert Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleInsertTable}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Insert Table"
                    >
                      <TableIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('insertHorizontalRule')}
                      className="p-2 rounded-lg hover:bg-white/10 hover:text-white"
                      title="Section Separator"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    {/* Color Highlights */}
                    <div className="flex items-center gap-1 ml-auto">
                      {[
                        { color: '#2563EB', title: 'Blue' },
                        { color: '#10B981', title: 'Emerald' },
                        { color: '#F59E0B', title: 'Amber' },
                        { color: '#EF4444', title: 'Rose' },
                        { color: '#CBD5E1', title: 'Light' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => execCmd('foreColor', c.color)}
                          className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c.color }}
                          title={c.title}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* EDITOR CANVAS */}
                {editorMode === 'VISUAL' && (
                  <div
                    ref={editorRef}
                    contentEditable
                    dir={editorDirection}
                    onInput={() => {
                      if (editorRef.current) {
                        setPolicyContent(editorRef.current.innerHTML);
                      }
                    }}
                    className="min-h-[360px] p-6 rounded-2xl bg-[#020C1B] border border-scalora-blue/20 text-slate-100 text-sm leading-relaxed focus:outline-none focus:border-blue-500 overflow-y-auto prose prose-invert max-w-none"
                    style={{
                      direction: editorDirection,
                      textAlign: editorDirection === 'rtl' ? 'right' : 'left',
                      unicodeBidi: 'plaintext',
                    }}
                  />
                )}

                {/* HTML SOURCE MODE */}
                {editorMode === 'HTML' && (
                  <textarea
                    rows={16}
                    value={policyContent}
                    onChange={(e) => setPolicyContent(e.target.value)}
                    className="w-full p-6 rounded-2xl bg-[#020C1B] border border-scalora-blue/20 text-cyan-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-blue-500"
                    placeholder="Enter raw HTML or Markdown here..."
                  />
                )}

                {/* STUDENT VIEW PREVIEW MODE */}
                {editorMode === 'PREVIEW' && (
                  <div
                    dir={isArabicText(policyContent) ? 'rtl' : 'ltr'}
                    className={`p-6 sm:p-8 rounded-2xl bg-white text-slate-900 border border-slate-200 min-h-[360px] prose text-sm space-y-4 leading-relaxed ${
                      isArabicText(policyContent) ? 'text-right font-sans' : 'text-left'
                    }`}
                    style={{
                      direction: isArabicText(policyContent) ? 'rtl' : 'ltr',
                      textAlign: isArabicText(policyContent) ? 'right' : 'left',
                    }}
                    dangerouslySetInnerHTML={{ __html: policyContent }}
                  />
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Revision Summary Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={policyNote}
                    onChange={(e) => setPolicyNote(e.target.value)}
                    placeholder="e.g. Updated academic guidelines, audio quality requirements, and SLA terms"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-slate-300 text-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={policySaving}
                    className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-glow-blue transition-all flex items-center gap-2"
                  >
                    {policySaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Publishing Version...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Save & Publish Policy Version</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Revision History Sidebar */}
            <div className="p-6 rounded-3xl bg-[#04152D] border border-scalora-blue/15 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-300" />
                <span>Version History & Audit Log</span>
              </h3>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {policy?.revisions && policy.revisions.length > 0 ? (
                  policy.revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl bg-[#020C1B] border border-scalora-blue/15 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300 text-xs">Version {rev.version}.0</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">{rev.title}</p>
                      {rev.note && <p className="text-[11px] text-slate-400 italic">"{rev.note}"</p>}
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-scalora-blue/10">
                        Author: {rev.author || 'Admin'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No revision history found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* REVIEW & INSPECTION MODAL */}
      {/* ==================================================================== */}
      {reviewModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#04152D] rounded-3xl border border-scalora-blue/30 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-scalora-blue/15 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedSub.status)}
                  <span className="text-xs text-slate-400">ID: {selectedSub.id}</span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedSub.title}</h2>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-2 rounded-xl bg-scalora-navy text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trainer Profile Card */}
            <div className="p-5 rounded-2xl bg-[#020C1B] border border-scalora-blue/20 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Trainer Credentials & Profile</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Name:</span>
                  <span className="font-bold text-white text-sm">{selectedSub.trainer.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email:</span>
                  <span className="font-medium text-white">{selectedSub.trainer.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mobile Phone:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {selectedSub.trainer.trainerProfile?.mobile || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Years Experience:</span>
                  <span className="font-medium text-white">
                    {selectedSub.trainer.trainerProfile?.yearsExperience || 0} Years
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">LinkedIn Profile:</span>
                  {selectedSub.trainer.trainerProfile?.linkedin ? (
                    <a
                      href={selectedSub.trainer.trainerProfile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>View LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500">None</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Policy Acceptance:</span>
                  <span className="text-emerald-400 font-semibold">✓ Verified & Signed</span>
                </div>
              </div>
            </div>

            {/* Sessions Inspector */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-blue-400" />
                <span>Curriculum Sessions ({selectedSub.sessions.length})</span>
              </h4>

              <div className="space-y-3">
                {selectedSub.sessions.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="p-4 rounded-xl bg-[#020C1B] border border-scalora-blue/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {s.sessionNumber || idx + 1}
                        </span>
                        <span className="font-bold text-white text-sm truncate">{s.title}</span>
                      </div>
                      <p className="text-slate-400 truncate">{s.description || 'No description'}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-scalora-navy text-slate-300 font-mono">
                        {s.durationMinutes || 30} min
                      </span>

                      {s.videoProvider === 'bunny' && s.videoId && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-cyan-300 font-mono text-[11px]">
                          Bunny ID: {s.videoId.slice(0, 12)}...
                        </span>
                      )}

                      {s.videoUrl && (
                        <a
                          href={s.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Preview Video</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-scalora-blue/15 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-scalora-navy text-slate-300 hover:text-white font-semibold text-xs"
              >
                Close Inspector
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setRejectPromptOpen(true)}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs"
                >
                  Reject Course
                </button>

                <button
                  type="button"
                  onClick={() => setRevisionPromptOpen(true)}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs"
                >
                  Request Revision
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(selectedSub.id)}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Publish Live</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PROMPT MODAL */}
      {rejectPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#04152D] rounded-3xl border border-rose-500/30 p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-white">Reject Course Submission</h3>
            <p className="text-xs text-slate-300">Please provide a clear rejection reason for the trainer.</p>

            <textarea
              rows={4}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this course cannot be accepted (e.g. audio quality, missing practical blueprints, incomplete curriculum)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#020C1B] border border-rose-500/30 text-white text-xs font-medium focus:border-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectPromptOpen(false)}
                className="px-4 py-2 rounded-xl bg-scalora-navy text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVISION PROMPT MODAL */}
      {revisionPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#04152D] rounded-3xl border border-purple-500/30 p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-white">Request Course Revisions</h3>
            <p className="text-xs text-slate-300">
              Provide actionable feedback so the trainer can update and resubmit.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                Required Feedback <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="Specify what needs to be changed..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#020C1B] border border-purple-500/30 text-white text-xs font-medium focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                Suggested Improvements (Optional)
              </label>
              <input
                type="text"
                value={suggestedImprovements}
                onChange={(e) => setSuggestedImprovements(e.target.value)}
                placeholder="e.g. Add downloadable PDF checklist in session 2"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#020C1B] border border-purple-500/30 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevisionPromptOpen(false)}
                className="px-4 py-2 rounded-xl bg-scalora-navy text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestRevision}
                disabled={actionLoading || !revisionFeedback.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACK MODAL */}
      {trackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#04152D] rounded-3xl border border-scalora-blue/30 p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-white">
              {editingTrack ? 'Edit Teaching Track' : 'Create Teaching Track'}
            </h3>

            <form onSubmit={handleSaveTrack} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Track Name</label>
                <input
                  type="text"
                  required
                  value={trackFormName}
                  onChange={(e) => setTrackFormName(e.target.value)}
                  placeholder="e.g. Business Strategy"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={trackFormSlug}
                  onChange={(e) => setTrackFormSlug(e.target.value)}
                  placeholder="e.g. business-strategy (auto-generated if blank)"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={trackFormDesc}
                  onChange={(e) => setTrackFormDesc(e.target.value)}
                  placeholder="Short summary of this track..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={trackFormOrder}
                    onChange={(e) => setTrackFormOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Active Status</label>
                  <select
                    value={trackFormActive ? 'true' : 'false'}
                    onChange={(e) => setTrackFormActive(e.target.value === 'true')}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-white text-xs"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setTrackModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-scalora-navy text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Save Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
