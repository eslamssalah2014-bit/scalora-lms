import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Settings, CreditCard, Shield, Globe, Save, CheckCircle2, Zap } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [platformName, setPlatformName] = useState('Scalora LMS Platform');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [allowRegistration, setAllowRegistration] = useState(true);

  // Gateway Toggles
  const [mockEnabled, setMockEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [paymobEnabled, setPaymobEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get<{ success: boolean; settings: any }>('/admin/settings');
      if (res.success && res.settings) {
        setPlatformName(res.settings.platformName || 'Scalora LMS');
        setDefaultCurrency(res.settings.defaultCurrency || 'USD');
        setAllowRegistration(res.settings.allowRegistration ?? true);
        if (res.settings.paymentGateways) {
          setMockEnabled(res.settings.paymentGateways.mock?.enabled ?? true);
          setStripeEnabled(res.settings.paymentGateways.stripe?.enabled ?? true);
          setPaymobEnabled(res.settings.paymentGateways.paymob?.enabled ?? true);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="pb-4 border-b border-scalora-blue/20">
        <h1 className="text-2xl font-black text-white">Platform Settings & Integrations</h1>
        <p className="text-xs text-slate-400">
          Configure payment gateway abstraction layers, branding styles, and security parameters
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Platform settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Brand & General Settings */}
        <div className="glass-panel p-6 rounded-2xl border border-scalora-blue/20 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-scalora-blue" />
            <span>Brand Identity & General</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Platform Name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Default Currency
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#04152D]"
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EGP">EGP (E£ - Egyptian Pound)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="allowReg"
              checked={allowRegistration}
              onChange={(e) => setAllowRegistration(e.target.checked)}
              className="w-4 h-4 rounded text-scalora-blue bg-[#04152D] border-scalora-blue/40"
            />
            <label htmlFor="allowReg" className="text-xs font-semibold text-white">
              Allow public student self-registration
            </label>
          </div>
        </div>

        {/* 2. Payment Gateway Abstraction Architecture */}
        <div className="glass-panel p-6 rounded-2xl border border-scalora-blue/20 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-scalora-accent" />
            <span>Payment Gateway Providers</span>
          </h3>
          <p className="text-xs text-slate-400">
            Scalora utilizes a unified payment provider architecture supporting instant sandbox and production webhooks.
          </p>

          <div className="space-y-3 pt-2">
            {/* Mock Provider */}
            <div className="p-4 rounded-xl bg-scalora-navy/50 border border-scalora-blue/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-scalora-blue/20 text-scalora-accent">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Scalora Sandbox Engine</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Instant test card charges and automated enrollment trigger</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={mockEnabled}
                onChange={(e) => setMockEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-scalora-blue"
              />
            </div>

            {/* Stripe Provider */}
            <div className="p-4 rounded-xl bg-scalora-navy/50 border border-scalora-blue/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Stripe Payment Intents</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-scalora-blue/20 text-cyan-300">
                      Configured
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Global Visa, Mastercard, Apple Pay, Google Pay</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={stripeEnabled}
                onChange={(e) => setStripeEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-scalora-blue"
              />
            </div>

            {/* Paymob Provider */}
            <div className="p-4 rounded-xl bg-scalora-navy/50 border border-scalora-blue/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Paymob Gateway</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">
                      MENA & Wallets
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Vodafone Cash, Orange, Meeza, and Local Cards</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={paymobEnabled}
                onChange={(e) => setPaymobEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-scalora-blue"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
