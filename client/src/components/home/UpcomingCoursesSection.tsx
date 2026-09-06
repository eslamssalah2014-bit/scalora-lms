import React, { useState, useEffect, useRef } from 'react';
import { Course } from '../../types';
import { api } from '../../lib/api';
import { CourseCard } from '../CourseCard';
import { Sparkles, ChevronLeft, ChevronRight, Rocket, Bell } from 'lucide-react';

export const UpcomingCoursesSection: React.FC = () => {
  const [upcomingCourses, setUpcomingCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const res = await api.get<{ success: boolean; courses: Course[] }>('/courses/upcoming');
      if (res.success && Array.isArray(res.courses)) {
        setUpcomingCourses(res.courses);
      }
    } catch (err) {
      console.error('Failed to fetch upcoming courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return null;
  }

  // Gracefully hide if no upcoming courses exist
  if (upcomingCourses.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative">
      {/* Glow Backdrop */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-cyan-500/15 to-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm">
            <Rocket className="w-3.5 h-3.5 text-amber-400" />
            <span>Upcoming Releases</span>
            <Sparkles className="w-3 h-3 text-cyan-300" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Upcoming Courses
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm">
            Be the first to know when these new engineering and operations tracks launch. Click <strong>Notify Me</strong> to get notified instantly.
          </p>
        </div>

        {/* Carousel Navigation Arrows */}
        {upcomingCourses.length > 2 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => scroll('left')}
              className="p-2.5 rounded-xl bg-[#08182D] hover:bg-cyan-500/20 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40 transition-all active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 rounded-xl bg-[#08182D] hover:bg-cyan-500/20 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40 transition-all active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Carousel Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
      >
        {upcomingCourses.map((course) => (
          <div
            key={course.id}
            className="w-[260px] sm:w-[300px] md:w-[340px] flex-shrink-0 snap-start"
          >
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </section>
  );
};
