import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Check, Calendar, Clock, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    interest: 'Services (Consulting & Operations)',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-scalora-navy/80 border border-scalora-blue/40 text-scalora-accent text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Executive Advisory & Inquiries</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          Let’s Build Something{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-scalora-blue via-cyan-400 to-scalora-accent">
            Extraordinary
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-300">
          Whether you need turnkey operations consulting or corporate academy training programs, our team is ready to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Info Card */}
        <div className="glass-card p-8 rounded-3xl space-y-8 border border-scalora-blue/30 h-fit">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Direct Channels</h3>
            <p className="text-xs text-slate-400">Our senior operational team is available worldwide.</p>
          </div>

          <div className="space-y-6 text-sm text-slate-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Email Us</div>
                <a href="mailto:advisory@scalora.com" className="text-scalora-accent hover:underline">
                  advisory@scalora.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Response Time</div>
                <div className="text-slate-300">Within 24 business hours</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Confidentiality</div>
                <div className="text-slate-300">100% strict mutual NDA available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="lg:col-span-2 rounded-3xl glass-card p-8 sm:p-12 border border-scalora-blue/30 shadow-2xl">
          {submitted ? (
            <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Consultation Request Confirmed!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Thank you, <span className="text-white font-semibold">{form.name}</span>. An executive strategist will contact you at <span className="text-scalora-accent">{form.email}</span> shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', email: '', phone: '', company: '', interest: 'Services (Consulting & Operations)', message: '' });
                }}
                className="mt-4 px-6 py-2.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white"
              >
                Send Another Message
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
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. David Chen"
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
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="david@company.com"
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
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Apex Global"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Primary Area of Interest
                  </label>
                  <select
                    value={form.interest}
                    onChange={(e) => setForm({ ...form, interest: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-scalora-navy"
                  >
                    <option value="Services (Consulting & Operations)">Services (Consulting & Operations)</option>
                    <option value="Community & Academy">Community & Academy (Courses & Cohorts)</option>
                    <option value="Both Services & Academy">Both Services & Academy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Project Scope or Inquiries *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your operational goals, bottlenecks, or learning requirements..."
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
      </div>
    </div>
  );
};
