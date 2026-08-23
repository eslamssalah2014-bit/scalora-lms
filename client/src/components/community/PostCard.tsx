import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CommunityPost, CommunityComment, CommentReply } from '../../types';
import { CommentItem } from './CommentItem';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Pin,
  Megaphone,
  Download,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Edit,
  Send,
  Loader2,
  Clock,
  Check,
  Code2,
  Shield,
  FileText,
  Sparkles,
  BarChart2,
  CheckCircle2,
  X,
  Hash,
} from 'lucide-react';

interface PostCardProps {
  post: CommunityPost;
  onPostDeleted: (postId: string) => void;
  onPostUpdated: (updated: CommunityPost) => void;
  onUserClick?: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostDeleted,
  onPostUpdated,
  onUserClick,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isAuthor = user?.id === post.author.id;

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Content Expansion State
  const [isExpanded, setIsExpanded] = useState(false);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);

  // Poll Vote UI State (Prototype)
  const [selectedPollOption, setSelectedPollOption] = useState<number | null>(null);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);

  // Check if content contains poll JSON data
  const hasPoll = post.content.includes('[POLL_DATA]:');
  let cleanContent = post.content;
  let parsedPoll: { question: string; options: { text: string; votes: number }[] } | null = null;

  if (hasPoll) {
    const parts = post.content.split('[POLL_DATA]:');
    cleanContent = parts[0].trim();
    try {
      parsedPoll = JSON.parse(parts[1]);
    } catch {
      parsedPoll = null;
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const days = Math.floor(diff / 86400);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleToggleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.post<{ success: boolean; isLiked: boolean; likesCount: number }>(
        `/community/posts/${post.id}/like`
      );
      if (res.success) {
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleToggleSave = async () => {
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      const res = await api.post<{ success: boolean; isSaved: boolean }>(`/community/posts/${post.id}/save`);
      if (res.success) {
        setIsSaved(res.isSaved);
      }
    } catch {
      setIsSaved(prevSaved);
    }
  };

  const handleTogglePin = async () => {
    try {
      const res = await api.patch<{ success: boolean; isPinned: boolean }>(`/community/posts/${post.id}/pin`);
      if (res.success) {
        onPostUpdated({ ...post, isPinned: res.isPinned });
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
    setShowMenu(false);
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/community/posts/${post.id}`);
      if (res.success) {
        onPostDeleted(post.id);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
    setShowMenu(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    try {
      const res = await api.patch<{ success: boolean; post: CommunityPost }>(`/community/posts/${post.id}`, {
        title: editTitle.trim() || undefined,
        content: editContent.trim(),
      });
      if (res.success && res.post) {
        onPostUpdated(res.post);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSharePost = () => {
    const url = `${window.location.origin}/community?channel=${post.channelId}&post=${post.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    setShowMenu(false);
  };

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }

    setShowComments(true);
    setLoadingComments(true);
    try {
      const res = await api.get<{ success: boolean; comments: CommunityComment[] }>(
        `/community/posts/${post.id}/comments`
      );
      if (res.success && Array.isArray(res.comments)) {
        setComments(res.comments);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post<{ success: boolean; comment: CommunityComment }>(
        `/community/posts/${post.id}/comments`,
        {
          content: newCommentText.trim(),
        }
      );

      if (res.success && res.comment) {
        setComments((prev) => [...prev, { ...res.comment, replies: [] }]);
        setCommentsCount((prev) => prev + 1);
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Error creating comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const isLongContent = cleanContent.length > 320;
  const displayContent = isLongContent && !isExpanded ? `${cleanContent.slice(0, 320)}...` : cleanContent;

  return (
    <article className="bg-[#0B1528] rounded-3xl p-4 sm:p-6 border border-white/10 hover:border-cyan-500/30 transition-all shadow-xl space-y-4 relative group w-full max-w-full overflow-hidden break-words box-border">
      {/* Pinned / Announcement Top Ribbon */}
      {(post.isPinned || post.isAnnouncement) && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold w-fit mb-1">
          {post.isAnnouncement ? (
            <>
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Announcement</span>
            </>
          ) : (
            <>
              <Pin className="w-3.5 h-3.5 text-amber-400" />
              <span>Pinned Post</span>
            </>
          )}
        </div>
      )}

      {/* Header Row: Author Info + Meta + Dropdown Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onUserClick && onUserClick(post.author.id)}
            className="flex-shrink-0 focus:outline-none relative group/avatar"
          >
            <img
              src={
                post.author.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=0284C7&color=fff`
              }
              alt={post.author.name}
              className={`w-11 h-11 rounded-full object-cover border-2 transition-transform group-hover/avatar:scale-105 shadow-md ${
                post.author.role === 'ADMIN' ? 'border-amber-400 shadow-glow-amber' : 'border-cyan-400/40'
              }`}
            />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onUserClick && onUserClick(post.author.id)}
                className="font-black text-white hover:text-cyan-300 text-sm truncate transition-colors text-left"
              >
                {post.author.name}
              </button>

              {post.author.role === 'ADMIN' ? (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Admin</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-white/5 text-slate-400 border border-white/5">
                  Member
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 3-Dots Dropdown Options Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
            title="Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 rounded-2xl bg-[#091324] border border-white/10 shadow-2xl p-1.5 z-30 text-xs font-semibold space-y-0.5 animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={handleToggleSave}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'text-amber-400 fill-amber-400' : ''}`} />
                <span>{isSaved ? 'Unsave Bookmark' : 'Save Bookmark'}</span>
              </button>

              <button
                type="button"
                onClick={handleSharePost}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Post Link'}</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <Pin className="w-4 h-4" />
                  <span>{post.isPinned ? 'Unpin from Top' : 'Pin to Top of Feed'}</span>
                </button>
              )}

              {(isAuthor || isAdmin) && (
                <>
                  <div className="my-1 border-t border-white/5" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Content</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeletePost}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Title (if present) */}
      {post.title && <h2 className="text-base sm:text-lg font-black text-white leading-snug">{post.title}</h2>}

      {/* Main Post Text Content */}
      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
        {displayContent}
        {isLongContent && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-400 hover:text-cyan-300 font-bold ml-1 transition-colors"
          >
            {isExpanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>

      {/* Attached Media Image with Lightbox */}
      {post.mediaUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/10 max-h-[460px] bg-black/40">
          <img
            src={post.mediaUrl}
            alt={post.title || 'Attached media'}
            onClick={() => setLightboxImage(post.mediaUrl || null)}
            className="w-full h-full object-cover max-h-[460px] cursor-pointer hover:scale-[1.01] transition-transform"
          />
        </div>
      )}

      {/* Attached Downloadable Resource Card */}
      {post.fileUrl && (
        <div className="p-4 rounded-2xl bg-[#091324] border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{post.fileName || 'Download Resource'}</div>
              <div className="text-[10px] text-purple-300 font-semibold uppercase">{post.fileSize || 'Direct File'}</div>
            </div>
          </div>

          <a
            href={post.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      )}

      {/* Attached External Link Preview */}
      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 rounded-2xl bg-[#091324] border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3 group/link block"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover/link:text-cyan-300 transition-colors truncate">
                {post.linkUrl}
              </div>
              <div className="text-[10px] text-slate-400">External Resource Link</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500 group-hover/link:text-cyan-300 transition-colors flex-shrink-0" />
        </a>
      )}

      {/* Poll Card Preview (UI Prototype) */}
      {parsedPoll && (
        <div className="p-4 rounded-2xl bg-[#091324] border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <BarChart2 className="w-4 h-4" />
            <span>{parsedPoll.question}</span>
          </div>

          <div className="space-y-2">
            {parsedPoll.options.map((option, idx) => {
              const isSelected = selectedPollOption === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedPollOption(idx);
                    setHasVotedPoll(true);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between text-xs font-semibold ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-white'
                      : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>{option.text}</span>
                  {hasVotedPoll && isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </button>
              );
            })}
          </div>

          {hasVotedPoll && (
            <p className="text-[11px] text-emerald-400 font-semibold text-right">Vote registered!</p>
          )}
        </div>
      )}

      {/* Reaction Summary Bar */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-400 px-1 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Heart className="w-3 h-3 fill-rose-400" />
          </span>
          <span className="font-semibold text-slate-300">{likesCount} likes</span>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={loadComments} className="hover:underline text-slate-400">
            {commentsCount} comments
          </button>
        </div>
      </div>

      {/* Facebook-Style Action Buttons Row */}
      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-white/5 text-xs font-bold w-full">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleToggleLike}
          className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all min-h-[44px] ${
            isLiked
              ? 'text-rose-400 bg-rose-500/10 shadow-sm font-black'
              : 'text-slate-300 hover:bg-white/5 hover:text-rose-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
          <span className="text-[10px] sm:text-xs">Like</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={loadComments}
          className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all min-h-[44px] ${
            showComments
              ? 'text-cyan-300 bg-cyan-500/10 font-black'
              : 'text-slate-300 hover:bg-white/5 hover:text-cyan-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs">Comment</span>
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleToggleSave}
          className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all min-h-[44px] ${
            isSaved
              ? 'text-amber-300 bg-amber-500/10 font-black'
              : 'text-slate-300 hover:bg-white/5 hover:text-amber-300'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span className="text-[10px] sm:text-xs">Save</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleSharePost}
          className="py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-slate-300 hover:bg-white/5 hover:text-cyan-300 transition-all min-h-[44px]"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span className="text-[10px] sm:text-xs">{copiedLink ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="pt-4 border-t border-white/5 space-y-4 animate-in fade-in duration-200">
          {/* Inline Comment Composer */}
          <form onSubmit={handleCreateComment} className="flex items-center gap-3">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0284C7&color=fff`
              }
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border border-cyan-500/30 flex-shrink-0"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Write a constructive comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 rounded-2xl bg-[#091324] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
              />
              <button
                type="submit"
                disabled={submittingComment || !newCommentText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white transition-all disabled:opacity-30 disabled:hover:bg-cyan-500"
              >
                {submittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Loading discussion...</span>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center py-4 text-xs text-slate-500 italic">No comments yet. Start the conversation!</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  onCommentDeleted={(cid) => {
                    setComments((prev) => prev.filter((c) => c.id !== cid));
                    setCommentsCount((prev) => Math.max(0, prev - 1));
                  }}
                  onReplyAdded={(reply) => {
                    setComments((prev) =>
                      prev.map((c) =>
                        c.id === reply.parentId
                          ? { ...c, replies: [...(c.replies || []), reply] }
                          : c
                      )
                    );
                  }}
                  onUserClick={onUserClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Edit Content Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1528] rounded-3xl p-6 border border-white/10 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Edit Post</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs font-bold"
            />

            <textarea
              rows={5}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
