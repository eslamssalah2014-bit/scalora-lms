import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Course, Module, Lesson } from '../types';
import { api } from '../lib/api';
import { getPersistentCourses } from '../data/fallbackData';
import { useAuth } from '../context/AuthContext';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  BookOpen,
  Video,
  FileText,
  Download,
  HelpCircle,
  Clock,
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';

export const CourseDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(() => {
    return getPersistentCourses().find((c) => c.slug === slug || c.id === slug) || getPersistentCourses()[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const res = await api.get<{ success: boolean; course: Course }>(`/courses/details/${slug}`);
        if (res.success && res.course) {
          setCourse(res.course);
          const initialExpanded: Record<string, boolean> = {};
          res.course.modules?.forEach((m) => {
            initialExpanded[m.id] = true;
          });
          setExpandedModules(initialExpanded);
          return;
        }
      } catch {
        const allCourses = getPersistentCourses();
        const fallback = allCourses.find((c) => c.slug === slug || c.id === slug) || allCourses[0];
        if (fallback) {
          setCourse(fallback);
          const initialExpanded: Record<string, boolean> = {};
          fallback.modules?.forEach((m) => {
            initialExpanded[m.id] = true;
          });
          setExpandedModules(initialExpanded);
        } else {
          setError('Course not found');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchCourseDetails();
  }, [slug]);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getLessonIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'YOUTUBE':
        return <Video className="w-4 h-4 text-rose-400" />;
      case 'PDF':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'DOWNLOAD':
        return <Download className="w-4 h-4 text-emerald-400" />;
      case 'TEXT':
      default:
        return <FileText className="w-4 h-4 text-scalora-blue" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-80 rounded-3xl glass-card animate-pulse bg-scalora-navy/40" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel rounded-2xl text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Course Not Found</h3>
        <p className="text-sm text-slate-400">The requested course could not be located.</p>
        <Link
          to="/courses"
          className="inline-block px-4 py-2 rounded-xl bg-scalora-blue text-white text-xs font-bold"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isEnrolled = course.isEnrolled;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
        <Link to="/" className="hover:text-scalora-blue">Home</Link>
        <span>/</span>
        <Link to="/courses" className="hover:text-scalora-blue">Courses</Link>
        <span>/</span>
        <span className="text-slate-200 truncate">{course.title}</span>
      </div>

      {/* Main Grid: Left Details + Right Sticky Purchase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-10">
          {/* Header Banner */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-scalora-blue/20 text-scalora-accent border border-scalora-blue/30">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-semibold bg-white/10 text-slate-300">
                {course.level}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-slate-300 text-base leading-relaxed">{course.description}</p>

            {/* Instructor & Meta row */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400 border-t border-scalora-blue/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-scalora-blue/30 flex items-center justify-center font-bold text-white">
                  {course.instructor[0]}
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold">Instructor</span>
                  <span className="font-bold text-slate-200">{course.instructor}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-scalora-blue" />
                <span>{course.lessonsCount ?? 0} Lessons</span>
              </div>

              {(course.quizzesCount ?? 0) > 0 && (
                <div className="flex items-center gap-2 text-scalora-accent">
                  <HelpCircle className="w-4 h-4" />
                  <span>{course.quizzesCount} Interactive Quizzes</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{course.studentsCount ?? 0} Enrolled Students</span>
              </div>
            </div>
          </div>

          {/* Curriculum Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-scalora-blue/20">
              <div>
                <h2 className="text-2xl font-black text-white">Course Curriculum</h2>
                <p className="text-xs text-slate-400">
                  {course.modules?.length ?? 0} Modules • {course.lessonsCount ?? 0} Lessons
                </p>
              </div>
            </div>

            {/* Modules Accordion */}
            <div className="space-y-4">
              {course.modules?.map((mod, idx) => {
                const isOpen = expandedModules[mod.id] ?? true;
                return (
                  <div
                    key={mod.id}
                    className="rounded-2xl glass-card overflow-hidden border border-scalora-blue/20"
                  >
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full px-5 py-4 bg-scalora-navy/60 hover:bg-scalora-navy flex items-center justify-between transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-scalora-blue/20 text-scalora-accent text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white text-sm sm:text-base">{mod.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{mod.lessons.length} lessons</span>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Module Lessons List */}
                    {isOpen && (
                      <div className="divide-y divide-scalora-blue/10 bg-[#04152D]/60">
                        {mod.lessons.map((lesson, lIdx) => (
                          <div
                            key={lesson.id}
                            className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-md bg-scalora-navy/80">
                                {getLessonIcon(lesson.type)}
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-slate-200">
                                {lesson.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              {lesson.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  {lesson.duration}
                                </span>
                              )}
                              {isEnrolled ? (
                                <Link
                                  to={`/learn/${course.slug}?lesson=${lesson.id}`}
                                  className="text-scalora-blue hover:text-scalora-accent font-semibold flex items-center gap-1"
                                >
                                  <span>Play</span>
                                  <PlayCircle className="w-3.5 h-3.5" />
                                </Link>
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quizzes Preview */}
          {course.quizzes && course.quizzes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-scalora-accent" />
                <span>Certification Assessments</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {course.quizzes.map((quiz) => (
                  <div key={quiz.id} className="p-5 rounded-2xl glass-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-scalora-accent bg-scalora-accent/10 px-2 py-0.5 rounded">
                        Passing Score: {quiz.passingScore}%
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {quiz.questions?.length ?? 0} Questions
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{quiz.title}</h4>
                    {isEnrolled && (
                      <Link
                        to={`/learn/${course.slug}/quiz/${quiz.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-scalora-blue hover:text-scalora-accent pt-1"
                      >
                        <span>Take Assessment</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1/3 Sticky Sidebar) */}
        <div className="space-y-6">
          <div className="sticky top-28 rounded-3xl glass-panel p-6 border border-scalora-blue/30 space-y-6 shadow-2xl">
            {/* Thumbnail Preview */}
            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-scalora-navy border border-scalora-blue/20">
              <img
                src={
                  course.thumbnail ||
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                }
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#04152D] via-transparent to-transparent" />
            </div>

            {/* Pricing Tag */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tuition Fee</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                </span>
                {course.price > 0 && (
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Lifetime Access
                  </span>
                )}
              </div>
            </div>

            {/* Action CTA */}
            {isEnrolled ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>You are enrolled in this track!</span>
                </div>
                <Link
                  to={`/learn/${course.slug}`}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Enter Classroom</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                    } else {
                      setCheckoutOpen(true);
                    }
                  }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-black text-sm shadow-glow-blue hover:opacity-95 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enroll in Course</span>
                </button>
              </div>
            )}

            {/* Features Checklist */}
            <div className="pt-4 border-t border-scalora-blue/20 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-scalora-blue" />
                <span>Full HD Video & Interactive Code</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-scalora-accent" />
                <span>Downloadable Blueprints & Starter Kits</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Accredited Scalora Certificate of Mastery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>256-Bit SSL Instant Verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        course={course}
        onSuccess={() => {
          setCourse((prev) => (prev ? { ...prev, isEnrolled: true } : null));
        }}
      />
    </div>
  );
};
