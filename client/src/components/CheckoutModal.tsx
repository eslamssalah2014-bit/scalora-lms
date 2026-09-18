import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { ScaloraImage } from './common/ScaloraImage';
import {
  CreditCard,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getCoursePricing } from '../lib/currency';
import { validateAndProcessPaymentProof } from '../lib/imageCompressor';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSuccess?: () => void;
}

const INSTAPAY_LINK = 'https://ipn.eg/S/eslamsalah210/instapay/7yLhab';
const INSTAPAY_RECIPIENT = 'eslamsalah210@instapay';
const ACCOUNT_HOLDER = 'Eslam Salah';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  course,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [kashierLoading, setKashierLoading] = useState(false);
  const [instaPayLoading, setInstaPayLoading] = useState(false);
  const [showInstaPayDetails, setShowInstaPayDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student Identity State (for guests)
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // InstaPay Form State
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [isInstaPaySubmitted, setIsInstaPaySubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name);
      if (!email) setEmail(user.email);
    }
  }, [user]);

  if (!course) return null;

  const pricing = getCoursePricing(course);

  // Copy InstaPay ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(INSTAPAY_RECIPIENT);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  // Kashier Live Checkout Redirection
  const handleKashierCheckout = async () => {
    if (!course) return;

    if (!user) {
      onClose();
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setKashierLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        success: boolean;
        checkoutUrl: string;
        orderId: string;
        amount: number;
        currency: string;
        message?: string;
      }>('/payments/kashier/create-session', {
        courseId: course.id,
        currency: 'EGP',
      });

      if (res && res.checkoutUrl) {
        try {
          if (res.orderId) {
            sessionStorage.setItem('scalora_kashier_order_id', res.orderId);
            sessionStorage.setItem('scalora_kashier_course_id', course.id);
          }
        } catch {}

        // Immediate redirect to Kashier checkout
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error(res.message || 'Unable to generate checkout URL.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setKashierLoading(false);
    }
  };

  // File Upload to Base64 with smart compression and 10MB verification
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      setFileName(file.name);
      const result = await validateAndProcessPaymentProof(file);
      setScreenshotUrl(result.dataUrl);
    } catch (err: any) {
      setError(err.message || 'File exceeds upload limits or format is invalid.');
      setFileName('');
      setScreenshotUrl('');
      if (e.target) e.target.value = '';
    }
  };

  // InstaPay Submission
  const handleInstaPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      setError('Please enter the payment reference number.');
      return;
    }
    if (!screenshotUrl) {
      setError('Please upload your payment screenshot.');
      return;
    }

    if (!user && !email.trim()) {
      setError('Please enter your email address for course enrollment.');
      return;
    }

    setInstaPayLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        success: boolean;
        message: string;
      }>('/payments/instapay', {
        courseId: course.id,
        referenceNumber: referenceNumber.trim(),
        screenshotUrl,
        notes: '',
        fullName: user ? user.name : (fullName.trim() || 'Student'),
        email: user ? user.email : email.trim(),
        phone: '',
      });

      if (res.success) {
        setIsInstaPaySubmitted(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10B981', '#2D8CFF', '#00D2FF', '#FFFFFF'],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment. Please try again.');
    } finally {
      setInstaPayLoading(false);
    }
  };

  const handleResetModal = () => {
    setIsInstaPaySubmitted(false);
    setShowInstaPayDetails(false);
    setReferenceNumber('');
    setScreenshotUrl('');
    setFileName('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleResetModal} title="Checkout" maxWidth="max-w-lg">
      {isInstaPaySubmitted ? (
        /* InstaPay Submission Confirmation State */
        <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-white">Payment Proof Submitted!</h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Review Time: Under 4 Hours</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-scalora-navy/60 border border-scalora-blue/20 text-left space-y-2 text-xs text-slate-300">
            <p>
              Your payment of <strong className="text-white">{pricing.formattedEffective}</strong> for{' '}
              <strong className="text-white">{course.title}</strong> has been submitted.
            </p>
            <p className="text-slate-400">
              Reference: <code className="text-scalora-blue font-mono font-bold">{referenceNumber}</code>
            </p>
            <p className="text-slate-400">
              Once verified, your access will be activated immediately.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                handleResetModal();
                if (onSuccess) onSuccess();
                navigate('/dashboard');
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-xs shadow-glow-blue hover:opacity-95 flex items-center justify-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetModal}
              className="px-5 py-3 rounded-xl glass-panel text-xs text-slate-300 hover:text-white font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. Course Summary */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-scalora-navy/50 border border-scalora-blue/20 flex items-center gap-3 sm:gap-4">
            <ScaloraImage
              src={course.thumbnail}
              alt={course.title}
              category={course.category}
              fallbackType="course"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-scalora-blue/20 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{course.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Instructor: {course.instructor}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Price</span>
              {pricing.hasDiscount ? (
                <div>
                  <span className="text-[11px] line-through text-slate-500 block leading-tight">
                    {pricing.formattedBase}
                  </span>
                  <span className="text-base sm:text-lg font-black text-cyan-300">
                    {pricing.formattedEffective}
                  </span>
                </div>
              ) : (
                <span className="text-base sm:text-lg font-black text-white">
                  {pricing.formattedEffective}
                </span>
              )}
            </div>
          </div>

          {/* Global Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in-50 duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 2. Two Payment Options */}
          <div className="space-y-4">
            {/* Option A: Online Payment */}
            <div className="p-4 rounded-2xl bg-scalora-navy/60 border border-scalora-blue/25 hover:border-scalora-blue/40 transition-all space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-scalora-blue/15 text-scalora-accent border border-scalora-blue/30 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white">Online Payment</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Visa, Mastercard, Meeza, Mobile Wallets</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleKashierCheckout}
                disabled={kashierLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-scalora-blue via-cyan-500 to-scalora-accent text-white font-bold text-xs sm:text-sm hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {kashierLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redirecting to Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Option B: InstaPay */}
            <div className="p-4 rounded-2xl bg-scalora-navy/60 border border-emerald-500/25 hover:border-emerald-500/40 transition-all space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white">InstaPay</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Direct bank transfer via InstaPay.</p>
                </div>
              </div>

              {!showInstaPayDetails ? (
                <button
                  type="button"
                  onClick={() => setShowInstaPayDetails(true)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Show InstaPay Details</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-4 pt-2 border-t border-emerald-500/20 animate-in fade-in-50 duration-200">
                  {/* Expanded InstaPay Details Section */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2 text-xs">
                    {/* InstaPay Number */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">InstaPay Number:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white">{INSTAPAY_RECIPIENT}</span>
                        <button
                          type="button"
                          onClick={handleCopyId}
                          className="p-1 rounded hover:bg-white/10 text-emerald-400 transition-colors"
                          title="Copy InstaPay Address"
                        >
                          {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={INSTAPAY_LINK}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded hover:bg-white/10 text-emerald-400 transition-colors"
                          title="Open InstaPay Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Account Holder Name */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Account Holder Name:</span>
                      <span className="font-semibold text-white">{ACCOUNT_HOLDER}</span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-bold text-emerald-400 text-sm">{pricing.formattedEffective}</span>
                    </div>
                  </div>

                  {/* Submission Form */}
                  <form onSubmit={handleInstaPaySubmit} className="space-y-3">
                    {/* Guest student inputs if not logged in */}
                    {!user && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">Your Name *</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Full name"
                            className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300">Your Email *</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Payment Reference Number */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Payment Reference Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. 12-digit Ref or IPN Transaction ID"
                        className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-mono"
                      />
                    </div>

                    {/* Screenshot Upload */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Payment Screenshot *
                      </label>
                      <div className="relative border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-3 text-center cursor-pointer bg-black/20 transition-all group">
                        <input
                          type="file"
                          required={!screenshotUrl}
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        {screenshotUrl ? (
                          <div className="flex items-center justify-center gap-2.5">
                            {screenshotUrl.startsWith('data:image') ? (
                              <img
                                src={screenshotUrl}
                                alt="Receipt Preview"
                                className="w-10 h-10 rounded-lg object-cover border border-emerald-500/40"
                              />
                            ) : (
                              <FileText className="w-6 h-6 text-emerald-400" />
                            )}
                            <div className="text-left text-xs">
                              <p className="font-bold text-white truncate max-w-[200px]">{fileName || 'Screenshot Attached'}</p>
                              <p className="text-[10px] text-emerald-400">Click to change screenshot</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-slate-200">
                            <UploadCloud className="w-5 h-5 text-emerald-400" />
                            <span className="text-xs">Upload payment screenshot (JPG, PNG, PDF)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Primary Submit Button */}
                    <button
                      type="submit"
                      disabled={instaPayLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {instaPayLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit InstaPay Payment</span>
                      )}
                    </button>

                    {/* Collapse Button */}
                    <button
                      type="button"
                      onClick={() => setShowInstaPayDetails(false)}
                      className="w-full py-1.5 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Hide Details</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};


