import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CommunityMemberProfile } from '../../types';
import {
  X,
  User,
  GraduationCap,
  MessageSquare,
  FileText,
  Award,
  Calendar,
  Sparkles,
  Shield,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface MemberProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [profile, setProfile] = useState<CommunityMemberProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile(userId);
    } else {
      setProfile(null);
    }
  }, [isOpen, userId]);

  const fetchProfile = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; profile: CommunityMemberProfile }>(
        `/community/members/${id}/profile`
      );
      if (res.success && res.profile) {
        setProfile(res.profile);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching member profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl w-full max-w-2xl border border-cyan-500/30 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-scalora-blue/20 flex items-center justify-between bg-[#04152D]/90">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-300" />
            <h2 className="text-lg font-black text-white">Community Member Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-scalora-blue/30">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <span>Loading member details...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
              {error}
            </div>
          ) : profile ? (
            <>
              {/* User Hero Banner */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 rounded-3xl bg-gradient-to-r from-scalora-navy via-[#0A264F] to-[#04152D] border border-cyan-400/30">
                <img
                  src={
                    profile.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2D8CFF&color=fff`
                  }
                  alt={profile.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-xl flex-shrink-0"
                />

                <div className="space-y-1.5 text-center sm:text-left min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-white">{profile.name}</h3>
                    {profile.role === 'ADMIN' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>Administrator</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-scalora-blue/20 text-scalora-accent border border-scalora-blue/30">
                        Enrolled Student
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {profile.bio || 'Scalora Academy Learner & Community Member.'}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Matrix (4 Tiles) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass-card p-3.5 rounded-2xl text-center space-y-1 border border-scalora-blue/20">
                  <div className="text-xl font-black text-white">{profile.enrolledCourses.length}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courses</div>
                </div>

                <div className="glass-card p-3.5 rounded-2xl text-center space-y-1 border border-scalora-blue/20">
                  <div className="text-xl font-black text-cyan-300">{profile.totalPosts}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posts</div>
                </div>

                <div className="glass-card p-3.5 rounded-2xl text-center space-y-1 border border-scalora-blue/20">
                  <div className="text-xl font-black text-emerald-400">{profile.totalComments}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments</div>
                </div>

                <div className="glass-card p-3.5 rounded-2xl text-center space-y-1 border border-scalora-blue/20">
                  <div className="text-xl font-black text-amber-300">{profile.certificatesCount}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Certificates</div>
                </div>
              </div>

              {/* Enrolled Courses Badges */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Enrolled Course Tracks ({profile.enrolledCourses.length})</span>
                </h4>

                {profile.enrolledCourses.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No public course enrollments.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {profile.enrolledCourses.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-2xl bg-scalora-navy/60 border border-scalora-blue/20 flex items-center gap-3"
                      >
                        {c.thumbnail && (
                          <img
                            src={c.thumbnail}
                            alt={c.title}
                            className="w-10 h-10 rounded-xl object-cover border border-scalora-blue/30 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{c.title}</div>
                          <div className="text-[10px] text-cyan-300">{c.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Community Posts */}
              {profile.recentPosts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Recent Community Activity</span>
                  </h4>

                  <div className="space-y-2">
                    {profile.recentPosts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-scalora-navy/40 border border-scalora-blue/15 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-bold text-cyan-300">{p.channelName}</span>
                          <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                        {p.title && <div className="font-bold text-white">{p.title}</div>}
                        <p className="text-slate-300 line-clamp-2 leading-relaxed">{p.content}</p>
                        <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-3 font-semibold">
                          <span>❤️ {p.likesCount} likes</span>
                          <span>💬 {p.commentsCount} comments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
