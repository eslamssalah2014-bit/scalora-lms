import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { realtime } from '../lib/realtime';
import {
  Home,
  Users,
  MessageSquare,
  User,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadMsgCount, setUnreadMsgCount] = useState<number>(0);

  // Determine profile destination
  const getProfileLink = () => {
    if (!user) return '/login';
    return '/profile';
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Fetch unread count & subscribe to real-time message stream
  useEffect(() => {
    if (!user?.id) return;

    // 1. Fetch initial unread count
    api
      .get<{ success: boolean; conversations: any[] }>('/messages/conversations')
      .then((res) => {
        if (res.success && Array.isArray(res.conversations)) {
          const total = res.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadMsgCount(total);
        }
      })
      .catch(() => {});

    // 2. Real-time direct message listener
    const unsubscribe = realtime.on('new_direct_message', (msg: any) => {
      if (msg && msg.senderId !== user.id && !location.pathname.startsWith('/messages')) {
        setUnreadMsgCount((prev) => prev + 1);
      }
    });

    return () => unsubscribe();
  }, [user?.id, location.pathname]);

  // Reset count when entering messages page
  useEffect(() => {
    if (location.pathname.startsWith('/messages')) {
      setUnreadMsgCount(0);
    }
  }, [location.pathname]);

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/',
      active: isActive('/') && !location.pathname.startsWith('/profile') && !location.pathname.startsWith('/dashboard'),
    },
    {
      label: 'Community',
      icon: Users,
      path: '/community',
      active: isActive('/community'),
    },
    {
      label: 'Messages',
      icon: MessageSquare,
      path: '/messages',
      active: isActive('/messages'),
      badge: unreadMsgCount,
    },
    {
      label: user ? 'Profile' : 'Sign In',
      icon: User,
      path: getProfileLink(),
      active:
        isActive('/profile') ||
        isActive('/dashboard') ||
        isActive('/admin') ||
        isActive('/trainer') ||
        (!user && isActive('/login')),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#030F20]/95 backdrop-blur-2xl border-t border-cyan-500/20 shadow-2xl px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-4 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = item.active;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 min-h-[48px] rounded-2xl transition-all duration-200 ${
                isItemActive
                  ? 'text-cyan-300 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Pill Indicator */}
              {isItemActive && (
                <span className="absolute inset-0 bg-cyan-500/15 rounded-2xl border border-cyan-400/30" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isItemActive ? 'scale-110 text-cyan-300' : 'text-slate-400'
                  }`}
                />

                {/* Real-time Unread Badge Counter */}
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center border-2 border-[#04152D] animate-pulse shadow-md">
                    {item.badge! > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="text-[10px] tracking-tight mt-1 leading-none z-10 truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
