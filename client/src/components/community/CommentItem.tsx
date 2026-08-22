import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CommunityComment, CommentReply } from '../../types';
import {
  CornerDownRight,
  Trash2,
  Send,
  Loader2,
  Clock,
  Shield,
  UserCheck,
} from 'lucide-react';

interface CommentItemProps {
  comment: CommunityComment;
  postId: string;
  onCommentDeleted: (commentId: string) => void;
  onReplyAdded: (reply: CommentReply) => void;
  onUserClick?: (userId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  onCommentDeleted,
  onReplyAdded,
  onUserClick,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isAuthor = user?.id === comment.author.id;

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await api.post<{ success: boolean; comment: any }>(`/community/posts/${postId}/comments`, {
        content: replyText.trim(),
        parentId: comment.id,
      });

      if (res.success && res.comment) {
        onReplyAdded({
          id: res.comment.id,
          parentId: comment.id,
          content: res.comment.content,
          createdAt: res.comment.createdAt,
          author: res.comment.author,
        });
        setReplyText('');
        setShowReplyInput(false);
      }
    } catch (err) {
      console.error('Error posting reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    setDeleting(true);
    try {
      const res = await api.delete<{ success: boolean }>(`/community/comments/${comment.id}`);
      if (res.success) {
        onCommentDeleted(comment.id);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-scalora-blue/15 text-xs">
      {/* Top-Level Comment */}
      <div className="flex items-start gap-3 group">
        <button
          type="button"
          onClick={() => onUserClick && onUserClick(comment.author.id)}
          className="flex-shrink-0 focus:outline-none"
        >
          <img
            src={
              comment.author.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=2D8CFF&color=fff`
            }
            alt={comment.author.name}
            className="w-8 h-8 rounded-lg object-cover border border-scalora-blue/20 hover:scale-105 transition-transform"
          />
        </button>

        <div className="flex-1 space-y-1 bg-scalora-navy/60 rounded-2xl p-3.5 border border-scalora-blue/15">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onUserClick && onUserClick(comment.author.id)}
                className="font-bold text-white hover:text-cyan-300 transition-colors"
              >
                {comment.author.name}
              </button>

              {comment.author.role === 'ADMIN' ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Admin
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-scalora-blue/15 text-scalora-accent">
                  Student
                </span>
              )}

              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(comment.createdAt)}</span>
              </span>
            </div>

            {(isAuthor || isAdmin) && (
              <button
                type="button"
                onClick={handleDeleteComment}
                disabled={deleting}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all"
                title="Delete comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">{comment.content}</p>

          <div className="pt-1.5 flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
            <button
              type="button"
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <CornerDownRight className="w-3 h-3" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-8 sm:pl-11 space-y-2.5 border-l-2 border-scalora-blue/20 ml-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2.5">
              <button
                type="button"
                onClick={() => onUserClick && onUserClick(reply.author.id)}
                className="flex-shrink-0 focus:outline-none"
              >
                <img
                  src={
                    reply.author.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.author.name)}&background=2D8CFF&color=fff`
                  }
                  alt={reply.author.name}
                  className="w-6 h-6 rounded-md object-cover border border-scalora-blue/20"
                />
              </button>

              <div className="flex-1 bg-scalora-navy/40 rounded-xl p-2.5 border border-scalora-blue/10 space-y-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUserClick && onUserClick(reply.author.id)}
                    className="font-bold text-white hover:text-cyan-300 text-xs transition-colors"
                  >
                    {reply.author.name}
                  </button>
                  {reply.author.role === 'ADMIN' && (
                    <span className="text-[8px] font-extrabold uppercase px-1 rounded bg-cyan-500/20 text-cyan-300">
                      Admin
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{formatTimeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Input */}
      {showReplyInput && (
        <form onSubmit={handleSendReply} className="pl-8 sm:pl-11 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Reply to ${comment.author.name}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-scalora-navy/80 border border-cyan-400/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={submittingReply || !replyText.trim()}
            className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-40"
          >
            {submittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      )}
    </div>
  );
};
