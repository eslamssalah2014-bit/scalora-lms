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

  // 4 Core Tabs ('FEED' | 'CHAT' | 'RESOURCES' | 'MEMBERS')
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

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null;

  // Unauthenticated or Access Denied Screen (Light SaaS Design)
  if (!authLoading && !loadingChannels && (!user || hasAccess === false)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-white">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Private Learning Community</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The Scalora Community is exclusively available to enrolled students and certified instructors. Join an engineering track to participate in peer discussions, code reviews, and live office hours.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/courses"
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-white text-slate-900 w-full max-w-full overflow-x-hidden py-6 sm:py-10 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Top Channel Selector & Clean Segmented Tabs (Feed | Chat | Resources | Members) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Channel Title & Switcher */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">
                {selectedChannel?.name || (loadingChannels ? 'Connecting to Community...' : 'Community Hub')}
              </h1>
            </div>

            {/* If multiple channels exist, allow clean switching */}
            {channels.length > 1 && (
              <select
                value={selectedChannelId || ''}
                onChange={(e) => handleSelectChannel(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-800 border border-slate-300 font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
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
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveMainTab('FEED')}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
                activeMainTab === 'FEED'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Feed</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('CHAT')}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
                activeMainTab === 'CHAT'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('RESOURCES')}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
                activeMainTab === 'RESOURCES'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Resources</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('MEMBERS')}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
                activeMainTab === 'MEMBERS'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="w-full max-w-full">
          <main className="w-full max-w-full space-y-4">
            {activeMainTab === 'FEED' && (
              <div className="space-y-4">
                {/* LinkedIn-style Post Composer */}
                {selectedChannel && (
                  <PostComposer
                    channelId={selectedChannel.id}
                    channelName={selectedChannel.name}
                    isLocked={selectedChannel.isLocked}
                    onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
                  />
                )}

                {/* Feed Filter & Search Bar */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold w-full max-w-full">
                  <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setFeedFilter('ALL')}
                      className={`py-2 px-3 rounded-xl transition-all min-h-[36px] flex items-center justify-center text-center font-bold ${
                        feedFilter === 'ALL'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      All Discussions
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedFilter('ANNOUNCEMENTS')}
                      className={`py-2 px-3 rounded-xl transition-all min-h-[36px] flex items-center justify-center text-center font-bold ${
                        feedFilter === 'ANNOUNCEMENTS'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      News & Updates
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedFilter('SAVED')}
                      className={`py-2 px-3 rounded-xl transition-all min-h-[36px] flex items-center justify-center text-center font-bold ${
                        feedFilter === 'SAVED'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      Saved
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search discussions..."
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 min-h-[36px] transition-all"
                    />
                  </div>
                </div>

                {/* Feed Posts Stream with Instant Skeletons */}
                <div className="space-y-4">
                  {loadingPosts || loadingChannels ? (
                    <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-slate-100 rounded w-1/3" />
                              <div className="h-3 bg-slate-100/60 rounded w-1/4" />
                            </div>
                          </div>
                          <div className="space-y-2 pt-1">
                            <div className="h-3.5 bg-slate-100 rounded w-full" />
                            <div className="h-3.5 bg-slate-100 rounded w-4/5" />
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex gap-4">
                            <div className="h-6 bg-slate-100 rounded w-16" />
                            <div className="h-6 bg-slate-100 rounded w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2 max-w-md mx-auto">
                      <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
                      <h4 className="text-base font-bold text-slate-900">No discussions yet</h4>
                      <p className="text-xs text-slate-500">Be the first to share an insight, question, or architecture diagram!</p>
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

            {/* TAB CONTENT: 2. LIVE GROUP CHAT ROOM */}
            {activeMainTab === 'CHAT' && selectedChannel && (
              <CommunityChatRoom channelId={selectedChannel.id} channelName={selectedChannel.name} />
            )}

            {/* TAB CONTENT: 3. RESOURCES VAULT */}
            {activeMainTab === 'RESOURCES' && (
              <CommunityResourcesTab posts={posts} />
            )}

            {/* TAB CONTENT: 4. MEMBERS DIRECTORY */}
            {activeMainTab === 'MEMBERS' && selectedChannel && (
              <CommunityMembersTab
                channel={selectedChannel}
                onUserClick={(userId) => setInspectUserId(userId)}
              />
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
