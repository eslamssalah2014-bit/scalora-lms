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
  MoreVertical,
  Trash2,
  Edit,
  Send,
  Loader2,
  Clock,
  Check,
  Code2,
  Shield,
  FileText,
  User,
  Sparkles,
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

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleToggleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

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
    if (!confirm('Are you sure you want to permanently delete this post?')) return;
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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await api.put<{ success: boolean; post: any }>(`/community/posts/${post.id}`, {
        title: editTitle.trim() || undefined,
        content: editContent.trim(),
      });
      if (res.success && res.post) {
        onPostUpdated({
          ...post,
          title: res.post.title,
          content: res.post.content,
          updatedAt: res.post.updatedAt,
        });
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community?post=${post.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
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
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post<{ success: boolean; comment: CommunityComment }>(
        `/community/posts/${post.id}/comments`,
        { content: newCommentText.trim() }
      );
      if (res.success && res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setCommentsCount((prev) => prev + 1);
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
  };

  const handleReplyAdded = (reply: CommentReply) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === reply.parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), reply],
          };
        }
        return c;
      })
    );
  };

  return (
    <div
      className={`glass-card rounded-3xl p-5 sm:p-6 space-y-4 border transition-all ${
        post.isAnnouncement
          ? 'border-amber-500/40 shadow-glow-amber bg-[#061B3B]/90'
          : post.isPinned
          ? 'border-cyan-500/40 shadow-glow-accent bg-[#04152D]'
          : 'border-scalora-blue/20 hover:border-scalora-blue/40 bg-[#04152D]/90'
      }`}
    >
      {/* Top Badges (Pinned & Announcement) */}
      {(post.isPinned || post.isAnnouncement) && (
        <div className="flex items-center gap-2 pb-2 border-b border-scalora-blue/15 text-xs font-bold">
          {post.isPinned && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              <Pin className="w-3 h-3 text-cyan-300" />
              <span>Pinned Post</span>
            </span>
          )}
          {post.isAnnouncement && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Megaphone className="w-3 h-3 text-amber-300" />
              <span>Official Announcement</span>
            </span>
          )}
        </div>
      )}

      {/* Post Header: Author info & 3-dots Menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onUserClick && onUserClick(post.author.id)}
            className="focus:outline-none flex-shrink-0"
          >
            <img
              src={
                post.author.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=2D8CFF&color=fff`
              }
              alt={post.author.name}
              className="w-11 h-11 rounded-2xl object-cover border border-cyan-400/30 shadow-md hover:scale-105 transition-transform"
            />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onUserClick && onUserClick(post.author.id)}
                className="text-sm font-bold text-white hover:text-cyan-300 transition-colors"
              >
                {post.author.name}
              </button>

              {post.author.role === 'ADMIN' ? (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Admin</span>
                </span>
              ) : (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-scalora-blue/20 text-scalora-accent border border-scalora-blue/30">
                  Learner
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{formatTimeAgo(post.createdAt)}</span>
              </span>
              {post.author.bio && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[200px] text-slate-500 text-[11px]">{post.author.bio}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3-Dots Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 rounded-2xl glass-panel py-1.5 shadow-2xl border border-scalora-blue/30 z-20 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={handleShare}
                className="w-full px-3.5 py-2 text-left text-slate-200 hover:text-white hover:bg-white/5 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSave}
                className="w-full px-3.5 py-2 text-left text-slate-200 hover:text-white hover:bg-white/5 flex items-center gap-2"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{isSaved ? 'Remove Bookmark' : 'Bookmark Post'}</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className="w-full px-3.5 py-2 text-left text-slate-200 hover:text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{post.isPinned ? 'Unpin from Top' : 'Pin to Top'}</span>
                </button>
              )}

              {(isAuthor || isAdmin) && (
                <>
                  <div className="my-1 border-t border-scalora-blue/15" />
                  {isAuthor && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-200 hover:text-white hover:bg-white/5 flex items-center gap-2"
                    >
                      <Edit className="w-3.5 h-3.5 text-scalora-blue" />
                      <span>Edit Post</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDeletePost}
                    className="w-full px-3.5 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content / Title */}
      <div className="space-y-3 text-sm text-slate-200 leading-relaxed">
        {post.title && <h3 className="text-base font-extrabold text-white leading-snug">{post.title}</h3>}

        <p className="whitespace-pre-wrap leading-relaxed text-slate-200">{post.content}</p>

        {/* Embedded Image */}
        {post.mediaUrl && (
          <div
            onClick={() => setLightboxImage(post.mediaUrl || null)}
            className="rounded-2xl overflow-hidden border border-scalora-blue/30 cursor-pointer group relative max-h-96 bg-black/40"
          >
            <img
              src={post.mediaUrl}
              alt={post.title || 'Post attachment'}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
            />
          </div>
        )}

        {/* File Attachment Card */}
        {post.fileUrl && (
          <a
            href={post.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  {post.fileName || 'Download Resource Blueprint'}
                </div>
                <div className="text-[11px] text-emerald-400/80">{post.fileSize || 'Downloadable attachment'}</div>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md flex-shrink-0">
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </div>
          </a>
        )}

        {/* External Link Card */}
        {post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-scalora-blue/10 border border-scalora-blue/30 hover:border-cyan-400 text-slate-200 text-xs transition-all group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <ExternalLink className="w-4 h-4 text-cyan-300 flex-shrink-0" />
              <span className="truncate font-semibold text-cyan-300 group-hover:underline">{post.linkUrl}</span>
            </div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wide font-bold">Open</span>
          </a>
        )}
      </div>

      {/* Post Action Bar (Like, Comment, Save, Share) */}
      <div className="flex items-center justify-between pt-3 border-t border-scalora-blue/15 text-xs text-slate-400 font-semibold">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              isLiked
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500 animate-pulse' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comments Toggle Button */}
          <button
            type="button"
            onClick={handleToggleComments}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              showComments
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                : 'hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentsCount}</span>
          </button>

          {/* Save / Bookmark Button */}
          <button
            type="button"
            onClick={handleToggleSave}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : 'hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="px-3 py-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* Comments Section Accordion */}
      {showComments && (
        <div className="space-y-4 pt-2">
          {/* Comment Composer Input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2D8CFF&color=fff`
              }
              alt={user?.name}
              className="w-8 h-8 rounded-lg object-cover border border-scalora-blue/30 flex-shrink-0"
            />
            <input
              type="text"
              placeholder="Write a constructive comment or answer..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-scalora-navy/80 border border-scalora-blue/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={submittingComment || !newCommentText.trim()}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-40"
            >
              {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-4 text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Loading discussion thread...</span>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center py-4 text-xs text-slate-500 italic">
              No comments yet. Be the first to start the conversation!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  onCommentDeleted={handleCommentDeleted}
                  onReplyAdded={handleReplyAdded}
                  onUserClick={onUserClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal for Image */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <img src={lightboxImage} alt="Enlarged view" className="max-w-full max-h-[90vh] object-contain rounded-2xl" />
        </div>
      )}

      {/* Edit Post Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-lg space-y-4 border border-cyan-500/30 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit className="w-5 h-5 text-cyan-400" />
              <span>Edit Post</span>
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full px-3 py-2 rounded-xl bg-scalora-navy border border-scalora-blue/30 text-white text-xs"
              />

              <textarea
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-scalora-navy border border-scalora-blue/30 text-white text-xs leading-relaxed"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold flex items-center gap-1.5"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
