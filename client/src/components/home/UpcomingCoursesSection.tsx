import React, { useState, useEffect, useRef } from 'react';
import { Course } from '../../types';
import { api } from '../../lib/api';
import { CourseCard } from '../CourseCard';
import { Sparkles, ChevronLeft, ChevronRight, Rocket } from 'lucide-react';

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

  if (loading || upcomingCourses.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
            <Rocket className="w-3.5 h-3.5 text-amber-600" />
            <span>Upcoming Releases</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Upcoming Courses
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm">
            Be the first to know when these new engineering and operations tracks launch. Click <strong>Notify Me</strong> to get notified instantly.
          </p>
        </div>

        {/* Carousel Navigation Arrows */}
        {upcomingCourses.length > 2 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => scroll('left')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-blue-300 shadow-sm transition-all active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-blue-300 shadow-sm transition-all active:scale-95"
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
