import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { realtime } from '../../lib/realtime';
import { CommunityNotification } from '../../types';
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
  BookOpen,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'UNREAD' | 'MESSAGES' | 'COMMUNITY' | 'COURSES'>('ALL');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (category = activeCategory) => {
    try {
      setLoading(true);
      const res = await api.get<{
        success: boolean;
        notifications: CommunityNotification[];
        unreadCount: number;
      }>(`/notifications?tab=${category}&limit=20`);

      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Non-blocking fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeCategory);
  }, [activeCategory]);

  // Real-time Push Subscription
  useEffect(() => {
    const unsub = realtime.on('notification', (data) => {
      if (data?.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      } else {
        fetchNotifications(activeCategory);
      }
    });

    return () => {
      unsub();
    };
  }, [activeCategory]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = async (notif: CommunityNotification) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }

    setIsOpen(false);
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
      return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (t.includes('LIKE')) {
      return <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />;
    }
    if (t.includes('REPLY')) {
      return <CornerDownRight className="w-3.5 h-3.5 text-scalora-accent" />;
    }
    if (t.includes('COMMENT')) {
      return <MessageSquare className="w-3.5 h-3.5 text-sky-400" />;
    }
    if (t.includes('ANNOUNCEMENT') || t.includes('GLOBAL')) {
      return <Megaphone className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (t.includes('COURSE') || t.includes('LESSON') || t.includes('ENROLLMENT')) {
      return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <Sparkles className="w-3.5 h-3.5 text-cyan-300" />;
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(activeCategory);
        }}
        className="relative p-2.5 rounded-2xl bg-[#0B1528] hover:bg-[#0F1E3A] border border-white/10 text-slate-300 hover:text-white transition-all focus:outline-none flex items-center justify-center"
        title="Scalora Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#04152D] animate-pulse shadow-glow-rose">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl glass-panel shadow-2xl border border-cyan-500/30 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-scalora-blue/20 bg-[#04152D]/95 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="px-3 py-2 bg-[#030E1E] border-b border-white/5 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'UNREAD', label: 'Unread' },
              { id: 'MESSAGES', label: 'Messages' },
              { id: 'COMMUNITY', label: 'Community' },
              { id: 'COURSES', label: 'Courses' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-scalora-blue/10 scrollbar-thin scrollbar-thumb-scalora-blue/30">
            {loading ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                <p className="text-xs text-slate-400">Loading activity...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold">No notifications in this category.</p>
                <p className="text-[11px] text-slate-500">You're all caught up with your courses & channels.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 text-xs group ${
                    !notif.isRead
                      ? 'bg-gradient-to-r from-cyan-500/10 to-scalora-blue/10 hover:bg-cyan-500/15'
                      : 'hover:bg-white/5 opacity-85'
                  }`}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    {notif.actor?.avatar ? (
                      <img
                        src={notif.actor.avatar}
                        alt={notif.actor.name}
                        className="w-8 h-8 rounded-xl object-cover border border-scalora-blue/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-scalora-navy text-cyan-300 flex items-center justify-center border border-scalora-blue/30">
                        {getIcon(notif.type)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#04152D] border border-scalora-blue/20">
                      {getIcon(notif.type)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-slate-200 leading-snug group-hover:text-white transition-colors">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                      {notif.channelName && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-300 font-semibold truncate max-w-[120px]">#{notif.channelName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5 shadow-glow-accent" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-3 bg-[#030E1E] border-t border-white/5 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 py-1"
            >
              <span>View All in Notification Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
