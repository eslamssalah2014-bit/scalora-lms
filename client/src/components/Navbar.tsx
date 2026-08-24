import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './community/NotificationDropdown';
import { api } from '../lib/api';
import { realtime } from '../lib/realtime';
import {
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  Shield,
  Sparkles,
  Users,
  Mail,
  Download,
  CheckCircle2,
  Bell,
  Target,
  Award,
  PlayCircle,
  Calendar,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { usePwa } from '../hooks/usePwa';
import { showNativeNotification } from '../lib/pushNotifications';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const { isInstalled, installApp } = usePwa();

  // Fetch unread count & subscribe to Realtime User Inbox & Notifications
  useEffect(() => {
    if (!user?.id) return;

    // Auto-sync Push Subscription with backend if permission is already granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      import('../lib/pushNotifications').then((m) => m.subscribeToPushNotifications());
    }

    // Fetch initial messages unread count
    api
      .get<{ success: boolean; conversations: any[] }>('/messages/conversations')
      .then((res) => {
        if (res.success && Array.isArray(res.conversations)) {
          const totalUnread = res.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadMsgCount(totalUnread);
        }
      })
      .catch(() => {});

    // Fetch initial notifications unread count
    api
      .get<{ success: boolean; unreadCount: number }>('/notifications?tab=UNREAD&limit=1')
      .then((res) => {
        if (res.success && typeof res.unreadCount === 'number') {
          setUnreadNotifCount(res.unreadCount);
        }
      })
      .catch(() => {});

    // Connect and listen to Realtime Push Events
    const unsubMsg = realtime.on('new_direct_message', (data) => {
      if (location.pathname !== '/messages') {
        setUnreadMsgCount((prev) => prev + 1);
      }
      if (data?.message?.sender?.name) {
        showNativeNotification({
          title: `Direct Message from ${data.message.sender.name}`,
          body: data.message.content || 'New message received',
          type: 'MESSAGE',
          actionUrl: `/messages?partner=${data.message.senderId}`,
        });
      }
    });

    const unsubNotif = realtime.on('notification', (data) => {
      if (location.pathname !== '/notifications') {
        setUnreadNotifCount((prev) => prev + 1);
      }
      if (data?.notification) {
        showNativeNotification({
          title: data.notification.title || 'New Scalora Notification',
          body: data.notification.message || 'You have a new update in Scalora',
          type: data.notification.type,
          actionUrl: data.notification.actionUrl || '/notifications',
        });
      }
    });

    return () => {
      unsubMsg();
      unsubNotif();
    };
  }, [user?.id, location.pathname]);

  // Clear unread counts when viewing active pages
  useEffect(() => {
    if (location.pathname === '/messages') {
      setUnreadMsgCount(0);
    }
    if (location.pathname === '/notifications') {
      setUnreadNotifCount(0);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserDropdownOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#04152D]/85 backdrop-blur-md border-b border-scalora-blue/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#04152D] border border-scalora-blue/30 p-1.5 shadow-glow-blue transition-transform group-hover:scale-105 flex items-center justify-center">
              <img src="/scalora-icon-transparent.png" alt="Scalora Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              Scalora <span className="w-2 h-2 rounded-full bg-scalora-accent animate-pulse" />
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link
              to="/courses"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/courses')
                  ? 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Courses
            </Link>
            <Link
              to="/community"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/community')
                  ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-400/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Community
            </Link>
            <Link
              to="/messages"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/messages')
                  ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-400/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Messages
            </Link>
            <Link
              to="/services"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/services')
                  ? 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Services
            </Link>
            <Link
              to="/about"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/contact')
                  ? 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* User / Auth CTA - Facebook/Messenger Style Top Right Cluster */}
          <div className="hidden md:flex items-center space-x-2.5">
            {user ? (
              <div className="flex items-center space-x-2">
                {/* 1. Notifications Bell */}
                <NotificationDropdown />

                {/* 2. Messages Primary Destination */}
                <Link
                  to="/messages"
                  className={`p-2.5 rounded-2xl transition-all relative flex items-center justify-center ${
                    isActive('/messages')
                      ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
                      : 'bg-[#0B1528] hover:bg-[#0F1E3A] text-slate-300 hover:text-cyan-300 border border-white/10'
                  }`}
                  title="Messenger & Direct Inquiries"
                >
                  <Mail className="w-4 h-4" />
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px] border-2 border-[#04152D] animate-pulse">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>

                {/* 3. User Profile Button */}
                <div className="relative pl-1">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2.5 px-3 py-1.5 rounded-2xl bg-[#0B1528] hover:bg-[#0F1E3A] border border-white/10 transition-all focus:outline-none"
                  >
                    <img
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=0284C7&color=fff`
                      }
                      alt={user.name}
                      className="w-7 h-7 rounded-xl object-cover border border-cyan-500/30 shadow-sm"
                    />
                    <div className="text-left hidden lg:block">
                      <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                      <div className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">
                        {user.role}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel py-2 shadow-2xl border border-scalora-blue/30 animate-in fade-in zoom-in-95 duration-150"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-scalora-blue/15">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                      </div>

                      {user.role === 'ADMIN' ? (
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-scalora-blue/20 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-scalora-accent" />
                          <span>Admin Console</span>
                        </Link>
                      ) : user.role === 'TRAINER' ? (
                        <Link
                          to="/trainer"
                          className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition-colors font-bold"
                        >
                          <Shield className="w-4 h-4 text-cyan-400" />
                          <span>Trainer Workspace</span>
                        </Link>
                      ) : (
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-scalora-blue/20 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-scalora-blue" />
                          <span>Student Dashboard</span>
                        </Link>
                      )}

                      <Link
                        to="/messages"
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span>Direct Inquiries</span>
                      </Link>

                      <Link
                        to="/community"
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition-colors"
                      >
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span>Scalora Community</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-scalora-blue/20 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span>My Enrolled Courses</span>
                      </Link>

                      <Link
                        to="/my-study-plan"
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition-colors font-semibold"
                      >
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span>My Study Plan</span>
                      </Link>

                      {/* PWA Install Option */}
                      {isInstalled ? (
                        <div className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>App Installed ✓</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            installApp();
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition-colors text-left font-semibold"
                        >
                          <Download className="w-4 h-4 text-cyan-400" />
                          <span>Install Scalora App</span>
                        </button>
                      )}

                      <div className="border-t border-scalora-blue/15 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-sm font-semibold shadow-glow-blue hover:opacity-95 transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Top Right Action Cluster - Facebook/LinkedIn Style */}
          <div className="flex md:hidden items-center space-x-1.5">
            {user ? (
              <>
                {/* 1. Mobile Notifications Bell -> Dedicated Full-Screen Page Route */}
                <Link
                  to="/notifications"
                  className={`p-2 rounded-xl transition-all relative flex items-center justify-center min-w-[36px] min-h-[36px] ${
                    isActive('/notifications')
                      ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
                      : 'bg-[#0B1528] text-slate-300 border border-white/10'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[9px] border border-[#04152D] animate-pulse">
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </span>
                  )}
                </Link>

                {/* 2. Messages Icon */}
                <Link
                  to="/messages"
                  className={`p-2 rounded-xl transition-all relative flex items-center justify-center min-w-[36px] min-h-[36px] ${
                    isActive('/messages')
                      ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
                      : 'bg-[#0B1528] text-slate-300 border border-white/10'
                  }`}
                  title="Messages"
                >
                  <Mail className="w-4 h-4" />
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] border border-[#04152D] animate-pulse">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>

                {/* 3. Quick Profile Avatar */}
                <Link
                  to={
                    user.role === 'ADMIN'
                      ? '/admin'
                      : user.role === 'TRAINER'
                      ? '/trainer'
                      : '/dashboard'
                  }
                  className="p-0.5 rounded-xl border border-cyan-500/30 flex-shrink-0"
                  title="My Profile"
                >
                  <img
                    src={
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name
                      )}&background=0284C7&color=fff`
                    }
                    alt={user.name}
                    className="w-7 h-7 rounded-[10px] object-cover"
                  />
                </Link>

                {/* 4. Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl bg-scalora-navy/50 text-slate-300 hover:text-white border border-scalora-blue/20"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-scalora-blue" />}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-semibold shadow-glow-blue"
                >
                  Get Started
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl bg-scalora-navy/50 text-slate-300 hover:text-white border border-scalora-blue/20"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-scalora-blue" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Primary Navigation Hub Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] z-50 bg-[#020B18]/98 backdrop-blur-2xl px-5 py-6 overflow-y-auto space-y-6 animate-in fade-in duration-150 pb-28">
          {/* User Header Profile Tile */}
          {user ? (
            <div className="p-4 rounded-2xl bg-[#04152D] border border-cyan-500/30 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=0284C7&color=fff`
                  }
                  alt={user.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-cyan-400/40 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-black text-white text-sm truncate">{user.name}</div>
                  <div className="text-xs text-slate-400 truncate font-mono">{user.email}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex-shrink-0">
                {user.role}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-center rounded-xl bg-scalora-navy border border-scalora-blue/30 text-white font-bold text-xs"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-center rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-xs shadow-glow-blue"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Section 1: Learning */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Learning
            </h3>
            <div className="rounded-2xl bg-[#04152D] border border-white/10 divide-y divide-white/5 overflow-hidden shadow-md">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>My Courses</span>
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                <span>Continue Learning</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Certificates</span>
              </Link>
              <Link
                to="/my-study-plan"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <Target className="w-4 h-4 text-cyan-300" />
                <span>Progress Planner</span>
              </Link>
            </div>
          </div>

          {/* Section 2: Community */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Community
            </h3>
            <div className="rounded-2xl bg-[#04152D] border border-white/10 divide-y divide-white/5 overflow-hidden shadow-md">
              <Link
                to="/community"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Community Feed</span>
              </Link>
              <Link
                to="/community?tab=members"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Members</span>
              </Link>
              <Link
                to="/community?tab=resources"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Resources</span>
              </Link>
              <Link
                to="/community?tab=events"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Events</span>
              </Link>
            </div>
          </div>

          {/* Section 3: Notifications */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Notifications
            </h3>
            <div className="rounded-2xl bg-[#04152D] border border-white/10 divide-y divide-white/5 overflow-hidden shadow-md">
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>Notification Center</span>
                </div>
                {unreadNotifCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    {unreadNotifCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Section 4: Account */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Account
            </h3>
            <div className="rounded-2xl bg-[#04152D] border border-white/10 divide-y divide-white/5 overflow-hidden shadow-md">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span>Profile</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help</span>
              </Link>
              {user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
