import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { DirectMessage, Conversation, Trainer } from '../types';
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

  // Fetch conversations on load
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
  }, [messages]);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await api.get<{ success: boolean; conversations: Conversation[] }>('/messages/conversations');
      if (res.success) {
        setConversations(res.conversations);
        if (!activePartnerId && res.conversations.length > 0) {
          setActivePartnerId(res.conversations[0].partner.id);
        }
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !attachmentUrl.trim()) || !activePartnerId) return;

    setSending(true);
    setError(null);

    try {
      const res = await api.post<{ success: boolean; message: DirectMessage }>('/messages', {
        recipientId: activePartnerId,
        content: text.trim(),
        attachmentUrl: attachmentUrl.trim() || undefined,
        attachmentName: attachmentName.trim() || undefined,
        attachmentType: attachmentType || undefined,
      });

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setText('');
        setAttachmentUrl('');
        setAttachmentName('');
        setAttachmentType(null);
        setShowAttachmentBar(false);

        // Update conversation preview
        fetchConversations();
      }
    } catch (err: any) {
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

  const filteredConversations = conversations.filter(
    (c) =>
      c.partner.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.partner.title && c.partner.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-[#0B1528] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[78vh] min-h-[580px]">
        {/* LEFT PANEL: Conversation Threads List */}
        <aside className="w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col flex-shrink-0 bg-[#091324]">
          {/* Panel Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                <span>Direct Inquiries</span>
              </h2>

              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-all border border-cyan-400/30"
                title="Message an Instructor"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Conversations List Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {loadingConversations ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs text-slate-400">Loading messages...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Mail className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No conversations yet.</p>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30"
                >
                  Contact Your Instructor
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activePartnerId === conv.partner.id;
                return (
                  <button
                    key={conv.partner.id}
                    type="button"
                    onClick={() => setActivePartnerId(conv.partner.id)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-scalora-blue/20 border-l-4 border-cyan-400'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          conv.partner.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.partner.name)}&background=0284C7&color=fff`
                        }
                        alt={conv.partner.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-white/10"
                      />
                      {conv.unreadCount > 0 && (
                        <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-[#091324] absolute -top-0.5 -right-0.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white truncate">{conv.partner.name}</div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-[11px] text-cyan-300 font-semibold truncate">
                        {conv.partner.title || (conv.partner.role === 'TRAINER' ? 'Course Instructor' : 'Student')}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {conv.lastMessage.isSender ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANEL: Chat History & Input */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0B1528]">
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#0B1528] z-10">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      activePartner.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(activePartner.name)}&background=0284C7&color=fff`
                    }
                    alt={activePartner.name}
                    className="w-10 h-10 rounded-2xl object-cover border border-cyan-500/30"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{activePartner.name}</h3>
                    <div className="text-xs text-cyan-300 font-semibold">
                      {activePartner.title || (activePartner.role === 'TRAINER' ? 'Assigned Instructor' : 'Student')}
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Private Session
                </span>
              </div>

              {/* Messages History Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
                {loadingMessages ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    <span className="text-xs text-slate-400">Loading conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center space-y-2 max-w-sm mx-auto">
                    <Sparkles className="w-8 h-8 text-cyan-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Start your discussion</h4>
                    <p className="text-xs text-slate-400">
                      Ask your instructor questions regarding course architecture, assignments, or blueprints.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
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
                                : 'bg-[#091324] text-slate-200 border border-white/10 rounded-bl-none'
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
                                {msg.isRead ? (
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
                <div ref={messagesEndRef} />
              </div>

              {/* Error Toast */}
              {error && (
                <div className="mx-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Attachment Drawer Bar */}
              {showAttachmentBar && (
                <div className="p-3 bg-[#091324] border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Add Media / File Attachment</span>
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
                      placeholder="Attachment URL (Image or PDF)..."
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
                      placeholder="Display Name (e.g. Architecture_Diagram.png)"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#050C1A] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-[#091324]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachmentBar(!showAttachmentBar)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-all border border-white/10"
                    title="Attach File or Image"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Type your message to instructor..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!text.trim() && !attachmentUrl.trim())}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white shadow-glow-accent hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Mail className="w-12 h-12 text-slate-600" />
              <h3 className="text-base font-bold text-white">Select a Conversation</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Choose an instructor from the left panel or click below to start a new discussion.
              </p>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white text-xs font-bold shadow-glow-accent"
              >
                Message Course Instructor
              </button>
            </div>
          )}
        </main>
      </div>

      {/* NEW CONVERSATION MODAL (Strictly Enforces Course Enrolled Instructors) */}
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
