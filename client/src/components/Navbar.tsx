import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Briefcase,
  Layers,
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

  const isAppRoute = [
    '/dashboard',
    '/profile',
    '/my-study-plan',
    '/study-plan',
    '/messages',
    '/notifications',
    '/trainer',
    '/learn',
    '/quiz',
    '/community',
  ].some((p) => location.pathname.startsWith(p));

  // Scroll Lock when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Auto-close menu on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Fetch unread count & subscribe to Realtime User Inbox & Notifications
  useEffect(() => {
    if (!user?.id) return;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      import('../lib/pushNotifications').then((m) => m.subscribeToPushNotifications());
    }

    api
      .get<{ success: boolean; conversations: any[] }>('/messages/conversations')
      .then((res) => {
        if (res.success && Array.isArray(res.conversations)) {
          const totalUnread = res.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadMsgCount(totalUnread);
        }
      })
      .catch(() => {});

    api
      .get<{ success: boolean; unreadCount: number }>('/notifications?tab=UNREAD&limit=1')
      .then((res) => {
        if (res.success && typeof res.unreadCount === 'number') {
          setUnreadNotifCount(res.unreadCount);
        }
      })
      .catch(() => {});

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

  // Render Light Header for public pages and Dark Header for internal LMS
  const isLight = !isAppRoute;

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        isLight
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'
          : 'bg-[#04152D]/90 backdrop-blur-md border-b border-scalora-blue/15'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div
              className={`w-10 h-10 rounded-xl p-1.5 shadow-sm transition-transform group-hover:scale-105 flex items-center justify-center ${
                isLight
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-[#04152D] border border-scalora-blue/30 shadow-glow-blue'
              }`}
            >
              <img src="/scalora-icon-transparent.png" alt="Scalora Logo" className="w-full h-full object-contain" />
            </div>
            <span
              className={`text-2xl font-black tracking-tight flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Scalora <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive('/')
                  ? isLight
                    ? 'text-blue-600 bg-blue-50/80 border border-blue-200/60'
                    : 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : isLight
                  ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link
              to="/courses"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive('/courses')
                  ? isLight
                    ? 'text-blue-600 bg-blue-50/80 border border-blue-200/60'
                    : 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : isLight
                  ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Courses
            </Link>
            <Link
              to="/services"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive('/services')
                  ? isLight
                    ? 'text-blue-600 bg-blue-50/80 border border-blue-200/60'
                    : 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : isLight
                  ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Services
            </Link>
            <Link
              to="/community"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive('/community')
                  ? isLight
                    ? 'text-blue-600 bg-blue-50/80 border border-blue-200/60'
                    : 'text-cyan-300 bg-cyan-500/10 border border-cyan-400/20'
                  : isLight
                  ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Community
            </Link>
            <Link
              to="/about"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive('/about')
                  ? isLight
                    ? 'text-blue-600 bg-blue-50/80 border border-blue-200/60'
                    : 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : isLight
                  ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive('/contact')
                  ? isLight
                    ? 'text-blue-600 bg-blue-50/80 border border-blue-200/60'
                    : 'text-scalora-blue bg-scalora-blue/10 border border-scalora-blue/20'
                  : isLight
                  ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* User / Auth CTA */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                {/* 1. Notifications Bell */}
                <NotificationDropdown />

                {/* 2. Messages */}
                <Link
                  to="/messages"
                  className={`p-2.5 rounded-2xl transition-all relative flex items-center justify-center ${
                    isActive('/messages')
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                      : 'bg-[#0B1528] hover:bg-[#0F1E3A] text-slate-300 hover:text-cyan-300 border border-white/10'
                  }`}
                  title="Messages & Inquiries"
                >
                  <Mail className="w-4 h-4" />
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px] border-2 border-white animate-pulse">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>

                {/* 3. User Profile Button */}
                <div className="relative pl-1">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-2xl transition-all focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        : 'bg-[#0B1528] hover:bg-[#0F1E3A] border border-white/10'
                    }`}
                  >
                    <img
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=2563EB&color=fff`
                      }
                      alt={user.name}
                      className="w-7 h-7 rounded-xl object-cover border border-blue-400/40 shadow-sm"
                    />
                    <div className="text-left hidden lg:block">
                      <div
                        className={`text-xs font-bold leading-tight ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {user.name}
                      </div>
                      <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                        {user.role}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-60 rounded-2xl py-2 shadow-2xl border animate-in fade-in zoom-in-95 duration-150 z-50 ${
                        isLight
                          ? 'bg-white border-slate-200 shadow-slate-900/10 text-slate-800'
                          : 'glass-panel border-scalora-blue/30 text-white'
                      }`}
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div
                        className={`px-4 py-2.5 border-b ${
                          isLight ? 'border-slate-100' : 'border-scalora-blue/15'
                        }`}
                      >
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {user.email}
                        </p>
                      </div>

                      {user.role === 'ADMIN' ? (
                        <Link
                          to="/admin"
                          className={`flex items-center space-x-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                            isLight
                              ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                              : 'text-slate-200 hover:text-white hover:bg-scalora-blue/20'
                          }`}
                        >
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span>Admin Console</span>
                        </Link>
                      ) : user.role === 'TRAINER' ? (
                        <Link
                          to="/trainer"
                          className={`flex items-center space-x-2.5 px-4 py-2.5 text-sm font-bold transition-colors ${
                            isLight
                              ? 'text-blue-600 hover:bg-blue-50'
                              : 'text-cyan-300 hover:text-white hover:bg-cyan-500/20'
                          }`}
                        >
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span>Trainer Workspace</span>
                        </Link>
                      ) : (
                        <Link
                          to="/dashboard"
                          className={`flex items-center space-x-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                            isLight
                              ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                              : 'text-slate-200 hover:text-white hover:bg-scalora-blue/20'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4 text-blue-600" />
                          <span>Student Dashboard</span>
                        </Link>
                      )}

                      <Link
                        to="/messages"
                        className={`flex items-center space-x-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                          isLight
                            ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                            : 'text-slate-200 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>Direct Inquiries</span>
                      </Link>

                      <Link
                        to="/community"
                        className={`flex items-center space-x-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                          isLight
                            ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                            : 'text-cyan-300 hover:text-white hover:bg-cyan-500/20'
                        }`}
                      >
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>Scalora Community</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        className={`flex items-center space-x-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                          isLight
                            ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                            : 'text-slate-200 hover:text-white hover:bg-scalora-blue/20'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>My Enrolled Courses</span>
                      </Link>

                      <Link
                        to="/my-study-plan"
                        className={`flex items-center space-x-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                          isLight
                            ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                            : 'text-cyan-300 hover:text-white hover:bg-cyan-500/20'
                        }`}
                      >
                        <Target className="w-4 h-4 text-blue-600" />
                        <span>My Study Plan</span>
                      </Link>

                      {/* PWA Install Option */}
                      {isInstalled ? (
                        <div className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>App Installed ✓</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            installApp();
                          }}
                          className={`w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm font-semibold transition-colors text-left ${
                            isLight
                              ? 'text-blue-600 hover:bg-blue-50'
                              : 'text-cyan-300 hover:text-white hover:bg-cyan-500/20'
                          }`}
                        >
                          <Download className="w-4 h-4 text-blue-600" />
                          <span>Install Scalora App</span>
                        </button>
                      )}

                      <div className={`border-t my-1 ${isLight ? 'border-slate-100' : 'border-scalora-blue/15'}`} />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold"
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
                  className={`px-4 py-2 text-sm font-bold transition-colors ${
                    isLight ? 'text-slate-700 hover:text-blue-600' : 'text-slate-200 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Action Cluster */}
          <div className="flex md:hidden items-center space-x-1.5">
            {user ? (
              <>
                <Link
                  to="/notifications"
                  className={`p-2 rounded-xl transition-all relative flex items-center justify-center min-w-[36px] min-h-[36px] ${
                    isActive('/notifications')
                      ? 'bg-blue-600 text-white'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-[#0B1528] text-slate-300 border border-white/10'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[9px] border border-white animate-pulse">
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/messages"
                  className={`p-2 rounded-xl transition-all relative flex items-center justify-center min-w-[36px] min-h-[36px] ${
                    isActive('/messages')
                      ? 'bg-blue-600 text-white'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-[#0B1528] text-slate-300 border border-white/10'
                  }`}
                  title="Messages"
                >
                  <Mail className="w-4 h-4" />
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] border border-white animate-pulse">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>

                <Link
                  to={user.role === 'ADMIN' ? '/admin' : user.role === 'TRAINER' ? '/trainer' : '/dashboard'}
                  className="p-0.5 rounded-xl border border-blue-500/30 flex-shrink-0"
                  title="My Profile"
                >
                  <img
                    src={
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name
                      )}&background=2563EB&color=fff`
                    }
                    alt={user.name}
                    className="w-7 h-7 rounded-[10px] object-cover"
                  />
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`p-2 rounded-xl ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
                      : 'bg-scalora-navy/50 text-slate-300 hover:text-white border border-scalora-blue/20'
                  }`}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-2.5 py-1.5 text-xs font-bold ${
                    isLight ? 'text-slate-700 hover:text-blue-600' : 'text-slate-200 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
                >
                  Get Started
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`p-2 rounded-xl ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
                      : 'bg-scalora-navy/50 text-slate-300 hover:text-white border border-scalora-blue/20'
                  }`}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Full-Screen Navigation Drawer via Portal */}
      {mobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={`fixed inset-0 z-[99999] flex flex-col justify-between animate-in fade-in duration-150 ${
              isLight ? 'bg-white text-slate-900' : 'bg-[#020B18] text-white'
            }`}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
            }}
          >
            {/* Top Bar with Logo & Close Button */}
            <div
              className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#030F20] border-cyan-500/20'
              }`}
            >
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2.5">
                <img src="/scalora-icon-transparent.png" alt="Scalora" className="w-8 h-8 object-contain" />
                <span className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  SCALORA
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 rounded-2xl transition-all active:scale-95 ${
                  isLight ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-300' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-28">
              {/* User Profile Card */}
              {user ? (
                <div
                  className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#04152D] border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=2563EB&color=fff`
                      }
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-blue-400/40 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className={`font-black text-base truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate font-mono">{user.email}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                    {user.role}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-3.5 text-center rounded-xl font-bold text-sm border ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-scalora-navy border-cyan-500/30 text-white'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-3.5 text-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <div
                className={`rounded-2xl border divide-y overflow-hidden shadow-sm ${
                  isLight ? 'bg-white border-slate-200 divide-slate-100' : 'bg-[#04152D] border-white/10 divide-white/5'
                }`}
              >
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-4 text-sm font-bold transition-colors ${
                    isLight ? 'text-slate-800 hover:bg-slate-50' : 'text-white hover:bg-white/5'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span>Home</span>
                </Link>

                <Link
                  to="/courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-4 text-sm font-bold transition-colors ${
                    isLight ? 'text-slate-800 hover:bg-slate-50' : 'text-white hover:bg-white/5'
                  }`}
                >
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Courses</span>
                </Link>

                <Link
                  to="/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-4 text-sm font-bold transition-colors ${
                    isLight ? 'text-slate-800 hover:bg-slate-50' : 'text-white hover:bg-white/5'
                  }`}
                >
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <span>Services</span>
                </Link>

                <Link
                  to="/community"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-4 text-sm font-bold transition-colors ${
                    isLight ? 'text-slate-800 hover:bg-slate-50' : 'text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Community</span>
                </Link>

                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-4 text-sm font-bold transition-colors ${
                    isLight ? 'text-slate-800 hover:bg-slate-50' : 'text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>About Us</span>
                </Link>

                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-4 text-sm font-bold transition-colors ${
                    isLight ? 'text-slate-800 hover:bg-slate-50' : 'text-white hover:bg-white/5'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Contact & Book Consultation</span>
                </Link>

                {user && (
                  <>
                    <Link
                      to="/messages"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-4 text-sm font-bold transition-colors ${
                        isLight ? 'text-slate-800 hover:bg-slate-50' : 'text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <span>Messages</span>
                      </div>
                      {unreadMsgCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                          {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-4 text-sm font-bold transition-colors ${
                        isLight ? 'text-slate-800 hover:bg-slate-50' : 'text-white hover:bg-white/5'
                      }`}
                    >
                      <User className="w-5 h-5 text-blue-600" />
                      <span>Profile</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-4 text-sm font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
