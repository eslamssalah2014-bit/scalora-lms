import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { PlayCircle, ArrowRight, Bell, CheckCircle2, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { getCoursePricing } from '../lib/currency';
import { useAuth } from '../context/AuthContext';
import { api, resolveMediaUrl } from '../lib/api';
import confetti from 'canvas-confetti';

interface CourseCardProps {
  course: Course;
  onEnrollClick?: (course: Course) => void;
  isEnrolled?: boolean;
}

export const formatLaunchDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'Coming Soon';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Coming Soon';
  }
};

export const CourseCard: React.FC<CourseCardProps> = ({ course, onEnrollClick, isEnrolled }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pricing = getCoursePricing(course);
  const enrolled = isEnrolled || course.isEnrolled;

  const [isInterested, setIsInterested] = useState<boolean>(Boolean(course.isInterested));
  const [interestCount, setInterestCount] = useState<number>(course.interestsCount || 0);
  const [loadingInterest, setLoadingInterest] = useState<boolean>(false);

  const handleAction = (e: React.MouseEvent) => {
    if (enrolled) {
      e.preventDefault();
      navigate(`/learn/${course.slug}`);
      return;
    }

    if (onEnrollClick) {
      e.preventDefault();
      onEnrollClick(course);
    }
  };

  const handleNotifyMe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate(`/login?redirect=/courses/${course.slug}`);
      return;
    }

    setLoadingInterest(true);
    try {
      if (isInterested) {
        // Remove interest
        const res = await api.delete<{ success: boolean; isInterested: boolean; interestCount: number }>(
          `/courses/${course.id}/interest`
        );
        if (res.success) {
          setIsInterested(false);
          setInterestCount(res.interestCount ?? Math.max(0, interestCount - 1));
        }
      } else {
        // Register interest
        const res = await api.post<{ success: boolean; isInterested: boolean; interestCount: number }>(
          `/courses/${course.id}/interest`
        );
        if (res.success) {
          setIsInterested(true);
          setInterestCount(res.interestCount ?? interestCount + 1);
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#00D2FF', '#2D8CFF', '#F59E0B'],
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle course interest:', err);
    } finally {
      setLoadingInterest(false);
    }
  };

  // =========================================================================
  // DEDICATED COMING SOON CARD STYLE
  // =========================================================================
  if (course.isComingSoon) {
    const formattedLaunch = formatLaunchDate(course.launchDate);

    return (
      <div className="bg-[#061224] rounded-2xl overflow-hidden flex flex-col h-full border border-amber-500/30 hover:border-cyan-400/60 transition-all duration-300 shadow-xl group relative">
        {/* Glow ambient background accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-all" />

        {/* 1. Thumbnail with fixed 4:5 aspect ratio (1080x1350) & no cropping */}
        <Link to={`/courses/${course.slug}`} className="relative aspect-[4/5] w-full overflow-hidden block bg-[#020A17] flex items-center justify-center">
          {/* Subtle ambient blur backdrop for non-4:5 legacy images */}
          <img
            src={
              resolveMediaUrl(course.thumbnail) ||
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
            }
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-md opacity-20 scale-110 pointer-events-none"
          />

          {/* Main 4:5 image (complete full image visible without cropping) */}
          <img
            src={
              resolveMediaUrl(course.thumbnail) ||
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
            }
            alt={course.title}
            className="relative z-[1] w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
          />

          {/* Glowing Top COMING SOON Badge */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/50 shadow-lg shadow-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>🚀 COMING SOON</span>
            </span>
          </div>

          {/* Category Tag (Top Right) */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#04152D]/90 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm">
              {course.category}
            </span>
          </div>
        </Link>

        {/* 2. Content */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            {/* Course Title */}
            <Link to={`/courses/${course.slug}`}>
              <h3 className="text-sm sm:text-base font-black text-white hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                {course.title}
              </h3>
            </Link>

            {/* Short Description */}
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {course.comingSoonDescription || course.description}
            </p>
          </div>

          {/* 3. Launch Date & Interactive Notify Me */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            {/* Expected Launch Date */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Launch Date:</span>
              </div>
              <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                {formattedLaunch}
              </span>
            </div>

            {/* Interactive Notify Me Button */}
            <button
              type="button"
              onClick={handleNotifyMe}
              disabled={loadingInterest}
              className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                isInterested
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-500 via-scalora-blue to-cyan-400 hover:from-amber-400 hover:to-cyan-300 text-white shadow-glow-blue'
              }`}
            >
              {loadingInterest ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isInterested ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>✓ You'll Be Notified</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Notify Me</span>
                  <Sparkles className="w-3.5 h-3.5 opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD PUBLISHED COURSE CARD STYLE
  // =========================================================================
  return (
    <div className="bg-[#071324] rounded-xl overflow-hidden flex flex-col h-full border border-white/10 hover:border-cyan-500/40 transition-all duration-200 shadow-sm">
      {/* 1. Course Thumbnail with fixed 4:5 aspect ratio (1080x1350) & no cropping */}
      <Link to={enrolled ? `/learn/${course.slug}` : `/courses/${course.slug}`} className="relative aspect-[4/5] w-full overflow-hidden block bg-[#020A17] flex items-center justify-center">
        {/* Subtle ambient blur backdrop for non-4:5 legacy images */}
        <img
          src={
            resolveMediaUrl(course.thumbnail) ||
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
          }
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-md opacity-20 scale-110 pointer-events-none"
        />

        {/* Main 4:5 image (complete full image visible without cropping) */}
        <img
          src={
            resolveMediaUrl(course.thumbnail) ||
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
          }
          alt={course.title}
          className="relative z-[1] w-full h-full object-contain hover:scale-[1.02] transition-transform duration-300"
        />
      </Link>

      {/* 2. Content */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        {/* Course Name */}
        <Link to={enrolled ? `/learn/${course.slug}` : `/courses/${course.slug}`}>
          <h3 className="text-xs sm:text-sm font-black text-white hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {course.title}
          </h3>
        </Link>

        {/* 3. Progress % or Price */}
        <div className="pt-1.5 border-t border-white/5 flex items-center justify-between">
          {enrolled ? (
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Progress</span>
                <span className="font-bold text-cyan-300">
                  {course.userProgress?.completionPercentage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-[#030F20] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${course.userProgress?.completionPercentage ?? 0}%` }}
                />
              </div>
              <Link
                to={`/learn/${course.slug}`}
                className="w-full mt-1.5 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform min-h-[36px]"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume</span>
              </Link>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-white">
                {pricing.formattedEffective}
              </span>
              <button
                onClick={handleAction}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-scalora-blue to-cyan-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-transform min-h-[36px]"
              >
                <span>Enroll</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

