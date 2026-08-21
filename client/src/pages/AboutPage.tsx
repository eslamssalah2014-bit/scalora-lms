import React from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Award,
  Users,
  Check,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Compass,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-scalora-navy/80 border border-scalora-blue/40 text-scalora-accent text-xs font-bold uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5" />
          <span>The Scalora Vision</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          Bridging Operational Systems &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-scalora-blue via-cyan-400 to-scalora-accent">
            Technical Mastery
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-300">
          Scalora was engineered to resolve the two greatest obstacles to business scale: chaotic operational infrastructure and the technical skill gap.
        </p>
      </div>

      {/* Two Pillars Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 sm:p-10 rounded-3xl space-y-6 border border-scalora-blue/30">
          <div className="w-14 h-14 rounded-2xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center shadow-glow-blue">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">1. Scalora Services</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Our consulting and systems architecture arm. We embed with leadership teams to design custom ERPs, build automated AI workflows, map lean processes, and deploy scalable operational playbooks.
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-bold text-scalora-accent hover:underline pt-2"
          >
            <span>Learn about Services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="glass-card p-8 sm:p-10 rounded-3xl space-y-6 border border-cyan-500/30">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-glow-accent">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">2. Scalora Community & Academy</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Our global learning and professional development ecosystem. We train thousands of engineers and operators in cloud architectures, AI engineering, and systems optimization with production-grade curriculum.
            </p>
          </div>
          <Link
            to="/community"
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:underline pt-2"
          >
            <span>Explore Community & Academy</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Core Principles */}
      <div className="rounded-3xl glass-card p-8 sm:p-14 border border-scalora-blue/20 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-white">Our Core Commitments</h2>
          <p className="text-sm text-slate-400">What guides every consulting sprint and course we produce.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-panel space-y-3">
            <div className="w-10 h-10 rounded-xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Zero Theory, 100% Execution</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Everything we teach and deploy is battle-tested in live enterprise environments. No vanity decks.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Measurable Velocity</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              We focus relentlessly on quantitative outcomes: cycle time acceleration, error reduction, and margin expansion.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Enduring Peer Ecosystem</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Long-term alumni network access, continuous template updates, and collaborative growth across industries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
