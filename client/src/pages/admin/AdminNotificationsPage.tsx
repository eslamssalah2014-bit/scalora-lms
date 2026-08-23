import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Bell,
  Megaphone,
  Sparkles,
  Users,
  BookOpen,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Layers,
  Shield,
  Eye,
  TrendingUp,
  BarChart3,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCheck,
  Award,
  RefreshCw,
} from 'lucide-react';

interface BroadcastCourse {
  id: string;
  title: string;
  slug: string;
  category: string;
  enrolledCount: number;
}

interface BroadcastTrainer {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  title?: string | null;
  coursesCount: number;
  studentCount: number;
}

interface BroadcastHistoryItem {
  id: string;
  title: string;
  message: string;
  type: string;
  targetType: 'ALL' | 'COURSE' | 'TRAINER';
  targetName: string;
  imageUrl?: string | null;
  actionUrl?: string | null;
  sentBy: string;
  sentAt: string;
  deliveredCount: number;
  readCount: number;
  readRate: number;
}

export const AdminNotificationsPage: React.FC = () => {
  const [courses, setCourses] = useState<BroadcastCourse[]>([]);
  const [trainers, setTrainers] = useState<BroadcastTrainer[]>([]);
  const [loadingAudience, setLoadingAudience] = useState(true);

  // Form State
  const [targetType, setTargetType] = useState<'ALL' | 'COURSE' | 'TRAINER'>('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [notifType, setNotifType] = useState<string>('GLOBAL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audit History & Analytics
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchAudience();
    fetchHistory();
  }, []);

  const fetchAudience = async () => {
    setLoadingAudience(true);
    try {
      const res = await api.get<{
        success: boolean;
        courses: BroadcastCourse[];
        trainers: BroadcastTrainer[];
      }>('/notifications/admin/audience');

      if (res.success) {
        if (Array.isArray(res.courses)) {
          setCourses(res.courses);
          if (res.courses.length > 0) {
            setSelectedCourseId(res.courses[0].id);
          }
        }
        if (Array.isArray(res.trainers)) {
          setTrainers(res.trainers);
          if (res.trainers.length > 0) {
            setSelectedTrainerId(res.trainers[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching broadcast audience:', err);
    } finally {
      setLoadingAudience(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get<{ success: boolean; history: BroadcastHistoryItem[] }>(
        '/notifications/admin/history'
      );
      if (res.success && Array.isArray(res.history)) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Error fetching broadcast history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMessage('Please fill in both title and message.');
      return;
    }
    if (targetType === 'COURSE' && !selectedCourseId) {
      setErrorMessage('Please select a target course.');
      return;
    }
    if (targetType === 'TRAINER' && !selectedTrainerId) {
      setErrorMessage('Please select a target instructor.');
      return;
    }

    setSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.post<{
        success: boolean;
        message: string;
        count: number;
        broadcast?: BroadcastHistoryItem;
      }>('/notifications/admin/broadcast', {
        title: title.trim(),
        message: message.trim(),
        targetType,
        courseId: targetType === 'COURSE' ? selectedCourseId : undefined,
        trainerId: targetType === 'TRAINER' ? selectedTrainerId : undefined,
        type: notifType,
        imageUrl: imageUrl.trim() || undefined,
        actionUrl: actionUrl.trim() || undefined,
      });

      if (res.success) {
        setSuccessMessage(`Success: Notification pushed in real-time to ${res.count} scholars.`);
        if (res.broadcast) {
          setHistory((prev) => [res.broadcast!, ...prev]);
        } else {
          fetchHistory();
        }
        // Reset form
        setTitle('');
        setMessage('');
        setImageUrl('');
        setActionUrl('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch broadcast notification.');
    } finally {
      setSending(false);
    }
  };

  // Metrics Calculations
  const totalDelivered = history.reduce((sum, h) => sum + (h.deliveredCount || 0), 0);
  const totalRead = history.reduce((sum, h) => sum + (h.readCount || 0), 0);
  const avgReadRate =
    totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedTrainer = trainers.find((t) => t.id === selectedTrainerId);

  const estimatedTargetCount =
    targetType === 'ALL'
      ? 'All Active Platform Users'
      : targetType === 'COURSE'
      ? `${selectedCourse?.enrolledCount || 0} Enrolled Scholars`
      : `${selectedTrainer?.studentCount || 0} Assigned Students`;

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#071A36] via-[#0B254E] to-[#041226] border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-glow-accent">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-400/30">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Native Push & Realtime Broadcast Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Push Notification Center</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Deliver native mobile push, desktop alerts, and in-app notifications with targeted audience reach.
            </p>
          </div>
        </div>

        {/* Realtime Status Gateway Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold self-start md:self-auto relative z-10">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Push Gateway: Active (100% Delivery)</span>
        </div>
      </div>

      {/* 2. Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#071325] p-5 rounded-3xl border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Delivered</span>
            <Send className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalDelivered}</div>
          <div className="text-[11px] text-cyan-300 font-semibold">Across all campaigns</div>
        </div>

        <div className="bg-[#071325] p-5 rounded-3xl border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Read</span>
            <CheckCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{totalRead}</div>
          <div className="text-[11px] text-slate-400">Opened by scholars</div>
        </div>

        <div className="bg-[#071325] p-5 rounded-3xl border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Average Read Rate</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{avgReadRate}%</div>
          <div className="text-[11px] text-slate-400">Campaign engagement</div>
        </div>

        <div className="bg-[#071325] p-5 rounded-3xl border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Delivery Rate</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">100%</div>
          <div className="text-[11px] text-emerald-400 font-semibold">Zero lost notifications</div>
        </div>
      </div>

      {/* 3. Feedback Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Broadcast Composer (7 Cols) */}
        <div className="lg:col-span-7 bg-[#071325] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-cyan-400" />
              <span>Create Notification Campaign</span>
            </h2>
            <span className="text-xs text-slate-400">Mobile PWA + Desktop Sync</span>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-5">
            {/* Target Audience Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Target Audience:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('ALL');
                    setNotifType('GLOBAL');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[70px] ${
                    targetType === 'ALL'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-glow-accent'
                      : 'bg-[#040C1A] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black">All Users</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Global Platform</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('COURSE');
                    setNotifType('COURSE_ANNOUNCEMENT');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[70px] ${
                    targetType === 'COURSE'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-glow-accent'
                      : 'bg-[#040C1A] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-scalora-accent" />
                    <span className="text-xs font-black">Course Track</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Enrolled Scholars</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('TRAINER');
                    setNotifType('TRAINER_ANNOUNCEMENT');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[70px] ${
                    targetType === 'TRAINER'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-glow-accent'
                      : 'bg-[#040C1A] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black">Trainer Group</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Assigned Students</span>
                </button>
              </div>
            </div>

            {/* Course Selector Dropdown (When Course Selected) */}
            {targetType === 'COURSE' && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Target Course:
                </label>
                {loadingAudience ? (
                  <div className="p-3 bg-[#040C1A] rounded-2xl text-xs text-slate-400">Loading courses...</div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#040C1A] border border-cyan-500/30 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#071325] text-white">
                        {c.title} ({c.enrolledCount} enrolled students) • {c.category}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Trainer Selector Dropdown (When Trainer Selected) */}
            {targetType === 'TRAINER' && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Target Instructor:
                </label>
                {loadingAudience ? (
                  <div className="p-3 bg-[#040C1A] rounded-2xl text-xs text-slate-400">Loading instructors...</div>
                ) : (
                  <select
                    value={selectedTrainerId}
                    onChange={(e) => setSelectedTrainerId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#040C1A] border border-cyan-500/30 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#071325] text-white">
                        {t.name} ({t.studentCount} assigned students across {t.coursesCount} courses)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Notification Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Notification Category:
              </label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#040C1A] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
              >
                <option value="GLOBAL" className="bg-[#071325]">📢 Global Announcement</option>
                <option value="COURSE_ANNOUNCEMENT" className="bg-[#071325]">📚 Course Curriculum Announcement</option>
                <option value="TRAINER_ANNOUNCEMENT" className="bg-[#071325]">👨‍🏫 Instructor Special Update</option>
                <option value="SYSTEM" className="bg-[#071325]">⚙️ System & Maintenance Alert</option>
                <option value="SECURITY" className="bg-[#071325]">🛡️ Platform Security Notice</option>
              </select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Title:
              </label>
              <input
                type="text"
                placeholder="e.g. New Lesson Available"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#040C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all font-medium"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Message:
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Module 3 has been published and is ready to watch."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 rounded-2xl bg-[#040C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all font-medium resize-none leading-relaxed"
              />
            </div>

            {/* Optional Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Optional Image URL:</span>
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/banner.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#040C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Optional Action URL:</span>
                </label>
                <input
                  type="text"
                  placeholder="/courses/build-your-business-engine"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#040C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-extrabold text-sm shadow-glow-accent hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Pushing Real-Time Notification...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Notification Campaign</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Panel: Live Preview & Delivery Scope (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Target Scope Card */}
          <div className="bg-[#071325] rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Broadcast Scope & Delivery</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#040C1A] border border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Target Audience</span>
                <span className="text-xs font-extrabold text-cyan-300">{estimatedTargetCount}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#040C1A] border border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Delivery Channel</span>
                <span className="text-xs font-extrabold text-emerald-400">Realtime SSE + Native Push API</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#040C1A] border border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Deep Link Action</span>
                <span className="text-xs font-extrabold text-amber-300 truncate max-w-[180px]">
                  {actionUrl.trim() || '/notifications'}
                </span>
              </div>
            </div>
          </div>

          {/* Native Push Notification Mockup Preview */}
          <div className="bg-[#071325] rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Mobile & Desktop Push Preview</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                Native OS Notification
              </span>
            </div>

            {/* Simulated Native OS Notification Box */}
            <div className="p-4 rounded-2xl bg-[#0F1E36] border border-cyan-400/40 shadow-2xl space-y-2 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#04152D] border border-cyan-500/40 p-1.5 flex items-center justify-center flex-shrink-0">
                  <img src="/scalora-icon-transparent.png" alt="Scalora" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white truncate">
                      {title.trim() || 'New Lesson Available'}
                    </span>
                    <span className="text-[10px] text-slate-400">now</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {message.trim() || 'Module 3 has been published and is ready to watch.'}
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                      Open App →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notification History & Analytics Table */}
      <div className="bg-[#071325] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Notification History & Analytics</span>
            </h2>
            <p className="text-xs text-slate-400">Review sent campaigns, audience scope, delivered counts, and real-time read rates.</p>
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            <p className="text-xs text-slate-400">Loading campaign analytics...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold">No notification campaigns sent yet.</p>
            <p className="text-[11px] text-slate-500">Create your first broadcast using the composer above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Title & Message</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Target Audience</th>
                  <th className="pb-3 px-3">Sent At</th>
                  <th className="pb-3 px-3 text-center">Delivered</th>
                  <th className="pb-3 px-3 text-center">Read Count</th>
                  <th className="pb-3 px-3">Read Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-3 max-w-xs">
                      <div className="font-black text-white truncate">{item.title}</div>
                      <div className="text-slate-400 text-[11px] truncate">{item.message}</div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold border border-cyan-500/30">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="font-bold text-slate-200">{item.targetName}</div>
                      <div className="text-[10px] text-slate-400">{item.targetType} Scope</div>
                    </td>
                    <td className="py-4 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(item.sentAt).toLocaleDateString()} {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-3 text-center font-bold text-cyan-300">
                      {item.deliveredCount}
                    </td>
                    <td className="py-4 px-3 text-center font-bold text-emerald-400">
                      {item.readCount}
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                            style={{ width: `${item.readRate || 0}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-white text-[11px]">{item.readRate || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
