import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import { api } from '../lib/api';
import { CourseCard } from '../components/CourseCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Video,
  FileText,
  HelpCircle,
  TrendingUp,
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
  Send,
  Check,
  Mail,
  Building2,
  Globe,
  BookOpen,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<Course | null>(null);

  // Contact / Consultation Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    interest: 'Services & Operations Consulting',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; courses: Course[] }>('/courses');
      if (res.success && Array.isArray(res.courses)) {
        setCourses(res.courses);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load courses from server.');
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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
  };

  return (
    <div className="space-y-28 pb-24">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-scalora-blue/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-scalora-accent/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Top Announcement Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-scalora-navy/80 border border-scalora-blue/40 shadow-glow-blue animate-in fade-in slide-in-from-top-4 duration-500">
              <span className="flex h-2 w-2 rounded-full bg-scalora-accent animate-ping" />
              <span className="text-xs font-bold text-slate-200 tracking-wide">
                Enterprise Consulting & Technical Academy
              </span>
              <Sparkles className="w-3.5 h-3.5 text-scalora-accent" />
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
              Architecting Growth with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scalora-blue via-cyan-400 to-scalora-accent">
                Consulting & Education
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Scalora empowers organizations and professionals through two core pillars:
              high-impact <strong className="text-white font-semibold">Business Operations Consulting</strong> and a
              world-class <strong className="text-white font-semibold">Academy & Community</strong> for modern engineers and operators.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#choose-journey"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-base shadow-glow-blue hover:opacity-95 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <span>Choose Your Journey</span>
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#services"
                className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-base border border-scalora-blue/30 transition-all flex items-center justify-center gap-2"
              >
                <Briefcase className="w-5 h-5 text-scalora-accent" />
                <span>Explore Services</span>
              </a>
            </div>

            {/* Live Metrics */}
            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-scalora-blue/15">
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white">4,800+</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engineers & Operators</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-scalora-accent">120+</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consulting Projects</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white">4.9 / 5</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client & Student Rating</div>
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
      {/* 2. CHOOSE YOUR JOURNEY SECTION (Immediately below Hero) */}
      {/* ========================================================================= */}
      <section id="choose-journey" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent">
            <Layers className="w-4 h-4" />
            <span>Dual Excellence Paths</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Choose Your Journey
          </h2>
          <p className="text-base text-slate-300">
            Select the pathway tailored to your strategic objectives, whether scaling business operations or advancing your technical mastery.
          </p>
        </div>

        {/* Two Equal Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Services */}
          <div className="relative rounded-3xl glass-card p-8 sm:p-10 border border-scalora-blue/30 hover:border-scalora-blue flex flex-col justify-between space-y-8 group transition-all">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-scalora-navy to-scalora-blue flex items-center justify-center text-white shadow-glow-blue group-hover:scale-105 transition-transform">
                  <Briefcase className="w-7 h-7 text-scalora-accent" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-scalora-blue/15 text-scalora-accent border border-scalora-blue/30">
                  Business & Ops
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Services</h3>
                <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                  Business consulting, operations systems, automation, process design, and implementation.
                </p>
              </div>

              {/* Feature Highlights */}
              <ul className="space-y-2.5 pt-2 border-t border-scalora-blue/15 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-scalora-accent flex-shrink-0" />
                  <span>Operations systems & centralized ERP/CRM architectures</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-scalora-accent flex-shrink-0" />
                  <span>Workflow automation & custom AI agent implementations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-scalora-accent flex-shrink-0" />
                  <span>Process design, standard operating procedures (SOPs) & KPI modeling</span>
                </li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-scalora-blue/15">
              <a
                href="#services"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-sm shadow-glow-blue hover:opacity-95 text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#contact"
                className="px-6 py-3.5 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-sm border border-scalora-blue/30 text-center transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-scalora-accent" />
                <span>Book Consultation</span>
              </a>
            </div>
          </div>

          {/* Card 2: Community & Academy */}
          <div className="relative rounded-3xl glass-card p-8 sm:p-10 border border-scalora-accent/30 hover:border-scalora-accent flex flex-col justify-between space-y-8 group transition-all">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-scalora-navy via-cyan-900 to-scalora-accent/40 flex items-center justify-center text-white shadow-glow-accent group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-7 h-7 text-cyan-300" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Learning & Network
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Community & Academy</h3>
                <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                  Courses, workshops, events, learning paths, and professional development programs.
                </p>
              </div>

              {/* Feature Highlights */}
              <ul className="space-y-2.5 pt-2 border-t border-scalora-blue/15 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                  <span>Production-grade engineering & leadership curriculum</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                  <span>Live workshops, AMAs, and interactive cohort events</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                  <span>Peer community of founders, operators, and tech leaders</span>
                </li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-scalora-blue/15">
              <Link
                to="/courses"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-sm shadow-glow-blue hover:opacity-95 text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#community"
                className="px-6 py-3.5 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-sm border border-scalora-blue/30 text-center transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-cyan-300" />
                <span>Join Community</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SERVICES SECTION */}
      {/* ========================================================================= */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-blue">
            <Briefcase className="w-4 h-4" />
            <span>Consulting & Advisory</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Operational Systems & Consulting
          </h2>
          <p className="text-base text-slate-300">
            We partner with ambitious enterprises and fast-growing startups to engineer bulletproof operational architectures,
            automated workflows, and strategic business systems.
          </p>
        </div>

        {/* 6 Services Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Service 1 */}
          <div className="glass-card p-8 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Business Consulting & Strategy</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Organizational design, bottleneck diagnostics, growth modeling, and executive advisory to unlock sustainable unit economics.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-scalora-accent font-semibold flex items-center gap-1">
              <span>Strategic Advisory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Service 2 */}
          <div className="glass-card p-8 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Operations Systems & ERP</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Centralized ERP, CRM, and inventory management architectures that eliminate data silos and harmonize multi-department execution.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-cyan-400 font-semibold flex items-center gap-1">
              <span>Systems Architecture</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Service 3 */}
          <div className="glass-card p-8 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Workflow Automation & AI</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Autonomous AI agents, robotic process automation, and zero-touch pipeline handoffs connecting your entire software stack.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span>Intelligent Automation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Service 4 */}
          <div className="glass-card p-8 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Process Design & SOPs</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Lean process mapping, repeatable standard operating procedures, and governance playbooks that enable friction-free delegation.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Process Engineering</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Service 5 */}
          <div className="glass-card p-8 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Cloud & DevOps Infrastructure</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Kubernetes orchestration, automated CI/CD deployment pipelines, and high-availability database replication on AWS/GCP.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-purple-400 font-semibold flex items-center gap-1">
              <span>Cloud Infrastructure</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Service 6 */}
          <div className="glass-card p-8 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">BI Dashboards & KPI Tracking</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Real-time executive performance dashboards, margin analytics, and predictive alerting to steer executive decisions with precision.
              </p>
            </div>
            <div className="pt-4 border-t border-scalora-blue/15 text-xs text-rose-400 font-semibold flex items-center gap-1">
              <span>Executive Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Consulting Interactive Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#082B5B] via-[#0D3E82] to-[#04152D] border border-scalora-blue/40 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 text-center lg:text-left max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Ready to Streamline Your Business Operations?
            </h3>
            <p className="text-sm text-slate-200">
              Schedule a 30-minute discovery consultation with our systems architects. We analyze your bottlenecks and deliver an actionable execution roadmap.
            </p>
          </div>
          <a
            href="#contact"
            className="px-8 py-4 rounded-xl bg-white text-scalora-navy hover:bg-slate-100 font-black text-sm shadow-xl flex-shrink-0 transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-scalora-blue" />
            <span>Book Discovery Consultation</span>
          </a>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DEDICATED COMMUNITY SECTION (After Services) */}
      {/* ========================================================================= */}
      <section id="community" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Community Hero Header */}
        <div className="relative rounded-3xl bg-gradient-to-tr from-[#020C1B] via-[#082B5B] to-[#0D3E82] border border-cyan-500/30 p-8 sm:p-14 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-extrabold tracking-widest uppercase">
              <Users className="w-3.5 h-3.5" />
              <span>Scalora Global Network</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              LEARN. BUILD. GROW.
            </h2>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
              Join the Scalora Community and access practical courses, workshops, events, and business resources designed for founders, operators, and professionals.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#community-courses"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-base shadow-glow-blue hover:opacity-95 transition-all flex items-center justify-center gap-2"
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
          </div>
        </div>

        {/* 4 Community Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Practical Workshops</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Live hands-on build sessions covering real-world cloud architectures, automations, and operational playbooks.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Events & AMAs</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Direct access to seasoned technology executives, startup founders, and operational leaders in exclusive sessions.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Resource Vault</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Downloadable standard operating procedures, architectural schematics, prompt libraries, and starter code repositories.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Peer Network</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Collaborate with high-caliber operators and engineers across the globe. Share solutions, hire talent, and scale together.
            </p>
          </div>
        </div>

        {/* Featured Courses Area */}
        <div id="community-courses" className="space-y-8 pt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-scalora-blue/15">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>Featured Curriculum</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Featured Courses & Learning Paths</h3>
              <p className="text-slate-400 text-sm mt-1">
                Practical, cohort-tested curriculum with interactive assessments and verifiable certificates.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-sm font-bold text-scalora-blue hover:text-scalora-accent transition-colors"
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnrollClick={handleEnrollClick}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHY SCALORA / PLATFORM CAPABILITIES */}
      {/* ========================================================================= */}
      <section id="why-scalora" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-blue">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise Learning Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Why Teams Choose Scalora
          </h2>
          <p className="text-sm text-slate-400">
            A comprehensive, high-throughput learning environment tailored for technical and operational mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Enterprise Streaming</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seamless YouTube embed streaming combined with PDF guides, downloadable starter repos, and rich Markdown lessons.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Quizzes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time scoring, automated pass/fail evaluations, and detailed answer explanations for immediate learning feedback.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Dynamic Progress Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pick up right where you left off with instant "Resume Learning" buttons, completed lesson checks, and progress percentages.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Verifiable Certificates</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Earn digitally verifiable Scalora certificates complete with unique credential hashes upon 100% course mastery.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TESTIMONIALS SECTION */}
      {/* ========================================================================= */}
      <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent">
            <Users className="w-4 h-4" />
            <span>Alumni & Client Voices</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Trusted by Industry Leaders
          </h2>
          <p className="text-sm text-slate-400">
            Hear from founders, operators, and architects who transformed their organizations through Scalora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "Scalora re-engineered our operational workflows and automated customer onboarding, cutting our turnaround time by 65% in the first quarter."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-scalora-blue/15">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Sarah Jenkins"
                className="w-10 h-10 rounded-full object-cover border border-scalora-blue/30"
              />
              <div>
                <div className="text-sm font-bold text-white">Sarah Jenkins</div>
                <div className="text-xs text-scalora-blue">Chief Operating Officer</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "The Generative AI and Cloud track is the gold standard for engineering education. The curriculum is production-ready, hands-on, and razor sharp."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-scalora-blue/15">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
                alt="Karim Mansour"
                className="w-10 h-10 rounded-full object-cover border border-scalora-blue/30"
              />
              <div>
                <div className="text-sm font-bold text-white">Karim Mansour</div>
                <div className="text-xs text-scalora-blue">Lead Systems Architect</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "The community network and live workshops gave our leadership squad unmatched access to high-caliber peers and actionable templates."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-scalora-blue/15">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80"
                alt="David Chen"
                className="w-10 h-10 rounded-full object-cover border border-scalora-blue/30"
              />
              <div>
                <div className="text-sm font-bold text-white">David Chen</div>
                <div className="text-xs text-scalora-blue">Founder & CEO</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ABOUT SECTION */}
      {/* ========================================================================= */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-blue">
              <Globe className="w-4 h-4" />
              <span>About Scalora</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Bridging Operational Rigor with Technical Mastery
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Founded on the belief that enduring companies require both seamless internal systems and continuously skilled human capital,
              Scalora delivers full-spectrum operational transformation.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl glass-panel space-y-1">
                <div className="text-xl font-bold text-white">Consulting Arm</div>
                <p className="text-xs text-slate-400">Design, automation & implementation of enterprise operations.</p>
              </div>
              <div className="p-4 rounded-2xl glass-panel space-y-1">
                <div className="text-xl font-bold text-cyan-300">Academy Arm</div>
                <p className="text-xs text-slate-400">Accredited curriculum, workshops & global peer network.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl glass-card p-8 border border-scalora-blue/30 space-y-6 relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-scalora-blue/20 blur-2xl rounded-full" />
            <h3 className="text-xl font-bold text-white">Our Core Commitments</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-scalora-blue/20 text-scalora-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Zero Theory, 100% Practical Implementation</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Every system we architect and course we teach is verified in production.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Measurable Business ROI</h4>
                  <p className="text-xs text-slate-400 mt-0.5">We design clear KPIs, automated telemetry, and accountability loops.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Continuous Ecosystem Support</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Lifelong access to community masterclasses, alumni networks, and resource updates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. CONTACT & CONSULTATION SECTION */}
      {/* ========================================================================= */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent">
            <Mail className="w-4 h-4" />
            <span>Connect with Scalora</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Start Your Transformation
          </h2>
          <p className="text-sm text-slate-400">
            Book an operational consultation or inquire about our academy programs and corporate cohort packages.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-3xl glass-card p-8 sm:p-12 border border-scalora-blue/30 shadow-2xl">
          {contactSubmitted ? (
            <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Consultation Request Received!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Thank you, <span className="text-white font-semibold">{contactForm.name}</span>. Our lead operational strategist will reach out to <span className="text-scalora-accent">{contactForm.email}</span> within 24 hours.
              </p>
              <button
                onClick={() => {
                  setContactSubmitted(false);
                  setContactForm({ name: '', email: '', company: '', interest: 'Services & Operations Consulting', message: '' });
                }}
                className="mt-4 px-6 py-2.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white border border-scalora-blue/20"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="s.jenkins@company.com"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    placeholder="e.g. Apex Technologies"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Primary Area of Interest
                  </label>
                  <select
                    value={contactForm.interest}
                    onChange={(e) => setContactForm({ ...contactForm, interest: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-scalora-navy"
                  >
                    <option value="Services & Operations Consulting">Services (Business Consulting & Ops Systems)</option>
                    <option value="Community & Academy">Community & Academy (Courses & Cohorts)</option>
                    <option value="Both Services & Academy">Both Services & Academy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Project Details / Inquiries *
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your operational challenges, consulting goals, or training requirements..."
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-sm shadow-glow-blue hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Consultation Request</span>
              </button>
            </form>
          )}
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
