import React from 'react';
import { Link } from 'react-router-dom';
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
  Check,
  Building2,
  Globe,
  BookOpen,
} from 'lucide-react';
import { PwaHeroCard } from '../components/pwa/PwaHeroCard';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

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
                Enterprise Operations Consulting & Technical Academy
              </span>
              <Sparkles className="w-3.5 h-3.5 text-scalora-accent" />
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
              Elevate Enterprise Excellence with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scalora-blue via-cyan-400 to-scalora-accent">
                Scalora
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We empower modern organizations through two unified pillars: high-impact <strong className="text-white font-semibold">Operations Consulting</strong> that
              structures business systems, and a premier <strong className="text-white font-semibold">Community & Academy</strong> for engineers and operators.
            </p>

            {/* Gateway Quick CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#choose-journey"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-base shadow-glow-blue hover:opacity-95 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <span>Choose Your Journey</span>
                <ArrowRight className="w-5 h-5" />
              </a>
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-base border border-scalora-blue/30 transition-all flex items-center justify-center gap-2"
                >
                  <Terminal className="w-5 h-5 text-scalora-accent" />
                  <span>Open Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/services"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-base border border-scalora-blue/30 transition-all flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-5 h-5 text-scalora-accent" />
                  <span>Explore Consulting</span>
                </Link>
              )}
            </div>

            {/* Permanent PWA Installation CTA Card */}
            <PwaHeroCard />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CHOOSE YOUR JOURNEY (TWO LARGE EQUAL CARDS) */}
      {/* ========================================================================= */}
      <section id="choose-journey" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent">
            <Layers className="w-4 h-4" />
            <span>Dual Business Experience</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Choose Your Journey
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Whether you're building a business or building your skills, Scalora has a path for you.
          </p>
        </div>

        {/* TWO LARGE EQUAL CARDS SIDE-BY-SIDE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CARD 1: Services */}
          <div className="relative rounded-3xl glass-card p-8 sm:p-12 border border-scalora-blue/30 hover:border-scalora-blue flex flex-col justify-between space-y-8 group transition-all shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-scalora-navy to-scalora-blue flex items-center justify-center text-white shadow-glow-blue group-hover:scale-105 transition-transform">
                  <Briefcase className="w-8 h-8 text-scalora-accent" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-scalora-blue/15 text-scalora-accent border border-scalora-blue/30">
                  Consulting & Ops
                </span>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-black text-white">Services</h3>
                <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                  Business consulting, operations systems, workflow automation, SOPs, AI implementation, and operational excellence.
                </p>
              </div>

              <ul className="space-y-3 pt-4 border-t border-scalora-blue/15 text-sm text-slate-300">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-scalora-blue/15">
              <Link
                to="/services"
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-sm shadow-glow-blue hover:opacity-95 text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="px-6 py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-sm border border-scalora-blue/30 text-center transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-scalora-accent" />
                <span>Book Consultation</span>
              </Link>
            </div>
          </div>

          {/* CARD 2: Community & Academy */}
          <div className="relative rounded-3xl glass-card p-8 sm:p-12 border border-cyan-500/30 hover:border-cyan-400 flex flex-col justify-between space-y-8 group transition-all shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-scalora-navy via-cyan-900 to-scalora-accent/40 flex items-center justify-center text-white shadow-glow-accent group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-8 h-8 text-cyan-300" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Learning & Network
                </span>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-black text-white">Community & Academy</h3>
                <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                  Courses, workshops, events, certifications, business resources, and professional development programs.
                </p>
              </div>

              <ul className="space-y-3 pt-4 border-t border-scalora-blue/15 text-sm text-slate-300">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-scalora-blue/15">
              <Link
                to="/community"
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-sm shadow-glow-blue hover:opacity-95 text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Community</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="px-6 py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-sm border border-cyan-400/30 text-center transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-cyan-300" />
                <span>Browse Courses</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. GATEWAY CTA BANNER */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#082B5B] via-[#0D3E82] to-[#04152D] border border-scalora-blue/40 p-8 sm:p-14 overflow-hidden text-center shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-scalora-accent/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Transform Your Organization or Skills?
            </h2>
            <p className="text-sm sm:text-base text-slate-200">
              Get started with Scalora today. Book a consulting session for your enterprise or join our academy and community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/services"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-scalora-navy hover:bg-slate-100 font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/community"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-scalora-navy/60 hover:bg-scalora-navy text-white font-bold text-sm border border-white/20 transition-colors"
              >
                Explore Community & Academy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
