import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Target,
  BookOpen,
  Users,
  CreditCard,
  HelpCircle,
  Settings,
  GraduationCap,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  ChevronRight,
  MessageSquare,
  Bell,
  Smartphone,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'PWA Analytics', path: '/admin/pwa-analytics', icon: Smartphone },
    { label: 'Notifications Broadcast', path: '/admin/notifications', icon: Bell },
    { label: 'Trainers', path: '/admin/trainers', icon: Shield },
    { label: 'Community Management', path: '/admin/community', icon: MessageSquare },
    { label: 'Payments Verification', path: '/admin/payments', icon: CreditCard },
    { label: 'Leads Center', path: '/admin/leads', icon: Target },
    { label: 'Courses', path: '/admin/courses', icon: BookOpen },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Enrollments', path: '/admin/enrollments', icon: GraduationCap },
    { label: 'Quizzes', path: '/admin/quizzes', icon: HelpCircle },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#020C1B] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Nav */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#04152D] border-b border-scalora-blue/20">
        <Link to="/admin" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#04152D] border border-scalora-blue/30 p-1 flex items-center justify-center">
            <img src="/scalora-icon-transparent.png" alt="Scalora Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-lg text-white">Scalora Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-scalora-navy text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside
        className={`${
          mobileOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-[#04152D] border-r border-scalora-blue/15 flex-shrink-0 flex flex-col justify-between p-5 z-40`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="hidden md:flex items-center justify-between pb-4 border-b border-scalora-blue/15">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#04152D] border border-scalora-blue/30 p-1.5 shadow-glow-blue flex items-center justify-center">
                <img src="/scalora-icon-transparent.png" alt="Scalora Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xl font-black text-white">Scalora</span>
                <span className="text-[10px] block font-bold text-scalora-accent uppercase tracking-widest -mt-1">
                  Admin Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Admin Tag */}
          <div className="px-3.5 py-2.5 rounded-xl bg-scalora-navy/60 border border-scalora-blue/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-scalora-blue/20 flex items-center justify-center text-scalora-accent">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'Eslam Salah (Admin)'}</div>
              <div className="text-[10px] text-scalora-blue font-medium">Administrator</div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-scalora-blue to-scalora-hover text-white shadow-glow-blue'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {active && <ChevronRight className="w-4 h-4 text-white/80" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-scalora-blue/15 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-scalora-blue" />
              <span>Public Website</span>
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-[#020C1B] p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
