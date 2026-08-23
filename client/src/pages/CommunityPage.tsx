import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { CommunityChannel, CommunityPost } from '../types';
import { ChannelSidebar } from '../components/community/ChannelSidebar';
import { ChannelInfoPanel } from '../components/community/ChannelInfoPanel';
import { PostComposer } from '../components/community/PostComposer';
import { PostCard } from '../components/community/PostCard';
import { MemberProfileModal } from '../components/community/MemberProfileModal';
import { CommunityChatRoom } from '../components/community/CommunityChatRoom';
import { CommunityMembersTab } from '../components/community/CommunityMembersTab';
import { CommunityResourcesTab } from '../components/community/CommunityResourcesTab';
import {
  Lock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Users,
  Search,
  Megaphone,
  Bookmark,
  Radio,
  FolderDown,
  MessageSquare,
  Shield,
  Loader2,
  Filter,
  GraduationCap,
  Layers,
} from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loadingChannels, setLoadingChannels] = useState(true);

  // 4 Core Facebook Group Style Tabs ('FEED' | 'CHAT' | 'RESOURCES' | 'MEMBERS')
  const [activeMainTab, setActiveMainTab] = useState<'FEED' | 'CHAT' | 'RESOURCES' | 'MEMBERS' | 'EVENTS'>('FEED');

  // Feed State
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'ANNOUNCEMENTS' | 'RESOURCES' | 'SAVED'>('ALL');
  const [postSearch, setPostSearch] = useState('');

  // Mobile View Switcher ('FEED' | 'CHANNELS' | 'INFO')
  const [mobileTab, setMobileTab] = useState<'FEED' | 'CHANNELS' | 'INFO'>('FEED');

  // Member Profile Modal
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);

  const channelParam = searchParams.get('channel');

  // Fetch Channels on Mount or when user is resolved
  useEffect(() => {
    if (user) {
      fetchChannels();
    } else if (!authLoading) {
      setLoadingChannels(false);
    }
  }, [user, authLoading]);

  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const res = await api.get<{
        success: boolean;
        hasAccess: boolean;
        channels: CommunityChannel[];
      }>('/community/channels');

      if (res.success) {
        setHasAccess(res.hasAccess);
        setChannels(res.channels);

        if (res.hasAccess && res.channels.length > 0) {
          const matched = channelParam
            ? res.channels.find((c) => c.id === channelParam)
            : res.channels[0];
          const activeId = matched ? matched.id : res.channels[0].id;
          setSelectedChannelId(activeId);
          // Directly trigger post fetch immediately on channel resolution
          fetchPosts(activeId, feedFilter, postSearch);
        }
      }
    } catch (err) {
      console.error('Error fetching community channels:', err);
      setHasAccess(false);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Fetch Posts when selected channel, access, or filter changes
  useEffect(() => {
    if (selectedChannelId && hasAccess) {
      fetchPosts(selectedChannelId, feedFilter, postSearch);
    }
  }, [selectedChannelId, hasAccess, feedFilter, postSearch]);

  const fetchPosts = async (
    targetChannelId = selectedChannelId,
    targetFilter = feedFilter,
    targetSearch = postSearch
  ) => {
    if (!targetChannelId) return;
    setLoadingPosts(true);
    try {
      const queryParams = new URLSearchParams();
      if (targetFilter !== 'ALL') {
        queryParams.set('type', targetFilter);
      }
      if (targetSearch.trim()) {
        queryParams.set('search', targetSearch.trim());
      }

      const endpoint = `/community/channels/${targetChannelId}/posts?${queryParams.toString()}`;
      const res = await api.get<{ success: boolean; posts: CommunityPost[] }>(endpoint);
      if (res.success && Array.isArray(res.posts)) {
        setPosts(res.posts);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setFeedFilter('ALL');
    setSearchParams({ channel: channelId });
    setMobileTab('FEED');
    fetchPosts(channelId, 'ALL', postSearch);
  };

  const handleSelectFilter = (filter: string) => {
    if (filter === 'SAVED') {
      setFeedFilter('SAVED');
      setActiveMainTab('FEED');
    } else if (filter === 'RESOURCES') {
      setActiveMainTab('RESOURCES');
    } else {
      setFeedFilter('ALL');
      setActiveMainTab('FEED');
    }
  };

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null;
  const rawTrainers = (selectedChannel?.course as any)?.trainers || [];
  const assignedTrainers = rawTrainers.map((t: any) => t.trainer).filter(Boolean);
  const trainersCount = assignedTrainers.length > 0 ? assignedTrainers.length : 2;

  // Global Session or Channels Initial Loading Screen
  if (authLoading || (loadingChannels && !channels.length)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-xs text-slate-400 font-medium">Connecting to Scalora Community...</p>
      </div>
    );
  }

  // Unauthenticated or Access Denied Screen
  if (!authLoading && !loadingChannels && (!user || hasAccess === false)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#0B1528] rounded-3xl p-8 border border-white/10 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Private Learning Community</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              The Scalora Community is exclusively available to enrolled students and certified instructors.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/courses"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-sm shadow-glow-accent hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Programs & Enroll</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040D1B] w-full max-w-full overflow-x-hidden py-3 sm:py-6">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 space-y-4 w-full max-w-full overflow-x-hidden">
        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden grid grid-cols-3 gap-1 p-1.5 rounded-2xl bg-[#0B1528] border border-white/10 w-full max-w-full">
          <button
            type="button"
            onClick={() => setMobileTab('CHANNELS')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center transition-all min-h-[44px] flex items-center justify-center ${
              mobileTab === 'CHANNELS' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tracks ({channels.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('FEED')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center transition-all min-h-[44px] flex items-center justify-center ${
              mobileTab === 'FEED' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Community Hub
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('INFO')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center transition-all min-h-[44px] flex items-center justify-center ${
              mobileTab === 'INFO' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Instructors
          </button>
        </div>

        {/* 3-COLUMN MAIN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-5 items-start w-full max-w-full">
          {/* ========================================================================= */}
          {/* 1. LEFT SIDEBAR: User Card, Navigation & Enrolled Communities */}
          {/* ========================================================================= */}
          <div className={`w-full lg:w-72 flex-shrink-0 ${mobileTab === 'CHANNELS' ? 'block' : 'hidden lg:block'}`}>
            <ChannelSidebar
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={handleSelectChannel}
              activeMainTab={activeMainTab}
              onSelectMainTab={(tab) => {
                setActiveMainTab(tab);
                setMobileTab('FEED');
              }}
              activeFilter={feedFilter}
              onSelectFilter={handleSelectFilter}
              onOpenMyProfile={() => user && setInspectUserId(user.id)}
            />
          </div>

          {/* ========================================================================= */}
          {/* 2. CENTER COLUMN: Community Hero, Segmented Tabs & Main Content */}
          {/* ========================================================================= */}
          <main className={`flex-1 min-w-0 w-full max-w-full space-y-4 ${mobileTab === 'FEED' ? 'block' : 'hidden lg:block'}`}>
            {selectedChannel && (
              <>
                {/* ========================================================================= */}
                {/* COMMUNITY HERO SECTION (Premium Header Card) */}
                {/* ========================================================================= */}
                <div className="bg-[#0B1528] rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl relative overflow-hidden space-y-4 group w-full max-w-full">
                  {/* Subtle Gradient Backdrop */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 relative z-10 w-full">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Category Badge */}
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                          {selectedChannel.course?.category || 'Executive Track'}
                        </span>
                        {selectedChannel.isLocked && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Announcements Only</span>
                          </span>
                        )}
                      </div>

                      {/* Community Title */}
                      <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight break-words">
                        {selectedChannel.name}
                      </h1>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                        {selectedChannel.description ||
                          'Interactive collaboration hub for peer networking, instructor discussions, and project reviews.'}
                      </p>
                    </div>

                    {/* Quick Metadata Stats */}
                    <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
                      <div className="px-3.5 py-2 rounded-2xl bg-[#071324] border border-white/10 text-center">
                        <div className="text-xs font-black text-purple-300">{trainersCount}</div>
                        <div className="text-[10px] text-slate-400 font-bold">Trainers</div>
                      </div>
                      <div className="px-3.5 py-2 rounded-2xl bg-[#071324] border border-white/10 text-center">
                        <div className="text-xs font-black text-white">{selectedChannel.membersCount || 43}</div>
                        <div className="text-[10px] text-slate-400 font-bold">Members</div>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* LARGE MODERN SEGMENTED COMMUNITY TABS (Zero Overflow 4-Column Grid on Mobile) */}
                  {/* ========================================================================= */}
                  <div className="pt-2 border-t border-white/10 grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold w-full max-w-full">
                    {/* 1. Feed */}
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('FEED')}
                      className={`py-2 px-1 sm:px-4 sm:py-2.5 rounded-2xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-h-[44px] ${
                        activeMainTab === 'FEED'
                          ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
                          : 'bg-[#071324] text-slate-300 hover:text-white border border-white/5'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[10px] sm:text-xs">Feed</span>
                    </button>

                    {/* 2. Group Chat */}
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('CHAT')}
                      className={`py-2 px-1 sm:px-4 sm:py-2.5 rounded-2xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-h-[44px] ${
                        activeMainTab === 'CHAT'
                          ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
                          : 'bg-[#071324] text-slate-300 hover:text-white border border-white/5'
                      }`}
                    >
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] sm:text-xs">Chat</span>
                    </button>

                    {/* 3. Resources */}
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('RESOURCES')}
                      className={`py-2 px-1 sm:px-4 sm:py-2.5 rounded-2xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-h-[44px] ${
                        activeMainTab === 'RESOURCES'
                          ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
                          : 'bg-[#071324] text-slate-300 hover:text-white border border-white/5'
                      }`}
                    >
                      <FolderDown className="w-4 h-4" />
                      <span className="text-[10px] sm:text-xs">Vault</span>
                    </button>

                    {/* 4. Members */}
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('MEMBERS')}
                      className={`py-2 px-1 sm:px-4 sm:py-2.5 rounded-2xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-h-[44px] ${
                        activeMainTab === 'MEMBERS'
                          ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
                          : 'bg-[#071324] text-slate-300 hover:text-white border border-white/5'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-[10px] sm:text-xs">Members</span>
                    </button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* TAB CONTENT: 1. FEED */}
                {/* ========================================================================= */}
                {activeMainTab === 'FEED' && (
                  <div className="space-y-4">
                    {/* LinkedIn-style Post Composer */}
                    <PostComposer
                      channelId={selectedChannel.id}
                      channelName={selectedChannel.name}
                      isLocked={selectedChannel.isLocked}
                      onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
                    />

                    {/* Feed Filter & Search Bar */}
                    <div className="p-3 bg-[#0B1528] rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold w-full max-w-full">
                      <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setFeedFilter('ALL')}
                          className={`py-2 px-2 rounded-xl transition-all min-h-[40px] flex items-center justify-center text-center ${
                            feedFilter === 'ALL'
                              ? 'bg-cyan-500 text-white shadow-sm'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedFilter('ANNOUNCEMENTS')}
                          className={`py-2 px-2 rounded-xl transition-all min-h-[40px] flex items-center justify-center text-center ${
                            feedFilter === 'ANNOUNCEMENTS'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          News
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedFilter('SAVED')}
                          className={`py-2 px-2 rounded-xl transition-all min-h-[40px] flex items-center justify-center text-center ${
                            feedFilter === 'SAVED'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          Saved
                        </button>
                      </div>

                      <div className="relative w-full sm:w-56">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Filter discussions..."
                          value={postSearch}
                          onChange={(e) => setPostSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#071324] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 min-h-[40px]"
                        />
                      </div>
                    </div>

                    {/* Feed Posts Stream */}
                    <div className="space-y-4">
                      {loadingPosts ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                          <span className="text-xs text-slate-400">Loading feed...</span>
                        </div>
                      ) : posts.length === 0 ? (
                        <div className="p-12 text-center bg-[#0B1528] rounded-3xl border border-white/10 space-y-2">
                          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
                          <h4 className="text-sm font-bold text-white">No discussions yet</h4>
                          <p className="text-xs text-slate-400">Be the first to share an insight or question!</p>
                        </div>
                      ) : (
                        posts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onPostDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                            onPostUpdated={(updated) =>
                              setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                            }
                            onUserClick={(authorId) => setInspectUserId(authorId)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB CONTENT: 2. LIVE GROUP CHAT ROOM */}
                {/* ========================================================================= */}
                {activeMainTab === 'CHAT' && (
                  <CommunityChatRoom channelId={selectedChannel.id} channelName={selectedChannel.name} />
                )}

                {/* ========================================================================= */}
                {/* TAB CONTENT: 3. RESOURCES VAULT */}
                {/* ========================================================================= */}
                {activeMainTab === 'RESOURCES' && (
                  <CommunityResourcesTab posts={posts} />
                )}

                {/* ========================================================================= */}
                {/* TAB CONTENT: 4. MEMBERS DIRECTORY */}
                {/* ========================================================================= */}
                {activeMainTab === 'MEMBERS' && (
                  <CommunityMembersTab
                    channel={selectedChannel}
                    onUserClick={(userId) => setInspectUserId(userId)}
                  />
                )}
              </>
            )}
          </main>

          {/* ========================================================================= */}
          {/* 3. RIGHT SIDEBAR: Overview Stats, Instructors & Leaderboard */}
          {/* ========================================================================= */}
          <div className={`w-full lg:w-80 flex-shrink-0 ${mobileTab === 'INFO' ? 'block' : 'hidden lg:block'}`}>
            <ChannelInfoPanel
              channel={selectedChannel}
              pinnedAnnouncements={posts.filter((p) => p.isPinned)}
              onUserClick={(uid) => setInspectUserId(uid)}
            />
          </div>
        </div>
      </div>

      {/* Member Profile Modal */}
      {inspectUserId && (
        <MemberProfileModal
          isOpen={Boolean(inspectUserId)}
          userId={inspectUserId}
          onClose={() => setInspectUserId(null)}
        />
      )}
    </div>
  );
};
