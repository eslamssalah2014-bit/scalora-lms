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
  Radio,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChannelSidebarProps {
  channels: CommunityChannel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  activeMainTab: 'FEED' | 'CHAT' | 'MEMBERS' | 'RESOURCES' | 'EVENTS';
  onSelectMainTab: (tab: 'FEED' | 'CHAT' | 'MEMBERS' | 'RESOURCES' | 'EVENTS') => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onOpenMyProfile: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  activeMainTab,
  onSelectMainTab,
  activeFilter,
  onSelectFilter,
  onOpenMyProfile,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTrainer = user?.role === 'TRAINER';
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">
      {/* ========================================================================= */}
      {/* 1. USER PROFILE CARD (Gamification, XP & Badges) */}
      {/* ========================================================================= */}
      {user && (
        <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-xl space-y-4 relative overflow-hidden group">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
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
                className="w-13 h-13 rounded-2xl object-cover border-2 border-cyan-400 shadow-glow-blue group-hover/avatar:scale-105 transition-transform"
              />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0B1528] absolute -bottom-0.5 -right-0.5 shadow-sm animate-pulse" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-white truncate leading-tight">{user.name}</div>
              <div className="flex items-center gap-1.5 mt-1">
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>Administrator</span>
                  </span>
                ) : isTrainer ? (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Instructor</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <GraduationCap className="w-2.5 h-2.5" />
                    <span>Active Scholar</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Gamification Level & XP Progress Bar */}
          <div className="space-y-1.5 pt-1 relative z-10">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-cyan-300 flex items-center gap-1">
                <Award className="w-3 h-3 text-cyan-400" />
                <span>Level 4</span>
              </span>
              <span className="text-slate-400 font-mono text-[10px]">720 / 1,000 XP</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#050C1A] border border-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-scalora-blue to-purple-500 shadow-glow-accent transition-all duration-500"
                style={{ width: '72%' }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMyProfile}
            className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/10 relative z-10"
          >
            <span>View My Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. COMMUNITY NAVIGATION MENU */}
      {/* ========================================================================= */}
      <div className="bg-[#0B1528] rounded-3xl p-3 sm:p-4 border border-white/10 shadow-xl space-y-1 text-xs font-semibold">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center gap-2">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>Navigation</span>
        </div>

        {/* 1. Community Feed */}
        <button
          type="button"
          onClick={() => {
            onSelectMainTab('FEED');
            onSelectFilter('ALL');
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
            activeMainTab === 'FEED' && activeFilter !== 'SAVED'
              ? 'bg-gradient-to-r from-cyan-500/20 to-scalora-blue/20 text-white border border-cyan-400/40 shadow-glow-accent'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare
              className={`w-4 h-4 ${
                activeMainTab === 'FEED' && activeFilter !== 'SAVED' ? 'text-cyan-400' : 'text-slate-400'
              }`}
            />
            <span>Community Feed</span>
          </div>
          {activeMainTab === 'FEED' && activeFilter !== 'SAVED' && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-accent" />
          )}
        </button>

        {/* 2. Group Chat */}
        <button
          type="button"
          onClick={() => onSelectMainTab('CHAT')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
            activeMainTab === 'CHAT'
              ? 'bg-gradient-to-r from-cyan-500/20 to-scalora-blue/20 text-white border border-cyan-400/40 shadow-glow-accent'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Radio className={`w-4 h-4 ${activeMainTab === 'CHAT' ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Group Chat</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            Live
          </span>
        </button>

        {/* 3. Resources Vault */}
        <button
          type="button"
          onClick={() => onSelectMainTab('RESOURCES')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
            activeMainTab === 'RESOURCES'
              ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-400/40 shadow-glow-accent'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FolderDown className={`w-4 h-4 ${activeMainTab === 'RESOURCES' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>Resources</span>
          </div>
        </button>

        {/* 4. Members Directory */}
        <button
          type="button"
          onClick={() => onSelectMainTab('MEMBERS')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
            activeMainTab === 'MEMBERS'
              ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-400/40 shadow-glow-accent'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className={`w-4 h-4 ${activeMainTab === 'MEMBERS' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Members</span>
          </div>
        </button>

        {/* 5. Saved Bookmarks */}
        <button
          type="button"
          onClick={() => {
            onSelectMainTab('FEED');
            onSelectFilter('SAVED');
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
            activeFilter === 'SAVED'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-glow-amber'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bookmark
              className={`w-4 h-4 ${
                activeFilter === 'SAVED' ? 'text-amber-400 fill-amber-400' : 'text-slate-400'
              }`}
            />
            <span>Saved Bookmarks</span>
          </div>
          {activeFilter === 'SAVED' && <ChevronRight className="w-3.5 h-3.5 text-amber-300" />}
        </button>

        {isAdmin && (
          <Link
            to="/admin/community"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-cyan-300 hover:bg-cyan-500/10 transition-all border border-cyan-500/20 mt-2"
          >
            <div className="flex items-center gap-2.5 font-bold">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Community Settings</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
          </Link>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MY COMMUNITIES (Enrolled Course Hubs) */}
      {/* ========================================================================= */}
      <div className="bg-[#0B1528] rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
          <span className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>My Communities ({channels.length})</span>
          </span>
        </div>

        {/* Channels Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#091324] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        {/* Communities Roster */}
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
          {filteredChannels.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 text-center">No communities found</p>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = selectedChannelId === channel.id && activeFilter !== 'SAVED';
              const trainersCount = (channel.course as any)?.trainers?.length || 1;
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
                        <span>{channel.membersCount} Members</span>
                        <span>•</span>
                        <span className="text-cyan-300 font-semibold">{trainersCount} Trainers</span>
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
