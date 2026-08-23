import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { realtime } from '../lib/realtime';
import { CommunityNotification } from '../types';
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  CornerDownRight,
  Heart,
  Megaphone,
  Sparkles,
  Clock,
  Loader2,
  Trash2,
  Search,
  BookOpen,
  Shield,
  Layers,
  Flame,
  ArrowRight,
  ArrowLeft,
  Filter,
  CheckCircle2,
  SlidersHorizontal,
  Smartphone,
  ShieldCheck,
  Send,
  RefreshCw,
  Award,
  MessageCircle,
} from 'lucide-react';
import { NotificationPreferencesModal } from '../components/NotificationPreferencesModal';
import {
  getNotificationPermission,
  subscribeToPushNotifications,
  sendTestPush,
} from '../lib/pushNotifications';

type NotificationTab = 'ALL' | 'UNREAD' | 'MESSAGES' | 'COMMUNITY' | 'COURSES';

export const NotificationCenterPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<NotificationTab>('ALL');
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [enablingPush, setEnablingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [testPushStatus, setTestPushStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [unreadCounts, setUnreadCounts] = useState({
    all: 0,
    messages: 0,
    community: 0,
    courses: 0,
    system: 0,
  });

  // Pull to refresh touch tracking
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  // Fetch notifications
  const fetchNotifications = async (tab = activeTab, search = searchQuery, isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (search.trim()) {
        params.set('search', search.trim());
      }
      params.set('limit', '50');

      const res = await api.get<{
        success: boolean;
        notifications: CommunityNotification[];
        unreadCount: number;
        unreadCounts: typeof unreadCounts;
      }>(`/notifications?${params.toString()}`);

      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        if (res.unreadCounts) {
          setUnreadCounts(res.unreadCounts);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPullDistance(0);
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab, searchQuery);
  }, [activeTab]);

  // Real-time Push Subscription
  useEffect(() => {
    if (!user?.id) return;

    const unsub = realtime.on('notification', (data) => {
      if (data?.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCounts((prev) => ({
          ...prev,
          all: prev.all + 1,
        }));
      } else {
        fetchNotifications(activeTab, searchQuery);
      }
    });

    return () => {
      unsub();
    };
  }, [user?.id, activeTab, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotifications(activeTab, searchQuery);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCounts({
        all: 0,
        messages: 0,
        community: 0,
        courses: 0,
        system: 0,
      });
      setToastMessage('All notifications marked as read ✓');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleMarkSingleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCounts((prev) => ({
        ...prev,
        all: Math.max(0, prev.all - 1),
      }));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNotificationClick = async (notif: CommunityNotification) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCounts((prev) => ({ ...prev, all: Math.max(0, prev.all - 1) }));
      } catch {}
    }

    const typeUpper = (notif.type || '').toUpperCase();

    if (typeUpper.includes('MESSAGE')) {
      if (notif.actor?.id) {
        navigate(`/messages?partner=${notif.actor.id}`);
      } else {
        navigate('/messages');
      }
    } else if (typeUpper.includes('COURSE') || typeUpper.includes('LESSON')) {
      navigate('/courses');
    } else if (notif.channelId) {
      navigate(`/community?channel=${notif.channelId}${notif.postId ? `&post=${notif.postId}` : ''}`);
    } else {
      navigate('/community');
    }
  };

  // Touch Gesture Pull to Refresh Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart !== null && window.scrollY === 0) {
      const distance = Math.max(0, e.touches[0].clientY - touchStart);
      if (distance < 120) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      fetchNotifications(activeTab, searchQuery, true);
    } else {
      setPullDistance(0);
    }
    setTouchStart(null);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const tabs: { id: NotificationTab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: unreadCounts.all },
    { id: 'UNREAD', label: 'Unread', count: unreadCounts.all },
    { id: 'MESSAGES', label: 'Messages', count: unreadCounts.messages },
    { id: 'COMMUNITY', label: 'Community', count: unreadCounts.community },
    { id: 'COURSES', label: 'Courses', count: unreadCounts.courses },
  ];

  return (
    <div
      className="min-h-screen bg-[#030C1A] text-white pb-32 md:pb-16 overflow-x-hidden selection:bg-cyan-500 selection:text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-To-Refresh Indicator on Mobile */}
      {pullDistance > 0 && (
        <div
          className="fixed top-14 left-0 right-0 z-40 flex justify-center items-center pointer-events-none transition-transform"
          style={{ transform: `translateY(${Math.min(pullDistance * 0.4, 40)}px)` }}
        >
          <div className="p-2.5 rounded-full bg-[#071936] border border-cyan-400/40 text-cyan-300 shadow-2xl flex items-center gap-2 text-xs font-bold">
            <RefreshCw className={`w-4 h-4 ${pullDistance > 60 ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{pullDistance > 60 ? 'Release to refresh' : 'Pull down to refresh'}</span>
          </div>
        </div>
      )}

      {/* 1. Mobile-First Sticky Header (Facebook / LinkedIn Style) */}
      <div className="sticky top-0 z-30 bg-[#041226]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex-shrink-0 min-w-[38px] min-h-[38px] flex items-center justify-center"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">Notifications</h1>
                {unreadCounts.all > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[11px] font-black animate-pulse">
                    {unreadCounts.all} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                Direct messages, community discussions, and course updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {unreadCounts.all > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white font-extrabold text-xs border border-cyan-500/40 transition-all flex items-center gap-1.5 min-h-[38px]"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all as read</span>
                <span className="sm:hidden">Mark read</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPreferencesOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center"
              title="Notification Settings"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* 2. Segmented Filter Tabs (Facebook/LinkedIn Mobile Style) */}
        <div className="max-w-4xl mx-auto px-4 pb-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-1 px-1">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3.5 rounded-full font-black text-xs transition-all flex items-center gap-1.5 flex-shrink-0 min-h-[38px] select-none ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
                      : 'bg-[#081830] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-3.5">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Device Push Activation Card (When not granted) */}
        {permission !== 'granted' && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#071F3D] to-[#05142B] border border-cyan-400/40 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">Enable Android System Notifications</div>
                <div className="text-[11px] text-slate-300 line-clamp-1">Receive message alerts on your phone lock screen</div>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setEnablingPush(true);
                const granted = await subscribeToPushNotifications();
                setPermission(granted ? 'granted' : 'denied');
                setEnablingPush(false);
              }}
              disabled={enablingPush}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-extrabold text-xs shadow-glow-accent transition-all flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
            >
              {enablingPush ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Enable</span>
            </button>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#061428] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>

        {/* 3. Notification Stream (Facebook / LinkedIn Clean Cards) */}
        {loading && !refreshing ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-xs text-slate-400 font-semibold">Loading your updates...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center bg-[#061428] rounded-3xl border border-white/5 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">All Caught Up!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No notifications in this category. Important messages, replies, and announcements will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const typeUpper = (notif.type || '').toUpperCase();
              const isMessage = typeUpper.includes('MESSAGE');
              const isCourse = typeUpper.includes('COURSE') || typeUpper.includes('LESSON') || typeUpper.includes('ENROLLMENT');
              const isAnnouncement = typeUpper.includes('ANNOUNCEMENT') || typeUpper.includes('GLOBAL');
              const isLike = typeUpper.includes('LIKE');
              const isComment = typeUpper.includes('COMMENT') || typeUpper.includes('REPLY');

              const actorName = notif.actor?.name || 'Scalora';
              const actorAvatar =
                notif.actor?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(actorName)}&background=0284C7&color=fff`;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group relative select-none ${
                    !notif.isRead
                      ? 'bg-gradient-to-r from-[#071E3D] via-[#09254E]/80 to-[#04152D] border-l-4 border-l-cyan-400 border-t-cyan-500/20 border-r-cyan-500/20 border-b-cyan-500/20 shadow-lg shadow-cyan-500/5'
                      : 'bg-[#06142A]/80 hover:bg-[#081B38] border-white/5 text-slate-300'
                  }`}
                >
                  {/* Left: Avatar with Overlay Badge */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={actorAvatar}
                      alt={actorName}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border border-cyan-500/30 shadow-md"
                    />
                    {/* Badge Icon on Corner */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#041226] text-white shadow-sm ${
                        isMessage
                          ? 'bg-cyan-500'
                          : isCourse
                          ? 'bg-emerald-500'
                          : isLike
                          ? 'bg-rose-500'
                          : isComment
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                    >
                      {isMessage ? (
                        <MessageSquare className="w-2.5 h-2.5" />
                      ) : isCourse ? (
                        <BookOpen className="w-2.5 h-2.5" />
                      ) : isLike ? (
                        <Heart className="w-2.5 h-2.5 fill-white" />
                      ) : isComment ? (
                        <CornerDownRight className="w-2.5 h-2.5" />
                      ) : (
                        <Megaphone className="w-2.5 h-2.5" />
                      )}
                    </div>
                  </div>

                  {/* Center Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-xs sm:text-sm leading-snug">
                      <span className="font-extrabold text-white">{actorName}</span>{' '}
                      <span className={`${!notif.isRead ? 'text-slate-200' : 'text-slate-400'}`}>
                        {notif.message}
                      </span>
                    </div>

                    {/* Context Pill & Timestamp */}
                    <div className="flex items-center gap-2 pt-0.5">
                      {notif.channelName && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-cyan-300 font-bold truncate max-w-[150px]">
                          #{notif.channelName}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatTimeAgo(notif.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Actions & Unread Indicator */}
                  <div className="flex flex-col items-end justify-between self-stretch gap-2 flex-shrink-0 pl-1">
                    {!notif.isRead ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
                    ) : (
                      <div className="w-2.5 h-2.5" />
                    )}

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkSingleRead(notif.id, e)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-white/5 transition-colors"
                          title="Mark read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 transition-colors"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
    </div>
  );
};
