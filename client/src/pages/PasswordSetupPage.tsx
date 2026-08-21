import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TokenValidationResult {
  valid: boolean;
  user: {
    name: string;
    email: string;
  };
  course?: {
    title: string;
    thumbnail?: string | null;
  } | null;
  expiresAt: string;
}

export const PasswordSetupPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenValidationResult | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate Token On Mount
  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setTokenError('Missing activation token. Please check the link from your confirmation email.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get<{
          success: boolean;
          valid: boolean;
          user: { name: string; email: string };
          course?: { title: string; thumbnail?: string | null } | null;
          expiresAt: string;
          message?: string;
        }>(`/auth/setup-token/${token}`);

        if (res.success && res.valid) {
          setTokenData(res);
        } else {
          setTokenError(res.message || 'Invalid or expired activation link.');
        }
      } catch (err: any) {
        setTokenError(err.message || 'This activation link is invalid, expired, or has already been used.');
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  // Submit Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post<{
        success: boolean;
        message: string;
        token: string;
        user: any;
      }>('/auth/setup-password', {
        token,
        password,
        confirmPassword,
      });

      if (res.success) {
        setIsSuccess(true);
        login(res.token, res.user);

        // Confetti celebration
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2D8CFF', '#00D2FF', '#10B981', '#FFFFFF'],
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 2200);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to activate password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Password Strength Score
  const passwordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = passwordStrength(password);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#04152D] border border-scalora-blue/30 p-1.5 shadow-glow-blue flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src="/scalora-icon-transparent.png" alt="Scalora Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-white">Scalora</span>
          </Link>
        </div>

        {/* Card Body */}
        <div className="glass-panel p-8 rounded-3xl space-y-6 shadow-2xl border border-scalora-blue/25 relative overflow-hidden">
          {loading ? (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-8 h-8 text-scalora-blue animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-semibold">Validating your activation link...</p>
            </div>
          ) : tokenError ? (
            /* Error / Expired State */
            <div className="py-6 text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white">Activation Link Expired or Invalid</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">{tokenError}</p>
              </div>
              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  to="/login"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-xs shadow-glow-blue hover:opacity-95 text-center"
                >
                  Go to Sign In
                </Link>
                <Link to="/contact" className="text-xs text-scalora-blue hover:underline">
                  Need assistance? Contact Scalora Support
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            /* Success State */
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-white">Account Activated!</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Welcome, <strong className="text-white">{tokenData?.user.name}</strong>! Your password has been set.
                Redirecting to your student dashboard...
              </p>
            </div>
          ) : (
            /* Password Setup Form */
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1.5 pb-2 border-b border-scalora-blue/15">
                <h2 className="text-2xl font-black text-white tracking-tight">Create Your Password</h2>
                <p className="text-xs text-slate-400">
                  Welcome <strong className="text-white">{tokenData?.user.name}</strong> ({tokenData?.user.email})
                </p>
              </div>

              {/* Course Welcome Banner if available */}
              {tokenData?.course && (
                <div className="p-3.5 rounded-2xl bg-scalora-navy/70 border border-scalora-blue/25 flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                      Enrolled Course Ready
                    </span>
                    <p className="font-bold text-white truncate">{tokenData.course.title}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {submitError}
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  New Password (Min 8 Characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl glass-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 rounded-full transition-all ${
                            strength >= step
                              ? strength >= 3
                                ? 'bg-emerald-400'
                                : strength === 2
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 block text-right">
                      {strength >= 4
                        ? 'Very Strong'
                        : strength === 3
                        ? 'Strong'
                        : strength === 2
                        ? 'Moderate'
                        : 'Weak (add uppercase, numbers, symbols)'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl glass-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-scalora-blue via-scalora-hover to-scalora-accent text-white font-extrabold text-xs shadow-glow-blue hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Your Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Activate Account & Access Course</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] text-slate-500">
                  Link valid for 24 hours. By activating, you agree to Scalora's Terms of Service.
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
