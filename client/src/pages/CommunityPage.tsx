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
import {
  Lock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Users,
  Search,
  Megaphone,
  Paperclip,
  ImageIcon,
  Bookmark,
  Layers,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Filter,
  MessageSquare,
  Compass,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loadingChannels, setLoadingChannels] = useState(true);

  // Feed State
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'ANNOUNCEMENTS' | 'RESOURCES' | 'MEDIA' | 'SAVED'>('ALL');
  const [postSearch, setPostSearch] = useState('');

  // Mobile View Switcher Tab ('FEED' | 'CHANNELS' | 'INFO')
  const [mobileTab, setMobileTab] = useState<'FEED' | 'CHANNELS' | 'INFO'>('FEED');

  // Member Profile Modal
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);

  const channelParam = searchParams.get('channel');
  const postParam = searchParams.get('post');

  // Fetch Channels on Mount
  useEffect(() => {
    if (user) {
      fetchChannels();
    } else {
      setLoadingChannels(false);
    }
  }, [user]);

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
          setSelectedChannelId(matched ? matched.id : res.channels[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching community channels:', err);
      setHasAccess(false);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Fetch Posts when selected channel or feed filter changes
  useEffect(() => {
    if (selectedChannelId && hasAccess) {
      fetchPosts();
    }
  }, [selectedChannelId, feedFilter, postSearch]);

  const fetchPosts = async () => {
    if (!selectedChannelId) return;
    setLoadingPosts(true);
    try {
      const queryParams = new URLSearchParams();
      if (feedFilter !== 'ALL') {
        queryParams.set('type', feedFilter);
      }
      if (postSearch.trim()) {
        queryParams.set('search', postSearch.trim());
      }

      const endpoint = `/community/channels/${selectedChannelId}/posts?${queryParams.toString()}`;
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
    setMobileTab('FEED'); // Switch back to feed on mobile selection
  };

  const handleSelectFilter = (filter: string) => {
    if (filter === 'SAVED') {
      setFeedFilter('SAVED');
    } else if (filter === 'RESOURCES') {
      setFeedFilter('RESOURCES');
    } else {
      setFeedFilter('ALL');
    }
    setMobileTab('FEED');
  };

  const handlePostCreated = (newPost: CommunityPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setChannels((prev) =>
      prev.map((c) => (c.id === newPost.channelId ? { ...c, postsCount: c.postsCount + 1 } : c))
    );
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (selectedChannelId) {
      setChannels((prev) =>
        prev.map((c) => (c.id === selectedChannelId ? { ...c, postsCount: Math.max(0, c.postsCount - 1) } : c))
      );
    }
  };

  const handlePostUpdated = (updated: CommunityPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const currentChannel = channels.find((c) => c.id === selectedChannelId) || null;
  const pinnedAnnouncements = posts.filter((p) => p.isPinned || p.isAnnouncement);

  // =========================================================================
  // 1. PUBLIC VISITOR TEASER (Not logged in)
  // =========================================================================
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-extrabold tracking-widest uppercase shadow-glow-accent">
            <Users className="w-3.5 h-3.5" />
            <span>Scalora Social-Learning Network</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Learn with peers.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-scalora-blue to-scalora-accent">
              Build together.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Scalora Community is a private, cohort-based social learning platform. Every course enrollment unlocks an
            exclusive channel with weekly live AMAs, code blueprint vaults, and direct access to instructors.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-sm shadow-glow-accent hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Sign In to Community</span>
            </Link>
            <Link
              to="/courses"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0B1528] hover:bg-[#0F1D38] text-white font-bold text-sm border border-cyan-400/40 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-cyan-300" />
              <span>Browse All Courses</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. LOADING STATE
  // =========================================================================
  if (loadingChannels) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-sm font-bold text-slate-300">Synchronizing Scalora Community Feed...</p>
      </div>
    );
  }

  // =========================================================================
  // 3. ZERO-ENROLLMENT LOCKED STATE
  // =========================================================================
  if (hasAccess === false) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto border border-amber-500/40 shadow-glow-amber">
          <Lock className="w-10 h-10" />
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
            <span>Exclusive Scalora Member Network</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            You must be enrolled in a course to join the Scalora Community.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            The Scalora Community is an exclusive social network engineered for registered students. Once you
            enroll in any track, you will immediately gain access to that course's private channel, peer discussion feed,
            and downloadable architecture blueprints.
          </p>
        </div>

        {/* Community Perks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-4">
          <div className="bg-[#0B1528] p-5 rounded-2xl border border-cyan-500/20 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="text-sm font-bold text-white">Private Course Channels</h4>
            <p className="text-xs text-slate-400">Direct peer communication and topic-specific discussion channels.</p>
          </div>

          <div className="bg-[#0B1528] p-5 rounded-2xl border border-emerald-500/20 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="text-sm font-bold text-white">Resource & Blueprint Vault</h4>
            <p className="text-xs text-slate-400">Download production-tested Helm charts, scripts, and SOPs.</p>
          </div>

          <div className="bg-[#0B1528] p-5 rounded-2xl border border-purple-500/20 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="text-sm font-bold text-white">Direct Instructor AMAs</h4>
            <p className="text-xs text-slate-400">Live weekly architectural reviews and feedback sessions.</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-black text-sm shadow-glow-accent hover:opacity-95 transform hover:-translate-y-0.5 transition-all"
          >
            <BookOpen className="w-5 h-5" />
            <span>Explore Course Catalog & Enroll</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. MAIN INTERACTIVE 3-COLUMN COMMUNITY PLATFORM
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Mobile / Tablet View Switcher Tabs (Hidden on Desktop) */}
      <div className="lg:hidden flex items-center p-1 rounded-2xl bg-[#0B1528] border border-white/10 text-xs font-bold shadow-lg">
        <button
          type="button"
          onClick={() => setMobileTab('CHANNELS')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'CHANNELS'
              ? 'bg-cyan-500 text-white shadow-glow-accent'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Channels</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('FEED')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'FEED'
              ? 'bg-cyan-500 text-white shadow-glow-accent'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Feed</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('INFO')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'INFO'
              ? 'bg-cyan-500 text-white shadow-glow-accent'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>About</span>
        </button>
      </div>

      {/* Main 3-Column Responsive Grid */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* LEFT COLUMN: Channels Switcher & Profile Card */}
        <div className={`w-full lg:w-72 lg:block ${mobileTab === 'CHANNELS' ? 'block' : 'hidden'}`}>
          <div className="lg:sticky lg:top-24">
            <ChannelSidebar
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={handleSelectChannel}
              activeFilter={feedFilter}
              onSelectFilter={handleSelectFilter}
              onOpenMyProfile={() => user?.id && setInspectUserId(user.id)}
            />
          </div>
        </div>

        {/* CENTER COLUMN: Feed Header, Fixed Post Creator, Feed Stream */}
        <main className={`flex-1 min-w-0 w-full space-y-5 ${mobileTab === 'FEED' ? 'block' : 'hidden lg:block'}`}>
          {/* Feed Header Banner */}
          {currentChannel && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#071A36] via-[#0B254E] to-[#041226] border border-cyan-500/30 shadow-2xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {currentChannel.course?.category || 'Active Track'}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">• {currentChannel.membersCount} Members</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{currentChannel.name}</h1>
                  <p className="text-xs text-slate-300 line-clamp-2">{currentChannel.description}</p>
                </div>
              </div>

              {/* Feed Filter Chips & Live Search */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFeedFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      feedFilter === 'ALL'
                        ? 'bg-cyan-500 text-white shadow-glow-accent'
                        : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    All Discussions
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedFilter('ANNOUNCEMENTS')}
                    className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                      feedFilter === 'ANNOUNCEMENTS'
                        ? 'bg-amber-500 text-white shadow-glow-amber'
                        : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Megaphone className="w-3 h-3" />
                    <span>Announcements</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedFilter('RESOURCES')}
                    className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                      feedFilter === 'RESOURCES'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Paperclip className="w-3 h-3" />
                    <span>Resources</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedFilter('MEDIA')}
                    className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                      feedFilter === 'MEDIA'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Media</span>
                  </button>
                </div>

                {/* Post Live Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search in feed..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Facebook-Style Post Creator */}
          {currentChannel && feedFilter !== 'SAVED' && (
            <PostComposer
              channelId={currentChannel.id}
              channelName={currentChannel.name}
              isLocked={currentChannel.isLocked}
              onPostCreated={handlePostCreated}
            />
          )}

          {/* Posts Feed Stream */}
          <div className="space-y-4">
            {loadingPosts ? (
              <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
                <Loader2 className="w-9 h-9 animate-spin text-cyan-400" />
                <span>Fetching latest discussions...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-[#0B1528] rounded-3xl space-y-3 p-8 border border-white/10 shadow-xl">
                <MessageSquare className="w-12 h-12 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No discussions found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {postSearch
                    ? `No discussions matching "${postSearch}". Try another keyword.`
                    : 'Be the first to share an insight, ask an architecture question, or post a code blueprint!'}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  onPostUpdated={handlePostUpdated}
                  onUserClick={(uid) => setInspectUserId(uid)}
                />
              ))
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Community Info & Leaderboard */}
        <div className={`w-full lg:w-80 lg:block ${mobileTab === 'INFO' ? 'block' : 'hidden'}`}>
          <div className="lg:sticky lg:top-24">
            <ChannelInfoPanel
              channel={currentChannel}
              pinnedAnnouncements={pinnedAnnouncements}
              onUserClick={(uid) => setInspectUserId(uid)}
            />
          </div>
        </div>
      </div>

      {/* Member Profile Modal */}
      <MemberProfileModal
        userId={inspectUserId}
        isOpen={Boolean(inspectUserId)}
        onClose={() => setInspectUserId(null)}
      />
    </div>
  );
};
