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
      <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Community Overview</span>
          </div>
          {channel.isLocked && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Announcements</span>
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-black text-white leading-snug">{channel.name}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {channel.description || 'Private collaboration and social-learning hub for enrolled peers and certified instructors.'}
          </p>
        </div>

        {/* 3 Overview Statistics Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-2xl bg-[#091324] border border-white/5 space-y-0.5">
            <div className="text-lg font-black text-purple-400">{displayTrainers.length}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trainers</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#091324] border border-white/5 space-y-0.5">
            <div className="text-lg font-black text-white">{channel.membersCount || 43}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Members</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#091324] border border-white/5 space-y-0.5">
            <div className="text-lg font-black text-cyan-300">{channel.postsCount || 18}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Discussions</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ASSIGNED INSTRUCTORS SECTION */}
      {/* ========================================================================= */}
      <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-white/10">
          <span className="flex items-center gap-2 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Course Instructors</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {displayTrainers.length} Assigned
          </span>
        </div>

        <div className="space-y-3">
          {displayTrainers.map((trainer: any) => (
            <div
              key={trainer.id}
              className="p-3.5 rounded-2xl bg-[#071324] border border-white/5 space-y-2.5 transition-all hover:border-cyan-500/30"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    trainer.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(trainer.name)}&background=0284C7&color=fff`
                  }
                  alt={trainer.name}
                  className="w-10 h-10 rounded-2xl object-cover border border-cyan-400 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span>{trainer.name}</span>
                    <span className="px-1 py-0.2 rounded text-[8px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300">
                      Pro
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-semibold truncate">
                    {trainer.title || 'Course Lead'}
                  </div>
                </div>
              </div>

              {/* Message Instructor CTA Button */}
              <button
                type="button"
                onClick={() => handleMessageTrainer(trainer.id)}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-scalora-blue/20 hover:from-cyan-500 hover:to-scalora-blue text-cyan-300 hover:text-white text-xs font-bold border border-cyan-400/30 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Message Instructor</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. UPCOMING LIVE SESSION CARD */}
      {/* ========================================================================= */}
      <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2 text-rose-400">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Upcoming Live Session</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Weekly AMA
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-[#071324] to-[#071324] border border-rose-500/20 space-y-2.5">
          <div className="text-xs font-bold text-white leading-tight">
            Advanced Operations & Automation Masterclass
          </div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-rose-400" />
              <span>This Thursday, August 27</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-rose-400" />
              <span>07:00 PM (GMT+3) • 60 Mins</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('Live session link will activate 15 minutes before scheduled start time.')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs shadow-glow-rose hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Join Live Session</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TOP CONTRIBUTORS LEADERBOARD */}
      {/* ========================================================================= */}
      <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-white/10">
          <span className="flex items-center gap-2 text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Contributors</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Leaderboard</span>
          </span>
        </div>

        <div className="space-y-2">
          {topContributors.map((c) => (
            <div
              key={c.rank}
              className="p-2.5 rounded-2xl bg-[#071324] border border-white/5 flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{c.badge}</span>
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=0F172A&color=38BDF8`}
                  alt={c.name}
                  className="w-7 h-7 rounded-xl object-cover border border-white/10"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-400">{c.role}</div>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20 font-mono">
                {c.xp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
