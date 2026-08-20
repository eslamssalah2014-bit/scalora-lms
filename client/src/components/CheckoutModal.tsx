import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { api } from '../lib/api';
import { Modal } from './Modal';
import {
  CreditCard,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Lock,
  Loader2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  course,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<'MOCK' | 'STRIPE' | 'PAYMOB'>('MOCK');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!course) return null;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        success: boolean;
        alreadyEnrolled?: boolean;
        message: string;
      }>('/payments/checkout', {
        courseId: course.id,
        provider,
      });

      if (res.success) {
        setIsCompleted(true);
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2D8CFF', '#00D2FF', '#FFFFFF', '#082B5B'],
        });

        setTimeout(() => {
          setIsCompleted(false);
          onClose();
          if (onSuccess) onSuccess();
          navigate(`/learn/${course.slug}`);
        }, 1800);
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Enrollment" maxWidth="max-w-lg">
      {isCompleted ? (
        <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-white">Enrollment Confirmed!</h3>
          <p className="text-sm text-slate-300 max-w-xs mx-auto">
            You now have lifetime access to <strong className="text-white">{course.title}</strong>.
            Redirecting to your classroom...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Course Summary Tile */}
          <div className="p-4 rounded-xl bg-scalora-navy/60 border border-scalora-blue/25 flex items-center gap-4">
            <img
              src={
                course.thumbnail ||
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
              }
              alt={course.title}
              className="w-16 h-16 rounded-lg object-cover border border-scalora-blue/30 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-scalora-accent">
                {course.category}
              </span>
              <h4 className="text-sm font-bold text-white truncate">{course.title}</h4>
              <p className="text-xs text-slate-400">Instructor: {course.instructor}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total</span>
              <span className="text-lg font-black text-white">
                {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Select Payment Gateway
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Instant Sandbox */}
              <button
                type="button"
                onClick={() => setProvider('MOCK')}
                className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                  provider === 'MOCK'
                    ? 'border-scalora-blue bg-scalora-blue/15 shadow-glow-blue'
                    : 'border-scalora-blue/20 bg-scalora-navy/40 hover:bg-scalora-navy/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-scalora-blue/20 text-scalora-accent">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Instant Demo Checkout</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-scalora-accent/20 text-scalora-accent border border-scalora-accent/30">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">1-click instant enrollment for testing & review</p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border mt-1 flex items-center justify-center ${
                    provider === 'MOCK' ? 'border-scalora-blue bg-scalora-blue' : 'border-slate-500'
                  }`}
                >
                  {provider === 'MOCK' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              {/* Option 2: Stripe */}
              <button
                type="button"
                onClick={() => setProvider('STRIPE')}
                className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                  provider === 'STRIPE'
                    ? 'border-scalora-blue bg-scalora-blue/15 shadow-glow-blue'
                    : 'border-scalora-blue/20 bg-scalora-navy/40 hover:bg-scalora-navy/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Stripe Gateway</span>
                      <span className="text-[10px] font-semibold text-slate-400">Credit / Debit Card</span>
                    </div>
                    <p className="text-xs text-slate-400">Global Visa, MasterCard, Amex via Stripe Engine</p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border mt-1 flex items-center justify-center ${
                    provider === 'STRIPE' ? 'border-scalora-blue bg-scalora-blue' : 'border-slate-500'
                  }`}
                >
                  {provider === 'STRIPE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              {/* Option 3: Paymob */}
              <button
                type="button"
                onClick={() => setProvider('PAYMOB')}
                className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                  provider === 'PAYMOB'
                    ? 'border-scalora-blue bg-scalora-blue/15 shadow-glow-blue'
                    : 'border-scalora-blue/20 bg-scalora-navy/40 hover:bg-scalora-navy/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Paymob Gateway</span>
                      <span className="text-[10px] font-semibold text-slate-400">Cards & Mobile Wallets</span>
                    </div>
                    <p className="text-xs text-slate-400">Vodafone Cash, Orange, Meeza, and Local Cards</p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border mt-1 flex items-center justify-center ${
                    provider === 'PAYMOB' ? 'border-scalora-blue bg-scalora-blue' : 'border-slate-500'
                  }`}
                >
                  {provider === 'PAYMOB' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Guarantee & Action */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-sm shadow-glow-blue hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Secure Checkout...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirm & Unlock Course Access ({course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`})</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                256-Bit SSL Encrypted
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-scalora-blue" />
                Lifetime Access Guaranteed
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
