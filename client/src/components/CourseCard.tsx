import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { getCoursePricing } from '../lib/currency';

interface CourseCardProps {
  course: Course;
  onEnrollClick?: (course: Course) => void;
  isEnrolled?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onEnrollClick, isEnrolled }) => {
  const navigate = useNavigate();
  const pricing = getCoursePricing(course);
  const enrolled = isEnrolled || course.isEnrolled;

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

  return (
    <div className="bg-[#071324] rounded-xl overflow-hidden flex flex-col h-full border border-white/10 hover:border-cyan-500/40 transition-all duration-200 shadow-sm">
      {/* 1. Course Thumbnail */}
      <Link to={enrolled ? `/learn/${course.slug}` : `/courses/${course.slug}`} className="relative aspect-video w-full overflow-hidden block bg-[#030F20]">
        <img
          src={
            course.thumbnail ||
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
          }
          alt={course.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
