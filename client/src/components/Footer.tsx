import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import { usePwa } from '../hooks/usePwa';
import { useCms } from '../context/CmsContext';

export const Footer: React.FC = () => {
  const { isInstalled, installApp } = usePwa();
  const { navigation, theme } = useCms();

  const footerColumns = navigation?.footerColumns || [
    {
      id: 'services',
      title: 'Services',
      order: 1,
      links: [
        { id: 's1', label: 'Operations Consulting', url: '/services', order: 1, visible: true },
        { id: 's2', label: 'Systems Building & ERP', url: '/services#what-we-do', order: 2, visible: true },
        { id: 's3', label: 'Workflow Automation', url: '/services#what-we-do', order: 3, visible: true },
        { id: 's4', label: 'Book Advisory Session', url: '/contact', order: 4, visible: true },
      ],
    },
    {
      id: 'academy',
      title: 'Community & Academy',
      order: 2,
      links: [
        { id: 'a1', label: 'Course Catalog', url: '/courses', order: 1, visible: true },
        { id: 'a2', label: 'Community Hub', url: '/community', order: 2, visible: true },
        { id: 'a3', label: 'Workshops & AMAs', url: '/community', order: 3, visible: true },
        { id: 'a4', label: 'Join The Academy', url: '/register', order: 4, visible: true },
      ],
    },
  ];

  const brandName = 'Scalora';
  const logoUrl = theme?.logoUrl || '/scalora-icon-transparent.png';

  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-12 border-b border-slate-200">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 p-1.5 shadow-sm flex items-center justify-center">
                <img src={logoUrl} alt={`${brandName} Logo`} className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">{brandName}</span>
            </Link>
            <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
              Enterprise Operations Consulting & Premier Technical Academy. We empower modern companies with scalable architectures, workflow automations, and practical engineering masterclasses.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Enterprise Verified</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-medium">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Accredited Credentials</span>
              </div>
              {isInstalled ? (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Scalora App Installed ✓</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={installApp}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Install App</span>
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Footer Sections from CMS */}
          {footerColumns.map((section) => (
            <div key={section.id || section.title} className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">{section.title}</h4>
              <ul className="space-y-2.5 text-sm">
                {(section.links || []).filter((l) => l.visible !== false).map((lnk) => (
                  <li key={lnk.id || lnk.label}>
                    {lnk.url.startsWith('http') ? (
                      <a
                        href={lnk.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-blue-600 text-slate-600 transition-colors"
                      >
                        {lnk.label}
                      </a>
                    ) : (
                      <Link to={lnk.url} className="hover:text-blue-600 text-slate-600 transition-colors">
                        {lnk.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick Links / Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Executive Briefs</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get monthly updates on enterprise systems, automation blueprints, and new course tracks.
            </p>
            <div className="space-y-2 pt-1">
              <Link
                to="/register"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-500/25"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {brandName} LMS & Systems Consulting. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/about" className="hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link to="/contact" className="hover:text-blue-600 transition-colors">
              Contact
            </Link>
            <span className="hover:text-blue-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-blue-600 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
