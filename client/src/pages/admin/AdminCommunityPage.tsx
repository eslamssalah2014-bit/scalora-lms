import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { CommunityAdminOverview, PostType } from '../../types';
import {
  Users,
  MessageSquare,
  Hash,
  Lock,
  Unlock,
  Archive,
  Megaphone,
  Trash2,
  Pin,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  Send,
  CheckCircle2,
  Shield,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const AdminCommunityPage: React.FC = () => {
  const [data, setData] = useState<CommunityAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Broadcast Form State
  const [broadcastChannelId, setBroadcastChannelId] = useState('ALL');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [pinBroadcast, setPinBroadcast] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean } & CommunityAdminOverview>('/community/admin/overview');
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load community administration overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastContent.trim()) return;

    setBroadcasting(true);
    setBroadcastSuccess(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/community/admin/announcements', {
        channelId: broadcastChannelId,
        title: broadcastTitle.trim() || undefined,
        content: broadcastContent.trim(),
        pinPost: pinBroadcast,
      });

      if (res.success) {
        setBroadcastSuccess(res.message);
        setBroadcastTitle('');
        setBroadcastContent('');
        fetchOverview();
        setTimeout(() => setBroadcastSuccess(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Error broadcasting announcement.');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleToggleLock = async (channelId: string) => {
    try {
      const res = await api.patch<{ success: boolean; channel: any }>(`/community/admin/channels/${channelId}/lock`);
      if (res.success) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            channels: prev.channels.map((c) =>
              c.id === channelId ? { ...c, isLocked: res.channel.isLocked } : c
            ),
          };
        });
      }
    } catch (err) {
      console.error('Error toggling channel lock:', err);
    }
  };

  const handleToggleArchive = async (channelId: string) => {
    try {
      const res = await api.patch<{ success: boolean; channel: any }>(
        `/community/admin/channels/${channelId}/archive`
      );
      if (res.success) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            channels: prev.channels.map((c) =>
              c.id === channelId ? { ...c, isArchived: res.channel.isArchived } : c
            ),
          };
        });
      }
    } catch (err) {
      console.error('Error toggling archive:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to permanently delete this post as Admin?')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/community/posts/${postId}`);
      if (res.success) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentPosts: prev.recentPosts.filter((p) => p.id !== postId),
            stats: { ...prev.stats, totalPosts: Math.max(0, prev.stats.totalPosts - 1) },
          };
        });
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleTogglePin = async (postId: string) => {
    try {
      const res = await api.patch<{ success: boolean; isPinned: boolean }>(`/community/posts/${postId}/pin`);
      if (res.success) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentPosts: prev.recentPosts.map((p) =>
              p.id === postId ? { ...p, isPinned: res.isPinned } : p
            ),
          };
        });
      }
    } catch (err) {
      console.error('Error pinning post:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
        <p className="text-xs font-bold text-slate-400">Loading Community Administration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-scalora-blue/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Community Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Community Management</h1>
          <p className="text-xs text-slate-400">
            Moderate discussions, manage course channels, lock/archive spaces, and broadcast announcements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOverview}
            className="px-4 py-2 rounded-xl bg-scalora-navy border border-scalora-blue/30 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/community"
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-glow-accent"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Community Feed</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Metric Tiles */}
      {data?.stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card p-5 rounded-2xl space-y-2 border border-cyan-500/20">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Course Channels</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Hash className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{data.stats.totalChannels}</div>
            <p className="text-[11px] text-slate-400">1:1 Course Linked</p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2 border border-scalora-blue/20">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Members</span>
              <div className="w-8 h-8 rounded-lg bg-scalora-blue/20 text-scalora-accent flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-scalora-accent">{data.stats.totalMembers}</div>
            <p className="text-[11px] text-slate-400">Active enrollments synced</p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2 border border-emerald-500/20">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Posts</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{data.stats.totalPosts}</div>
            <p className="text-[11px] text-slate-400">Discussions & Blueprints</p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2 border border-amber-500/20">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Comments</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">{data.stats.totalComments}</div>
            <p className="text-[11px] text-slate-400">Peer answers & replies</p>
          </div>
        </div>
      )}

      {/* 2. Broadcast Announcement Composer */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 space-y-5 bg-[#071F42]/90">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shadow-glow-amber">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Broadcast Administrator Announcement</h2>
            <p className="text-xs text-slate-300">
              Send high-priority notifications and pinned announcements directly into course channel feeds.
            </p>
          </div>
        </div>

        {broadcastSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{broadcastSuccess}</span>
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Target Destination</label>
              <select
                value={broadcastChannelId}
                onChange={(e) => setBroadcastChannelId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-scalora-navy border border-scalora-blue/30 text-white font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">🌐 Broadcast to ALL Channels</option>
                {data?.channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-bold mb-1.5">Announcement Title</label>
              <input
                type="text"
                placeholder="e.g. 📢 Upcoming Live Architecture AMA on Thursday at 7 PM UTC"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-scalora-navy border border-scalora-blue/30 text-white font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Announcement Message</label>
            <textarea
              rows={3}
              placeholder="Write the full announcement text. All enrolled members of the target channel(s) will receive an instant notification..."
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-scalora-navy border border-scalora-blue/30 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-amber-400 resize-y"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={pinBroadcast}
                onChange={(e) => setPinBroadcast(e.target.checked)}
                className="rounded bg-scalora-navy border-scalora-blue/30 text-amber-500 focus:ring-0"
              />
              <span className="font-semibold">Automatically pin to top of channel feed</span>
            </label>

            <button
              type="submit"
              disabled={broadcasting || !broadcastContent.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-glow-amber flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Send Broadcast</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Channels Management Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-scalora-blue/20 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-scalora-blue/15">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white">
            <Hash className="w-4 h-4 text-cyan-400" />
            <span>Course Channels Directory ({data?.channels.length || 0})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-scalora-blue/20 text-slate-400 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3">Channel Name</th>
                <th className="py-3 px-3">Linked Course</th>
                <th className="py-3 px-3 text-center">Members</th>
                <th className="py-3 px-3 text-center">Posts</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-scalora-blue/10">
              {data?.channels.map((ch) => (
                <tr key={ch.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{ch.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{ch.courseTitle || 'General Platform'}</td>
                  <td className="py-3 px-3 text-center font-bold text-white">{ch.membersCount}</td>
                  <td className="py-3 px-3 text-center font-bold text-cyan-300">{ch.postsCount}</td>
                  <td className="py-3 px-3 text-center">
                    {ch.isLocked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Locked
                      </span>
                    ) : ch.isArchived ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                        Archived
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLock(ch.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        ch.isLocked
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                      }`}
                      title={ch.isLocked ? 'Unlock channel' : 'Lock channel'}
                    >
                      {ch.isLocked ? 'Unlock' : 'Lock'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleArchive(ch.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                      title={ch.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      {ch.isArchived ? 'Restore' : 'Archive'}
                    </button>

                    <Link
                      to={`/community?channel=${ch.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500 hover:bg-cyan-400 text-white"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Global Moderation Feed Stream */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-scalora-blue/20 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-scalora-blue/15">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Recent Community Posts Moderation Stream</span>
          </div>
        </div>

        <div className="space-y-3">
          {data?.recentPosts.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No posts submitted yet.</p>
          ) : (
            data?.recentPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl bg-scalora-navy/60 border border-scalora-blue/20 flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-400/20">
                      {post.channelName}
                    </span>
                    <span className="font-bold text-white">{post.author.name}</span>
                    <span className="text-slate-500">({post.author.email})</span>
                    <span className="text-slate-500">• {new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.isPinned && (
                      <span className="text-[10px] font-extrabold text-cyan-300 bg-cyan-500/20 px-1.5 py-0.2 rounded">
                        PINNED
                      </span>
                    )}
                    {post.isAnnouncement && (
                      <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded">
                        ANNOUNCEMENT
                      </span>
                    )}
                  </div>

                  {post.title && <div className="font-extrabold text-white">{post.title}</div>}
                  <p className="text-slate-300 line-clamp-2 leading-relaxed">{post.content}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(post.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title={post.isPinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${post.isPinned ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    to={`/community?channel=${post.channelId}&post=${post.id}`}
                    className="px-3 py-1.5 rounded-xl bg-scalora-blue hover:bg-scalora-hover text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
