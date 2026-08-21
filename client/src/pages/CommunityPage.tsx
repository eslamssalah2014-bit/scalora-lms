import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import { api } from '../lib/api';
import { CourseCard } from '../components/CourseCard';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  Users,
  GraduationCap,
  Video,
  Calendar,
  FileText,
  MessageSquare,
  ArrowRight,
  Sparkles,
  BookOpen,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  Star,
  Download,
  Zap,
  Code2,
  Terminal,
  Layers,
} from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<Course | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; courses: Course[] }>('/courses');
      if (res.success && Array.isArray(res.courses)) {
        setCourses(res.courses);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnrollClick = (course: Course) => {
    setSelectedCourseForCheckout(course);
  };

  return (
    <div className="space-y-28 pb-24">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-cyan-500/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-scalora-blue/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-extrabold tracking-widest uppercase shadow-glow-accent animate-in fade-in slide-in-from-top-4 duration-500">
              <Users className="w-3.5 h-3.5" />
              <span>Scalora Global Academy & Network</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
              LEARN. BUILD.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-scalora-blue to-scalora-accent">
                GROW.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Join the Scalora Community and access practical courses, workshops, events, templates, frameworks,
              and business resources designed for founders, operators, and professionals.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#community-courses"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-base shadow-glow-blue hover:opacity-95 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                <span>Explore Courses</span>
              </a>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel hover:bg-scalora-navy/90 text-white font-bold text-base border border-cyan-400/40 transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5 text-cyan-300" />
                <span>Join Community</span>
              </Link>
            </div>

            {/* Academy Metrics */}
            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-scalora-blue/15">
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white">4,800+</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Members</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-cyan-300">45+</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Masterclasses & AMAs</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white">150+</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Curated SOPs & Blueprints</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verifiable Credentials</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. COMMUNITY PILLARS (4 Premium Cards) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400">
            <Layers className="w-4 h-4" />
            <span>Member Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            The 4 Community Pillars
          </h2>
          <p className="text-base text-slate-300">
            Built from the ground up to give operators, founders, and engineers unfair competitive advantages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="glass-card p-8 rounded-3xl space-y-4 border border-cyan-500/20 hover:border-cyan-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:scale-105 transition-transform shadow-glow-accent">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">1. Practical Workshops</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hands-on implementation sessions. Build working cloud-native systems, automated operational pipelines, and AI workflows live alongside practitioners.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-cyan-300 font-semibold flex items-center gap-1">
              <span>Interactive Cohorts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card p-8 rounded-3xl space-y-4 border border-scalora-blue/20 hover:border-scalora-blue transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center group-hover:scale-105 transition-transform shadow-glow-blue">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">2. Events & AMAs</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Live sessions with founders and operators. Direct Q&A with industry leaders sharing actual metrics, war stories, and growth strategies.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-scalora-accent font-semibold flex items-center gap-1">
              <span>Exclusive AMAs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card p-8 rounded-3xl space-y-4 border border-emerald-500/20 hover:border-emerald-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">3. Resource Vault</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                SOPs, templates, blueprints, frameworks, prompt libraries, and starter toolkits that you can clone directly into your business.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span>Downloadable Assets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="glass-card p-8 rounded-3xl space-y-4 border border-purple-500/20 hover:border-purple-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">4. Founder Network</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect with ambitious operators and business owners. Form partnerships, hire vetted talent, and get instant feedback on operational challenges.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-purple-400 font-semibold flex items-center gap-1">
              <span>Private Channels</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED COURSES SECTION */}
      {/* ========================================================================= */}
      <section id="community-courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-scalora-blue/15">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-300 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Curated Academy Curriculum</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Featured Courses & Learning Paths</h2>
            <p className="text-slate-400 text-sm mt-1">
              Practical, production-grade curriculum designed by veteran engineers and enterprise practitioners.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>View all courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl glass-card animate-pulse bg-scalora-navy/40" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnrollClick={handleEnrollClick}
              />
            ))}
          </div>
        ) : (
          /* Graceful Fallback Placeholder Cards */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl overflow-hidden p-6 space-y-4">
              <img
                src="https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80"
                alt="DevOps Track"
                className="w-full h-44 object-cover rounded-xl"
              />
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-scalora-accent uppercase">DevOps & Cloud</span>
                <h3 className="text-lg font-bold text-white">Production Infrastructure Automation</h3>
                <p className="text-xs text-slate-300">Master Docker, Kubernetes, CI/CD, and zero-downtime deploys.</p>
              </div>
              <Link
                to="/courses"
                className="block text-center py-2.5 rounded-xl bg-scalora-blue text-white text-xs font-bold"
              >
                Enroll Now
              </Link>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden p-6 space-y-4">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
                alt="AI Track"
                className="w-full h-44 object-cover rounded-xl"
              />
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-cyan-300 uppercase">AI & Data Science</span>
                <h3 className="text-lg font-bold text-white">Generative AI & LLM Engineering</h3>
                <p className="text-xs text-slate-300">Build RAG pipelines, fine-tuned agent workflows, and vector search.</p>
              </div>
              <Link
                to="/courses"
                className="block text-center py-2.5 rounded-xl bg-cyan-500 text-white text-xs font-bold"
              >
                Enroll Now
              </Link>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden p-6 space-y-4">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
                alt="Systems Track"
                className="w-full h-44 object-cover rounded-xl"
              />
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase">Business Operations</span>
                <h3 className="text-lg font-bold text-white">Operational Systems Mastery</h3>
                <p className="text-xs text-slate-300">Design scalable ERP, CRM databases, and automated workflows.</p>
              </div>
              <Link
                to="/courses"
                className="block text-center py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold"
              >
                Enroll Now
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. RESOURCE VAULT & COMMUNITY PERKS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="rounded-3xl glass-card p-8 sm:p-14 border border-cyan-500/30 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/10 blur-3xl rounded-full pointer-events-none" />

          <div className="max-w-3xl space-y-4">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Community Vault Access
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready-to-Deploy Frameworks & Assets
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Every Scalora Community member receives direct access to our centralized template repository. Clone production-tested SOPs and architectures in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl glass-panel space-y-1">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-300" />
                <span>ClickUp Enterprise Templates</span>
              </div>
              <p className="text-xs text-slate-400">Complete task hierarchies, dashboard views & automations.</p>
            </div>

            <div className="p-4 rounded-2xl glass-panel space-y-1">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-300" />
                <span>Notion Company Wiki Blueprint</span>
              </div>
              <p className="text-xs text-slate-400">Standard operating procedure knowledge base & employee handbook.</p>
            </div>

            <div className="p-4 rounded-2xl glass-panel space-y-1">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-300" />
                <span>Make & Zapier Scenario JSONs</span>
              </div>
              <p className="text-xs text-slate-400">Pre-built webhook scenarios for zero-touch client onboarding.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MEMBERSHIP CTA */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-tr from-[#020C1B] via-[#082B5B] to-[#0D3E82] border border-cyan-400/40 p-8 sm:p-14 overflow-hidden text-center shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-400/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Join 4,800+ High-Performing Operators & Engineers
            </h2>
            <p className="text-sm sm:text-base text-slate-200">
              Get immediate access to practical courses, interactive masterclasses, downloadable business toolkits, and an elite global peer community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-scalora-navy hover:bg-slate-100 font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Create Free Community Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-scalora-navy/60 hover:bg-scalora-navy text-white font-bold text-sm border border-white/20 transition-colors"
              >
                Browse All Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={Boolean(selectedCourseForCheckout)}
        onClose={() => setSelectedCourseForCheckout(null)}
        course={selectedCourseForCheckout}
      />
    </div>
  );
};
