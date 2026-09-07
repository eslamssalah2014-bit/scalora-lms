import React from 'react';
import { Link } from 'react-router-dom';
import { useCms } from '../context/CmsContext';
import {
  Globe,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Users,
  ArrowRight,
  TrendingUp,
  Quote,
  Sparkles,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { about } = useCms();

  const heroHeadline = about?.heroTitle || 'Bridging Operational Systems & Technical Mastery';
  const heroSubheadline =
    about?.heroDescription ||
    'Scalora was engineered to resolve the two greatest obstacles to business scale: chaotic operational infrastructure and the technical skill gap.';
  const pillBadge = about?.heroBadge || 'The Scalora Vision';

  const missionText =
    about?.mission ||
    'To architect resilient, automated operations for growing enterprises while training the next generation of systems engineers.';

  const visionText =
    about?.vision ||
    'A global standard where every ambitious company operates on zero-fluff, automated engines powered by continuous real-world learning.';

  const founder = about?.founder;
  const teamMembers = about?.team || [];
  const milestones = about?.milestones || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-20 bg-white text-slate-900">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5" />
          <span>{pillBadge}</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight">
          {heroHeadline}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          {heroSubheadline}
        </p>
      </div>

      {/* Mission & Vision Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 sm:p-10 rounded-3xl space-y-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">1. Our Core Mission</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {missionText}
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 pt-2"
          >
            <span>Learn about Services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-3xl space-y-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">2. Scalora Vision</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {visionText}
            </p>
          </div>
          <Link
            to="/community"
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 pt-2"
          >
            <span>Explore Community & Academy</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Founder Story Section (if available) */}
      {founder && founder.name && (
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-8 sm:p-12 overflow-hidden relative shadow-xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {founder.photoUrl && (
              <div className="flex justify-center lg:justify-start">
                <img
                  src={founder.photoUrl}
                  alt={founder.name}
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl object-cover border-4 border-blue-400/30 shadow-2xl"
                />
              </div>
            )}
            <div className={`space-y-4 ${founder.photoUrl ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Founder's Note</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{founder.name}</h2>
              <p className="text-xs sm:text-sm font-semibold text-blue-400 uppercase tracking-wider">
                {founder.title || 'Founder & Principal Architect'}
              </p>
              {founder.quote && (
                <div className="relative pl-6 border-l-2 border-blue-500 italic text-slate-200 text-sm sm:text-base leading-relaxed">
                  <Quote className="w-4 h-4 text-blue-400 absolute -left-2 top-0" />
                  "{founder.quote}"
                </div>
              )}
              {founder.bio && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2">
                  {founder.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Section (if available) */}
      {teamMembers.length > 0 && (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Leadership & Mentors</h2>
            <p className="text-sm text-slate-500">The experienced practitioners powering Scalora.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 hover:shadow-md transition-shadow"
              >
                <img
                  src={
                    member.photoUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2563EB&color=fff`
                  }
                  alt={member.name}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-blue-100 shadow-sm"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{member.name}</h3>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">{member.role}</p>
                </div>
                {member.bio && <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{member.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Milestones (if available) */}
      {milestones.length > 0 && (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Our Journey & Milestones</h2>
            <p className="text-sm text-slate-500">Key milestones in the evolution of Scalora.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3 relative"
              >
                <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white">
                  {m.year}
                </span>
                <h3 className="font-bold text-slate-900 text-base pt-1">{m.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core Principles */}
      <div className="rounded-3xl bg-white p-8 sm:p-14 border border-slate-200 shadow-sm space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Our Core Commitments</h2>
          <p className="text-sm text-slate-500">What guides every consulting sprint and course we produce.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Zero Theory, 100% Execution</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Everything we teach and deploy is battle-tested in live enterprise environments. No vanity decks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Measurable Velocity</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We focus relentlessly on quantitative outcomes: cycle time acceleration, error reduction, and margin expansion.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Enduring Peer Ecosystem</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Long-term alumni network access, continuous template updates, and collaborative growth across industries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
