import React from 'react';
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
  if (!channel) return null;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-4">
      {/* 1. CHANNEL OVERVIEW CARD */}
      <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>About Community</span>
          </div>
          {channel.isLocked && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Announcements Only</span>
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-black text-white leading-snug">{channel.name}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {channel.description || 'Private collaboration and social-learning hub for enrolled peers.'}
          </p>
        </div>

        {/* Linked Course Pill */}
        {channel.course && (
          <div className="p-3 rounded-2xl bg-[#091324] border border-white/10 flex items-center gap-3">
            {channel.course.thumbnail && (
              <img
                src={channel.course.thumbnail}
                alt={channel.course.title}
                className="w-10 h-10 rounded-xl object-cover border border-cyan-500/30 flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">Enrolled Track</div>
              <div className="text-xs font-bold text-white truncate">{channel.course.title}</div>
            </div>
          </div>
        )}

        {/* Quick Stats Counter */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-center">
          <div className="p-3 rounded-2xl bg-[#091324] border border-white/5">
            <div className="text-xl font-black text-white">{channel.membersCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Members</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#091324] border border-white/5">
            <div className="text-xl font-black text-cyan-300">{channel.postsCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discussions</div>
          </div>
        </div>
      </div>

      {/* 2. UPCOMING LIVE SESSIONS & AMAs WIDGET (UI Prototype) */}
      <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2 text-cyan-300">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Upcoming Live AMA</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Weekly
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#091324] border border-cyan-500/20 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-cyan-300 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Every Thursday • 7:00 PM UTC</span>
          </div>
          <div className="text-xs font-bold text-white leading-snug">
            Cohort Architecture Review & Office Hours with Eslam Salah
          </div>
          <p className="text-[11px] text-slate-400">
            Bring your blueprints, code roadblocks, and system architecture for live breakdown.
          </p>
          <button
            type="button"
            className="w-full py-2 mt-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-all border border-cyan-400/30"
          >
            RSVP & Add to Calendar
          </button>
        </div>
      </div>

      {/* 3. PINNED ANNOUNCEMENTS */}
      {pinnedAnnouncements.length > 0 && (
        <div className="bg-[#0B1528] rounded-3xl p-5 border border-amber-500/30 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>Pinned Highlights</span>
          </div>

          <div className="space-y-2">
            {pinnedAnnouncements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => onSelectPost && onSelectPost(ann.id)}
                className="p-3 rounded-2xl bg-[#091324] border border-amber-500/20 hover:border-amber-400/50 cursor-pointer transition-all space-y-1 group"
              >
                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                  {ann.title || 'Official Announcement'}
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TOP CONTRIBUTORS LEADERBOARD (Gamification) */}
      <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2 text-amber-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Top Contributors</span>
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">This Month</span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#091324] border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm">🥇</span>
              <div className="text-xs font-bold text-white">Eslam Salah</div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300">
              Instructor
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#091324] border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm">🥈</span>
              <div className="text-xs font-bold text-white">Sarah Mitchell</div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-400">
              24 posts
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#091324] border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm">🥉</span>
              <div className="text-xs font-bold text-white">Shahd Ashraf</div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-400">
              18 posts
            </span>
          </div>
        </div>
      </div>

      {/* 5. CHANNEL MEMBERS ROSTER */}
      {channel.recentMembers && channel.recentMembers.length > 0 && (
        <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Members</span>
            </span>
            <span className="text-slate-500 text-[11px] font-semibold">{channel.membersCount} total</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 pt-1">
            {channel.recentMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onUserClick && onUserClick(member.id)}
                className="group flex flex-col items-center space-y-1 focus:outline-none"
                title={member.name}
              >
                <div className="relative">
                  <img
                    src={
                      member.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0284C7&color=fff`
                    }
                    alt={member.name}
                    className="w-11 h-11 rounded-2xl object-cover border border-white/10 group-hover:scale-105 group-hover:border-cyan-400 transition-all shadow-md"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-[#0B1528]" />
                </div>
                <span className="text-[10px] text-slate-300 font-semibold truncate max-w-[64px] group-hover:text-white transition-colors">
                  {member.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. COMMUNITY STANDARDS */}
      <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-2 text-xs text-slate-400 leading-relaxed">
        <div className="font-bold text-white flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Community Standards</span>
        </div>
        <ul className="space-y-1 list-disc pl-4 text-[11px]">
          <li>Share actionable insights and code blueprints.</li>
          <li>Be respectful and constructive in feedback.</li>
          <li>No spam or self-promotion without admin approval.</li>
          <li>Never post production credentials or secrets.</li>
        </ul>
      </div>
    </aside>
  );
};
