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
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-4 text-slate-900">
      {/* 1. USER PROFILE CARD */}
      {user && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden group">
          <div className="flex items-center gap-3.5 relative z-10">
            <button
              type="button"
              onClick={onOpenMyProfile}
              className="relative focus:outline-none flex-shrink-0 group/avatar"
            >
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563EB&color=fff`
                }
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shadow-sm group-hover/avatar:scale-105 transition-transform"
              />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0 shadow-sm" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 truncate leading-tight">{user.name}</div>
              <div className="flex items-center gap-1.5 mt-1">
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-amber-600" />
                    <span>Administrator</span>
                  </span>
                ) : isTrainer ? (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Instructor</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <GraduationCap className="w-2.5 h-2.5" />
                    <span>Scholar</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Gamification Level & XP Progress Bar */}
          <div className="space-y-1.5 pt-1 relative z-10">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-blue-700 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Level 4 Scholar</span>
              </span>
              <span className="text-slate-500 font-mono text-[10px]">720 / 1,000 XP</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                style={{ width: '72%' }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMyProfile}
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200 relative z-10"
          >
            <span>View My Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. COMMUNITY NAVIGATION MENU */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-1 text-xs font-semibold">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Navigation</span>
        </div>

        {/* 1. Community Feed */}
        <button
          type="button"
          onClick={() => {
            onSelectMainTab('FEED');
            onSelectFilter('ALL');
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
            activeMainTab === 'FEED' && activeFilter !== 'SAVED'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare
              className={`w-4 h-4 ${
                activeMainTab === 'FEED' && activeFilter !== 'SAVED' ? 'text-blue-600' : 'text-slate-400'
              }`}
            />
            <span>Community Feed</span>
          </div>
          {activeMainTab === 'FEED' && activeFilter !== 'SAVED' && (
            <span className="w-2 h-2 rounded-full bg-blue-600" />
          )}
        </button>

        {/* 2. Group Chat */}
        <button
          type="button"
          onClick={() => onSelectMainTab('CHAT')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
            activeMainTab === 'CHAT'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Radio className={`w-4 h-4 ${activeMainTab === 'CHAT' ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span>Group Chat</span>
          </div>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            Live
          </span>
        </button>

        {/* 3. Resources Vault */}
        <button
          type="button"
          onClick={() => onSelectMainTab('RESOURCES')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
            activeMainTab === 'RESOURCES'
              ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold shadow-sm'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FolderDown className={`w-4 h-4 ${activeMainTab === 'RESOURCES' ? 'text-purple-600' : 'text-slate-400'}`} />
            <span>Resources</span>
          </div>
        </button>

        {/* 4. Members Directory */}
        <button
          type="button"
          onClick={() => onSelectMainTab('MEMBERS')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
            activeMainTab === 'MEMBERS'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className={`w-4 h-4 ${activeMainTab === 'MEMBERS' ? 'text-blue-600' : 'text-slate-400'}`} />
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
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
            activeFilter === 'SAVED'
              ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold shadow-sm'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bookmark
              className={`w-4 h-4 ${
                activeFilter === 'SAVED' ? 'text-amber-600 fill-amber-600' : 'text-slate-400'
              }`}
            />
            <span>Saved Bookmarks</span>
          </div>
          {activeFilter === 'SAVED' && <ChevronRight className="w-3.5 h-3.5 text-amber-600" />}
        </button>

        {isAdmin && (
          <Link
            to="/admin/community"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-blue-700 hover:bg-blue-50 transition-all border border-blue-100 mt-2 font-bold"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Community Settings</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
          </Link>
        )}
      </div>

      {/* 3. MY COMMUNITIES */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          <span className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>My Tracks ({channels.length})</span>
          </span>
        </div>

        {/* Channels Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Communities Roster */}
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
          {filteredChannels.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 text-center">No tracks found</p>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = selectedChannelId === channel.id && activeFilter !== 'SAVED';
              const trainersCount = (channel.course as any)?.trainers?.length || 1;
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => onSelectChannel(channel.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-2 group ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-sm font-bold'
                      : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 group-hover:scale-105 transition-transform'
                      }`}
                    >
                      <Hash className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate leading-tight flex items-center gap-1.5">
                        <span className="truncate">{channel.name}</span>
                        {channel.isLocked && <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{channel.membersCount} Members</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">{trainersCount} Trainers</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
