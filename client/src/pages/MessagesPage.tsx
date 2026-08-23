import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { realtime } from '../lib/realtime';
import { DirectMessage, Conversation } from '../types';
import {
  Mail,
  Send,
  Search,
  Paperclip,
  ImageIcon,
  Check,
  CheckCheck,
  User,
  Shield,
  Loader2,
  Plus,
  X,
  FileText,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Video,
  Info,
  Globe,
  Linkedin,
  BookOpen,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Smile,
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetTrainerParam = searchParams.get('trainer');
  const targetStudentParam = searchParams.get('student');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<any | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Realtime Presence & Typing Indicator State
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // New Message Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);

  // Message Form State
  const [text, setText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState<'IMAGE' | 'FILE' | null>(null);
  const [showAttachmentBar, setShowAttachmentBar] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial conversations on load
  useEffect(() => {
    fetchConversations();
    if (user?.role === 'STUDENT' || user?.role === 'ADMIN') {
      fetchAvailableTrainers();
    }
  }, [user]);

  // Handle URL param shortcuts (e.g. ?trainer=xyz or ?student=xyz)
  useEffect(() => {
    const target = targetTrainerParam || targetStudentParam;
    if (target) {
      setActivePartnerId(target);
    }
  }, [targetTrainerParam, targetStudentParam]);

  // Fetch messages whenever activePartnerId changes
  useEffect(() => {
    if (activePartnerId) {
      fetchMessageThread(activePartnerId);
    }
  }, [activePartnerId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // =========================================================================
  // REAL-TIME PUSH SUBSCRIPTIONS (ZERO REFRESH REQUIRED)
  // =========================================================================
  useEffect(() => {
    if (!user?.id) return;

    // Connect to persistent SSE Stream
    realtime.connect();

    // 1. Listen for new incoming direct messages
    const unsubNewMessage = realtime.on('new_direct_message', ({ message }: { message: DirectMessage }) => {
      if (!message) return;

      // If the message is part of current active conversation, append to stream immediately
      if (message.senderId === activePartnerId || message.recipientId === activePartnerId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setIsPartnerTyping(false);
      }

      // Update conversations sidebar list & unread counters instantly (move to top without auto-opening)
      setConversations((prev) => {
        const partnerId = message.senderId === user.id ? message.recipientId : message.senderId;
        const existingIndex = prev.findIndex((c) => c.partner.id === partnerId);

        if (existingIndex !== -1) {
          const existing = prev[existingIndex];
          const updatedConv: Conversation = {
            ...existing,
            lastMessage: {
              id: message.id,
              content: message.content || (message.attachmentType === 'IMAGE' ? '📷 Image' : '📎 Attachment'),
              createdAt: message.createdAt,
              isSender: message.senderId === user.id,
              isRead: message.isRead,
            },
            unreadCount: partnerId === activePartnerId ? 0 : existing.unreadCount + 1,
          };
          const others = prev.filter((_, idx) => idx !== existingIndex);
          return [updatedConv, ...others];
        } else {
          // Re-fetch conversation list to include the new partner (without auto-opening)
          fetchConversations();
          return prev;
        }
      });
    });

    // 2. Listen for typing indicators
    const unsubTyping = realtime.on('typing', ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
      if (senderId === activePartnerId) {
        setIsPartnerTyping(Boolean(isTyping));

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsPartnerTyping(false);
          }, 3000);
        }
      }
    });

    // 3. Listen for presence changes
    const unsubPresence = realtime.on('presence', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      if (userId === activePartnerId) {
        setIsPartnerOnline(Boolean(isOnline));
      }
    });

    return () => {
      unsubNewMessage();
      unsubTyping();
      unsubPresence();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user?.id, activePartnerId]);

  // =========================================================================
  // DATA FETCHING METHODS (INBOX FIRST - NO AUTO SELECT)
  // =========================================================================

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await api.get<{ success: boolean; conversations: Conversation[] }>('/messages/conversations');
      if (res.success) {
        setConversations(res.conversations);
        // INBOX FIRST: Do NOT auto-open any conversation. The user decides.
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchAvailableTrainers = async () => {
    setLoadingTrainers(true);
    try {
      const res = await api.get<{ success: boolean; trainers: any[] }>('/messages/available-trainers');
      if (res.success) {
        setAvailableTrainers(res.trainers);
      }
    } catch (err) {
      console.error('Error fetching available trainers:', err);
    } finally {
      setLoadingTrainers(false);
    }
  };

  const fetchMessageThread = async (partnerId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get<{
        success: boolean;
        targetUser: any;
        messages: DirectMessage[];
      }>(`/messages/thread/${partnerId}`);

      if (res.success) {
        setMessages(res.messages);
        setActivePartner(res.targetUser);
        // Clear unread count locally in conversation list
        setConversations((prev) =>
          prev.map((c) => (c.partner.id === partnerId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.error('Error fetching message thread:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Dispatch Typing Indicator
  const handleTypingChange = (val: string) => {
    setText(val);
    if (activePartnerId) {
      realtime.sendTyping(activePartnerId, val.trim().length > 0);
    }
  };

  // Send Message with Optimistic Update + Realtime Server Push
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !attachmentUrl.trim()) || !activePartnerId || !user) return;

    const messageContent = text.trim();
    const mediaUrl = attachmentUrl.trim() || undefined;
    const mediaName = attachmentName.trim() || undefined;
    const mediaType = attachmentType || undefined;

    // 1. Optimistic UI update (Appears immediately on sender screen)
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: DirectMessage = {
      id: tempId,
      senderId: user.id,
      recipientId: activePartnerId,
      content: messageContent,
      attachmentUrl: mediaUrl,
      attachmentName: mediaName,
      attachmentType: mediaType,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      recipient: activePartner
        ? {
            id: activePartner.id,
            name: activePartner.name,
            avatar: activePartner.avatar,
            role: activePartner.role,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText('');
    setAttachmentUrl('');
    setAttachmentName('');
    setAttachmentType(null);
    setShowAttachmentBar(false);
    setSending(true);
    setError(null);

    // Stop typing indicator
    if (activePartnerId) {
      realtime.sendTyping(activePartnerId, false);
    }

    try {
      const res = await api.post<{ success: boolean; message: DirectMessage }>('/messages', {
        recipientId: activePartnerId,
        content: messageContent,
        attachmentUrl: mediaUrl,
        attachmentName: mediaName,
        attachmentType: mediaType,
      });

      if (res.success && res.message) {
        const savedMessage = res.message;

        // Replace optimistic placeholder with verified DB record
        setMessages((prev) => prev.map((m) => (m.id === tempId ? savedMessage : m)));

        // Update local conversation preview in sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.partner.id === activePartnerId
              ? {
                  ...c,
                  lastMessage: {
                    id: savedMessage.id,
                    content: savedMessage.content || (savedMessage.attachmentType === 'IMAGE' ? '📷 Image' : '📎 Attachment'),
                    createdAt: savedMessage.createdAt,
                    isSender: true,
                    isRead: true,
                  },
                }
              : c
          )
        );
      }
    } catch (err: any) {
      // Revert optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleStartConversationWithTrainer = (trainer: any) => {
    setActivePartnerId(trainer.id);
    setActivePartner(trainer);
    setIsNewModalOpen(false);
  };

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = (now.getTime() - date.getTime()) / 1000;

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;

    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.partner.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.partner.title && c.partner.title.toLowerCase().includes(search.toLowerCase()))
  );

  // Extract shared media and attachments in this thread
  const sharedMedia = messages.filter(
    (m): m is DirectMessage & { attachmentUrl: string } => Boolean(m.attachmentUrl) && m.attachmentType === 'IMAGE'
  );
  const sharedFiles = messages.filter(
    (m): m is DirectMessage & { attachmentUrl: string } => Boolean(m.attachmentUrl) && m.attachmentType === 'FILE'
  );

  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-4">
      {/* Messenger App Container */}
      <div className="bg-[#0B1528] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex h-[86vh] min-h-[580px]">
        {/* ========================================================================= */}
        {/* 1. LEFT SIDEBAR: Facebook Messenger Style Conversations List */}
        {/* ========================================================================= */}
        <aside
          className={`w-full md:w-80 lg:w-88 border-r border-white/10 flex flex-col flex-shrink-0 bg-[#071326] ${
            activePartnerId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                <span>Inbox</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Realtime
                </span>
              </h2>

              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent hover:opacity-90 transition-all flex items-center justify-center min-h-[44px] min-w-[44px]"
                title="New Direct Inquiry"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Messenger Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Messenger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#0B1A30] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all min-h-[40px]"
              />
            </div>
          </div>

          {/* Conversations Scroll Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {loadingConversations ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs text-slate-400">Loading inbox...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Mail className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No active conversations yet.</p>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 min-h-[44px]"
                >
                  Start Discussion
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activePartnerId === conv.partner.id;
                const hasUnread = conv.unreadCount > 0;
                return (
                  <button
                    key={conv.partner.id}
                    type="button"
                    onClick={() => setActivePartnerId(conv.partner.id)}
                    className={`w-full p-3.5 text-left flex items-center gap-3 transition-all min-h-[64px] ${
                      isSelected
                        ? 'bg-[#0E2242] border-l-4 border-cyan-400 shadow-inner'
                        : 'hover:bg-white/5 active:bg-white/10'
                    }`}
                  >
                    {/* Avatar with Online Dot */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          conv.partner.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.partner.name)}&background=0284C7&color=fff`
                        }
                        alt={conv.partner.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                      />
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#071326] absolute -bottom-0.5 -right-0.5 shadow-sm" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs truncate ${hasUnread ? 'font-black text-white' : 'font-bold text-white'}`}>
                          {conv.partner.name}
                        </span>
                        {conv.lastMessage && (
                          <span className={`text-[10px] flex-shrink-0 ${hasUnread ? 'font-bold text-cyan-400' : 'text-slate-500'}`}>
                            {formatMessageTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${hasUnread ? 'text-slate-200 font-semibold' : 'text-slate-400'}`}>
                          {conv.lastMessage ? (
                            <span>{conv.lastMessage.content}</span>
                          ) : (
                            <span className="italic text-slate-500">Tap to chat</span>
                          )}
                        </p>
                        {hasUnread && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-white font-extrabold text-[10px] shadow-glow-accent flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* 2. CENTER PANEL: Active Conversation & Speech Bubbles Stream */}
        {/* ========================================================================= */}
        <main
          className={`flex-1 flex-col min-w-0 bg-[#09152A] ${
            activePartnerId ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activePartner ? (
            <>
              {/* Messenger Header */}
              <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#08152B] z-10">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setActivePartnerId(null);
                      setActivePartner(null);
                    }}
                    className="md:hidden px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 min-h-[40px] flex items-center gap-1.5 font-bold text-xs"
                    title="Back to Inbox"
                  >
                    <ChevronLeft className="w-4 h-4 text-cyan-400" />
                    <span>Inbox</span>
                  </button>

                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        activePartner.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(activePartner.name)}&background=0284C7&color=fff`
                      }
                      alt={activePartner.name}
                      className="w-10 h-10 rounded-2xl object-cover border border-cyan-500/30 shadow-md"
                    />
                    <span
                      className={`w-3 h-3 rounded-full border-2 border-[#08152B] absolute -bottom-0.5 -right-0.5 ${
                        isPartnerOnline ? 'bg-emerald-400' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                      <span>{activePartner.name}</span>
                      {activePartner.role === 'TRAINER' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                          Instructor
                        </span>
                      )}
                    </h3>
                    <div
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        isPartnerOnline ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPartnerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      <span>{isPartnerOnline ? 'Active now' : 'Online'}</span>
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowRightPanel(!showRightPanel)}
                    className={`p-2 rounded-xl border transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${
                      showRightPanel
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                        : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
                    }`}
                    title="Toggle Profile Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages History Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 scrollbar-thin bg-gradient-to-b from-[#09152A] to-[#071122]">
                {loadingMessages ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    <span className="text-xs text-slate-400">Connecting to secure stream...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center space-y-2 max-w-sm mx-auto">
                    <Sparkles className="w-8 h-8 text-cyan-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Start your discussion</h4>
                    <p className="text-xs text-slate-400">
                      Send an instant message to your assigned course instructor.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    const isOptimistic = msg.id.startsWith('temp-');

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={
                              msg.sender?.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.name || 'User')}&background=0284C7&color=fff`
                            }
                            alt=""
                            className="w-7 h-7 rounded-xl object-cover border border-white/10 mb-1"
                          />
                        )}

                        <div className={`space-y-1 max-w-[80%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Message Bubble */}
                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-gradient-to-r from-cyan-500 to-scalora-blue text-white rounded-br-none shadow-md'
                                : 'bg-[#0E203C] text-slate-200 border border-white/10 rounded-bl-none shadow-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {/* Image Attachment */}
                            {msg.attachmentUrl && msg.attachmentType === 'IMAGE' && (
                              <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                                <img
                                  src={msg.attachmentUrl}
                                  alt="Attachment"
                                  className="max-h-60 w-full object-cover"
                                />
                              </div>
                            )}

                            {/* File Attachment */}
                            {msg.attachmentUrl && msg.attachmentType === 'FILE' && (
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="mt-2 p-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 flex items-center justify-between gap-2 text-cyan-300 transition-all group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate font-semibold text-[11px]">
                                    {msg.attachmentName || 'Download Resource'}
                                  </span>
                                </div>
                                <Download className="w-3.5 h-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                              </a>
                            )}
                          </div>

                          {/* Timestamp & Read Status */}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && (
                              <span>
                                {isOptimistic ? (
                                  <Clock className="w-3 h-3 text-cyan-300 animate-spin" />
                                ) : msg.isRead ? (
                                  <CheckCheck className="w-3 h-3 text-cyan-400" />
                                ) : (
                                  <Check className="w-3 h-3 text-slate-500" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Realtime Partner Typing Bubble Indicator */}
                {isPartnerTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                    <div className="px-4 py-2 rounded-2xl bg-[#0E203C] border border-white/10 rounded-bl-none flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[11px] text-slate-400 ml-1.5 font-medium">{activePartner.name} is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mx-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Attachment Drawer Bar */}
              {showAttachmentBar && (
                <div className="p-3 bg-[#08152B] border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Attach Media / Document</span>
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
                      placeholder="Image / Document URL..."
                      value={attachmentUrl}
                      onChange={(e) => {
                        setAttachmentUrl(e.target.value);
                        if (e.target.value.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
                          setAttachmentType('IMAGE');
                        } else {
                          setAttachmentType('FILE');
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#050C1A] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      placeholder="Display Name (e.g. Blueprint.png)"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#050C1A] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-[#08152B]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachmentBar(!showAttachmentBar)}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-all border border-white/10"
                    title="Attach File or Image"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Aa"
                    value={text}
                    onChange={(e) => handleTypingChange(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!text.trim() && !attachmentUrl.trim())}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-4 bg-gradient-to-b from-[#09152A] to-[#071122]">
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-glow-accent">
                <Mail className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-xl font-black text-white tracking-tight">Messages</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Select a conversation from your inbox to view discussions, or start a new inquiry with an instructor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white text-xs font-bold shadow-glow-accent hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Start a new conversation</span>
              </button>
            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* 3. RIGHT PANEL: Facebook Messenger Style User Profile & Shared Media */}
        {/* ========================================================================= */}
        {activePartner && showRightPanel && (
          <aside className="hidden lg:flex w-72 lg:w-80 border-l border-white/10 flex-col bg-[#071326] p-5 space-y-6 overflow-y-auto scrollbar-thin">
            {/* User Profile Card */}
            <div className="text-center space-y-3 pb-5 border-b border-white/10">
              <img
                src={
                  activePartner.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(activePartner.name)}&background=0284C7&color=fff`
                }
                alt={activePartner.name}
                className="w-20 h-20 rounded-3xl object-cover border-2 border-cyan-400 shadow-glow-accent mx-auto"
              />
              <div>
                <h4 className="text-base font-black text-white">{activePartner.name}</h4>
                <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                  {activePartner.title || (activePartner.role === 'TRAINER' ? 'Course Instructor' : 'Enrolled Scholar')}
                </p>
              </div>

              {/* Bio Snippet */}
              {activePartner.bio && (
                <p className="text-xs text-slate-400 leading-relaxed italic bg-white/5 p-3 rounded-2xl border border-white/5">
                  "{activePartner.bio}"
                </p>
              )}

              {/* Social Links */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {activePartner.linkedin && (
                  <a
                    href={activePartner.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
                {activePartner.website && (
                  <a
                    href={activePartner.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Course Relationship Info */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Relationship & Permissions</span>
              </h5>
              <div className="p-3 rounded-2xl bg-[#09172E] border border-white/5 space-y-1 text-xs text-slate-400 leading-relaxed">
                <div className="text-white font-semibold flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Enrolled Track Connection</span>
                </div>
                <p className="text-[11px]">
                  Direct inquiries are permitted between enrolled students and course instructors.
                </p>
              </div>
            </div>

            {/* Shared Media & Files History */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Shared Media & Files</span>
                <span className="text-[10px] text-slate-500">{sharedMedia.length + sharedFiles.length} items</span>
              </h5>

              {sharedMedia.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {sharedMedia.slice(0, 6).map((item, idx) => (
                    <a
                      key={idx}
                      href={item.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl overflow-hidden border border-white/10 hover:opacity-80 transition-opacity"
                    >
                      <img src={item.attachmentUrl} alt="" className="w-full h-16 object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {sharedFiles.length > 0 && (
                <div className="space-y-1.5">
                  {sharedFiles.slice(0, 3).map((item, idx) => (
                    <a
                      key={idx}
                      href={item.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-xs text-cyan-300 transition-colors"
                    >
                      <span className="truncate text-[11px] font-semibold">{item.attachmentName || 'Attachment'}</span>
                      <Download className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              {sharedMedia.length === 0 && sharedFiles.length === 0 && (
                <p className="text-xs text-slate-500 italic">No shared photos or files yet.</p>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ========================================================================= */}
      {/* NEW CONVERSATION MODAL (Strictly Enforces Student -> Instructor Rule) */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1528] w-full max-w-md rounded-3xl border border-white/15 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>Select Course Instructor</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You can start a direct messaging inquiry with certified instructors assigned to your enrolled courses:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {loadingTrainers ? (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs text-slate-400">Fetching assigned instructors...</span>
                </div>
              ) : availableTrainers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-[#091324] rounded-2xl p-4 border border-white/5 space-y-2">
                  <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="font-bold text-white">No Assigned Instructors Available</p>
                  <p>You must be actively enrolled in a course with an assigned trainer to start a private session.</p>
                </div>
              ) : (
                availableTrainers.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => handleStartConversationWithTrainer(tr)}
                    className="w-full p-3 rounded-2xl bg-[#091324] hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-400/40 transition-all text-left flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          tr.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(tr.name)}&background=0284C7&color=fff`
                        }
                        alt={tr.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {tr.name}
                        </div>
                        <div className="text-[10px] text-cyan-300 font-semibold">{tr.title || 'Course Lead'}</div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 text-[11px] font-bold border border-cyan-500/20">
                      Message
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
