import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CommunityChannel } from '../../types';
import {
  Hash,
  Lock,
  Bookmark,
  Search,
  Users,
  Layers,
  Sparkles,
  BookOpen,
  ChevronRight,
  Shield,
  GraduationCap,
} from 'lucide-react';

interface ChannelSidebarProps {
  channels: CommunityChannel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onOpenMyProfile: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  activeFilter,
  onSelectFilter,
  onOpenMyProfile,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-5">
      {/* Community Brand Card */}
      <div className="glass-card rounded-3xl p-5 border border-cyan-500/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shadow-glow-accent">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Scalora Community</h2>
            <p className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Private Social Network</span>
            </p>
          </div>
        </div>

        {/* Search Channels */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-scalora-navy/80 border border-scalora-blue/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Global Feeds Filter */}
        <div className="space-y-1 pt-1 border-t border-scalora-blue/15 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onSelectFilter('SAVED')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
              activeFilter === 'SAVED'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bookmark className={`w-3.5 h-3.5 ${activeFilter === 'SAVED' ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              <span>Saved Bookmarks</span>
            </div>
            {activeFilter === 'SAVED' && <ChevronRight className="w-3.5 h-3.5 text-amber-300" />}
          </button>
        </div>
      </div>

      {/* Course Channels List */}
      <div className="glass-card rounded-3xl p-5 border border-scalora-blue/20 space-y-3">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Course Channels ({channels.length})</span>
          </span>
        </div>

        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-scalora-blue/30">
          {filteredChannels.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-2">No channels matching "{searchTerm}"</p>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = selectedChannelId === channel.id && activeFilter !== 'SAVED';
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => onSelectChannel(channel.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start justify-between gap-2 group ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-scalora-blue/30 text-white border border-cyan-400/50 shadow-glow-accent'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'bg-cyan-500 text-white' : 'bg-scalora-navy/80 text-cyan-400 group-hover:scale-105 transition-transform'
                      }`}
                    >
                      <Hash className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
                        <span className="truncate">{channel.name}</span>
                        {channel.isLocked && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{channel.membersCount} members</span>
                        <span>•</span>
                        <span>{channel.postsCount} posts</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* User Quick Profile Card */}
      {user && (
        <div className="glass-card rounded-3xl p-4 border border-scalora-blue/20 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={
                user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2D8CFF&color=fff`
              }
              alt={user.name}
              className="w-10 h-10 rounded-xl object-cover border border-cyan-400/30 shadow-md"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">
                {user.role === 'ADMIN' ? 'Administrator' : 'Active Learner'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMyProfile}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 text-[11px] font-bold transition-all"
          >
            Profile
          </button>
        </div>
      )}
    </aside>
  );
};
