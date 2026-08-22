import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { PostType, CommunityPost } from '../../types';
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  Link as LinkIcon,
  Megaphone,
  Send,
  Loader2,
  Sparkles,
  Pin,
  X,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface PostComposerProps {
  channelId: string;
  channelName: string;
  isLocked?: boolean;
  onPostCreated: (newPost: CommunityPost) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  channelId,
  channelName,
  isLocked,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<PostType>('TEXT');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLocked && !isAdmin) {
    return (
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-400" />
          <span>This channel is currently locked by administrators for announcement-only mode.</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please enter your post message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        channelId,
        type: activeTab,
        title: title.trim() || undefined,
        content: content.trim(),
        isPinned: isAdmin && isPinned,
        isAnnouncement: isAdmin && activeTab === 'ANNOUNCEMENT',
      };

      if (activeTab === 'IMAGE' && mediaUrl.trim()) {
        payload.mediaUrl = mediaUrl.trim();
      }

      if (activeTab === 'FILE' && fileUrl.trim()) {
        payload.fileUrl = fileUrl.trim();
        payload.fileName = fileName.trim() || 'Resource-Attachment.zip';
        payload.fileSize = fileSize.trim() || '2.4 MB';
      }

      if (activeTab === 'LINK' && linkUrl.trim()) {
        payload.linkUrl = linkUrl.trim();
      }

      const res = await api.post<{ success: boolean; post: CommunityPost }>('/community/posts', payload);
      if (res.success && res.post) {
        onPostCreated(res.post);
        // Reset composer
        setContent('');
        setTitle('');
        setMediaUrl('');
        setFileName('');
        setFileUrl('');
        setFileSize('');
        setLinkUrl('');
        setIsPinned(false);
        setIsPreview(false);
        setActiveTab('TEXT');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`glass-card rounded-3xl p-5 sm:p-6 border transition-all ${
        activeTab === 'ANNOUNCEMENT'
          ? 'border-amber-500/50 shadow-glow-amber bg-[#0B254A]/90'
          : 'border-cyan-500/20 hover:border-cyan-400/40 bg-[#04152D]/90'
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Composer Header: User Avatar & Role */}
        <div className="flex items-center justify-between pb-3 border-b border-scalora-blue/15">
          <div className="flex items-center gap-3">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2D8CFF&color=fff`
              }
              alt={user?.name}
              className="w-10 h-10 rounded-xl object-cover border border-cyan-400/30 shadow-md"
            />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{user?.name}</span>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                    Administrator
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-scalora-blue/20 text-scalora-accent border border-scalora-blue/30">
                    Enrolled Learner
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Posting to <strong className="text-slate-200">{channelName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isPreview
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isPreview ? 'Edit' : 'Preview'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher (Text, Image, File, Link, Announcement) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('TEXT')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'TEXT'
                ? 'bg-cyan-500 text-white shadow-glow-accent'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Discussion Post</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('IMAGE')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'IMAGE'
                ? 'bg-cyan-500 text-white shadow-glow-accent'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image / Screenshot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FILE')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'FILE'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Resource Blueprint</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LINK')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'LINK'
                ? 'bg-scalora-blue text-white shadow-glow-blue'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>External Link</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('ANNOUNCEMENT')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'ANNOUNCEMENT'
                  ? 'bg-amber-500 text-white shadow-glow-amber'
                  : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Broadcast Announcement</span>
            </button>
          )}
        </div>

        {/* Optional Title */}
        <div>
          <input
            type="text"
            placeholder={
              activeTab === 'ANNOUNCEMENT'
                ? 'Announcement Headline (e.g. 📢 Important Cohort Update...)'
                : 'Post Title / Topic (Optional)'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-scalora-navy/80 border border-scalora-blue/20 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Dynamic Fields Based on Tab */}
        {activeTab === 'IMAGE' && (
          <div className="p-3 rounded-2xl bg-scalora-navy/60 border border-cyan-500/20 space-y-2">
            <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image URL / Media Source</span>
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or direct image link"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#020C1B] border border-scalora-blue/20 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            />
            {mediaUrl && (
              <div className="relative rounded-xl overflow-hidden max-h-48 border border-cyan-500/30 bg-black/40">
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-rose-500/80 text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'FILE' && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach Resource Blueprint / Code Zip</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="File Name (e.g. Scalora-Architecture-Template.zip)"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#020C1B] border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Size (e.g. 4.2 MB)"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#020C1B] border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
            <input
              type="url"
              placeholder="Download URL (e.g. https://github.com/... or Google Drive / S3)"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#020C1B] border border-emerald-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>
        )}

        {activeTab === 'LINK' && (
          <div className="p-3 rounded-2xl bg-scalora-blue/10 border border-scalora-blue/30 space-y-2">
            <label className="text-xs font-bold text-scalora-accent flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>External Resource / GitHub / Documentation Link</span>
            </label>
            <input
              type="url"
              placeholder="https://github.com/... or https://kubernetes.io/docs/..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#020C1B] border border-scalora-blue/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-scalora-accent"
            />
          </div>
        )}

        {/* Content Area / Live Preview */}
        {isPreview ? (
          <div className="p-4 rounded-2xl bg-scalora-navy/70 border border-cyan-500/30 min-h-[120px] text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {title && <h3 className="text-base font-bold text-white mb-2">{title}</h3>}
            {content || <span className="text-slate-500 italic">No content typed yet...</span>}
          </div>
        ) : (
          <div>
            <textarea
              rows={4}
              placeholder={
                activeTab === 'ANNOUNCEMENT'
                  ? 'Type your announcement details here. All enrolled students in this channel will receive an instant notification...'
                  : `What's on your mind regarding ${channelName}? Ask a question, share an architectural breakthrough, or discuss lesson concepts...`
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-scalora-navy/80 border border-scalora-blue/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors resize-y leading-relaxed"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
            {error}
          </p>
        )}

        {/* Footer Actions: Pin toggle & Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-4">
            {isAdmin && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded bg-scalora-navy border-scalora-blue/30 text-cyan-500 focus:ring-0"
                />
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>Pin to top of feed</span>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'ANNOUNCEMENT'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-glow-amber'
                : 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{activeTab === 'ANNOUNCEMENT' ? 'Broadcast Announcement' : 'Publish to Feed'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
