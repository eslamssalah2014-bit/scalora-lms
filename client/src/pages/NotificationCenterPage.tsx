import React, { useState, useEffect } from 'react';
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
  Filter,
  CheckCircle2,
} from 'lucide-react';

type NotificationTab = 'ALL' | 'UNREAD' | 'MESSAGES' | 'COMMUNITY' | 'COURSES' | 'SYSTEM';

export const NotificationCenterPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<NotificationTab>('ALL');
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({
    all: 0,
    messages: 0,
    community: 0,
    courses: 0,
    system: 0,
  });

  // Fetch notifications
  const fetchNotifications = async (tab = activeTab, search = searchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (search.trim()) {
        params.set('search', search.trim());
      }

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
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab, searchQuery);
  }, [activeTab]);

  // Real-time Push Subscription
  useEffect(() => {
    if (!user?.id) return;

    const unsub = realtime.on('notification', (data) => {
      // Prepend to notifications stream
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

  const getIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('MESSAGE')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes('LIKE')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 fill-rose-400" />
        </div>
      );
    }
    if (t.includes('REPLY') || t.includes('COMMENT')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
          <CornerDownRight className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes('ANNOUNCEMENT') || t.includes('GLOBAL')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          <Megaphone className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes('COURSE') || t.includes('LESSON') || t.includes('ENROLLMENT')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
        <Bell className="w-5 h-5" />
      </div>
    );
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
    { id: 'SYSTEM', label: 'System', count: unreadCounts.system },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#071A36] via-[#0B254E] to-[#041226] border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-glow-accent">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-400/30">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Real-Time Activity</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Notification Center</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Stay updated with direct messages, discussions, course announcements, and system alerts.
            </p>
          </div>
        </div>

        {unreadCounts.all > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white font-bold text-xs border border-cyan-500/30 hover:border-cyan-400 transition-all flex items-center gap-2 relative z-10 self-start md:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read ({unreadCounts.all})</span>
          </button>
        )}
      </div>

      {/* 2. Search & Tab Filter Bar */}
      <div className="space-y-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search notifications by keyword or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#09152A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </form>

        {/* 6 Segmented Tabs with 44px+ touch targets */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-[#061328] p-1.5 rounded-2xl border border-white/10">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
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

      {/* 3. Notifications Stream */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-[#071325] rounded-3xl border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">All Caught Up!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You have no notifications in this category. Important messages, replies, and announcements will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 group ${
                notif.isRead
                  ? 'bg-[#071325]/80 hover:bg-[#09182F] border-white/5 text-slate-300'
                  : 'bg-[#091A36] hover:bg-[#0C2042] border-cyan-500/40 shadow-lg shadow-cyan-500/5 text-white'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {getIcon(notif.type)}

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {notif.actor?.name && (
                      <span className="font-extrabold text-xs text-cyan-300">{notif.actor.name}</span>
                    )}
                    {notif.channelName && (
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">
                        #{notif.channelName}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed break-words font-medium">{notif.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkSingleRead(notif.id, e)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-white/10 transition-all"
                    title="Mark as Read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDelete(notif.id, e)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-all"
                  title="Dismiss Notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
