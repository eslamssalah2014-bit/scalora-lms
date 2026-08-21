import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Award, Globe, Mail, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#020C1B] border-t border-scalora-blue/20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-scalora-blue/15">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#04152D] border border-scalora-blue/30 p-1.5 shadow-glow-blue flex items-center justify-center">
                <img src="/scalora-logo.png" alt="Scalora Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-black text-white">Scalora</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Operations & Business Systems Consulting. We help businesses build scalable systems, streamline operations, and implement smart automations.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-scalora-blue" />
                <span>Enterprise Verified</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Award className="w-4 h-4 text-scalora-accent" />
                <span>Accredited Credentials</span>
              </div>
            </div>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/services" className="hover:text-scalora-blue transition-colors">
                  Operations Consulting
                </Link>
              </li>
              <li>
                <Link to="/services#what-we-do" className="hover:text-scalora-blue transition-colors">
                  Systems Building
                </Link>
              </li>
              <li>
                <Link to="/services#what-we-do" className="hover:text-scalora-blue transition-colors">
                  Workflow Automation
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-scalora-blue transition-colors">
                  Book Consultation
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-4">Community & Academy</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/community" className="hover:text-cyan-300 transition-colors">
                  Community Hub
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-cyan-300 transition-colors">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link to="/community#community-courses" className="hover:text-cyan-300 transition-colors">
                  Workshops & AMAs
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-cyan-300 transition-colors">
                  Join Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Tracks */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Mastery Tracks</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/courses?category=Cloud Architecture" className="hover:text-scalora-blue transition-colors">
                  Cloud Architecture
                </Link>
              </li>
              <li>
                <Link to="/courses?category=AI & Data Science" className="hover:text-scalora-blue transition-colors">
                  AI & Data Science
                </Link>
              </li>
              <li>
                <Link to="/courses?category=Software Engineering" className="hover:text-scalora-blue transition-colors">
                  Software Engineering
                </Link>
              </li>
              <li>
                <Link to="/courses?category=DevOps & Cloud" className="hover:text-scalora-blue transition-colors">
                  DevOps Automation
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Stay Ahead</h4>
            <p className="text-xs text-slate-400 mb-3">
              Subscribe to Scalora Engineering Briefs and course release notifications.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="developer@company.com"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
              />
              <button className="px-3 py-2 rounded-lg bg-scalora-blue hover:bg-scalora-hover text-white text-xs font-semibold">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Scalora LMS. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Security Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
