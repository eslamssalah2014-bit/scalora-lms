import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { PlayCircle, ArrowRight, Bell, CheckCircle2, Calendar, Sparkles, Loader2, BookOpen } from 'lucide-react';
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
            colors: ['#2563EB', '#3B82F6', '#F59E0B'],
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
  // COMING SOON CARD STYLE (White + Blue/Amber SaaS Theme)
  // =========================================================================
  if (course.isComingSoon) {
    const formattedLaunch = formatLaunchDate(course.launchDate);

    return (
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full border border-slate-200/90 hover:border-amber-400/80 transition-all duration-300 shadow-sm hover:shadow-xl group relative">
        {/* 1. Thumbnail with fixed 4:5 aspect ratio (1080x1350) & no cropping */}
        <Link
          to={`/courses/${course.slug}`}
          className="relative aspect-[4/5] w-full overflow-hidden block bg-slate-100 flex items-center justify-center"
        >
          {/* Subtle ambient blur backdrop for non-4:5 legacy images */}
          <img
            src={
              resolveMediaUrl(course.thumbnail) ||
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
            }
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none"
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
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>COMING SOON</span>
            </span>
          </div>

          {/* Category Tag (Top Right) */}
          {course.category && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/95 text-blue-700 border border-blue-200/80 shadow-sm backdrop-blur-sm">
                {course.category}
              </span>
            </div>
          )}
        </Link>

        {/* 2. Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
          <div className="space-y-2">
            {/* Course Title */}
            <Link to={`/courses/${course.slug}`}>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                {course.title}
              </h3>
            </Link>

            {/* Short Description */}
            {(course.comingSoonDescription || course.description) && (
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {course.comingSoonDescription || course.description}
              </p>
            )}
          </div>

          {/* 3. Launch Date & Interactive Notify Me */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* Expected Launch Date */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Launch Date:</span>
              </div>
              <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80">
                {formattedLaunch}
              </span>
            </div>

            {/* Interactive Notify Me Button */}
            <button
              type="button"
              onClick={handleNotifyMe}
              disabled={loadingInterest}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 min-h-[40px] ${
                isInterested
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
              }`}
            >
              {loadingInterest ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isInterested ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>✓ You'll Be Notified</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Notify Me</span>
                  <Sparkles className="w-3.5 h-3.5 opacity-90" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD PUBLISHED COURSE CARD STYLE (White + Blue SaaS Theme)
  // =========================================================================
  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full border border-slate-200/90 hover:border-blue-400/80 transition-all duration-300 shadow-sm hover:shadow-xl group relative">
      {/* 1. Course Thumbnail with fixed 4:5 aspect ratio (1080x1350) & no cropping */}
      <Link
        to={enrolled ? `/learn/${course.slug}` : `/courses/${course.slug}`}
        className="relative aspect-[4/5] w-full overflow-hidden block bg-slate-100 flex items-center justify-center"
      >
        {/* Subtle ambient blur backdrop for non-4:5 legacy images */}
        <img
          src={
            resolveMediaUrl(course.thumbnail) ||
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
          }
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none"
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

        {/* Category Tag (Top Right) */}
        {course.category && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/95 text-blue-700 border border-blue-200/80 shadow-sm backdrop-blur-sm">
              {course.category}
            </span>
          </div>
        )}
      </Link>

      {/* 2. Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div className="space-y-2">
          {/* 2. Course Title */}
          <Link to={enrolled ? `/learn/${course.slug}` : `/courses/${course.slug}`}>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
              {course.title}
            </h3>
          </Link>

          {/* 3. Course Description (Always visible on all course cards) */}
          {course.description && (
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>

        {/* 4 & 5. Pricing / Progress & CTA Button */}
        <div className="pt-3 border-t border-slate-100">
          {enrolled ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Your Progress</span>
                <span className="font-bold text-blue-600">
                  {course.userProgress?.completionPercentage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${course.userProgress?.completionPercentage ?? 0}%` }}
                />
              </div>
              <Link
                to={`/learn/${course.slug}`}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 active:scale-98 transition-all min-h-[40px]"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Resume Course</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              {/* 4. Pricing */}
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tuition</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-slate-900">
                    {pricing.formattedEffective}
                  </span>
                  {pricing.hasDiscount && (
                    <span className="text-xs text-slate-400 line-through font-normal">
                      {pricing.formattedBase}
                    </span>
                  )}
                </div>
              </div>

              {/* 5. CTA Button */}
              <button
                type="button"
                onClick={handleAction}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-98 transition-all min-h-[40px]"
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
