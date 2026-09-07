import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { realtime } from '../../lib/realtime';
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

  useEffect(() => {
    fetchMessages();
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // =========================================================================
  // REAL-TIME GROUP CHAT SUBSCRIPTIONS
  // =========================================================================
  useEffect(() => {
    if (!channelId) return;

    realtime.connect();

    // 1. Listen for new group chat messages
    const unsubChatMessage = realtime.on(
      'chat_message',
      ({ channelId: incomingChannelId, message }: { channelId: string; message: CommunityChatMessage }) => {
        if (incomingChannelId === channelId && message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
        }
      }
    );

    // 2. Listen for pin status updates
    const unsubPin = realtime.on(
      'chat_pin',
      ({
        channelId: incomingChannelId,
        messageId,
        isPinned,
      }: {
        channelId: string;
        messageId: string;
        isPinned: boolean;
      }) => {
        if (incomingChannelId === channelId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, isPinned } : m))
          );
        }
      }
    );

    // 3. Listen for message deletions
    const unsubDelete = realtime.on(
      'chat_delete',
      ({ channelId: incomingChannelId, messageId }: { channelId: string; messageId: string }) => {
        if (incomingChannelId === channelId) {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        }
      }
    );

    // 4. Listen for group typing indicators
    const unsubTyping = realtime.on(
      'chat_typing',
      ({
        channelId: incomingChannelId,
        userId,
        userName,
        isTyping,
      }: {
        channelId: string;
        userId: string;
        userName: string;
        isTyping: boolean;
      }) => {
        if (incomingChannelId !== channelId || userId === user?.id) return;

        setTypingUsers((prev) => {
          if (isTyping) {
            return { ...prev, [userId]: userName };
          } else {
            const copy = { ...prev };
            delete copy[userId];
            return copy;
          }
        });

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
      }
    );

    return () => {
      unsubChatMessage();
      unsubPin();
      unsubDelete();
      unsubTyping();
    };
  }, [channelId, user?.id]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; messages: CommunityChatMessage[] }>(
        `/community/channels/${channelId}/chat`
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
    realtime.sendChatTyping(channelId, val.length > 0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !mediaUrl.trim() && !fileUrl.trim()) return;

    setSending(true);
    setError(null);
    try {
      const payload: any = {
        content: text.trim(),
        replyToId: replyingTo?.id,
      };

      if (mediaUrl.trim()) payload.mediaUrl = mediaUrl.trim();
      if (fileUrl.trim()) {
        payload.fileUrl = fileUrl.trim();
        payload.fileName = fileName.trim() || 'Attachment.pdf';
      }

      const res = await api.post<{ success: boolean; message: CommunityChatMessage }>(
        `/community/channels/${channelId}/chat`,
        payload
      );

      if (res.success && res.message) {
        setText('');
        setMediaUrl('');
        setFileUrl('');
        setFileName('');
        setShowAttachmentBar(false);
        setReplyingTo(null);

        realtime.sendChatTyping(channelId, false);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleTogglePin = async (messageId: string) => {
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
      }
    } catch (err) {
      console.error('Error deleting chat message:', err);
    }
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const typingList = Object.values(typingUsers);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[74vh] min-h-[560px] text-slate-900">
      {/* Chat Room Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black border border-blue-200 shadow-sm">
            ⚡
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{channelName} Live Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500">
              Live instant channel for enrolled students & instructors
            </p>
          </div>
        </div>

        {pinnedMessages.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            <Pin className="w-3.5 h-3.5 text-amber-600" />
            <span>{pinnedMessages.length} Pinned</span>
          </div>
        )}
      </div>

      {/* Pinned Message Alert Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="font-bold">{pinnedMessages[pinnedMessages.length - 1].user.name}:</span>
            <span className="truncate">{pinnedMessages[pinnedMessages.length - 1].content}</span>
          </div>
        </div>
      )}

      {/* Chat Messages Feed Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs text-slate-500">Connecting to live group stream...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center space-y-2 max-w-sm mx-auto">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Welcome to the Live Room!</h4>
            <p className="text-xs text-slate-500">
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
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user.name)}&background=2563EB&color=fff`
                  }
                  alt={msg.user.name}
                  className={`w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 shadow-sm ${
                    isInstructor ? 'border-blue-400' : 'border-blue-100'
                  }`}
                />

                <div className={`space-y-1 max-w-[85%] sm:max-w-lg ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                  {/* Author Name & Role Badge */}
                  <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-bold text-slate-900">{msg.user.name}</span>
                    {isInstructor && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        Instructor
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.isPinned && (
                      <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed inline-block ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Media Preview */}
                    {msg.mediaUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-slate-200">
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
                        className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isMe
                            ? 'bg-blue-700/50 border-blue-400 text-white hover:bg-blue-700'
                            : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
                        }`}
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
                      className="p-1 hover:text-blue-600 transition-colors flex items-center gap-0.5"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>

                    {isAdminOrTrainer && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(msg.id)}
                        className={`p-1 transition-colors flex items-center gap-0.5 ${
                          msg.isPinned ? 'text-amber-600' : 'hover:text-amber-600'
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
                        className="p-1 hover:text-rose-600 transition-colors flex items-center gap-0.5"
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
          <div className="flex items-center gap-2 text-slate-500 text-xs py-1">
            <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 rounded-bl-none flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] text-slate-600 ml-1.5 font-medium">
                {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Replying Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900 font-semibold">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-3.5 h-3.5 text-blue-600" />
            <span>Replying to <strong>{replyingTo.user.name}</strong>: "{replyingTo.content}"</span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded text-slate-400 hover:text-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Drawer Bar */}
      {showAttachmentBar && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Share Image or File Attachment</span>
            <button
              type="button"
              onClick={() => setShowAttachmentBar(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700"
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
              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
            />
            <input
              type="url"
              placeholder="File / Document Link URL..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAttachmentBar(!showAttachmentBar)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-all border border-slate-200 shadow-sm"
            title="Attach Media or File"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Type your message in community chat..."
            value={text}
            onChange={(e) => handleTypingChange(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          />

          <button
            type="submit"
            disabled={sending || (!text.trim() && !mediaUrl.trim() && !fileUrl.trim())}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 disabled:opacity-40 transition-all flex items-center justify-center"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};
