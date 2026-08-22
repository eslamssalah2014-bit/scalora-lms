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
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-5">
      {/* Channel Overview Card */}
      <div className="glass-card rounded-3xl p-5 border border-scalora-blue/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-scalora-blue/15">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>About Channel</span>
          </div>
          {channel.isLocked && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Locked</span>
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-white leading-snug">{channel.name}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {channel.description || 'Private collaboration and discussion hub for this course.'}
          </p>
        </div>

        {/* Linked Course Pill */}
        {channel.course && (
          <div className="p-3 rounded-2xl bg-scalora-navy/80 border border-scalora-blue/20 flex items-center gap-3">
            {channel.course.thumbnail && (
              <img
                src={channel.course.thumbnail}
                alt={channel.course.title}
                className="w-10 h-10 rounded-xl object-cover border border-scalora-blue/30"
              />
            )}
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">Linked Track</div>
              <div className="text-xs font-bold text-white truncate">{channel.course.title}</div>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-center">
          <div className="p-3 rounded-2xl bg-scalora-navy/60 border border-scalora-blue/15">
            <div className="text-lg font-black text-white">{channel.membersCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Members</div>
          </div>
          <div className="p-3 rounded-2xl bg-scalora-navy/60 border border-scalora-blue/15">
            <div className="text-lg font-black text-cyan-300">{channel.postsCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posts</div>
          </div>
        </div>
      </div>

      {/* Pinned Announcements Widget */}
      {pinnedAnnouncements.length > 0 && (
        <div className="glass-card rounded-3xl p-5 border border-amber-500/30 space-y-3 bg-[#0A2244]/80">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>Pinned Announcements</span>
          </div>

          <div className="space-y-2">
            {pinnedAnnouncements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => onSelectPost && onSelectPost(ann.id)}
                className="p-3 rounded-2xl bg-[#04152D]/80 border border-amber-500/20 hover:border-amber-400/40 cursor-pointer transition-all space-y-1 group"
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

      {/* Channel Members Roster Preview */}
      {channel.recentMembers && channel.recentMembers.length > 0 && (
        <div className="glass-card rounded-3xl p-5 border border-scalora-blue/20 space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Channel Members</span>
            </span>
            <span className="text-slate-500 text-[11px] font-semibold">{channel.membersCount} total</span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
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
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2D8CFF&color=fff`
                    }
                    alt={member.name}
                    className="w-10 h-10 rounded-xl object-cover border border-scalora-blue/30 group-hover:scale-105 group-hover:border-cyan-400 transition-all shadow-md"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-[#04152D]" />
                </div>
                <span className="text-[10px] text-slate-300 font-semibold truncate max-w-[60px] group-hover:text-white transition-colors">
                  {member.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Community Rules / Etiquette */}
      <div className="glass-card rounded-3xl p-5 border border-scalora-blue/15 space-y-2 text-xs text-slate-400 leading-relaxed">
        <div className="font-bold text-white flex items-center gap-1.5 mb-1">
          <ShieldCheck className="w-4 h-4 text-cyan-300" />
          <span>Community Standards</span>
        </div>
        <ul className="space-y-1 list-disc pl-4 text-[11px]">
          <li>Keep discussions relevant to this course track.</li>
          <li>Be constructive and encourage peer learning.</li>
          <li>Never share sensitive API tokens or secrets.</li>
          <li>Report issues to instructors or admins.</li>
        </ul>
      </div>
    </aside>
  );
};
