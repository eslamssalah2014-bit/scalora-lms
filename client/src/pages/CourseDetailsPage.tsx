import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Course, Module, Lesson } from '../types';
import { api, resolveMediaUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CheckoutModal } from '../components/CheckoutModal';
import { formatLaunchDate } from '../components/CourseCard';
import confetti from 'canvas-confetti';
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
  AlertCircle,
  Calendar,
  Bell,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { getCoursePricing } from '../lib/currency';

export const CourseDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [isInterested, setIsInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const [loadingInterest, setLoadingInterest] = useState(false);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; course: Course }>(`/courses/details/${slug}`);
      if (res.success && res.course) {
        setCourse(res.course);
        setIsInterested(Boolean(res.course.isInterested));
        setInterestCount(res.course.interestsCount || 0);

        const initialExpanded: Record<string, boolean> = {};
        res.course.modules?.forEach((m) => {
          initialExpanded[m.id] = true;
        });
        setExpandedModules(initialExpanded);
      } else {
        setError('Course not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course details from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyMe = async () => {
    if (!user) {
      navigate(`/login?redirect=/courses/${slug}`);
      return;
    }

    if (!course) return;

    setLoadingInterest(true);
    try {
      if (isInterested) {
        const res = await api.delete<{ success: boolean; isInterested: boolean; interestCount: number }>(
          `/courses/${course.id}/interest`
        );
        if (res.success) {
          setIsInterested(false);
          setInterestCount(res.interestCount ?? Math.max(0, interestCount - 1));
        }
      } else {
        const res = await api.post<{ success: boolean; isInterested: boolean; interestCount: number }>(
          `/courses/${course.id}/interest`
        );
        if (res.success) {
          setIsInterested(true);
          setInterestCount(res.interestCount ?? interestCount + 1);
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
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

  useEffect(() => {
    if (slug) fetchCourseDetails();
  }, [slug]);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getLessonIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'YOUTUBE':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'PDF':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'DOWNLOAD':
        return <Download className="w-4 h-4 text-emerald-500" />;
      case 'TEXT':
      default:
        return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-96 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Course Not Found</h3>
        <p className="text-sm text-slate-500">The requested course could not be located in our catalog.</p>
        <Link
          to="/courses"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all"
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
      <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/courses" className="hover:text-blue-600 transition-colors">Courses</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">{course.title}</span>
      </div>

      {/* Main Grid: Left Details + Right Sticky Purchase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-10">
          {/* Header Banner */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {course.isComingSoon && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>🚀 COMING SOON</span>
                </span>
              )}
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {course.level}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              {course.title}
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              {course.isComingSoon && course.comingSoonDescription
                ? course.comingSoonDescription
                : course.description}
            </p>

            {/* Instructor & Meta row */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-600 border-t border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {course.instructor[0]}
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold text-[11px]">Instructor</span>
                  <span className="font-bold text-slate-900 text-sm">{course.instructor}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700">{course.lessonsCount ?? 0} Lessons</span>
              </div>

              {(course.quizzesCount ?? 0) > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 font-semibold">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>{course.quizzesCount} Interactive Quizzes</span>
                </div>
              )}

              {course.isComingSoon ? (
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 font-bold">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Launches: {formatLaunchDate(course.launchDate)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 font-semibold">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>{course.studentsCount ?? 0} Enrolled Students</span>
                </div>
              )}
            </div>
          </div>

          {/* Curriculum Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Course Curriculum</h2>
                <p className="text-xs text-slate-500 mt-0.5">
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
                    className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition-all"
                  >
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base">{mod.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{mod.lessons.length} lessons</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                      </div>
                    </button>

                    {/* Module Lessons List */}
                    {isOpen && (
                      <div className="divide-y divide-slate-100 bg-white">
                        {mod.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-md bg-slate-100">
                                {getLessonIcon(lesson.type)}
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-slate-800">
                                {lesson.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              {lesson.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {lesson.duration}
                                </span>
                              )}
                              {course.isComingSoon ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <Lock className="w-3 h-3" />
                                  <span>Coming Soon</span>
                                </span>
                              ) : isEnrolled ? (
                                <Link
                                  to={`/learn/${course.slug}?lesson=${lesson.id}`}
                                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                                >
                                  <span>Play</span>
                                  <PlayCircle className="w-3.5 h-3.5" />
                                </Link>
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
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

          {/* Assigned Instructors & Trainers Section */}
          {course.trainers && course.trainers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Assigned Instructors & Cohort Trainers</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {course.trainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all space-y-3 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={
                          trainer.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(trainer.name)}&background=2563EB&color=fff`
                        }
                        alt={trainer.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-100 shadow-sm"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{trainer.name}</h4>
                        <div className="text-xs text-blue-600 font-semibold mt-0.5">
                          {trainer.title || 'Course Lead'}
                        </div>
                      </div>
                    </div>

                    {trainer.bio && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {trainer.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Certified Trainer
                      </span>
                      {isEnrolled && (
                        <Link
                          to={`/messages?trainer=${trainer.id}`}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <span>Ask Question</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quizzes Preview */}
          {course.quizzes && course.quizzes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Certification Assessments</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {course.quizzes.map((quiz) => (
                  <div key={quiz.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        Passing Score: {quiz.passingScore}%
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        {quiz.questions?.length ?? 0} Questions
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{quiz.title}</h4>
                    {isEnrolled && (
                      <Link
                        to={`/learn/${course.slug}/quiz/${quiz.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 pt-1"
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
          <div className="sticky top-28 rounded-3xl bg-white p-6 border border-slate-200 space-y-6 shadow-xl">
            {/* Thumbnail Preview (4:5 Aspect Ratio, 1080x1350) */}
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center">
              <img
                src={
                  resolveMediaUrl(course.thumbnail) ||
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                }
                alt={course.title}
                className="w-full h-full object-contain"
              />
              {course.isComingSoon && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white shadow-md">
                    🚀 COMING SOON
                  </span>
                </div>
              )}
            </div>

            {/* If Coming Soon, show Expected Release & Notify Me */}
            {course.isComingSoon ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Expected Launch Date</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatLaunchDate(course.launchDate)}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This course is currently in production. Be the first to get access when enrollment opens.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleNotifyMe}
                  disabled={loadingInterest}
                  className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
                    isInterested
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  }`}
                >
                  {loadingInterest ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isInterested ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>✓ You'll Be Notified on Launch</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      <span>Notify Me When Released</span>
                      <Sparkles className="w-4 h-4 opacity-80" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                {/* Pricing Tag */}
                {(() => {
                  const pricing = getCoursePricing(course);
                  return (
                    <div className="space-y-2">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tuition Fee</span>
                      {pricing.hasDiscount ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm line-through text-slate-400 font-semibold">
                              {pricing.formattedBase}
                            </span>
                            <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              {pricing.discountPercent}% OFF
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">
                              {pricing.formattedEffective}
                            </span>
                            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Save {pricing.formattedSavings}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-900">
                            {pricing.formattedEffective}
                          </span>
                          {!pricing.isFree && (
                            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Lifetime Access
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Action CTA */}
                {isEnrolled ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>You are enrolled in this track!</span>
                    </div>
                    <Link
                      to={`/learn/${course.slug}`}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Enter Classroom</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setCheckoutOpen(true)}
                      className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Enroll in Course</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Features Checklist */}
            <div className="pt-4 border-t border-slate-200 space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-blue-600" />
                <span>Full HD Video & Interactive Code</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-blue-500" />
                <span>Downloadable Blueprints & Starter Kits</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Accredited Scalora Certificate of Mastery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
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

