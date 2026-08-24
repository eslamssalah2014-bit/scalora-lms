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
    <div className="min-h-screen bg-[#040D1B] w-full max-w-full overflow-x-hidden py-3 sm:py-6 pb-24">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4 w-full max-w-full overflow-x-hidden">
        {/* Top Channel Selector & Clean Segmented Tabs (Feed | Chat | Resources | Members) */}
        <div className="bg-[#0B1528] rounded-xl p-2.5 sm:p-3 border border-white/10 shadow-sm space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Channel Title & Switcher */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <h1 className="text-xs sm:text-sm font-black text-white truncate">
                {selectedChannel?.name || 'Community Hub'}
              </h1>
            </div>

            {/* If multiple channels exist, allow clean switching */}
            {channels.length > 1 && (
              <select
                value={selectedChannelId || ''}
                onChange={(e) => handleSelectChannel(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#04152D] text-xs text-white border border-white/10 font-bold focus:outline-none"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Top 4 Core Tabs */}
          <div className="grid grid-cols-4 gap-1 pt-0.5 border-t border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveMainTab('FEED')}
              className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 min-h-[34px] ${
                activeMainTab === 'FEED'
                  ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-sm'
                  : 'bg-[#04152D] text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Feed</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('CHAT')}
              className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 min-h-[34px] ${
                activeMainTab === 'CHAT'
                  ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-sm'
                  : 'bg-[#04152D] text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('RESOURCES')}
              className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 min-h-[34px] ${
                activeMainTab === 'RESOURCES'
                  ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-sm'
                  : 'bg-[#04152D] text-slate-400 hover:text-white'
              }`}
            >
              <FolderDown className="w-3 h-3" />
              <span>Resources</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('MEMBERS')}
              className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 min-h-[34px] ${
                activeMainTab === 'MEMBERS'
                  ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-sm'
                  : 'bg-[#04152D] text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Members</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="w-full max-w-full">
          <main className="w-full max-w-full space-y-3">
            {selectedChannel && (
              <>
                {activeMainTab === 'FEED' && (
                  <div className="space-y-3">
                    {/* LinkedIn-style Post Composer */}
                    <PostComposer
                      channelId={selectedChannel.id}
                      channelName={selectedChannel.name}
                      isLocked={selectedChannel.isLocked}
                      onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
                    />

                    {/* Feed Filter & Search Bar */}
                    <div className="p-2.5 bg-[#0B1528] rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold w-full max-w-full">
                      <div className="grid grid-cols-3 sm:flex items-center gap-1 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setFeedFilter('ALL')}
                          className={`py-1.5 px-2 rounded-lg transition-all min-h-[34px] flex items-center justify-center text-center ${
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
                          className={`py-1.5 px-2 rounded-lg transition-all min-h-[34px] flex items-center justify-center text-center ${
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
                          className={`py-1.5 px-2 rounded-lg transition-all min-h-[34px] flex items-center justify-center text-center ${
                            feedFilter === 'SAVED'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          Saved
                        </button>
                      </div>

                      <div className="relative w-full sm:w-56">
                        <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Filter discussions..."
                          value={postSearch}
                          onChange={(e) => setPostSearch(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-[#071324] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 min-h-[34px]"
                        />
                      </div>
                    </div>

                    {/* Feed Posts Stream */}
                    <div className="space-y-3">
                      {loadingPosts ? (
                        <div className="py-16 text-center flex flex-col items-center justify-center space-y-2">
                          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                          <span className="text-xs text-slate-400">Loading feed...</span>
                        </div>
                      ) : posts.length === 0 ? (
                        <div className="p-8 text-center bg-[#0B1528] rounded-2xl border border-white/10 space-y-1.5">
                          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                          <h4 className="text-xs font-bold text-white">No discussions yet</h4>
                          <p className="text-[11px] text-slate-400">Be the first to share an insight or question!</p>
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
