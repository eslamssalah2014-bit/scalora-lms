import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Course } from '../types';
import { api } from '../lib/api';
import { CourseCard } from '../components/CourseCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { Search, Filter, BookOpen, Sparkles, Layers } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Cloud Architecture',
  'AI & Data Science',
  'Software Engineering',
  'DevOps & Cloud',
];

export const CoursesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState('newest');
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, selectedSort]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let url = `/courses?sort=${selectedSort}`;
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await api.get<{ success: boolean; courses: Course[] }>(url);
      if (res.success) {
        setCourses(res.courses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#082B5B] via-[#0D3E82] to-[#04152D] border border-scalora-blue/30 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-scalora-accent/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scalora-blue/20 text-scalora-accent border border-scalora-blue/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mastery Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Explore All Engineering Tracks
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            Choose from comprehensive, hands-on enterprise tracks. Learn at your own pace with lifetime access,
            interactive assessments, and verifiable certification.
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
              className="w-full pl-10 pr-24 py-3 rounded-xl glass-input text-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-scalora-blue text-white text-xs font-bold hover:bg-scalora-hover transition-colors"
            >
              Search
            </button>
          </form>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl glass-input text-xs font-semibold focus:outline-none"
            >
              <option value="newest" className="bg-[#04152D]">Newest Releases</option>
              <option value="price-low" className="bg-[#04152D]">Price: Low to High</option>
              <option value="price-high" className="bg-[#04152D]">Price: High to Low</option>
              <option value="title" className="bg-[#04152D]">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-scalora-blue text-white shadow-glow-blue'
                  : 'bg-scalora-navy/50 text-slate-300 hover:text-white hover:bg-scalora-navy/80 border border-scalora-blue/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-2xl glass-card animate-pulse bg-scalora-navy/40" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl space-y-4 max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Courses Found</h3>
          <p className="text-xs text-slate-400">
            We couldn't find any courses matching your search criteria. Try adjusting your keywords or category filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-scalora-blue text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnrollClick={(c) => setSelectedCourseForCheckout(c)}
            />
          ))}
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
