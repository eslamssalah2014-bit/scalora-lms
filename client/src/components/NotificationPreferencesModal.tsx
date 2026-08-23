import React, { useState, useEffect } from 'react';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermission,
  getNotificationPermission,
  NotificationPreferences,
} from '../lib/pushNotifications';
import {
  Bell,
  X,
  Check,
  Volume2,
  VolumeX,
  MessageSquare,
  Users,
  BookOpen,
  Megaphone,
  AtSign,
  ShieldCheck,
} from 'lucide-react';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences());
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [requesting, setRequesting] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrefs(getNotificationPreferences());
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    saveNotificationPreferences(updated);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleEnableNativePush = async () => {
    setRequesting(true);
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    setRequesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#071325] rounded-3xl border border-cyan-500/30 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Notification Settings</h2>
              <p className="text-[11px] text-slate-400">Control which alerts you receive</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Native Browser / PWA Permission Banner */}
        {permission !== 'granted' && (
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Enable Device Push Notifications</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Receive alerts on your lock screen and desktop even when Scalora is minimized.
            </p>
            <button
              type="button"
              onClick={handleEnableNativePush}
              disabled={requesting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white text-xs font-bold shadow-glow-accent hover:opacity-95 transition-all"
            >
              {requesting ? 'Requesting Permission...' : 'Allow Push Notifications'}
            </button>
          </div>
        )}

        {/* Preferences List */}
        <div className="space-y-3">
          {[
            {
              key: 'messages' as const,
              label: 'Direct Messages',
              desc: 'Private inquiries and instructor replies',
              icon: MessageSquare,
            },
            {
              key: 'community' as const,
              label: 'Community Activity',
              desc: 'Comments, likes, and replies on discussions',
              icon: Users,
            },
            {
              key: 'mentions' as const,
              label: 'Mentions & Tags',
              desc: 'When someone tags you in a post or chat',
              icon: AtSign,
            },
            {
              key: 'courses' as const,
              label: 'Course Updates',
              desc: 'New lessons, curriculum blueprints, and quizzes',
              icon: BookOpen,
            },
            {
              key: 'announcements' as const,
              label: 'System & Announcements',
              desc: 'Platform updates and scheduled maintenance',
              icon: Megaphone,
            },
            {
              key: 'sound' as const,
              label: 'Notification Sound',
              desc: 'Play subtle audio alert on new notification',
              icon: Volume2,
            },
          ].map((item) => {
            const isChecked = prefs[item.key];
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                onClick={() => handleToggle(item.key)}
                className="p-3.5 rounded-2xl bg-[#040C1A] border border-white/5 hover:border-white/15 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/5 text-slate-300 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 ${
                    isChecked ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-white/10">
          <span className="text-[11px] text-emerald-400 font-semibold">
            {savedMessage ? '✓ Preferences saved automatically' : 'Changes apply immediately'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
