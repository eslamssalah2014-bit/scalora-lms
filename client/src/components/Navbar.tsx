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
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // Fetch unread count & subscribe to Realtime User Inbox
  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial count
    api
      .get<{ success: boolean; conversations: any[] }>('/messages/conversations')
      .then((res) => {
        if (res.success && Array.isArray(res.conversations)) {
          const totalUnread = res.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadMsgCount(totalUnread);
        }
      })
      .catch(() => {});

    // Connect and listen to Realtime Push Events
    const unsub = realtime.on('new_direct_message', () => {
      if (location.pathname !== '/messages') {
        setUnreadMsgCount((prev) => prev + 1);
      }
    });

    return () => {
      unsub();
    };
  }, [user?.id, location.pathname]);

  // Clear unread count when viewing messages page
  useEffect(() => {
    if (location.pathname === '/messages') {
      setUnreadMsgCount(0);
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

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-scalora-navy/50 text-slate-300 hover:text-white border border-scalora-blue/20"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-scalora-blue" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-scalora-blue/15 bg-[#04152D]/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-scalora-blue/10"
          >
            Home
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-scalora-blue/10"
          >
            Services
          </Link>
          <Link
            to="/community"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-scalora-blue/10"
          >
            Community
          </Link>
          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-scalora-blue/10"
          >
            Courses
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-scalora-blue/10"
          >
            About
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-scalora-blue/10"
          >
            Contact
          </Link>

          {user ? (
            <div className="pt-4 border-t border-scalora-blue/15 space-y-2">
              <div className="px-3 py-2 bg-scalora-navy/40 rounded-xl flex items-center gap-3">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=2D8CFF&color=fff`
                  }
                  alt={user.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-scalora-blue">{user.email}</div>
                </div>
              </div>

              {user.role === 'ADMIN' ? (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-base font-semibold text-scalora-accent bg-scalora-accent/10"
                >
                  Admin Console
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-base font-semibold text-scalora-blue bg-scalora-blue/10"
                >
                  Student Dashboard
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-rose-400 font-medium hover:bg-rose-500/10"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-scalora-blue/15 grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-xl bg-scalora-navy border border-scalora-blue/20 text-white font-medium text-sm"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-semibold text-sm shadow-glow-blue"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
