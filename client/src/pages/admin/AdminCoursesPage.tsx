import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Course, Category } from '../../types';
import { api } from '../../lib/api';
import { Modal } from '../../components/Modal';
import {
  BookOpen,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Layers,
  HelpCircle,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
  AlertCircle,
  Tag,
  Plus,
  X,
  Check,
} from 'lucide-react';

export const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Category State
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catSuccess, setCatSuccess] = useState<string | null>(null);

  // Quick inline add category in course modal
  const [isInlineAddingCat, setIsInlineAddingCat] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');

  // Course Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Available Trainers State
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([]);
  const [trainerSearch, setTrainerSearch] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [instructor, setInstructor] = useState('');
  const [category, setCategory] = useState('Cloud Architecture');
  const [level, setLevel] = useState('All Levels');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const res = await api.get<{ success: boolean; trainers: any[] }>('/trainers');
      if (res.success && Array.isArray(res.trainers)) {
        setAvailableTrainers(res.trainers);
      }
    } catch (err) {
      console.error('Failed to load trainers:', err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; courses: Course[] }>('/courses/admin/all');
      if (res.success && Array.isArray(res.courses)) {
        setCourses(res.courses);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load courses from server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get<{ success: boolean; categories: Category[] }>('/courses/categories');
      if (res.success && Array.isArray(res.categories)) {
        setCategories(res.categories);
        if (res.categories.length > 0 && !category) {
          setCategory(res.categories[0].name);
        }
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleCreateCategory = async (nameToAdd: string, autoSelect = false) => {
    if (!nameToAdd.trim()) return;
    setCatLoading(true);
    setCatError(null);
    setCatSuccess(null);

    try {
      const res = await api.post<{ success: boolean; message: string; category: Category }>(
        '/courses/categories',
        { name: nameToAdd.trim() }
      );
      if (res.success && res.category) {
        await fetchCategories();
        if (autoSelect) {
          setCategory(res.category.name);
          setIsInlineAddingCat(false);
          setInlineCatName('');
        }
        setNewCatName('');
        setCatSuccess(`Category "${res.category.name}" created successfully!`);
      }
    } catch (err: any) {
      setCatError(err.message || 'Failed to create category.');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      return;
    }
    setCatLoading(true);
    setCatError(null);
    setCatSuccess(null);

    try {
      await api.delete(`/courses/categories/${catId}`);
      await fetchCategories();
      setCatSuccess(`Category "${catName}" deleted successfully.`);
      if (category === catName && categories.length > 1) {
        const remaining = categories.filter((c) => c.id !== catId);
        if (remaining.length > 0) {
          setCategory(remaining[0].name);
        }
      }
    } catch (err: any) {
      setCatError(err.message || 'Failed to delete category.');
    } finally {
      setCatLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setTitle('');
    setDescription('');
    setThumbnail('');
    setPrice(0);
    setInstructor('Scalora Master Instructor');
    setCategory(categories.length > 0 ? categories[0].name : 'Cloud Architecture');
    setLevel('All Levels');
    setIsPublished(true);
    setSelectedTrainerIds([]);
    setTrainerSearch('');
    setFormError(null);
    setIsInlineAddingCat(false);
    setInlineCatName('');
    setModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description);
    setThumbnail(course.thumbnail || '');
    setPrice(course.price);
    setInstructor(course.instructor);
    setCategory(course.category);
    setLevel(course.level || 'All Levels');
    setIsPublished(course.isPublished);
    setSelectedTrainerIds(course.trainers ? course.trainers.map((t) => t.id) : []);
    setTrainerSearch('');
    setFormError(null);
    setIsInlineAddingCat(false);
    setInlineCatName('');
    setModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const payload = {
      title,
      description,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      price: Number(price),
      instructor: instructor || 'Scalora Master Instructor',
      category,
      level,
      isPublished,
      trainerIds: selectedTrainerIds,
    };

    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, payload);
      } else {
        await api.post('/courses', payload);
      }
      await fetchCourses();
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save course to server.');
    } finally {
      setFormLoading(false);
    }
  };

  const togglePublish = async (courseId: string) => {
    try {
      await api.patch(`/courses/${courseId}/publish`);
      await fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to update course status on server.');
    }
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${courseTitle}"?`)) {
      return;
    }
    try {
      await api.delete(`/courses/${courseId}`);
      await fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course from server.');
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-scalora-blue/20">
        <div>
          <h1 className="text-2xl font-black text-white">Course Management</h1>
          <p className="text-xs text-slate-400">
            Create, edit, publish, and manage module & lesson curriculums
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setCatError(null);
              setCatSuccess(null);
              setCategoryModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl glass-panel hover:bg-scalora-navy text-slate-200 text-xs font-bold border border-scalora-blue/30 transition-all flex items-center gap-2"
          >
            <Tag className="w-4 h-4 text-scalora-accent" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Course</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter courses by title, category, instructor..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
        />
      </div>

      {/* Courses Table */}
      <div className="glass-panel rounded-2xl border border-scalora-blue/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-scalora-blue/20 bg-scalora-navy/50 text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Course</th>
                <th className="py-3.5 px-4 font-semibold">Category & Level</th>
                <th className="py-3.5 px-4 font-semibold">Price</th>
                <th className="py-3.5 px-4 font-semibold">Content</th>
                <th className="py-3.5 px-4 font-semibold">Students</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-scalora-blue/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-scalora-blue mb-2" />
                    Loading courses...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No courses found. Click "New Course" to create one.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    {/* Course Title + Thumbnail */}
                    <td className="py-4 px-4 font-bold text-white max-w-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            c.thumbnail ||
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                          }
                          alt={c.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-scalora-blue/30"
                        />
                        <div className="min-w-0">
                          <span className="block truncate font-bold text-slate-100">{c.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">By {c.instructor}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Level */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-scalora-navy text-scalora-accent border border-scalora-blue/30">
                          {c.category}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{c.level}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 font-black text-white">
                      {c.price === 0 ? 'Free' : `$${c.price.toFixed(2)}`}
                    </td>

                    {/* Content Count */}
                    <td className="py-4 px-4 text-slate-300">
                      <div className="space-y-0.5">
                        <span>{c.lessonsCount ?? 0} lessons</span>
                        <span className="block text-[10px] text-scalora-accent">
                          {c.quizzesCount ?? 0} quizzes
                        </span>
                      </div>
                    </td>

                    {/* Students Count */}
                    <td className="py-4 px-4 font-bold text-white">{c.studentsCount ?? 0}</td>

                    {/* Published Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => togglePublish(c.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors inline-flex items-center gap-1 ${
                          c.isPublished
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-700/30 text-slate-400 border-slate-600 hover:bg-slate-700/50'
                        }`}
                      >
                        {c.isPublished ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/courses/${c.id}/curriculum`}
                          className="p-1.5 rounded-lg bg-scalora-blue/20 hover:bg-scalora-blue/40 text-scalora-accent transition-colors"
                          title="Manage Modules & Lessons"
                        >
                          <Layers className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Course Settings"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/courses/${c.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Preview Public Page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteCourse(c.id, c.title)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCourse ? 'Edit Course Settings' : 'Create New Course'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Course Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems in Go"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Category & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Category
                </label>
                <div className="flex items-center gap-2">
                  {!isInlineAddingCat && (
                    <button
                      type="button"
                      onClick={() => setIsInlineAddingCat(true)}
                      className="text-[11px] font-bold text-scalora-accent hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCatError(null);
                      setCatSuccess(null);
                      setCategoryModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-0.5"
                  >
                    <span>Manage</span>
                  </button>
                </div>
              </div>

              {isInlineAddingCat ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={inlineCatName}
                    onChange={(e) => setInlineCatName(e.target.value)}
                    placeholder="Enter category name..."
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory(inlineCatName, true);
                      } else if (e.key === 'Escape') {
                        setIsInlineAddingCat(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={catLoading || !inlineCatName.trim()}
                    onClick={() => handleCreateCategory(inlineCatName, true)}
                    className="p-2 rounded-xl bg-scalora-blue hover:bg-scalora-hover text-white disabled:opacity-50"
                    title="Save category"
                  >
                    {catLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInlineAddingCat(false);
                      setInlineCatName('');
                    }}
                    className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#04152D]"
                >
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {category && !categories.some((c) => c.name.toLowerCase() === category.toLowerCase()) && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#04152D]"
              >
                <option value="All Levels">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Instructor & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Instructor Name
              </label>
              <input
                type="text"
                required
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Dr. Tariq Al-Mansoor"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Tuition Price ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="89.99"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Thumbnail Image URL
            </label>
            <input
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Course Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive summary of what students will learn..."
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Assigned Trainers Selection Section */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#0B1528] border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Assigned Instructors & Trainers</span>
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                {selectedTrainerIds.length} selected
              </span>
            </div>

            {/* Trainer Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trainers..."
                value={trainerSearch}
                onChange={(e) => setTrainerSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Trainers Chips Grid */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {availableTrainers
                .filter((t) => t.name.toLowerCase().includes(trainerSearch.toLowerCase()))
                .map((t) => {
                  const isSelected = selectedTrainerIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTrainerIds(selectedTrainerIds.filter((id) => id !== t.id));
                        } else {
                          setSelectedTrainerIds([...selectedTrainerIds, t.id]);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all border ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-white shadow-sm'
                          : 'bg-[#091324] border-white/5 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            t.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=0284C7&color=fff`
                          }
                          alt={t.name}
                          className="w-6 h-6 rounded-lg object-cover border border-white/10"
                        />
                        <div>
                          <div className="font-bold text-white leading-tight">{t.name}</div>
                          <div className="text-[10px] text-slate-400">{t.title || 'Trainer'}</div>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-white'
                            : 'border-slate-600 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Publish Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-scalora-blue focus:ring-0 bg-[#04152D] border-scalora-blue/40"
            />
            <label htmlFor="isPublished" className="text-xs font-semibold text-white">
              Publish immediately (visible in public catalog)
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-scalora-blue/20">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-scalora-navy hover:bg-scalora-navy/80 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 flex items-center gap-2"
            >
              {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingCourse ? 'Update Course' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Management Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Manage Course Categories"
      >
        <div className="space-y-6">
          <p className="text-xs text-slate-400">
            Create new categories or delete existing ones. Categories appear as filters on the public catalog and options when creating courses.
          </p>

          {catError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{catError}</span>
            </div>
          )}

          {catSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{catSuccess}</span>
            </div>
          )}

          {/* Add Category Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateCategory(newCatName);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name (e.g. Prompt Engineering)"
              className="flex-1 px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
            <button
              type="submit"
              disabled={catLoading || !newCatName.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {catLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Add Category</span>
            </button>
          </form>

          {/* Category List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Categories ({categories.length})
            </h4>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-scalora-blue/10">
              {categories.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">No categories found.</p>
              ) : (
                categories.map((c) => (
                  <div
                    key={c.id || c.name}
                    className="pt-2 flex items-center justify-between gap-3 group hover:bg-white/5 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Tag className="w-3.5 h-3.5 text-scalora-accent" />
                      <span className="text-xs font-bold text-white">{c.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-scalora-blue/20 text-scalora-blue border border-scalora-blue/30 font-semibold">
                        {c.courseCount ?? 0} {c.courseCount === 1 ? 'course' : 'courses'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={catLoading}
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title={`Delete "${c.name}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-scalora-blue/20">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-scalora-navy hover:bg-scalora-navy/80 text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
