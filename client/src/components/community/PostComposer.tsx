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
  HelpCircle,
  FolderDown,
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
  const [activeTab, setActiveTab] = useState<PostType | 'POLL' | 'QUESTION'>('TEXT');
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

  // Poll State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  if (isLocked && !isAdmin) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>This community is currently in announcement-only mode. Only instructors and admins can publish.</span>
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
        type: activeTab === 'POLL' || activeTab === 'QUESTION' ? 'TEXT' : activeTab,
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
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3 transition-all text-slate-900">
      {/* 1. COLLAPSED TRIGGER BOX */}
      {!isOpen ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563EB&color=fff`
              }
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-100 shadow-sm flex-shrink-0"
            />

            <button
              type="button"
              onClick={() => {
                setActiveTab('TEXT');
                setIsOpen(true);
              }}
              className="flex-1 text-left px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-medium border border-slate-200 transition-all min-h-[42px]"
            >
              What's on your mind, {firstName}?
            </button>
          </div>

          {/* Quick Action Pills */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:flex sm:items-center sm:gap-2 gap-1.5 text-xs font-bold w-full">
            {/* 1. Create Post */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('TEXT');
                setIsOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-colors min-h-[38px]"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Post</span>
            </button>

            {/* 2. Ask Question */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('QUESTION');
                setTitle('❓ Question: ');
                setIsOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors min-h-[38px]"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Ask</span>
            </button>

            {/* 3. Share Resource */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('FILE');
                setIsOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 transition-colors min-h-[38px]"
            >
              <FolderDown className="w-4 h-4 text-purple-600" />
              <span>Resource</span>
            </button>

            {/* 4. Create Poll */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('POLL');
                setIsOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100 transition-colors min-h-[38px]"
            >
              <BarChart2 className="w-4 h-4 text-amber-600" />
              <span>Poll</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ANNOUNCEMENT');
                  setIsOpen(true);
                }}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 transition-colors min-h-[38px]"
              >
                <Megaphone className="w-4 h-4 text-rose-600" />
                <span>Announcement</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 2. EXPANDED COMPOSER FORM */
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                Publishing to {channelName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Post Type Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('TEXT')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'TEXT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('QUESTION');
                if (!title) setTitle('❓ Question: ');
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'QUESTION'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Question</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('IMAGE')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'IMAGE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Media</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FILE')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'FILE'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Resource</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('POLL')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'POLL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Poll</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('ANNOUNCEMENT')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'ANNOUNCEMENT'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Announcement</span>
              </button>
            )}
          </div>

          {/* Optional Title */}
          <input
            type="text"
            placeholder="Post Title or Topic (Optional)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
          />

          {/* Poll Builder Mode */}
          {activeTab === 'POLL' ? (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="text"
                placeholder="Ask a community question for the poll..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-500"
              />

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600">Poll Choices:</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}...`}
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(idx)}
                        className="p-2 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1.5 hover:bg-amber-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              )}
            </div>
          ) : (
            /* Main Content Textarea */
            <textarea
              rows={4}
              placeholder={`Share an update, key insight, or question with your peers in ${channelName}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm leading-relaxed focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          )}

          {/* Media / File Drawer Inputs */}
          {activeTab === 'IMAGE' && (
            <input
              type="url"
              placeholder="Paste Image URL (e.g. Screenshot, Flowchart, Diagram)..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          )}

          {activeTab === 'FILE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="url"
                placeholder="Resource URL (PDF / Template Link)..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Resource Name (e.g. Checklist.pdf)"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 font-semibold">
              {error}
            </p>
          )}

          {/* Submit Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {isAdmin ? (
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none font-semibold">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                <span>Pin to top</span>
              </label>
            ) : (
              <span className="text-[11px] text-slate-400">Markdown formatting supported</span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || (!content.trim() && !pollQuestion.trim())}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 hover:shadow-md disabled:opacity-40 transition-all flex items-center gap-2"
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
