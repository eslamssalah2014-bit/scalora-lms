import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Workflow,
  FileText,
  Cpu,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Send,
  Check,
  Calendar,
  Layers,
  Zap,
  TrendingUp,
  ShieldCheck,
  Star,
  Users,
  Compass,
  Laptop,
  ShoppingBag,
  GraduationCap,
  HeartPulse,
  UtensilsCrossed,
  Wrench,
  Database,
  Share2,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Marketing Agencies',
    teamSize: '1-10 Employees',
    projectScope: 'Operations & Workflow Automation',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setSubmitted(true);
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
                ENTERPRISE OPERATIONS & BUSINESS CONSULTING
              </span>
              <Sparkles className="w-3.5 h-3.5 text-scalora-accent" />
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
              SYSTEM. STRATEGY.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scalora-blue via-cyan-400 to-scalora-accent">
                SCALE.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We design, automate, and implement robust operational systems for ambitious companies. Eliminate
              operational bottlenecks, streamline team workflows, and unlock repeatable, high-margin growth.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#consultation-form"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-base shadow-glow-blue hover:opacity-95 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                <span>Book Discovery Consultation</span>
              </a>
              <a
                href="#what-we-do"
                className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-base border border-scalora-blue/30 transition-all flex items-center justify-center gap-2"
              >
                <Briefcase className="w-5 h-5 text-scalora-accent" />
                <span>Explore Solutions</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ABOUT SCALORA (From Operational Chaos to Structured Growth) */}
      {/* ========================================================================= */}
      <section id="about-services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-blue">
              <Compass className="w-4 h-4" />
              <span>Operational Philosophy</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              From Operational Chaos to Structured Growth
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Fast-growing companies rarely fail from a lack of market demand; they stall from internal operational friction.
              Fragmented tools, manual copy-pasting, undocumented procedures, and communication silos drain leadership bandwidth.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              At Scalora, we bridge strategic vision with hands-on systems architecture. We don't hand you theoretical decks—we
              construct custom ERPs, build automated pipelines, and author actionable SOPs that enable your team to execute with
              flawless velocity.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl glass-panel space-y-1 border border-scalora-blue/20">
                <div className="text-xl font-bold text-white">Strategy First</div>
                <p className="text-xs text-slate-400">Diagnosis of root bottlenecks & growth modeling.</p>
              </div>
              <div className="p-4 rounded-2xl glass-panel space-y-1 border border-scalora-blue/20">
                <div className="text-xl font-bold text-scalora-accent">Execution Always</div>
                <p className="text-xs text-slate-400">Turnkey implementation in your production tools.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl glass-card p-8 sm:p-10 border border-scalora-blue/30 space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-scalora-blue/20 blur-2xl rounded-full pointer-events-none" />
            <h3 className="text-2xl font-bold text-white">The Scalora Advantage</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-scalora-blue/20 text-scalora-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Zero Operational Fluff</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Direct implementation in ClickUp, Notion, Airtable, Make, and custom APIs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Autonomous AI & Automation</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Self-healing data pipelines and custom AI agents handling routine overhead.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Continuous Post-Launch Governance</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Dedicated telemetry, KPI tracking, and weekly optimization sprints.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. WHAT WE DO (4 Pillars) */}
      {/* ========================================================================= */}
      <section id="what-we-do" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-blue">
            <Briefcase className="w-4 h-4" />
            <span>Consulting Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            What We Do
          </h2>
          <p className="text-base text-slate-300">
            Four specialized operational practices designed to diagnose friction, architect modern infrastructure, and empower high-performing teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pillar 1 */}
          <div className="glass-card p-8 sm:p-10 rounded-3xl space-y-6 border border-scalora-blue/20 hover:border-scalora-blue transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center group-hover:scale-105 transition-transform shadow-glow-blue">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">1. Operations Consulting</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Comprehensive operational health checks, bottleneck diagnostics, organizational restructuring, Lean workflow mapping, and growth capacity modeling.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2 border-t border-scalora-blue/15">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-scalora-accent" />
                <span>End-to-end operational bottleneck audits</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-scalora-accent" />
                <span>Organizational hierarchy & cross-functional governance</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-scalora-accent" />
                <span>Executive advisory & margin expansion modeling</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card p-8 sm:p-10 rounded-3xl space-y-6 border border-cyan-500/20 hover:border-cyan-400 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-glow-accent">
              <Layers className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">2. Systems Building</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Turnkey architectures in ClickUp, Notion, and Airtable. We build centralized single sources of truth, customized CRM/ERP databases, and dynamic project boards.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2 border-t border-scalora-blue/15">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                <span>Custom relational business databases & schema design</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                <span>Unified ClickUp & Notion enterprise workspaces</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                <span>Executive telemetry & real-time KPI tracking dashboards</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card p-8 sm:p-10 rounded-3xl space-y-6 border border-emerald-500/20 hover:border-emerald-400 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Workflow className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">3. Automation Solutions</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect your disparate software stack using Make, Zapier, custom webhooks, and autonomous AI agents to eliminate manual data entry and human error.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2 border-t border-scalora-blue/15">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero-touch client onboarding & automated invoicing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Custom AI agents for ticket triage, summarization & search</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Self-healing webhook pipelines with error handling</span>
              </li>
            </ul>
          </div>

          {/* Pillar 4 */}
          <div className="glass-card p-8 sm:p-10 rounded-3xl space-y-6 border border-purple-500/20 hover:border-purple-400 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">4. Training Programs</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Transformational team onboarding, standard operating procedure (SOP) authoring, leadership enablement workshops, and change management coaching.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2 border-t border-scalora-blue/15">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Interactive team workshops on tool mastery & best practices</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Searchable video SOP libraries & interactive training modules</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Long-term operational governance & adoption monitoring</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHY SCALORA? */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent">
            <ShieldCheck className="w-4 h-4" />
            <span>Why Scalora</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Built for Real-World Execution
          </h2>
          <p className="text-sm text-slate-400">
            Why visionary founders and operations executives select Scalora over traditional consulting firms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Turnkey Implementation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We don't leave you with slides. We build, configure, test, and deploy every system directly in your software environment.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Rapid Sprint Delivery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our structured sprint methodology ships working production workflows within 2 to 4 weeks, delivering immediate business value.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Measurable ROI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We define clear operational benchmarks, quantifying saved payroll hours, reduced error rates, and increased client throughput.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">High Team Adoption</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our intuitive UX design, video SOPs, and live coaching ensure your employees actually love using the systems we architect.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HOW WE WORK (4 Steps) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-blue">
            <Workflow className="w-4 h-4" />
            <span>Methodology</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            How We Work
          </h2>
          <p className="text-base text-slate-300">
            A proven 4-stage engineering sprint that moves your operations from diagnostic to automated scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative border border-scalora-blue/20">
            <div className="w-12 h-12 rounded-2xl bg-scalora-blue/20 text-scalora-blue font-black text-xl flex items-center justify-center">
              01
            </div>
            <h3 className="text-xl font-bold text-white">Discover</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We conduct deep-dive interviews with department leads, audit your current software stack, and map all operational friction points.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative border border-cyan-500/20">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 font-black text-xl flex items-center justify-center">
              02
            </div>
            <h3 className="text-xl font-bold text-white">Structure</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We blueprint the complete operational architecture, database schema, SOP documentation, and user permission models.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative border border-emerald-500/20">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-xl flex items-center justify-center">
              03
            </div>
            <h3 className="text-xl font-bold text-white">Automate</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We build custom API integrations, automated Make/Zapier triggers, AI agents, and centralized dashboards inside your workspace.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative border border-purple-500/20">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 font-black text-xl flex items-center justify-center">
              04
            </div>
            <h3 className="text-xl font-bold text-white">Scale</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We lead live team training sessions, launch video SOP hubs, and provide ongoing telemetry monitoring to ensure flawless execution.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. INDUSTRIES WE SERVE (7 Industries) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent">
            <Building2 className="w-4 h-4" />
            <span>Vertical Expertise</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Industries We Serve
          </h2>
          <p className="text-base text-slate-300">
            Tailored operations systems and specialized workflow playbooks built for your industry's specific challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Industry 1 */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Marketing Agencies</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated client onboarding, creative asset approvals, sprint capacity tracking, and multi-channel reporting.
            </p>
          </div>

          {/* Industry 2 */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Startups</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rapid operations frameworks, pitch data rooms, automated investor reporting, and zero-overhead task delegation.
            </p>
          </div>

          {/* Industry 3 */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">E-Commerce</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inventory sync across channels, returns management pipelines, 3PL fulfillment webhooks, and supplier database tracking.
            </p>
          </div>

          {/* Industry 4 */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Educational Businesses</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Student admissions workflows, automated certificate generation, cohort community portals, and instructor payroll.
            </p>
          </div>

          {/* Industry 5 */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Healthcare</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Patient scheduling, staff shift rotations, compliance SOP vaults, multi-clinic operational dashboards, and intake pipelines.
            </p>
          </div>

          {/* Industry 6 */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Restaurants & Cafes</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Branch checklist automation, recipe & inventory cost databases, vendor ordering forms, and staff onboarding playbooks.
            </p>
          </div>

          {/* Industry 7 */}
          <div className="glass-card p-6 rounded-2xl space-y-3 md:col-span-2 lg:col-span-3 xl:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Service Businesses</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lead qualification pipelines, quote/proposal automation, digital contract signature handoffs, and billing reconciliations.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TOOLS WE WORK WITH (7 Tools) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-blue">
            <Cpu className="w-4 h-4" />
            <span>Tech Stack</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Tools We Work With
          </h2>
          <p className="text-base text-slate-300">
            We build on top of industry-standard tools that your team already knows and loves.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="glass-card p-5 rounded-2xl text-center space-y-2 border border-scalora-blue/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black">
              CU
            </div>
            <div className="text-sm font-bold text-white">ClickUp</div>
            <div className="text-[10px] text-slate-400">Task Architecture</div>
          </div>

          <div className="glass-card p-5 rounded-2xl text-center space-y-2 border border-scalora-blue/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-700/50 text-white flex items-center justify-center font-black">
              N
            </div>
            <div className="text-sm font-bold text-white">Notion</div>
            <div className="text-[10px] text-slate-400">SOP Knowledge Hubs</div>
          </div>

          <div className="glass-card p-5 rounded-2xl text-center space-y-2 border border-scalora-blue/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black">
              AT
            </div>
            <div className="text-sm font-bold text-white">Airtable</div>
            <div className="text-[10px] text-slate-400">Relational Databases</div>
          </div>

          <div className="glass-card p-5 rounded-2xl text-center space-y-2 border border-scalora-blue/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-orange-500/20 text-orange-300 flex items-center justify-center font-black">
              Z
            </div>
            <div className="text-sm font-bold text-white">Zapier</div>
            <div className="text-[10px] text-slate-400">Instant Triggers</div>
          </div>

          <div className="glass-card p-5 rounded-2xl text-center space-y-2 border border-scalora-blue/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center font-black">
              M
            </div>
            <div className="text-sm font-bold text-white">Make</div>
            <div className="text-[10px] text-slate-400">Complex Scenarios</div>
          </div>

          <div className="glass-card p-5 rounded-2xl text-center space-y-2 border border-scalora-blue/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black">
              S
            </div>
            <div className="text-sm font-bold text-white">Slack</div>
            <div className="text-[10px] text-slate-400">Bot Notifications</div>
          </div>

          <div className="glass-card p-5 rounded-2xl text-center space-y-2 border border-scalora-blue/20 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-black">
              GW
            </div>
            <div className="text-sm font-bold text-white">Google</div>
            <div className="text-[10px] text-slate-400">Workspace & Sheets</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. CONTACT / CONSULTATION CTA FORM */}
      {/* ========================================================================= */}
      <section id="consultation-form" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent">
            <Calendar className="w-4 h-4" />
            <span>Consultation Booking</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Schedule Your Systems Audit
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Speak directly with our senior operations architects. We will analyze your bottlenecks and provide an actionable execution blueprint.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-3xl glass-card p-8 sm:p-12 border border-scalora-blue/30 shadow-2xl">
          {submitted ? (
            <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Consultation Request Confirmed!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Thank you, <span className="text-white font-semibold">{contactForm.name}</span>. Our lead operational strategist will review your requirements and contact you at <span className="text-scalora-accent">{contactForm.email}</span> within 24 hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setContactForm({
                    name: '',
                    email: '',
                    phone: '',
                    company: '',
                    industry: 'Marketing Agencies',
                    teamSize: '1-10 Employees',
                    projectScope: 'Operations & Workflow Automation',
                    message: '',
                  });
                }}
                className="mt-4 px-6 py-2.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white border border-scalora-blue/20"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    placeholder="e.g. Apex Digital"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Industry
                  </label>
                  <select
                    value={contactForm.industry}
                    onChange={(e) => setContactForm({ ...contactForm, industry: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-scalora-navy"
                  >
                    <option value="Marketing Agencies">Marketing Agencies</option>
                    <option value="Startups">Startups & Tech</option>
                    <option value="E-Commerce">E-Commerce & Retail</option>
                    <option value="Educational Businesses">Educational Businesses</option>
                    <option value="Healthcare">Healthcare & Clinics</option>
                    <option value="Restaurants & Cafes">Restaurants & Hospitality</option>
                    <option value="Service Businesses">Professional Service Businesses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Team Size
                  </label>
                  <select
                    value={contactForm.teamSize}
                    onChange={(e) => setContactForm({ ...contactForm, teamSize: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-scalora-navy"
                  >
                    <option value="1-10 Employees">1-10 Employees</option>
                    <option value="11-50 Employees">11-50 Employees</option>
                    <option value="51-200 Employees">51-200 Employees</option>
                    <option value="200+ Employees">200+ Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Tell Us About Your Operational Goals & Bottlenecks *
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your current systems, tools used, and what you'd like to automate or streamline..."
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-base shadow-glow-blue hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>Submit Consultation Request</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
