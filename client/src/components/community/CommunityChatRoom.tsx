import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { CommunityChatMessage } from '../../types';
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  Pin,
  Trash2,
  Reply,
  Shield,
  Loader2,
  X,
  FileText,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';

interface CommunityChatRoomProps {
  channelId: string;
  channelName: string;
}

export const CommunityChatRoom: React.FC<CommunityChatRoomProps> = ({ channelId, channelName }) => {
  const { user } = useAuth();
  const isAdminOrTrainer = user?.role === 'ADMIN' || user?.role === 'TRAINER';

  const [messages, setMessages] = useState<CommunityChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [showAttachmentBar, setShowAttachmentBar] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommunityChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Realtime Group Typing State
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const typingTimerRef = useRef<{ [userId: string]: NodeJS.Timeout }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages();
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // =========================================================================
  // SUPABASE REALTIME SUBSCRIPTION FOR GROUP CHAT ROOM
  // =========================================================================
  useEffect(() => {
    if (!channelId) return;

    const groupChannel = supabase.channel(`group-chat:${channelId}`, {
      config: { broadcast: { self: false } },
    });

    groupChannel
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        const incoming: CommunityChatMessage = payload.message;
        if (incoming) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      })
      .on('broadcast', { event: 'chat_pin' }, ({ payload }) => {
        const { messageId, isPinned } = payload;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isPinned } : m))
        );
      })
      .on('broadcast', { event: 'chat_delete' }, ({ payload }) => {
        const { messageId } = payload;
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      })
      .on('broadcast', { event: 'chat_typing' }, ({ payload }) => {
        const { userId, userName, isTyping } = payload;
        if (userId === user?.id) return;

        setTypingUsers((prev) => {
          if (isTyping) {
            return { ...prev, [userId]: userName };
          } else {
            const copy = { ...prev };
            delete copy[userId];
            return copy;
          }
        });

        // Auto-clear after 3s
        if (typingTimerRef.current[userId]) clearTimeout(typingTimerRef.current[userId]);
        if (isTyping) {
          typingTimerRef.current[userId] = setTimeout(() => {
            setTypingUsers((prev) => {
              const copy = { ...prev };
              delete copy[userId];
              return copy;
            });
          }, 3000);
        }
      })
      .subscribe();

    channelRef.current = groupChannel;

    return () => {
      supabase.removeChannel(groupChannel);
      Object.values(typingTimerRef.current).forEach(clearTimeout);
    };
  }, [channelId, user?.id]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; messages: CommunityChatMessage[] }>(
        `/community/chat/channels/${channelId}`
      );
      if (res.success && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Error loading chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTypingChange = (val: string) => {
    setText(val);
    if (channelRef.current && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'chat_typing',
        payload: {
          userId: user.id,
          userName: user.name,
          isTyping: val.trim().length > 0,
        },
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !mediaUrl.trim() && !fileUrl.trim()) return;

    const messageContent = text.trim();
    const media = mediaUrl.trim() || undefined;
    const file = fileUrl.trim() || undefined;
    const fName = fileName.trim() || undefined;
    const parent = replyingTo?.id || undefined;

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: CommunityChatMessage = {
      id: tempId,
      channelId,
      userId: user?.id || '',
      content: messageContent,
      mediaUrl: media,
      fileUrl: file,
      fileName: fName,
      parentId: parent,
      isPinned: false,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id || '',
        name: user?.name || '',
        avatar: user?.avatar,
        role: user?.role || 'STUDENT',
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText('');
    setMediaUrl('');
    setFileUrl('');
    setFileName('');
    setShowAttachmentBar(false);
    setReplyingTo(null);
    setSending(true);
    setError(null);

    // Stop typing broadcast
    if (channelRef.current && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'chat_typing',
        payload: { userId: user.id, userName: user.name, isTyping: false },
      });
    }

    try {
      const res = await api.post<{ success: boolean; message: CommunityChatMessage }>(
        `/community/chat/channels/${channelId}`,
        {
          content: messageContent,
          mediaUrl: media,
          fileUrl: file,
          fileName: fName,
          parentId: parent,
        }
      );

      if (res.success && res.message) {
        const savedMessage = res.message;
        setMessages((prev) => prev.map((m) => (m.id === tempId ? savedMessage : m)));

        // Broadcast to all connected channel participants
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'chat_message',
            payload: { message: savedMessage },
          });
        }
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err.message || 'Failed to send chat message.');
    } finally {
      setSending(false);
    }
  };

  const handleTogglePin = async (messageId: string) => {
    if (!isAdminOrTrainer) return;
    try {
      const res = await api.patch<{ success: boolean; message: CommunityChatMessage }>(
        `/community/chat/${messageId}/pin`,
        {}
      );
      if (res.success) {
        const updated = res.message;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isPinned: updated.isPinned } : m))
        );

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'chat_pin',
            payload: { messageId, isPinned: updated.isPinned },
          });
        }
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await api.delete<{ success: boolean }>(`/community/chat/${messageId}`);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'chat_delete',
            payload: { messageId },
          });
        }
      }
    } catch (err) {
      console.error('Error deleting chat message:', err);
    }
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const typingList = Object.values(typingUsers);

  return (
    <div className="bg-[#0B1528] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[74vh] min-h-[560px]">
      {/* Chat Room Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#071324]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black">
            ⚡
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>{channelName} Group Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-400">
              Live instant room for students and instructors
            </p>
          </div>
        </div>

        {pinnedMessages.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
            <Pin className="w-3.5 h-3.5 text-amber-400" />
            <span>{pinnedMessages.length} Pinned</span>
          </div>
        )}
      </div>

      {/* Pinned Message Alert Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="font-bold">{pinnedMessages[pinnedMessages.length - 1].user.name}:</span>
            <span className="truncate">{pinnedMessages[pinnedMessages.length - 1].content}</span>
          </div>
        </div>
      )}

      {/* Chat Messages Feed Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-xs text-slate-400">Connecting to live group stream...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center space-y-2 max-w-sm mx-auto">
            <MessageSquare className="w-10 h-10 text-cyan-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Welcome to the Live Room!</h4>
            <p className="text-xs text-slate-400">
              Say hello to your fellow peers and trainers. Share questions, snippets, and updates in real-time.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === user?.id;
            const isInstructor = msg.user.role === 'TRAINER' || msg.user.role === 'ADMIN';

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Author Avatar */}
                <img
                  src={
                    msg.user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user.name)}&background=0284C7&color=fff`
                  }
                  alt={msg.user.name}
                  className={`w-9 h-9 rounded-xl object-cover flex-shrink-0 border ${
                    isInstructor ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-white/10'
                  }`}
                />

                <div className={`space-y-1 max-w-[85%] sm:max-w-lg ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                  {/* Author Name & Role Badge */}
                  <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-bold text-white">{msg.user.name}</span>
                    {isInstructor && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        Instructor
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.isPinned && (
                      <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed inline-block ${
                      isMe
                        ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white rounded-tr-none shadow-md'
                        : 'bg-[#091324] text-slate-200 border border-white/10 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Media Preview */}
                    {msg.mediaUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                        <img
                          src={msg.mediaUrl}
                          alt="Media attachment"
                          className="max-h-60 w-full object-cover"
                        />
                      </div>
                    )}

                    {/* File Attachment */}
                    {msg.fileUrl && (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="mt-2 p-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 flex items-center justify-between gap-2 text-cyan-300 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate font-semibold text-[11px]">
                            {msg.fileName || 'Shared Document'}
                          </span>
                        </div>
                        <Download className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    )}
                  </div>

                  {/* Message Actions on Hover */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-slate-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 hover:text-cyan-300 transition-colors flex items-center gap-0.5"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>

                    {isAdminOrTrainer && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(msg.id)}
                        className={`p-1 transition-colors flex items-center gap-0.5 ${
                          msg.isPinned ? 'text-amber-400' : 'hover:text-amber-300'
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                        <span>{msg.isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                    )}

                    {(isMe || isAdminOrTrainer) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 hover:text-rose-400 transition-colors flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Realtime Group Typing Indicator */}
        {typingList.length > 0 && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
            <div className="px-4 py-2 rounded-2xl bg-[#091324] border border-white/10 rounded-bl-none flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
                {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Replying Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#091324] border-t border-white/10 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-3.5 h-3.5" />
            <span>Replying to <strong className="text-white">{replyingTo.user.name}</strong>: "{replyingTo.content}"</span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Drawer Bar */}
      {showAttachmentBar && (
        <div className="p-3 bg-[#071324] border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Share Image or File Attachment</span>
            <button
              type="button"
              onClick={() => setShowAttachmentBar(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="url"
              placeholder="Media URL (Screenshot / Diagram)..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#050C1A] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
            <input
              type="url"
              placeholder="File / Document Link URL..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#050C1A] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-[#071324]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAttachmentBar(!showAttachmentBar)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-all border border-white/10"
            title="Attach Media or File"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Type your message in community chat..."
            value={text}
            onChange={(e) => handleTypingChange(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
          />

          <button
            type="submit"
            disabled={sending || (!text.trim() && !mediaUrl.trim() && !fileUrl.trim())}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};
