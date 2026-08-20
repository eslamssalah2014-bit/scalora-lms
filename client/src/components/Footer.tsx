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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-scalora-navy to-scalora-blue p-0.5 shadow-glow-blue">
                <div className="w-full h-full bg-[#04152D] rounded-[10px] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-scalora-blue" />
                </div>
              </div>
              <span className="text-2xl font-black text-white">Scalora</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Scalora is the enterprise learning platform engineered for mission-critical software engineering,
              cloud architecture, and artificial intelligence mastery.
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

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/courses" className="hover:text-scalora-blue transition-colors">
                  Explore Courses
                </Link>
              </li>
              <li>
                <a href="/#why-scalora" className="hover:text-scalora-blue transition-colors">
                  Why Scalora
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-scalora-blue transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-scalora-blue transition-colors">
                  Instructor & Admin
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
