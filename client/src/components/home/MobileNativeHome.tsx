import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Course } from '../../types';
import {
  Sparkles,
  Play,
  ArrowRight,
  BookOpen,
  Users,
  MessageSquare,
  Award,
  Clock,
  Shield,
  Briefcase,
  ChevronRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { PwaHeroCard } from '../pwa/PwaHeroCard';

export const MobileNativeHome: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; courses: Course[] }>('/courses')
      .then((res) => {
        if (res.success && Array.isArray(res.courses)) {
          setCourses(res.courses.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="md:hidden space-y-5 px-4 pt-4 pb-12">
      {/* 1. Mobile Welcome / User Status Header */}
      <div className="bg-gradient-to-br from-[#0B172E] via-[#071324] to-[#04152D] rounded-3xl p-5 border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            {user ? (
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=0284C7&color=fff`
                }
                alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#04152D] border border-cyan-500/30 p-2 flex items-center justify-center flex-shrink-0">
                <img
                  src="/scalora-icon-transparent.png"
                  alt="Scalora"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="min-w-0">
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                <span>{user ? `Welcome Back, ${user.name.split(' ')[0]}` : 'Scalora Academy'}</span>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>
              <h2 className="text-base font-black text-white truncate">
                {user ? 'Continue Your Track' : 'Master Executive Skills'}
              </h2>
            </div>
          </div>

          {user && (
            <div className="flex flex-col items-end">
              <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold border border-cyan-400/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Level 4</span>
              </span>
            </div>
          )}
        </div>

        {/* Quick Mobile Action Pills */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10">
          <Link
            to="/courses"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 font-bold text-xs hover:bg-cyan-500/20 active:scale-95 transition-all min-h-[44px]"
          >
            <BookOpen className="w-4 h-4" />
            <span>All Courses</span>
          </Link>
          <Link
            to="/community"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 active:scale-95 transition-all min-h-[44px]"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Community</span>
          </Link>
        </div>
      </div>

      {/* 2. Permanent PWA Installation CTA Card */}
      <PwaHeroCard />

      {/* 3. Continue Learning / Active Track Card */}
      {user && (
        <div className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Continue Learning</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-400">75% Complete</span>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-black text-white leading-snug">
              Build Your Business Engine: Standard Operations & Architecture
            </h4>
            <p className="text-xs text-slate-400">Current Unit: Lesson 4 • System Architecture Blueprint</p>
          </div>

          <div className="w-full bg-[#04152D] h-2 rounded-full overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-cyan-400 to-scalora-blue h-full w-3/4 rounded-full" />
          </div>

          <Link
            to="/dashboard"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform min-h-[44px] shadow-glow-accent"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Resume Lesson</span>
          </Link>
        </div>
      )}

      {/* 4. Featured Masterclass Courses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Featured Mastery Courses</span>
          </h3>
          <Link to="/courses" className="text-xs font-bold text-cyan-400 flex items-center gap-0.5">
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.slug}`}
              className="block bg-[#091324] rounded-3xl p-4 border border-white/10 hover:border-cyan-500/40 transition-all active:scale-[0.98]"
            >
              <div className="flex gap-3.5">
                <img
                  src={course.thumbnail || '/courses/business-engine.jpg'}
                  alt={course.title}
                  className="w-20 h-20 rounded-2xl object-cover border border-white/10 flex-shrink-0"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 font-extrabold text-[10px] uppercase">
                      {course.category || 'Executive Track'}
                    </span>
                    <h4 className="text-xs font-black text-white line-clamp-2 mt-1 leading-snug">
                      {course.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>${course.price}</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <span>View Course</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Community & Live Discussion Card */}
      <div className="bg-gradient-to-br from-[#0C1A33] to-[#071324] rounded-3xl p-5 border border-cyan-500/20 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">Scalora Executive Community</h4>
            <p className="text-[11px] text-slate-400">Live Group Chat & Instructor Q&A</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Connect with certified instructors, join real-time group chats, download resource blueprints, and network with fellow scholars.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/community"
            className="py-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold text-xs text-center min-h-[44px] flex items-center justify-center active:scale-95 transition-transform"
          >
            <span>Open Community</span>
          </Link>
          <Link
            to="/messages"
            className="py-2.5 rounded-2xl bg-white/10 border border-white/15 text-white font-bold text-xs text-center min-h-[44px] flex items-center justify-center active:scale-95 transition-transform"
          >
            <span>Message Trainer</span>
          </Link>
        </div>
      </div>

      {/* 6. Operations Consulting Quick Link */}
      <div className="bg-[#091324] rounded-3xl p-4 border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-scalora-blue/20 text-scalora-accent flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">Operations Consulting</h4>
            <p className="text-[11px] text-slate-400">Business Systems & SOPs</p>
          </div>
        </div>

        <Link
          to="/services"
          className="px-3.5 py-2 rounded-xl bg-scalora-blue/20 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex-shrink-0 min-h-[40px] flex items-center"
        >
          Explore
        </Link>
      </div>
    </div>
  );
};
