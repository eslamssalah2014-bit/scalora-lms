import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  FileText,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface VerificationResult {
  success: boolean;
  message: string;
  courseSlug?: string;
  payment?: {
    id: string;
    transactionId: string;
    amount: number;
    currency: string;
    course?: {
      id: string;
      title: string;
      slug: string;
      thumbnail?: string;
    };
  };
}

export const KashierCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedTxn, setCopiedTxn] = useState(false);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    setLoading(true);
    setErrorMessage(null);

    // Extract all parameters provided by Kashier in query string
    const queryParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Check sessionStorage fallback if redirect query stripped orderId
    let storedOrderId: string | null = null;
    try {
      storedOrderId = sessionStorage.getItem('scalora_kashier_order_id');
    } catch {}

    const orderId =
      searchParams.get('orderId') ||
      searchParams.get('merchantOrderId') ||
      searchParams.get('merchant_order_id') ||
      searchParams.get('order') ||
      searchParams.get('order_id') ||
      storedOrderId ||
      searchParams.get('paymentId') ||
      '';

    const paymentId = searchParams.get('paymentId') || undefined;

    const paymentStatus =
      searchParams.get('paymentStatus') ||
      searchParams.get('status') ||
      '';

    const signature = searchParams.get('signature') || undefined;

    try {
      const res = await api.post<VerificationResult>('/payments/kashier/verify', {
        orderId: orderId || undefined,
        paymentId: paymentId || undefined,
        paymentStatus,
        signature,
        queryParams,
      });

      if (res && res.success) {
        setResult(res);
        try {
          sessionStorage.removeItem('scalora_kashier_order_id');
        } catch {}

        // Trigger celebration confetti
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00D2FF', '#2D8CFF', '#10B981', '#FFFFFF'],
        });
      } else {
        setErrorMessage(res.message || 'Payment could not be verified by the banking gateway.');
      }

    } catch (err: any) {
      console.error('[KASHIER CALLBACK ERROR]', err);
      setErrorMessage(
        err.message ||
          'Payment verification failed. Your card may not have been charged or the transaction was cancelled.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTxn = (txnId: string) => {
    navigator.clipboard.writeText(txnId);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* State 1: Verification in Progress */}
        {loading && (
          <div className="p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-scalora-blue/10 via-transparent to-transparent pointer-events-none" />
            <div className="w-20 h-20 rounded-full bg-scalora-blue/20 text-cyan-400 border border-scalora-blue/40 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Verifying Kashier Live Payment...</h2>
              <p className="text-sm text-slate-400">
                Please wait while we confirm your transaction with Kashier banking servers and activate your course enrollment.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-cyan-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bank 256-Bit SSL Handshake Active</span>
            </div>
          </div>
        )}

        {/* State 2: Payment Verified & Course Enrolled Successfully */}
        {!loading && result?.success && (
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#04152D] via-scalora-navy/90 to-[#020C1B] border border-emerald-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-scalora-blue" />

            {/* Glowing Icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Payment Confirmed & Verified</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Welcome to Your Course!</h1>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Your payment via Kashier Live was successful. Your course track and community chat access have been activated.
              </p>
            </div>

            {/* Transaction Receipt Card */}
            <div className="p-4 rounded-2xl bg-black/40 border border-scalora-blue/20 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <button
                  type="button"
                  onClick={() => handleCopyTxn(result.payment?.transactionId || '')}
                  className="font-mono font-bold text-cyan-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>{result.payment?.transactionId}</span>
                  {copiedTxn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {result.payment?.course?.title && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Course Track:</span>
                  <span className="font-bold text-white truncate max-w-[240px]">
                    {result.payment.course.title}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-black text-emerald-400 text-sm">
                  {result.payment?.amount?.toLocaleString()} {result.payment?.currency || 'EGP'}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-scalora-blue/15 pt-2">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="font-semibold text-slate-200">Kashier Live Gateway</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <Link
                to={result.courseSlug ? `/learn/${result.courseSlug}` : '/dashboard'}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-scalora-blue via-cyan-500 to-scalora-accent text-white font-extrabold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                <BookOpen className="w-4 h-4" />
                <span>Start Learning in Course Player</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/purchases"
                className="w-full py-3 px-6 rounded-xl bg-scalora-navy/80 hover:bg-scalora-navy border border-scalora-blue/30 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>View My Purchase History & Invoice</span>
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Payment Declined or Error */}
        {!loading && !result?.success && (
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#04152D] via-scalora-navy/90 to-[#020C1B] border border-rose-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white">Payment Unsuccessful</h1>
              <p className="text-sm text-rose-300/90 max-w-md mx-auto">
                {errorMessage ||
                  'The transaction was cancelled or declined by your bank or mobile wallet provider.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-rose-500/20 text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  No charge was completed. You can reattempt checkout using another card, Meeza, or mobile wallet.
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-scalora-blue to-cyan-500 text-white font-extrabold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Browse Courses & Try Again</span>
              </button>

              <Link
                to="/contact"
                className="w-full py-3 px-6 rounded-xl bg-scalora-navy/80 hover:bg-scalora-navy border border-scalora-blue/20 text-slate-300 font-bold text-xs transition-all flex items-center justify-center"
              >
                Contact Support for Assistance
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
