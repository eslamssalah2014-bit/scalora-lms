import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCms } from '../context/CmsContext';
import { Course } from '../types';
import { api } from '../lib/api';
import { CourseCard } from '../components/CourseCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { PwaHeroCard } from '../components/pwa/PwaHeroCard';
import { UpcomingCoursesSection } from '../components/home/UpcomingCoursesSection';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  CheckCircle2,
  Users,
  Cpu,
  Layers,
  Terminal,
  Briefcase,
  GraduationCap,
  Calendar,
  MessageSquare,
  BookOpen,
  Check,
  Star,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { home, partners } = useCms();

  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<Course | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const res = await api.get<{ success: boolean; courses: Course[] }>('/courses');
      if (res.success && Array.isArray(res.courses)) {
        const publishedOnly = res.courses.filter((c) => !c.isComingSoon);
        setFeaturedCourses(publishedOnly.length > 0 ? publishedOnly.slice(0, 6) : res.courses.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to fetch featured courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 md:space-y-28 pb-20 md:pb-28 bg-white text-slate-900">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Clean White + Blue Premium SaaS)                         */}
      {/* ========================================================================= */}
      <section className="relative pt-8 sm:pt-14 pb-14 sm:pb-20 md:pt-20 md:pb-24 bg-gradient-to-b from-blue-50/60 via-white to-white border-b border-slate-100 overflow-hidden">
        {/* Soft Radial Ambient Lights */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-100/50 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-[300px] h-[300px] bg-blue-200/40 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            {/* Announcement Pill */}
            {home?.hero?.pillBadge && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 max-w-full">
                {home.hero.pillPing !== false && (
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping flex-shrink-0" />
                )}
                <span className="text-xs font-bold tracking-wide truncate">
                  {home.hero.pillBadge}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              </div>
            )}

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.12]">
              {home?.hero?.headline || 'Elevate Enterprise Excellence with Scalora'}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {home?.hero?.subheadline ||
                'We empower modern organizations through two unified pillars: high-impact Operations Consulting that structures business systems, and a premier Community & Academy for engineers and operators.'}
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-2">
              <a
                href={home?.hero?.cta1Link || '#featured-courses'}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <span>{home?.hero?.cta1Text || 'Explore Courses'}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>

              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span>Open Dashboard</span>
                </Link>
              ) : (
                <Link
                  to={home?.hero?.cta2Link || '/services'}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span>{home?.hero?.cta2Text || 'Explore Consulting'}</span>
                </Link>
              )}
            </div>

            {/* Permanent PWA Installation CTA Card */}
            <div className="pt-4 sm:pt-6">
              <PwaHeroCard />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FEATURED COURSES SECTION                                                */}
      {/* ========================================================================= */}
      <section id="featured-courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Mastery Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Featured Courses
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Hands-on, project-driven engineering and operational masterclasses taught by senior industry practitioners.
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 group self-start sm:self-auto"
          >
            <span>View All Courses</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Course Cards Grid: 1 col on mobile, 2 col on tablet, 3 col on desktop */}
        {loadingCourses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-slate-50 h-[450px] animate-pulse" />
            ))}
          </div>
        ) : featuredCourses.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No courses published yet</h3>
            <p className="text-xs text-slate-500">
              New engineering and operations tracks are being uploaded. Check our upcoming courses below!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnrollClick={(c) => setSelectedCourseForCheckout(c)}
              />
            ))}
          </div>
        )}

        {/* Custom Corporate Curriculum Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm sm:text-base font-bold text-slate-900">Looking for a tailored corporate curriculum?</h4>
            <p className="text-xs text-slate-600">We design custom training tracks and SOP architectures for engineering and operations teams.</p>
          </div>
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs whitespace-nowrap shadow-sm transition-all"
          >
            Request Custom Training
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. COMING SOON COURSES (HORIZONTAL CAROUSEL)                              */}
      {/* ========================================================================= */}
      <UpcomingCoursesSection />

      {/* ========================================================================= */}
      {/* 4. COMMUNITY PREVIEW SECTION                                              */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Global Peer Network</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Community & Live Network
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Connect with founders, systems engineers, and operations leaders. Share architectures, ask questions, and grow together.
            </p>
          </div>

          <Link
            to="/community"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 group self-start sm:self-auto"
          >
            <span>Explore Community</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3 Community Feature Cards: 1 col on mobile, 3 col on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Live AMAs & Discussions</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ask questions directly to instructors and guest architects. Discuss edge cases, tooling updates, and career milestones.
            </p>
            <div className="pt-2 text-xs font-bold text-blue-600 flex items-center gap-1">
              <span>Weekly live Q&A</span>
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Architecture Peer Reviews</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Submit your workflow diagrams, ERP blueprints, and automation pipelines to receive constructive feedback from peers.
            </p>
            <div className="pt-2 text-xs font-bold text-indigo-600 flex items-center gap-1">
              <span>Real code & schema feedback</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Verified Skill Badges</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Earn public credentials upon course and quiz completion. Display your verifiable badges to recruiters and teammates.
            </p>
            <div className="pt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>Public verifiable certificates</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Community Callout Gateway */}
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-6 sm:p-10 md:p-12 overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider border border-white/30 backdrop-blur-sm">
                Join 5,000+ Members
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-white">
                Ready to collaborate with senior operators?
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                The Scalora Community is open to all enrolled students and verified alumni. Access discussion channels, workshop recordings, and resource vaults.
              </p>
            </div>
            <Link
              to="/community"
              className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md text-center transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Enter Community</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CHOOSE YOUR JOURNEY (DUAL PILLARS)                                     */}
      {/* ========================================================================= */}
      <section id="choose-journey" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
            <Layers className="w-4 h-4" />
            <span>Dual Business Experience</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Choose Your Journey
          </h2>
          <p className="text-xs sm:text-base text-slate-600">
            Whether you're building an enterprise system or advancing your technical mastery, Scalora has a path for you.
          </p>
        </div>

        {/* TWO LARGE EQUAL CARDS: 1 col on mobile, 2 col on tablet/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* CARD 1: Services */}
          <div className="relative rounded-3xl bg-white p-6 sm:p-10 md:p-12 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 flex flex-col justify-between space-y-6 sm:space-y-8 group transition-all">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <Briefcase className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  Consulting & Ops
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">Services</h3>
                <p className="text-xs sm:text-base text-slate-600 mt-2 sm:mt-3 leading-relaxed">
                  Business consulting, operations systems, workflow automation, SOPs, AI implementation, and operational excellence.
                </p>
              </div>

              <ul className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Operations systems & centralized ERP/CRM architectures</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Zero-touch workflow automation & AI agent deployments</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Process design, Lean standard operating procedures & KPIs</span>
                </li>
              </ul>
            </div>

            {/* Card 1 Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 sm:pt-6 border-t border-slate-100">
              <Link
                to="/services"
                className="px-5 py-3 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="px-5 py-3 sm:py-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 text-center transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Book Advisory</span>
              </Link>
            </div>
          </div>

          {/* CARD 2: Community & Academy */}
          <div className="relative rounded-3xl bg-white p-6 sm:p-10 md:p-12 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 flex flex-col justify-between space-y-6 sm:space-y-8 group transition-all">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Learning & Network
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">Community & Academy</h3>
                <p className="text-xs sm:text-base text-slate-600 mt-2 sm:mt-3 leading-relaxed">
                  Courses, workshops, events, certifications, business resources, and professional development programs.
                </p>
              </div>

              <ul className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Practical courses with interactive quizzes & verifiable certs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Hands-on implementation workshops & exclusive AMAs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Global peer network of founders, operators & engineers</span>
                </li>
              </ul>
            </div>

            {/* Card 2 Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 sm:pt-6 border-t border-slate-100">
              <Link
                to="/community"
                className="px-5 py-3 sm:py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Community</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="px-5 py-3 sm:py-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 text-center transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Browse Courses</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. DYNAMIC TESTIMONIALS & REVIEWS SECTION (CMS MANAGED)                   */}
      {/* ========================================================================= */}
      {home?.testimonials && home.testimonials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>Proven Impact</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Trusted by Leading Practitioners & Teams
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Hear directly from developers, cloud architects, and operations managers who transformed their systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {home.testimonials.map((t) => (
              <div
                key={t.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    "{t.review}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.role} {t.company && `• ${t.company}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. FREQUENTLY ASKED QUESTIONS SECTION (CMS MANAGED)                       */}
      {/* ========================================================================= */}
      {home?.faq && home.faq.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {home.faq.map((f, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={f.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-900">{f.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {f.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. GATEWAY CALL TO ACTION BANNER (Dark Navy Corporate Accent)             */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-[#0F172A] border border-slate-800 p-8 sm:p-12 md:p-14 overflow-hidden text-center shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-5 sm:space-y-6">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Ready to Transform Your Organization or Skills?
            </h2>
            <p className="text-xs sm:text-base text-slate-300">
              Get started with Scalora today. Book a consulting session for your enterprise or join our academy and community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
              <Link
                to="/services"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Browse Courses</span>
              </Link>
              <Link
                to="/community"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-colors"
              >
                Explore Community
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frictionless Checkout Modal */}
      <CheckoutModal
        isOpen={Boolean(selectedCourseForCheckout)}
        onClose={() => setSelectedCourseForCheckout(null)}
        course={selectedCourseForCheckout}
        onSuccess={fetchFeaturedCourses}
      />
    </div>
  );
};
