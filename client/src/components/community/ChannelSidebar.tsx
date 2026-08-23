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
  Megaphone,
  Compass,
  Award,
  Settings,
  FolderDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const isAdmin = user?.role === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">
      {/* 1. USER PROFILE CARD */}
      {user && (
        <div className="bg-[#0B1528] rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xl space-y-3.5 relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenMyProfile}
              className="relative focus:outline-none flex-shrink-0 group/avatar"
            >
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284C7&color=fff`
                }
                alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-md group-hover/avatar:scale-105 transition-transform"
              />
              <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0B1528] absolute -bottom-0.5 -right-0.5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-white truncate">{user.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>Administrator</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <GraduationCap className="w-2.5 h-2.5" />
                    <span>Active Scholar</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMyProfile}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/5"
          >
            <span>View My Profile & Badges</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. COMMUNITY MAIN NAVIGATION */}
      <div className="bg-[#0B1528] rounded-3xl p-3 sm:p-4 border border-white/10 shadow-xl space-y-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onSelectFilter('ALL')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
            activeFilter === 'ALL'
              ? 'bg-gradient-to-r from-cyan-500/20 to-scalora-blue/20 text-white border border-cyan-400/40 shadow-glow-accent'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Compass className={`w-4 h-4 ${activeFilter === 'ALL' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Community Feed</span>
          </div>
          {activeFilter === 'ALL' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter('SAVED')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
            activeFilter === 'SAVED'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-glow-amber'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className={`w-4 h-4 ${activeFilter === 'SAVED' ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
            <span>Saved Bookmarks</span>
          </div>
          {activeFilter === 'SAVED' && <ChevronRight className="w-3.5 h-3.5 text-amber-300" />}
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter('RESOURCES')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
            activeFilter === 'RESOURCES'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FolderDown className={`w-4 h-4 ${activeFilter === 'RESOURCES' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>Resource Vault</span>
          </div>
        </button>

        {isAdmin && (
          <Link
            to="/admin/community"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-cyan-300 hover:bg-cyan-500/10 transition-all border border-cyan-500/20 mt-2"
          >
            <div className="flex items-center gap-2.5 font-bold">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Community Management</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
          </Link>
        )}
      </div>

      {/* 3. COURSE CHANNELS LIST */}
      <div className="bg-[#0B1528] rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
          <span className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>My Channels ({channels.length})</span>
          </span>
        </div>

        {/* Channel Search Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#091324] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        {/* Channels Roster */}
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
          {filteredChannels.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 text-center">No channels matching "{searchTerm}"</p>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = selectedChannelId === channel.id && activeFilter !== 'SAVED';
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => onSelectChannel(channel.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between gap-2 group ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-scalora-blue/30 text-white border border-cyan-400/50 shadow-glow-accent'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 text-white shadow-md'
                          : 'bg-[#091324] text-cyan-400 group-hover:scale-105 transition-transform border border-white/5'
                      }`}
                    >
                      <Hash className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
                        <span className="truncate">{channel.name}</span>
                        {channel.isLocked && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{channel.membersCount} members</span>
                        <span>•</span>
                        <span>{channel.postsCount} posts</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
