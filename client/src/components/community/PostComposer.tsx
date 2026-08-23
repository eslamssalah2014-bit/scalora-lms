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
  BarChart2,
  Plus,
  Trash2,
  Smile,
  Shield,
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

  // Composer expanded state
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [activeTab, setActiveTab] = useState<PostType | 'POLL'>('TEXT');
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

  // Poll UI Prototype State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  if (isLocked && !isAdmin) {
    return (
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>This channel is currently in announcement-only mode. Only instructors and admins can publish.</span>
        </div>
      </div>
    );
  }

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && activeTab !== 'POLL') {
      setError('Please enter your post message.');
      return;
    }

    if (activeTab === 'POLL' && !pollQuestion.trim()) {
      setError('Please enter a question for your poll.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let finalContent = content.trim();

      // If poll, format poll choices into content structure
      if (activeTab === 'POLL') {
        const validOptions = pollOptions.filter((opt) => opt.trim());
        const pollData = {
          question: pollQuestion.trim(),
          options: validOptions.map((opt) => ({ text: opt.trim(), votes: 0 })),
        };
        finalContent = `${pollQuestion.trim()}\n\n[POLL_DATA]:${JSON.stringify(pollData)}`;
      }

      const payload: any = {
        channelId,
        type: activeTab === 'POLL' ? 'TEXT' : activeTab,
        title: title.trim() || undefined,
        content: finalContent,
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
        setFileUrl('');
        setFileName('');
        setFileSize('');
        setLinkUrl('');
        setPollQuestion('');
        setPollOptions(['', '']);
        setIsPinned(false);
        setIsPreview(false);
        setIsOpen(false);
      }
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to publish post. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="bg-[#0B1528] rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xl space-y-3 transition-all">
      {/* 1. COLLAPSED FACEBOOK-STYLE TRIGGER BOX */}
      {!isOpen ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0284C7&color=fff`
              }
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border border-cyan-500/30 shadow-md flex-shrink-0"
            />

            <button
              type="button"
              onClick={() => {
                setActiveTab('TEXT');
                setIsOpen(true);
              }}
              className="flex-1 text-left px-5 py-3 rounded-2xl bg-[#0F1D38]/80 hover:bg-[#14264A] text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-medium border border-white/5 transition-all shadow-inner"
            >
              What's on your mind, {firstName}?
            </button>
          </div>

          {/* Quick Action Pills */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-around sm:justify-start sm:gap-4 overflow-x-auto scrollbar-none text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('TEXT');
                setIsOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Discussion</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('IMAGE');
                setIsOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Photo/Media</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('FILE');
                setIsOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
            >
              <Paperclip className="w-4 h-4 text-purple-400" />
              <span>Resource Share</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('POLL');
                setIsOpen(true);
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Poll</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ANNOUNCEMENT');
                  setIsOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-amber-300 hover:bg-amber-500/10 transition-colors"
              >
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Announcement</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 2. EXPANDED FULL POST COMPOSER INTERFACE */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0284C7&color=fff`
                }
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover border border-cyan-500/30 shadow-md"
              />
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{user?.name}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <span>Posting in</span>
                  <span className="text-cyan-300 font-semibold">{channelName}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Post Type Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('TEXT')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'TEXT'
                  ? 'bg-cyan-500 text-white shadow-glow-accent'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Discussion</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('IMAGE')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'IMAGE'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo/Media</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FILE')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'FILE'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Resource File</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LINK')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'LINK'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Web Link</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('POLL')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'POLL'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Poll</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('ANNOUNCEMENT')}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'ANNOUNCEMENT'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-glow-amber'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Announcement</span>
              </button>
            )}
          </div>

          {/* Optional Title */}
          {activeTab !== 'POLL' && (
            <input
              type="text"
              placeholder="Post Title (optional)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#091324] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm font-semibold focus:outline-none focus:border-cyan-400 transition-all"
            />
          )}

          {/* Main Text / Content Area */}
          {activeTab !== 'POLL' ? (
            <textarea
              rows={4}
              placeholder="Share your thoughts, ask questions, or provide valuable feedback..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#091324] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition-all resize-none"
            />
          ) : (
            /* Poll Creation Interface */
            <div className="space-y-3 p-4 rounded-2xl bg-[#091324] border border-amber-500/20">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Poll Question</span>
                </label>
                <input
                  type="text"
                  placeholder="Ask the community a question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Poll Options (Min 2, Max 6)
                </label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}...`}
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab Specific Inputs */}
          {activeTab === 'IMAGE' && (
            <div className="p-3.5 rounded-2xl bg-[#091324] border border-emerald-500/20 space-y-2">
              <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image / Screenshot URL</span>
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400"
              />
              {mediaUrl && (
                <div className="relative rounded-xl overflow-hidden max-h-48 border border-white/10 mt-2">
                  <img src={mediaUrl} alt="Preview" className="w-full h-48 object-cover" />
                </div>
              )}
            </div>
          )}

          {activeTab === 'FILE' && (
            <div className="p-3.5 rounded-2xl bg-[#091324] border border-purple-500/20 space-y-2.5">
              <label className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Resource File Details</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="File Name (e.g. Architecture-Diagram.pdf)"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
                <input
                  type="text"
                  placeholder="File Size (e.g. 4.8 MB)"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
              <input
                type="url"
                placeholder="Direct Download URL (e.g. https://...)"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
          )}

          {activeTab === 'LINK' && (
            <div className="p-3.5 rounded-2xl bg-[#091324] border border-blue-500/20 space-y-2">
              <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>External Link URL</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/your-org/repo..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Footer Controls & Publish CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
            {/* Admin Controls */}
            {isAdmin ? (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-white/20 bg-scalora-navy text-cyan-400 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                />
                <Pin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pin this post to top of feed</span>
              </label>
            ) : (
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Posts are visible to all enrolled peers</span>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue hover:opacity-95 text-white text-xs font-black shadow-glow-accent flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
