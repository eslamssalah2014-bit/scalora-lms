import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Code2,
  Cpu,
  Layers,
  Terminal,
  Zap,
  Star,
  Briefcase,
  GraduationCap,
  Workflow,
  BarChart3,
  Calendar,
  MessageSquare,
  Clock,
  Building2,
  Globe,
  BookOpen,
  Compass,
  Flame,
  Check,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<Course | null>(null);

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const res = await api.get<{ success: boolean; courses: Course[] }>('/courses');
      if (res.success && Array.isArray(res.courses)) {
        // Filter out coming soon courses for the Featured Courses section (Coming soon have their own dedicated carousel section below)
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
    <div className="space-y-16 sm:space-y-24 md:space-y-28 pb-20 md:pb-28">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-6 sm:pt-12 pb-12 sm:pb-20 md:pt-20 md:pb-24 overflow-hidden">
        {/* Ambient Glow Backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[550px] md:w-[700px] h-[250px] sm:h-[350px] md:h-[380px] bg-scalora-blue/20 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-4 sm:right-10 w-[200px] sm:w-[350px] h-[200px] sm:h-[350px] bg-scalora-accent/15 blur-[90px] sm:blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            {/* Top Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-scalora-navy/80 border border-scalora-blue/40 shadow-glow-blue animate-in fade-in slide-in-from-top-4 duration-500 max-w-full">
              <span className="flex h-2 w-2 rounded-full bg-scalora-accent animate-ping flex-shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 tracking-wide truncate">
                Enterprise Operations Consulting & Technical Academy
              </span>
              <Sparkles className="w-3.5 h-3.5 text-scalora-accent flex-shrink-0" />
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.15]">
              Elevate Enterprise Excellence with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scalora-blue via-cyan-400 to-scalora-accent">
                Scalora
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We empower modern organizations through two unified pillars: high-impact{' '}
              <strong className="text-white font-semibold">Operations Consulting</strong> that structures business systems, and a premier{' '}
              <strong className="text-white font-semibold">Community & Academy</strong> for engineers and operators.
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-2">
              <a
                href="#featured-courses"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-sm sm:text-base shadow-glow-blue hover:opacity-95 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <span>Browse Courses</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>

              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-sm sm:text-base border border-scalora-blue/30 transition-all flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-scalora-accent" />
                  <span>Open Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/services"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-sm sm:text-base border border-scalora-blue/30 transition-all flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-scalora-accent" />
                  <span>Explore Consulting</span>
                </Link>
              )}
            </div>

            {/* Trust & Highlights Strip */}
            <div className="pt-6 sm:pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left">
              <div className="p-3 sm:p-4 rounded-2xl bg-[#061426]/70 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Enterprise</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-200">Production Systems</div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-[#061426]/70 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-amber-400">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Verified</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-200">Official Certificates</div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-[#061426]/70 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Workflow className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Zero Fluff</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-200">100% Practical Labs</div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-[#061426]/70 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Offline PWA</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-200">Learn Anywhere</div>
              </div>
            </div>

            {/* Permanent PWA Installation CTA Card (Universal for mobile & desktop) */}
            <div className="pt-2">
              <PwaHeroCard />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FEATURED COURSES SECTION                                                */}
      {/* ========================================================================= */}
      <section id="featured-courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-scalora-blue/20 text-scalora-accent border border-scalora-blue/30 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mastery Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Featured Courses
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Hands-on, project-driven engineering and operational masterclasses taught by senior industry practitioners.
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 group self-start sm:self-auto"
          >
            <span>View All Courses</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Course Cards Grid: 1 col on mobile, 2 col on tablet, 3 col on desktop */}
        {loadingCourses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl glass-card h-[450px] animate-pulse bg-scalora-navy/40" />
            ))}
          </div>
        ) : featuredCourses.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl space-y-4 max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No courses published yet</h3>
            <p className="text-xs text-slate-400">
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

        {/* Bottom Catalog Discovery Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#061B36] to-[#041122] border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm sm:text-base font-bold text-white">Looking for a tailored corporate curriculum?</h4>
            <p className="text-xs text-slate-400">We design custom training tracks and SOP architectures for engineering teams.</p>
          </div>
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-xl bg-scalora-navy hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-bold text-xs whitespace-nowrap transition-all"
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Global Peer Network</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Community & Live Network
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Connect with founders, systems engineers, and operations leaders. Share architectures, ask questions, and grow together.
            </p>
          </div>

          <Link
            to="/community"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 group self-start sm:self-auto"
          >
            <span>Explore Community</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3 Community Feature Cards: 1 col on mobile, 3 col on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 hover:border-cyan-400/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Live AMAs & Discussions</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ask questions directly to instructors and guest architects. Discuss edge cases, tooling updates, and career milestones.
            </p>
            <div className="pt-2 text-xs font-bold text-cyan-400 flex items-center gap-1">
              <span>Weekly live Q&A</span>
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 hover:border-cyan-400/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Architecture Peer Reviews</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Submit your workflow diagrams, ERP blueprints, and automation pipelines to receive constructive feedback from peers.
            </p>
            <div className="pt-2 text-xs font-bold text-amber-400 flex items-center gap-1">
              <span>Real code & schema feedback</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 hover:border-cyan-400/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Verified Skill Badges</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Earn public credentials upon course and quiz completion. Display your verifiable badges to recruiters and teammates.
            </p>
            <div className="pt-2 text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span>Public verifiable certificates</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Community Interactive Gateway */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#071F3D] via-[#0B2E5C] to-[#04152D] border border-cyan-500/30 p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <span className="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-bold uppercase tracking-wider border border-cyan-400/30">
                Join 5,000+ Members
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-white">
                Ready to collaborate with senior operators?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                The Scalora Community is open to all enrolled students and verified alumni. Access channels, event recordings, and discussion boards.
              </p>
            </div>
            <Link
              to="/community"
              className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-scalora-blue text-white font-extrabold text-sm shadow-glow-blue hover:opacity-95 text-center transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Enter Community</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CHOOSE YOUR JOURNEY (TWO LARGE EQUAL CARDS)                            */}
      {/* ========================================================================= */}
      <section id="choose-journey" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent">
            <Layers className="w-4 h-4" />
            <span>Dual Business Experience</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Choose Your Journey
          </h2>
          <p className="text-xs sm:text-base text-slate-300">
            Whether you're building a business or building your skills, Scalora has a path for you.
          </p>
        </div>

        {/* TWO LARGE EQUAL CARDS: 1 col on mobile, 2 col on tablet/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* CARD 1: Services */}
          <div className="relative rounded-3xl glass-card p-6 sm:p-10 md:p-12 border border-scalora-blue/30 hover:border-scalora-blue flex flex-col justify-between space-y-6 sm:space-y-8 group transition-all shadow-2xl">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-scalora-navy to-scalora-blue flex items-center justify-center text-white shadow-glow-blue group-hover:scale-105 transition-transform">
                  <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-scalora-accent" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-scalora-blue/15 text-scalora-accent border border-scalora-blue/30">
                  Consulting & Ops
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">Services</h3>
                <p className="text-xs sm:text-base text-slate-300 mt-2 sm:mt-3 leading-relaxed">
                  Business consulting, operations systems, workflow automation, SOPs, AI implementation, and operational excellence.
                </p>
              </div>

              <ul className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4 border-t border-scalora-blue/15 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-scalora-accent flex-shrink-0" />
                  <span>Operations systems & centralized ERP/CRM architectures</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-scalora-accent flex-shrink-0" />
                  <span>Zero-touch workflow automation & AI agent deployments</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-scalora-accent flex-shrink-0" />
                  <span>Process design, Lean standard operating procedures & KPIs</span>
                </li>
              </ul>
            </div>

            {/* Card 1 Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 sm:pt-6 border-t border-scalora-blue/15">
              <Link
                to="/services"
                className="px-5 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-xs sm:text-sm shadow-glow-blue hover:opacity-95 text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="px-5 py-3 sm:py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-xs sm:text-sm border border-scalora-blue/30 text-center transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-scalora-accent" />
                <span>Book Consultation</span>
              </Link>
            </div>
          </div>

          {/* CARD 2: Community & Academy */}
          <div className="relative rounded-3xl glass-card p-6 sm:p-10 md:p-12 border border-cyan-500/30 hover:border-cyan-400 flex flex-col justify-between space-y-6 sm:space-y-8 group transition-all shadow-2xl">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-scalora-navy via-cyan-900 to-scalora-accent/40 flex items-center justify-center text-white shadow-glow-accent group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-300" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Learning & Network
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">Community & Academy</h3>
                <p className="text-xs sm:text-base text-slate-300 mt-2 sm:mt-3 leading-relaxed">
                  Courses, workshops, events, certifications, business resources, and professional development programs.
                </p>
              </div>

              <ul className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4 border-t border-scalora-blue/15 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                  <span>Practical courses with interactive quizzes & verifiable certs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                  <span>Hands-on implementation workshops & exclusive AMAs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                  <span>Global peer network of founders, operators & engineers</span>
                </li>
              </ul>
            </div>

            {/* Card 2 Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 sm:pt-6 border-t border-scalora-blue/15">
              <Link
                to="/community"
                className="px-5 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-xs sm:text-sm shadow-glow-blue hover:opacity-95 text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Community</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="px-5 py-3 sm:py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-xs sm:text-sm border border-cyan-400/30 text-center transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-cyan-300" />
                <span>Browse Courses</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PLATFORM BENEFITS SECTION (WHY SCALORA)                                */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400">
            <Award className="w-4 h-4" />
            <span>Why Scalora</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Built for Real-World Impact, Zero Fluff
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Our curriculum and consulting engagements are engineered to deliver immediate ROI and durable systems.
          </p>
        </div>

        {/* 6 Benefits: 1 col on mobile, 2 col on tablet, 3 col on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#061426] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-scalora-blue/20 text-scalora-accent flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Enterprise-Grade Curriculum</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every course is extracted directly from enterprise production engagements. No toy projects or synthetic filler.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#061426] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Verifiable Certifications</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Earn cryptographically verifiable credentials upon passing rigorous project milestones and quizzes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#061426] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Workflow className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Zero-Touch Automation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Master n8n, Make, custom webhooks, and AI agent pipelines that eliminate manual operational drag.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#061426] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Offline PWA Learning</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Install Scalora directly to your phone or desktop for lightning-fast, offline-capable learning anywhere.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#061426] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Senior Practitioner Mentors</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Get personalized feedback and direct answers from veteran architects with 10+ years in the field.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#061426] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Lifelong Alumni Network</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Retain continuous access to community channels, live masterclasses, templates, and event replays.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. GATEWAY CALL TO ACTION BANNER                                          */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#082B5B] via-[#0D3E82] to-[#04152D] border border-scalora-blue/40 p-6 sm:p-12 md:p-14 overflow-hidden text-center shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-scalora-accent/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-5 sm:space-y-6">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Ready to Transform Your Organization or Skills?
            </h2>
            <p className="text-xs sm:text-base text-slate-200">
              Get started with Scalora today. Book a consulting session for your enterprise or join our academy and community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
              <Link
                to="/services"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-white text-scalora-navy hover:bg-slate-100 font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-cyan-500 hover:from-scalora-blue/90 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-glow-blue transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Browse Courses</span>
              </Link>
              <Link
                to="/community"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-scalora-navy/60 hover:bg-scalora-navy text-white font-bold text-xs sm:text-sm border border-white/20 transition-colors"
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
