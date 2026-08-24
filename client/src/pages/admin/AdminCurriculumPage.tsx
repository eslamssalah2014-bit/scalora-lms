import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Course, Module, Lesson, LessonType } from '../../types';
import { api } from '../../lib/api';
import { Modal } from '../../components/Modal';
import {
  Layers,
  PlusCircle,
  Video,
  FileText,
  Download,
  Edit2,
  Trash2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { extractYouTubeVideoId } from '../../lib/videoSecurity';

export const AdminCurriculumPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Module Modal
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleLoading, setModuleLoading] = useState(false);

  // Lesson Modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string>('');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('YOUTUBE');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');
  const [lessonLoading, setLessonLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; courses: Course[] }>('/courses/admin/all');
      if (res.success && Array.isArray(res.courses)) {
        const found = res.courses.find((c) => c.id === courseId || c.slug === courseId);
        if (found) {
          setCourse(found);
          const expanded: Record<string, boolean> = {};
          found.modules?.forEach((m) => {
            expanded[m.id] = true;
          });
          setExpandedModules(expanded);
        } else {
          setError('Course curriculum not found.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course curriculum from server.');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Module Actions
  const openCreateModule = () => {
    setEditingModule(null);
    setModuleTitle('');
    setModuleModalOpen(true);
  };

  const openEditModule = (mod: Module) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setModuleLoading(true);

    try {
      if (editingModule) {
        await api.put(`/modules/${editingModule.id}`, { title: moduleTitle });
      } else {
        await api.post('/modules', { title: moduleTitle, courseId: course.id });
      }
      await fetchCourseData();
      setModuleModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save module to server.');
    } finally {
      setModuleLoading(false);
    }
  };

  const handleDeleteModule = async (modId: string, title: string) => {
    if (!window.confirm(`Delete module "${title}" and all its lessons?`)) return;
    try {
      await api.delete(`/modules/${modId}`);
      await fetchCourseData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete module from server.');
    }
  };

  // Lesson Actions
  const openCreateLesson = (moduleId: string) => {
    setTargetModuleId(moduleId);
    setEditingLesson(null);
    setLessonTitle('');
    setLessonType('YOUTUBE');
    setVideoUrl('');
    setFileUrl('');
    setFileName('');
    setFileSize('');
    setDuration('15 min');
    setContent('');
    setFormError(null);
    setLessonModalOpen(true);
  };

  const openEditLesson = (moduleId: string, lesson: Lesson) => {
    setTargetModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonType(lesson.type);
    setVideoUrl(lesson.videoUrl || '');
    setFileUrl(lesson.fileUrl || '');
    setFileName(lesson.fileName || '');
    setFileSize(lesson.fileSize || '');
    setDuration(lesson.duration || '');
    setContent(lesson.content || '');
    setFormError(null);
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLessonLoading(true);
    setFormError(null);

    const payload = {
      title: lessonTitle,
      type: lessonType,
      videoUrl: videoUrl || undefined,
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      duration: duration || '15 min',
      content: content || undefined,
      moduleId: targetModuleId,
    };

    try {
      if (editingLesson) {
        await api.put(`/lessons/${editingLesson.id}`, payload);
      } else {
        await api.post('/lessons', payload);
      }
      await fetchCourseData();
      setLessonModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save lesson to server.');
    } finally {
      setLessonLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!window.confirm(`Delete lesson "${title}"?`)) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      await fetchCourseData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lesson from server.');
    }
  };

  const getLessonIcon = (type: LessonType) => {
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
      <div className="py-20 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-scalora-blue mb-2" />
        <p className="text-xs">Loading course curriculum builder...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 glass-panel rounded-2xl space-y-4 max-w-sm mx-auto">
        <h3 className="text-lg font-bold text-white">Course Not Found</h3>
        <Link to="/admin/courses" className="px-4 py-2 rounded-xl bg-scalora-blue text-white text-xs font-bold">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-scalora-blue/20">
        <div className="space-y-1">
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Courses</span>
          </Link>
          <h1 className="text-2xl font-black text-white">{course.title}</h1>
          <p className="text-xs text-slate-400">Curriculum Content & Lesson Management</p>
        </div>

        <button
          onClick={openCreateModule}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Module</span>
        </button>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {course.modules?.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl space-y-3">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Modules Created Yet</h3>
            <p className="text-xs text-slate-400">
              Start structuring your course by adding your first module.
            </p>
            <button
              onClick={openCreateModule}
              className="px-4 py-2 rounded-xl bg-scalora-blue text-white text-xs font-bold"
            >
              Add Module
            </button>
          </div>
        ) : (
          course.modules?.map((mod, modIdx) => {
            const isExpanded = expandedModules[mod.id] ?? true;
            return (
              <div key={mod.id} className="glass-panel rounded-2xl border border-scalora-blue/25 overflow-hidden">
                {/* Module Header */}
                <div className="px-5 py-4 bg-scalora-navy/60 flex items-center justify-between">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    <span className="w-7 h-7 rounded-lg bg-scalora-blue/20 text-scalora-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {modIdx + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{mod.title}</h3>
                      <span className="text-[11px] text-slate-400">{mod.lessons.length} lessons</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openCreateLesson(mod.id)}
                      className="px-3 py-1.5 rounded-lg bg-scalora-blue/20 hover:bg-scalora-blue/30 text-scalora-accent text-xs font-bold border border-scalora-blue/30 flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Lesson</span>
                    </button>

                    <button
                      onClick={() => openEditModule(mod)}
                      className="p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Edit Module Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteModule(mod.id, mod.title)}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button onClick={() => toggleModule(mod.id)} className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Lessons in Module */}
                {isExpanded && (
                  <div className="divide-y divide-scalora-blue/10 bg-[#020C1B]">
                    {mod.lessons.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        No lessons in this module. Click "Add Lesson" to add content.
                      </div>
                    ) : (
                      mod.lessons.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 rounded-md bg-scalora-navy">
                              {getLessonIcon(lesson.type)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-slate-200 block truncate">
                                {lesson.title}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="font-bold text-scalora-accent">{lesson.type}</span>
                                {lesson.duration && <span>• {lesson.duration}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => openEditLesson(module.id, lesson)}
                              className="p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="Edit Lesson"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Module Create/Edit Modal */}
      <Modal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title={editingModule ? 'Edit Module' : 'Add New Module'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveModule} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Module Title
            </label>
            <input
              type="text"
              required
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="e.g. Module 1: Distributed Transactions & Consensus"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setModuleModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-scalora-navy text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={moduleLoading}
              className="px-5 py-2 rounded-xl bg-scalora-blue text-white text-xs font-bold shadow-glow-blue"
            >
              {moduleLoading ? 'Saving...' : editingModule ? 'Save Changes' : 'Create Module'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lesson Create/Edit Modal */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveLesson} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Lesson Title
            </label>
            <input
              type="text"
              required
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="e.g. 1.2 Multi-Stage Docker Builds"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Lesson Type & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Lesson Type
              </label>
              <select
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value as LessonType)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#04152D]"
              >
                <option value="YOUTUBE">YouTube Video</option>
                <option value="PDF">PDF Material</option>
                <option value="DOWNLOAD">Downloadable File / Zip</option>
                <option value="TEXT">Text / Markdown Article</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 18 min"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Type-Specific Fields */}
          {lessonType === 'YOUTUBE' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  YouTube Video Resource (URL or Video ID)
                </label>
                {(() => {
                  const detectedId = extractYouTubeVideoId(videoUrl);
                  if (detectedId) {
                    return (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Ready (ID: {detectedId})</span>
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              <input
                type="text"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste YouTube URL, youtu.be link, or 11-char Video ID"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
              <span className="text-[10px] text-slate-400 block">
                Accepts full URLs (<code className="text-slate-300 font-mono">youtube.com/watch?v=...</code>), short links (<code className="text-slate-300 font-mono">youtu.be/...</code>), or raw video IDs.
              </span>
            </div>
          )}

          {(lessonType === 'PDF' || lessonType === 'DOWNLOAD') && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  File Download URL
                </label>
                <input
                  type="url"
                  required
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://.../document.pdf or .zip"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Scalora-Blueprint.pdf"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    File Size
                  </label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="4.2 MB"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Markdown Content Area */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Lesson Text Content (Markdown supported)
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add comprehensive notes, code blocks, or summary..."
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-scalora-blue/20">
            <button
              type="button"
              onClick={() => setLessonModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-scalora-navy text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={lessonLoading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue"
            >
              {lessonLoading ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
