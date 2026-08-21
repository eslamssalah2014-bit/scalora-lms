import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
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
  Copy,
  Check,
  ExternalLink,
  UploadCloud,
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSuccess?: () => void;
}

const INSTAPAY_LINK = 'https://ipn.eg/S/eslamsalah210/instapay/7yLhab';
const INSTAPAY_RECIPIENT = 'eslamsalah210@instapay';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  course,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState<'INSTAPAY' | 'MOCK' | 'STRIPE'>('INSTAPAY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student Identity State (for guests)
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  // InstaPay Form State
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Success States
  const [isInstantCompleted, setIsInstantCompleted] = useState(false);
  const [isInstaPaySubmitted, setIsInstaPaySubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name);
      if (!email) setEmail(user.email);
    }
  }, [user]);

  if (!course) return null;

  // Copy helper
  const handleCopyLink = () => {
    navigator.clipboard.writeText(INSTAPAY_LINK);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(INSTAPAY_RECIPIENT);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  // File Upload to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit. Please upload a smaller image or PDF.');
      return;
    }

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Instant Checkout (Demo / Free)
  const handleInstantCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        success: boolean;
        alreadyEnrolled?: boolean;
        message: string;
      }>('/payments/checkout', {
        courseId: course.id,
        provider: 'MOCK',
      });

      if (res.success) {
        setIsInstantCompleted(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2D8CFF', '#00D2FF', '#FFFFFF', '#082B5B'],
        });

        setTimeout(() => {
          setIsInstantCompleted(false);
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

  // InstaPay Submission
  const handleInstaPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      setError('Please enter the InstaPay transaction reference number.');
      return;
    }
    if (!screenshotUrl) {
      setError('Please upload your InstaPay payment screenshot or receipt.');
      return;
    }

    // Validate email if guest
    if (!user && !email.trim()) {
      setError('Please enter your email address so we can enroll you and send confirmation.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        success: boolean;
        message: string;
      }>('/payments/instapay', {
        courseId: course.id,
        referenceNumber: referenceNumber.trim(),
        screenshotUrl,
        notes: notes.trim(),
        fullName: user ? user.name : (fullName.trim() || 'Student'),
        email: user ? user.email : email.trim(),
        phone: phone.trim(),
      });

      if (res.success) {
        setIsInstaPaySubmitted(true);
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10B981', '#2D8CFF', '#00D2FF', '#FFFFFF'],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetModal = () => {
    setIsInstaPaySubmitted(false);
    setIsInstantCompleted(false);
    setReferenceNumber('');
    setScreenshotUrl('');
    setFileName('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleResetModal} title="Complete Course Purchase" maxWidth="max-w-xl">
      {/* 1. Instant Free/Sandbox Success */}
      {isInstantCompleted ? (
        <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-white">Enrollment Confirmed!</h3>
          <p className="text-sm text-slate-300 max-w-xs mx-auto">
            You now have lifetime access to <strong className="text-white">{course.title}</strong>. Redirecting to your classroom...
          </p>
        </div>
      ) : isInstaPaySubmitted ? (
        /* 2. InstaPay Submission Confirmation State */
        <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">Payment Request Submitted!</h3>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-scalora-blue/20 border border-scalora-blue/30 text-scalora-accent text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Review Time: Under 4 Hours</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-scalora-navy/70 border border-scalora-blue/25 text-left space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              Your payment of <strong className="text-white">${course.price.toFixed(2)}</strong> for{' '}
              <strong className="text-white">"{course.title}"</strong> (Ref: <code className="text-scalora-blue font-mono font-bold">{referenceNumber}</code>) has been submitted to the Scalora finance team.
            </p>
            <p className="leading-relaxed text-slate-400">
              Once payment is verified, you will be enrolled in the course automatically and will receive a confirmation email.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                handleResetModal();
                navigate('/dashboard');
              }}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-xs shadow-glow-blue hover:opacity-95 flex items-center justify-center gap-2"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetModal}
              className="px-6 py-3.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        /* 3. Main Checkout Form */
        <div className="space-y-6">
          {/* Course Summary Tile */}
          <div className="p-4 rounded-2xl bg-scalora-navy/60 border border-scalora-blue/25 flex items-center gap-4">
            <img
              src={
                course.thumbnail ||
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
              }
              alt={course.title}
              className="w-16 h-16 rounded-xl object-cover border border-scalora-blue/30 flex-shrink-0"
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
              <span className="text-xl font-black text-white">
                {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Choose Payment Method
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: InstaPay */}
              <button
                type="button"
                onClick={() => setProvider('INSTAPAY')}
                className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                  provider === 'INSTAPAY'
                    ? 'border-emerald-500 bg-emerald-500/15 shadow-lg ring-1 ring-emerald-500/30'
                    : 'border-scalora-blue/20 bg-scalora-navy/40 hover:bg-scalora-navy/70'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Pay via InstaPay</span>
                  </div>
                  <span className="text-[10px] text-emerald-300/80 block font-semibold">
                    Direct Egyptian Transfer
                  </span>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center ${
                    provider === 'INSTAPAY' ? 'border-emerald-400 bg-emerald-400' : 'border-slate-500'
                  }`}
                >
                  {provider === 'INSTAPAY' && <div className="w-1 h-1 rounded-full bg-black" />}
                </div>
              </button>

              {/* Option 2: Instant Sandbox */}
              <button
                type="button"
                onClick={() => setProvider('MOCK')}
                className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                  provider === 'MOCK'
                    ? 'border-scalora-blue bg-scalora-blue/15 shadow-glow-blue'
                    : 'border-scalora-blue/20 bg-scalora-navy/40 hover:bg-scalora-navy/70'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-scalora-accent" />
                    <span className="text-xs font-bold text-white">Instant Sandbox</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">1-Click Test Enrollment</span>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center ${
                    provider === 'MOCK' ? 'border-scalora-blue bg-scalora-blue' : 'border-slate-500'
                  }`}
                >
                  {provider === 'MOCK' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INSTAPAY DEDICATED WORKFLOW SECTION */}
          {/* ========================================================================= */}
          {provider === 'INSTAPAY' ? (
            <form onSubmit={handleInstaPaySubmit} className="space-y-5">
              {/* InstaPay Transfer Info Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-scalora-navy/80 to-[#04152D] border border-emerald-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Pay via InstaPay</h4>
                      <p className="text-[11px] text-slate-400">Transfer the course amount, then upload proof of payment.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    ${course.price.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Recipient Account:</span>
                    <span className="font-mono font-bold text-white">{INSTAPAY_RECIPIENT}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Official Payment Link:</span>
                    <span className="font-mono text-emerald-400 text-[11px] truncate max-w-[200px]">
                      {INSTAPAY_LINK}
                    </span>
                  </div>
                </div>

                {/* InstaPay Quick Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'ID Copied!' : 'Copy InstaPay ID'}</span>
                  </button>

                  <a
                    href={INSTAPAY_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-500 text-black text-xs font-extrabold hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <span>Open InstaPay</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Payment Confirmation Fields */}
              <div className="space-y-4">
                {/* Student Info: Logged in Badge vs Guest Inputs */}
                {user ? (
                  <div className="p-3 rounded-xl bg-scalora-navy/60 border border-scalora-blue/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-scalora-blue/20 text-scalora-accent flex items-center justify-center font-bold text-[10px]">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-slate-300">
                        Enrolling as: <strong className="text-white">{user.name}</strong> ({user.email})
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                      Logged In
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-scalora-navy/50 border border-scalora-blue/25">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Email Address (For Enrollment) *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 1. Reference Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>InstaPay Reference / Transaction Number *</span>
                    <span className="text-[10px] text-slate-400 font-normal">Found on receipt</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. IPN20260821-8930492 or 12-digit Ref"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                {/* 2. Upload Screenshot */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>Payment Proof Screenshot (JPG, PNG, PDF max 10MB) *</span>
                    {fileName && <span className="text-[10px] text-emerald-400 font-semibold">{fileName}</span>}
                  </label>
                  
                  <div className="relative border-2 border-dashed border-scalora-blue/30 hover:border-scalora-blue/60 rounded-2xl p-4 text-center cursor-pointer bg-scalora-navy/30 transition-all group">
                    <input
                      type="file"
                      required={!screenshotUrl}
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />

                    {screenshotUrl ? (
                      <div className="flex items-center justify-center gap-3">
                        {screenshotUrl.startsWith('data:image') ? (
                          <img
                            src={screenshotUrl}
                            alt="Receipt Preview"
                            className="w-12 h-12 rounded-lg object-cover border border-emerald-500/40"
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-emerald-400" />
                        )}
                        <div className="text-left text-xs">
                          <p className="font-bold text-white">{fileName || 'Receipt Attached'}</p>
                          <p className="text-[10px] text-emerald-400">Click or drag to replace screenshot</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="w-7 h-7 text-scalora-blue mx-auto group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-semibold text-slate-300">Click to upload payment screenshot</p>
                        <p className="text-[10px] text-slate-500">Supports PNG, JPG, JPEG, and PDF up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Optional Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Optional Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sender name or bank account details..."
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              {/* Submit Payment Request Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Payment Proof...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit InstaPay Payment Verification</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Instant Sandbox Flow */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-scalora-navy/50 border border-scalora-blue/20 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-scalora-accent font-bold">
                  <Zap className="w-4 h-4" />
                  <span>Instant Test Checkout</span>
                </div>
                <p className="text-slate-400 text-xs">
                  Instantly enrolls your current user in "{course.title}" for local testing without requiring manual review.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleInstantCheckout}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-sm shadow-glow-blue hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling in Course...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Instant Enroll Access ({course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              256-Bit SSL Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-scalora-blue" />
              Lifetime Course Access
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};

