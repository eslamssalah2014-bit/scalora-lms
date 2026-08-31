import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Course, Module, Lesson, Quiz } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { YouTubeLessonPlayer } from '../components/YouTubeLessonPlayer';
import { BunnyLessonPlayer } from '../components/BunnyLessonPlayer';
import { CertificateModal } from '../components/CertificateModal';
import {
  Video,
  FileText,
  Download,
  HelpCircle,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Award,
  Menu,
  X,
  PlayCircle,
  ExternalLink,
  Sparkles,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CoursePlayerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [completingLesson, setCompletingLesson] = useState(false);
  const [certificateData, setCertificateData] = useState<any | null>(null);
  const [certModalOpen, setCertModalOpen] = useState(false);

  const currentLessonId = searchParams.get('lesson');

  useEffect(() => {
    fetchCourseAndProgress();
  }, [slug]);

  const fetchCourseAndProgress = async () => {
    setLoading(true);
    setError(null);
    let courseData: Course | null = null;

    try {
      const res = await api.get<{ success: boolean; course: Course }>(`/courses/details/${slug}`);
      if (res.success && res.course) {
        courseData = res.course;
      } else {
        setError('Course not found');
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course from server.');
      return;
    } finally {
      setLoading(false);
    }

    setCourse(courseData);

    // Expand all modules
    const expanded: Record<string, boolean> = {};
    courseData.modules?.forEach((m) => {
      expanded[m.id] = true;
    });
    setExpandedModules(expanded);

    // Fetch live user progress
    try {
      const progRes = await api.get<{
        success: boolean;
        progress: { completedLessonIds: string[] };
      }>(`/progress/course/${courseData.id}`);

      if (progRes.success && progRes.progress && Array.isArray(progRes.progress.completedLessonIds)) {
        setCompletedLessonIds(new Set(progRes.progress.completedLessonIds));
      }
    } catch {
      // Retain existing set
    }

    // Determine active lesson
    const allLessons = courseData.modules?.flatMap((m) => m.lessons) || [];
    if (allLessons.length > 0) {
      if (currentLessonId) {
        const found = allLessons.find((l) => l.id === currentLessonId);
        setActiveLesson(found || allLessons[0]);
      } else {
        const firstIncomplete = allLessons.find((l) => !completedLessonIds.has(l.id));
        const target = firstIncomplete || allLessons[0];
        setActiveLesson(target);
        setSearchParams({ lesson: target.id });
      }
    }

    setLoading(false);
  };

  const selectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setSearchParams({ lesson: lesson.id });
  };

  const toggleLessonComplete = async (lessonId: string) => {
    const isNowCompleted = !completedLessonIds.has(lessonId);

    // Optimistic UI update
    const updated = new Set(completedLessonIds);
    if (isNowCompleted) {
      updated.add(lessonId);
    } else {
      updated.delete(lessonId);
    }
    setCompletedLessonIds(updated);

    try {
      const res = await api.post<{
        success: boolean;
        isCourseCompleted: boolean;
        completionPercentage: number;
      }>('/progress/toggle', {
        lessonId,
        isCompleted: isNowCompleted,
      });

      if (res.isCourseCompleted) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2D8CFF', '#00D2FF', '#FFD700', '#FFFFFF'],
        });
      }
    } catch (err) {
      console.error('Error toggling lesson progress:', err);
    }
  };

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleClaimCertificate = async () => {
    if (!course) return;
    try {
      const res = await api.get<{ success: boolean; certificate: any }>(
        `/progress/certificate/${course.id}`
      );
      if (res.success && res.certificate) {
        setCertificateData(res.certificate);
        setCertModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching certificate:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04152D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-scalora-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading classroom workspace...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#04152D] flex items-center justify-center p-4">
        <div className="text-center glass-panel p-8 rounded-2xl space-y-4 max-w-sm">
          <h3 className="text-lg font-bold text-white">Course Not Found</h3>
          <Link to="/courses" className="px-4 py-2 rounded-xl bg-scalora-blue text-white text-xs font-bold">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const allLessons = course.modules?.flatMap((m) => m.lessons) || [];
  const currentIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isLessonCompleted = activeLesson ? completedLessonIds.has(activeLesson.id) : false;

  return (
    <div className="min-h-screen bg-[#020C1B] text-slate-100 flex flex-col">
      {/* 1. Classroom Top Navigation Header */}
      <header className="h-16 bg-[#04152D] border-b border-scalora-blue/20 px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-scalora-navy/60 hover:bg-scalora-navy text-slate-300 hover:text-white border border-scalora-blue/20 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="h-6 w-px bg-scalora-blue/20 hidden sm:block" />

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
              {course.title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{activeLesson?.title || 'Classroom'}</span>
            </div>
          </div>
        </div>

        {/* Top Right: Overall Progress & Certificate */}
        <div className="flex items-center space-x-3">
          {progressPercent === 100 ? (
            <button
              onClick={handleClaimCertificate}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-xs font-black shadow-lg hover:opacity-95 transition-all flex items-center gap-1.5 animate-pulse"
            >
              <Award className="w-4 h-4" />
              <span>Claim Certificate</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Course Progress
                </span>
                <span className="text-xs font-black text-white">{progressPercent}% Completed</span>
              </div>
              <div className="w-24 h-2 rounded-full bg-scalora-navy overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-scalora-blue to-scalora-accent rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <Link
            to={`/my-study-plan?course=${course.id}`}
            className="p-2 rounded-xl bg-scalora-navy/80 hover:bg-cyan-500/20 text-cyan-400 hover:text-white border border-cyan-500/30 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="View Personalized Study Plan & Milestones"
          >
            <Target className="w-4 h-4" />
            <span className="hidden md:inline">Study Plan</span>
          </Link>

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-scalora-navy text-slate-300 hover:text-white border border-scalora-blue/20"
            title="Toggle Curriculum Sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 2. Main Content & Curriculum Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Active Lesson Learning Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeLesson ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Dynamic Lesson Display Area */}
              {activeLesson.type === 'YOUTUBE' && (
                (() => {
                  const provider = (activeLesson.videoProvider || 'youtube').toLowerCase();
                  if (provider === 'bunny') {
                    return (
                      <BunnyLessonPlayer
                        videoId={activeLesson.videoId || activeLesson.videoUrl}
                        title={activeLesson.title}
                        user={user}
                      />
                    );
                  }
                  return (
                    <YouTubeLessonPlayer
                      videoUrl={activeLesson.videoUrl}
                      title={activeLesson.title}
                      user={user}
                    />
                  );
                })()
              )}

              {activeLesson.type === 'PDF' && (
                <div className="p-8 rounded-2xl glass-card border border-scalora-blue/30 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">PDF Study Material</h3>
                      <p className="text-xs text-slate-400">
                        {activeLesson.fileName || 'Technical Blueprint Document'} ({activeLesson.fileSize || 'PDF'})
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#04152D] border border-scalora-blue/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-xs text-slate-300">
                      Download the reference guide and architectural diagrams for offline study.
                    </span>
                    <a
                      href={activeLesson.fileUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-scalora-blue hover:bg-scalora-hover text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              )}

              {activeLesson.type === 'DOWNLOAD' && (
                <div className="p-8 rounded-2xl glass-card border border-scalora-blue/30 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Download className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Downloadable Starter Resource</h3>
                      <p className="text-xs text-slate-400">
                        {activeLesson.fileName || 'Starter Code Repository Zip'} ({activeLesson.fileSize || 'Zip'})
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#04152D] border border-scalora-blue/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-xs text-slate-300">
                      Includes starter repository, docker-compose orchestration manifests, and test fixtures.
                    </span>
                    <a
                      href={activeLesson.fileUrl || '#'}
                      download
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Starter Asset</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Lesson Title & Completion Controls */}
              <div className="p-6 rounded-2xl glass-panel border border-scalora-blue/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-scalora-accent uppercase tracking-wider">
                      <span>{activeLesson.type} Lesson</span>
                      {activeLesson.duration && <span>• {activeLesson.duration}</span>}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">{activeLesson.title}</h2>
                  </div>

                  <button
                    onClick={() => toggleLessonComplete(activeLesson.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                      isLessonCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30'
                        : 'bg-gradient-to-r from-scalora-blue to-scalora-accent text-white hover:opacity-95 shadow-glow-blue'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isLessonCompleted ? 'text-emerald-400' : 'text-white'}`} />
                    <span>{isLessonCompleted ? 'Completed' : 'Mark as Completed'}</span>
                  </button>
                </div>

                {/* Lesson Markdown / Rich Content */}
                {activeLesson.content && (
                  <div className="pt-4 border-t border-scalora-blue/15 prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {activeLesson.content}
                  </div>
                )}
              </div>

              {/* Lesson Bottom Navigation (Previous / Next) */}
              <div className="flex items-center justify-between pt-4 border-t border-scalora-blue/15">
                {prevLesson ? (
                  <button
                    onClick={() => selectLesson(prevLesson)}
                    className="px-4 py-2.5 rounded-xl glass-panel hover:bg-scalora-navy text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous: {prevLesson.title}</span>
                  </button>
                ) : <div />}

                {nextLesson ? (
                  <button
                    onClick={() => selectLesson(nextLesson)}
                    className="px-5 py-2.5 rounded-xl bg-scalora-blue hover:bg-scalora-hover text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-glow-blue"
                  >
                    <span>Next: {nextLesson.title}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  progressPercent === 100 && (
                    <button
                      onClick={handleClaimCertificate}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg hover:opacity-95"
                    >
                      <Award className="w-4 h-4" />
                      <span>View Final Certificate</span>
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p>Select a lesson from the curriculum sidebar to begin.</p>
            </div>
          )}
        </div>

        {/* Right: Collapsible Curriculum Tree Sidebar */}
        {sidebarOpen && (
          <aside className="w-full md:w-80 lg:w-96 bg-[#04152D] border-l border-scalora-blue/20 flex flex-col flex-shrink-0 z-20 overflow-y-auto max-h-[85vh] md:max-h-none">
            <div className="p-4 border-b border-scalora-blue/20 bg-scalora-navy/40">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Curriculum Content</span>
                <span className="text-xs text-scalora-blue font-semibold">
                  {completedCount}/{totalLessons} Done
                </span>
              </h3>
            </div>

            {/* Modules & Lessons Accordion */}
            <div className="divide-y divide-scalora-blue/10">
              {course.modules?.map((mod, modIdx) => {
                const isExpanded = expandedModules[mod.id] ?? true;
                return (
                  <div key={mod.id}>
                    {/* Module Accordion Header */}
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full px-4 py-3 bg-scalora-navy/30 hover:bg-scalora-navy/60 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-scalora-accent">
                          Module {modIdx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 leading-snug">{mod.title}</h4>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {/* Lessons list inside module */}
                    {isExpanded && (
                      <div className="divide-y divide-scalora-blue/5 bg-[#020C1B]">
                        {mod.lessons.map((lesson) => {
                          const isActive = activeLesson?.id === lesson.id;
                          const isCompleted = completedLessonIds.has(lesson.id);

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => selectLesson(lesson)}
                              className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                                isActive
                                  ? 'bg-scalora-blue/20 border-l-4 border-scalora-blue'
                                  : 'hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLessonComplete(lesson.id);
                                  }}
                                  className="text-slate-400 hover:text-emerald-400 flex-shrink-0"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-600" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <p
                                    className={`text-xs font-medium truncate ${
                                      isActive ? 'text-white font-bold' : 'text-slate-300'
                                    }`}
                                  >
                                    {lesson.title}
                                  </p>
                                  <span className="text-[10px] text-slate-500">
                                    {lesson.duration || lesson.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Quizzes / Assessments Section */}
              {course.quizzes && course.quizzes.length > 0 && (
                <div className="p-4 bg-scalora-navy/20 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-scalora-accent" />
                    <span>Course Assessments</span>
                  </h4>
                  <div className="space-y-2">
                    {course.quizzes.map((quiz) => (
                      <Link
                        key={quiz.id}
                        to={`/learn/${course.slug}/quiz/${quiz.id}`}
                        className="p-3 rounded-xl glass-panel hover:bg-scalora-navy/70 border border-scalora-blue/30 block space-y-1 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{quiz.title}</span>
                          <span className="text-[10px] font-bold text-scalora-accent bg-scalora-accent/10 px-1.5 py-0.5 rounded">
                            Pass: {quiz.passingScore}%
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {quiz.questions?.length ?? 0} Multiple-choice questions
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        certificate={certificateData}
      />
    </div>
  );
};
