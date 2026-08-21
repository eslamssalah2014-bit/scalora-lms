import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { BookOpen, Users, HelpCircle, ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onEnrollClick?: (course: Course) => void;
  isEnrolled?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onEnrollClick, isEnrolled }) => {
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent) => {
    if (isEnrolled || course.isEnrolled) {
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
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group h-full border border-scalora-blue/20 hover:border-scalora-blue/50 transition-all duration-300">
      {/* Thumbnail - Aspect Square for full poster visibility */}
      <Link to={`/courses/${course.slug}`} className="relative aspect-square w-full overflow-hidden block bg-[#04152D]">
        <img
          src={
            course.thumbnail ||
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
          }
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Enrolled Badge if applicable */}
        {(isEnrolled || course.isEnrolled) && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/90 text-white flex items-center gap-1 shadow-lg backdrop-blur-md z-10">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Enrolled</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Category & Level Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-scalora-blue/15 text-scalora-accent border border-scalora-blue/30">
              {course.category}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-scalora-navy/80 text-slate-300 border border-scalora-blue/20">
              {course.level || 'All Levels'}
            </span>
          </div>

          <Link to={`/courses/${course.slug}`}>
            <h3 className="text-lg font-bold text-white group-hover:text-scalora-blue transition-colors line-clamp-2 leading-snug">
              {course.title}
            </h3>
          </Link>
          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Instructor & Meta */}
        <div className="pt-2 border-t border-scalora-blue/15 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300">By {course.instructor}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-scalora-blue" />
                {course.lessonsCount ?? 0} lessons
              </span>
              {(course.quizzesCount ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-scalora-accent">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {course.quizzesCount} quiz
                </span>
              )}
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Tuition</span>
              <span className="text-xl font-extrabold text-white">
                {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isEnrolled || course.isEnrolled ? (
                <Link
                  to={`/learn/${course.slug}`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </Link>
              ) : (
                <>
                  <Link
                    to={`/courses/${course.slug}`}
                    className="px-3 py-2 rounded-xl bg-scalora-navy/80 hover:bg-scalora-navy text-slate-200 hover:text-white text-xs font-semibold border border-scalora-blue/20 transition-colors"
                  >
                    Details
                  </Link>
                  <button
                    onClick={handleAction}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-hover text-white text-xs font-bold shadow-glow-blue hover:opacity-95 transition-all flex items-center gap-1"
                  >
                    <span>Enroll</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
