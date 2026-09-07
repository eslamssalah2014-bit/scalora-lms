import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Download, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { usePwa } from '../hooks/usePwa';

export const Footer: React.FC = () => {
  const { isInstalled, installApp } = usePwa();

  return (
    <footer className="bg-[#0F172A] border-t border-slate-800 text-slate-400 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 p-1.5 shadow-sm flex items-center justify-center">
                <img src="/scalora-icon-transparent.png" alt="Scalora Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Scalora</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Enterprise Operations Consulting & Premier Technical Academy. We empower modern companies with scalable architectures, workflow automations, and practical engineering masterclasses.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Enterprise Verified</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Accredited Credentials</span>
              </div>
              {isInstalled ? (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Scalora App Installed ✓</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={installApp}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Install App</span>
                </button>
              )}
            </div>
          </div>

          {/* Services Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Services</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/services" className="hover:text-blue-400 transition-colors">
                  Operations Consulting
                </Link>
              </li>
              <li>
                <Link to="/services#what-we-do" className="hover:text-blue-400 transition-colors">
                  Systems Building & ERP
                </Link>
              </li>
              <li>
                <Link to="/services#what-we-do" className="hover:text-blue-400 transition-colors">
                  Workflow Automation
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400 transition-colors">
                  Book Advisory Session
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Community & Academy</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses" className="hover:text-blue-400 transition-colors">
                  Course Catalog
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-blue-400 transition-colors">
                  Community Hub
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-blue-400 transition-colors">
                  Workshops & AMAs
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-400 transition-colors">
                  Join The Academy
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links / Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Executive Briefs</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get monthly updates on enterprise systems, automation blueprints, and new course tracks.
            </p>
            <div className="space-y-2 pt-1">
              <Link
                to="/register"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Scalora LMS & Systems Consulting. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/about" className="hover:text-slate-300 transition-colors">
              About
            </Link>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">
              Contact
            </Link>
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
