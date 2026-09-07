import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CommunityChannel, CommunityPost } from '../../types';
import {
  Users,
  Info,
  ShieldCheck,
  Megaphone,
  Download,
  BookOpen,
  Sparkles,
  Lock,
  ChevronRight,
  ExternalLink,
  Calendar,
  Award,
  Clock,
  Radio,
  Mail,
  Trophy,
  Flame,
} from 'lucide-react';

interface ChannelInfoPanelProps {
  channel: CommunityChannel | null;
  pinnedAnnouncements: CommunityPost[];
  onSelectPost?: (postId: string) => void;
  onUserClick?: (userId: string) => void;
}

export const ChannelInfoPanel: React.FC<ChannelInfoPanelProps> = ({
  channel,
  pinnedAnnouncements,
  onSelectPost,
  onUserClick,
}) => {
  const navigate = useNavigate();
  if (!channel) return null;

  // Extract trainers from course relation
  const rawTrainers = (channel.course as any)?.trainers || [];
  const assignedTrainers = rawTrainers.map((t: any) => t.trainer).filter(Boolean);

  // Fallback if no trainers explicitly assigned yet
  const displayTrainers =
    assignedTrainers.length > 0
      ? assignedTrainers
      : [
          {
            id: 'lead-instructor',
            name: 'Eslam Salah',
            title: 'Lead Operations Instructor',
            avatar: null,
            role: 'TRAINER',
          },
        ];

  const handleMessageTrainer = (trainerId: string) => {
    navigate(`/messages?trainer=${trainerId}`);
  };

  // Mock Top Contributors for Leaderboard
  const topContributors = [
    { rank: 1, name: 'Karim Mahmoud', xp: '1,420 XP', role: 'Scholar', avatar: null, badge: '🥇' },
    { rank: 2, name: 'Nour El-Din', xp: '1,180 XP', role: 'Scholar', avatar: null, badge: '🥈' },
    { rank: 3, name: 'Sara Ahmed', xp: '950 XP', role: 'Scholar', avatar: null, badge: '🥉' },
  ];

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-4">
      {/* ========================================================================= */}
      {/* 1. COMMUNITY OVERVIEW CARD */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Community Overview</span>
          </div>
          {channel.isLocked && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Announcements</span>
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-black text-slate-900 leading-snug">{channel.name}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {channel.description || 'Private collaboration and social-learning hub for enrolled peers and certified instructors.'}
          </p>
        </div>

        {/* 3 Overview Statistics Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <div className="text-lg font-black text-blue-600">{displayTrainers.length}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Trainers</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <div className="text-lg font-black text-slate-900">{channel.membersCount || 43}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Members</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
            <div className="text-lg font-black text-blue-600">{channel.postsCount || 18}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Discussions</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ASSIGNED INSTRUCTORS SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
          <span className="flex items-center gap-2 text-slate-900 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Course Instructors</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {displayTrainers.length} Assigned
          </span>
        </div>

        <div className="space-y-3">
          {displayTrainers.map((trainer: any) => (
            <div
              key={trainer.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 transition-all hover:border-blue-300"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    trainer.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(trainer.name)}&background=2563EB&color=fff`
                  }
                  alt={trainer.name}
                  className="w-10 h-10 rounded-xl object-cover border border-blue-200 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <span>{trainer.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-blue-100 text-blue-700">
                      Pro
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-600 font-semibold truncate">
                    {trainer.title || 'Course Lead'}
                  </div>
                </div>
              </div>

              {/* Message Instructor CTA Button */}
              <button
                type="button"
                onClick={() => handleMessageTrainer(trainer.id)}
                className="w-full py-2 rounded-lg bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Message Instructor</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. UPCOMING LIVE SESSION CARD */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-500">
          <span className="flex items-center gap-2 text-rose-600 font-bold">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Upcoming Live Session</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Weekly AMA
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 space-y-2.5">
          <div className="text-xs font-bold text-slate-900 leading-tight">
            Advanced Operations & Automation Masterclass
          </div>

          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-rose-500" />
              <span>This Thursday, August 27</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-rose-500" />
              <span>07:00 PM (GMT+3) • 60 Mins</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('Live session link will activate 15 minutes before scheduled start time.')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-sm shadow-rose-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Join Live Session</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TOP CONTRIBUTORS LEADERBOARD */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
          <span className="flex items-center gap-2 text-slate-900 font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Top Contributors</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>Leaderboard</span>
          </span>
        </div>

        <div className="space-y-2">
          {topContributors.map((c) => (
            <div
              key={c.rank}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5 transition-all hover:bg-slate-100"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{c.badge}</span>
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=E2E8F0&color=0F172A`}
                  alt={c.name}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-500">{c.role}</div>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 font-mono">
                {c.xp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
