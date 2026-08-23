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
} from 'lucide-react';

interface BroadcastCourse {
  id: string;
  title: string;
  slug: string;
  category: string;
  enrolledCount: number;
}

export const AdminNotificationsPage: React.FC = () => {
  const [courses, setCourses] = useState<BroadcastCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Form State
  const [targetType, setTargetType] = useState<'ALL' | 'COURSE'>('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [notifType, setNotifType] = useState<string>('GLOBAL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audit History
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchBroadcastCourses();
  }, []);

  const fetchBroadcastCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await api.get<{ success: boolean; courses: BroadcastCourse[] }>(
        '/notifications/admin/courses'
      );
      if (res.success && Array.isArray(res.courses)) {
        setCourses(res.courses);
        if (res.courses.length > 0) {
          setSelectedCourseId(res.courses[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching broadcast courses:', err);
    } finally {
      setLoadingCourses(false);
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

    setSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.post<{ success: boolean; message: string; count: number }>(
        '/notifications/admin/broadcast',
        {
          title: title.trim(),
          message: message.trim(),
          targetType,
          courseId: targetType === 'COURSE' ? selectedCourseId : undefined,
          type: notifType,
        }
      );

      if (res.success) {
        setSuccessMessage(`Success: Notification pushed in real-time to ${res.count} scholars.`);
        // Record in local history
        const selectedCourse = courses.find((c) => c.id === selectedCourseId);
        setHistory((prev) => [
          {
            id: Date.now().toString(),
            title: title.trim(),
            message: message.trim(),
            targetType,
            targetName: targetType === 'ALL' ? 'All Platform Scholars' : selectedCourse?.title || 'Course Track',
            count: res.count,
            type: notifType,
            sentAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        // Reset form
        setTitle('');
        setMessage('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch broadcast notification.');
    } finally {
      setSending(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const estimatedTargetCount = targetType === 'ALL' ? 'All Active Platform Users' : `${selectedCourse?.enrolledCount || 0} Enrolled Scholars`;

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
              <span>Real-Time Broadcast Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Notification Center</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Broadcast instant real-time announcements, curriculum updates, and alerts across all devices and PWA apps.
            </p>
          </div>
        </div>

        {/* Live SSE Status Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold self-start md:self-auto relative z-10">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Realtime SSE Gateway: Online</span>
        </div>
      </div>

      {/* 2. Success / Error Feedback */}
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
              <span>Create Real-Time Broadcast</span>
            </h2>
            <span className="text-xs text-slate-400">Zero Page Refresh Required</span>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-5">
            {/* Target Audience Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Target Audience:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('ALL');
                    setNotifType('GLOBAL');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 min-h-[44px] ${
                    targetType === 'ALL'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-glow-accent'
                      : 'bg-[#040C1A] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Users className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black">All Platform Users</div>
                    <div className="text-[11px] text-slate-400">Broadcast globally to every student & trainer</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('COURSE');
                    setNotifType('COURSE_ANNOUNCEMENT');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 min-h-[44px] ${
                    targetType === 'COURSE'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-glow-accent'
                      : 'bg-[#040C1A] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <BookOpen className="w-5 h-5 text-scalora-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black">Specific Course Track</div>
                    <div className="text-[11px] text-slate-400">Target enrolled scholars of a specific course</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Course Selector Dropdown (When Course Selected) */}
            {targetType === 'COURSE' && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Course Track:
                </label>
                {loadingCourses ? (
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
                <option value="SYSTEM" className="bg-[#071325]">⚙️ System & Maintenance Alert</option>
                <option value="SECURITY" className="bg-[#071325]">🛡️ Platform Security Notice</option>
              </select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Notification Title:
              </label>
              <input
                type="text"
                placeholder="e.g., Important: New Live Session Scheduled for Saturday"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#040C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all font-medium"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Message Body:
              </label>
              <textarea
                rows={4}
                placeholder="Write the detailed notification text that will appear in the scholars' notification dropdown and center..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 rounded-2xl bg-[#040C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all font-medium resize-none leading-relaxed"
              />
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
                  <span>Pushing Real-Time Broadcast...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Dispatch Real-Time Broadcast Now</span>
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
                <span className="text-xs font-extrabold text-emerald-400">SSE Realtime Push + Persistent Ingress</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#040C1A] border border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">PWA & Tab Sync</span>
                <span className="text-xs font-extrabold text-amber-300">Instant Unread Badge Update</span>
              </div>
            </div>
          </div>

          {/* Live Mockup Preview */}
          <div className="bg-[#071325] rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Scholar UI Live Preview</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                As seen on client
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#091A36] border border-cyan-500/40 shadow-lg space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white truncate">
                      {title.trim() || 'Broadcast Announcement Title'}
                    </span>
                    <span className="text-[10px] text-slate-400">just now</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {message.trim() ||
                      'The notification message body will appear here formatted nicely for scholars across desktop, tablet, and mobile PWA screens.'}
                  </p>
                </div>
                <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1 shadow-glow-accent" />
              </div>
            </div>
          </div>

          {/* Audit History Log */}
          {history.length > 0 && (
            <div className="bg-[#071325] rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 animate-in fade-in">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Session Broadcast History ({history.length})</span>
              </h3>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {history.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-[#040C1A] border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span className="truncate max-w-[200px]">{item.title}</span>
                      <span className="text-[10px] text-emerald-400">{item.count} delivered</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{item.targetName}</span>
                      <span>•</span>
                      <span>{new Date(item.sentAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
