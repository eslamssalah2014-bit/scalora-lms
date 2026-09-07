import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Course } from '../types';
import { api } from '../lib/api';
import { useCms } from '../context/CmsContext';
import { CourseCard } from '../components/CourseCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { Search, Filter, BookOpen, Sparkles, Clock, Calendar } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'All',
  'Cloud Architecture',
  'AI & Data Science',
  'Software Engineering',
  'DevOps & Cloud',
  'Business Operations',
  'Cybersecurity',
];

export const CoursesPage: React.FC = () => {
  const { courses: cmsCourses } = useCms();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState('newest');
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<Course | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, selectedSort]);

  const fetchCategories = async () => {
    try {
      const res = await api.get<{ success: boolean; categories: { name: string }[] }>('/courses/categories');
      if (res.success && Array.isArray(res.categories)) {
        const uniqueNames = ['All', ...res.categories.map((c) => c.name)];
        setCategories(uniqueNames);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/courses?sort=${selectedSort}`;
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await api.get<{ success: boolean; courses: Course[] }>(url);
      if (res.success && Array.isArray(res.courses)) {
        setCourses(res.courses);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load courses from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const comingSoonCourses = cmsCourses?.comingSoonCourses || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-white text-slate-900">
      {/* Header Banner */}
      <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{cmsCourses?.headerTitle || 'Mastery Catalog'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {cmsCourses?.headerHeadline || 'Explore All Engineering Tracks'}
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            {cmsCourses?.headerDescription ||
              'Choose from comprehensive, hands-on enterprise tracks. Learn at your own pace with lifetime access, interactive assessments, and verifiable certification.'}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, instructor, or topic..."
              className="w-full pl-10 pr-24 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-sm"
            >
              <option value="newest">Newest Releases</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Courses Found</h3>
          <p className="text-xs text-slate-500">
            We couldn't find any courses matching your search criteria. Try adjusting your keywords or category filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnrollClick={(c) => setSelectedCourseForCheckout(c)}
            />
          ))}
        </div>
      )}

      {/* Coming Soon Courses from CMS */}
      {comingSoonCourses.length > 0 && (
        <div className="pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{cmsCourses?.upcomingSectionTitle || 'Upcoming Releases'}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Coming Soon to Scalora</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonCourses.map((track) => (
              <div
                key={track.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {track.category || 'Engineering Track'}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {track.featured ? 'Featured Track' : 'Coming Soon'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{track.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{track.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{track.launchDate ? `Target: ${track.launchDate}` : 'Coming This Quarter'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={Boolean(selectedCourseForCheckout)}
        onClose={() => setSelectedCourseForCheckout(null)}
        course={selectedCourseForCheckout}
        onSuccess={fetchCourses}
      />
    </div>
  );
};
