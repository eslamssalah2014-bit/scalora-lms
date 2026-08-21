import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { PaymentRequest, PaymentRequestStatus, PaymentRequestStats } from '../../types';
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  Check,
  X,
  FileText,
  DollarSign,
  User,
  BookOpen,
  Send,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Copy,
  Trash2,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  PaymentRequestStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PENDING: {
    label: 'Pending Review',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  APPROVED: {
    label: 'Approved & Enrolled',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

export const AdminPaymentsPage: React.FC = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [stats, setStats] = useState<PaymentRequestStats>({
    totalRequests: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{
        success: boolean;
        requests: PaymentRequest[];
        stats: PaymentRequestStats;
      }>('/payments/admin/requests?limit=200');

      if (res.success) {
        setRequests(res.requests);
        setStats(res.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment verification requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== 'ALL' && req.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = req.user?.name.toLowerCase().includes(q) || false;
        const matchEmail = req.user?.email.toLowerCase().includes(q) || false;
        const matchCourse = req.course?.title.toLowerCase().includes(q) || false;
        const matchRef = req.referenceNumber.toLowerCase().includes(q);
        return matchName || matchEmail || matchCourse || matchRef;
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  // Copy Reference Number
  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Approve Payment Request
  const handleApprove = async (reqId: string, notes?: string) => {
    try {
      setProcessingAction(true);
      const res = await api.post<{
        success: boolean;
        message: string;
        paymentRequest: PaymentRequest;
      }>(`/payments/admin/requests/${reqId}/approve`, {
        adminNotes: notes || adminNotes,
      });

      if (res.success) {
        setRequests((prev) => prev.map((r) => (r.id === reqId ? res.paymentRequest : r)));
        if (selectedRequest?.id === reqId) {
          setSelectedRequest(res.paymentRequest);
        }
        setStats((prev) => ({
          ...prev,
          pendingReview: Math.max(0, prev.pendingReview - 1),
          approved: prev.approved + 1,
          totalRevenue: prev.totalRevenue + (res.paymentRequest.amount || 0),
        }));
        setActionSuccess(res.message);
        setTimeout(() => setActionSuccess(null), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve payment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Reject Payment Request
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setProcessingAction(true);
      const res = await api.post<{
        success: boolean;
        message: string;
        paymentRequest: PaymentRequest;
      }>(`/payments/admin/requests/${selectedRequest.id}/reject`, {
        rejectionReason: rejectionReason.trim(),
        adminNotes: adminNotes.trim(),
      });

      if (res.success) {
        setRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? res.paymentRequest : r)));
        setSelectedRequest(res.paymentRequest);
        setStats((prev) => ({
          ...prev,
          pendingReview: Math.max(0, prev.pendingReview - 1),
          rejected: prev.rejected + 1,
        }));
        setIsRejectOpen(false);
        setActionSuccess('Payment request marked as rejected');
        setTimeout(() => setActionSuccess(null), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject payment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Delete Request Record
  const handleDelete = async (reqItem: PaymentRequest) => {
    if (!window.confirm(`Are you sure you want to delete payment record (Ref: ${reqItem.referenceNumber})?`)) {
      return;
    }

    try {
      const res = await api.delete<{ success: boolean; message: string }>(`/payments/admin/requests/${reqItem.id}`);
      if (res.success) {
        setRequests((prev) => prev.filter((r) => r.id !== reqItem.id));
        if (selectedRequest?.id === reqItem.id) {
          setIsDetailOpen(false);
          setSelectedRequest(null);
        }
        setActionSuccess('Payment request deleted');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  const openDetails = (reqItem: PaymentRequest) => {
    setSelectedRequest(reqItem);
    setAdminNotes(reqItem.adminNotes || '');
    setRejectionReason(reqItem.rejectionReason || '');
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-scalora-blue/15 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-950 to-emerald-600 p-0.5 shadow-lg shadow-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Payments Verification
                {stats.pendingReview > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                    {stats.pendingReview} Pending
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400">
                Review and verify manual InstaPay bank transfers to grant automatic student course enrollments
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 hover:bg-white/5 transition-all"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SUMMARY METRIC CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="glass-card p-5 rounded-2xl border border-scalora-blue/20 space-y-2 hover:border-scalora-blue/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Submissions</span>
            <FileText className="w-4 h-4 text-scalora-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalRequests}</div>
          <div className="text-[11px] text-slate-400">All-time payment proofs</div>
        </div>

        {/* Pending Review */}
        <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2 hover:border-amber-400 transition-all shadow-lg">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.pendingReview}</div>
          <div className="text-[11px] text-amber-300/80">Awaiting admin verification</div>
        </div>

        {/* Approved Enrolled */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Deals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.approved}</div>
          <div className="text-[11px] text-emerald-400/80">Enrolled & Active</div>
        </div>

        {/* Total Verified Revenue */}
        <div className="glass-card p-5 rounded-2xl border border-cyan-500/30 space-y-2 hover:border-cyan-400 transition-all">
          <div className="flex items-center justify-between text-cyan-300">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Revenue</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">${stats.totalRevenue.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">From approved InstaPay</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATUS FILTER TABS & SEARCH */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              statusFilter === 'ALL'
                ? 'bg-gradient-to-r from-scalora-blue to-scalora-hover text-white shadow-glow-blue'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            <span>All Requests</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">{requests.length}</span>
          </button>

          {(['PENDING', 'APPROVED', 'REJECTED'] as PaymentRequestStatus[]).map((st) => {
            const cfg = STATUS_CONFIG[st];
            const count = requests.filter((r) => r.status === st).length;
            const active = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  active
                    ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-lg ring-1 ring-white/20`
                    : 'glass-panel text-slate-400 hover:text-white border-transparent'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span>{cfg.label}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-scalora-navy/80 border border-scalora-blue/20">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, email, ref number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PAYMENTS DATA TABLE */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl border border-scalora-blue/20 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-scalora-blue animate-spin mx-auto" />
            <p className="text-sm text-slate-400 font-medium">Loading payment verification requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-scalora-navy/60 border border-scalora-blue/20 flex items-center justify-center mx-auto text-slate-400">
              <CreditCard className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Payment Requests Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When students select "Pay via InstaPay" and upload proof of transfer, their verification requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-scalora-blue/15 bg-scalora-navy/40 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-4">Student</th>
                  <th className="py-4 px-4">Course</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">InstaPay Ref</th>
                  <th className="py-4 px-4">Proof Receipt</th>
                  <th className="py-4 px-4">Submitted</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scalora-blue/10 text-xs">
                {filteredRequests.map((reqItem) => {
                  const cfg = STATUS_CONFIG[reqItem.status] || STATUS_CONFIG.PENDING;

                  return (
                    <tr
                      key={reqItem.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => openDetails(reqItem)}
                    >
                      {/* Student */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              reqItem.user?.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                reqItem.user?.name || 'Student'
                              )}&background=2D8CFF&color=fff`
                            }
                            alt={reqItem.user?.name}
                            className="w-9 h-9 rounded-xl object-cover border border-scalora-blue/30 flex-shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-white truncate group-hover:text-scalora-accent transition-colors">
                              {reqItem.user?.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{reqItem.user?.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 max-w-[200px]">
                          <div className="font-semibold text-slate-200 truncate">{reqItem.course?.title}</div>
                          <div className="text-[10px] text-scalora-accent uppercase font-bold">
                            InstaPay Direct
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-black text-white whitespace-nowrap">
                        ${reqItem.amount.toFixed(2)}
                      </td>

                      {/* Reference Number */}
                      <td className="py-4 px-4 font-mono font-bold text-scalora-blue whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleCopyRef(reqItem.referenceNumber)}
                          className="px-2.5 py-1 rounded-lg bg-scalora-navy/80 border border-scalora-blue/20 hover:border-scalora-blue flex items-center gap-1.5 transition-all text-xs"
                          title="Click to Copy Reference"
                        >
                          <span>{reqItem.referenceNumber}</span>
                          <Copy className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>

                      {/* Screenshot Thumbnail */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setLightboxImage(reqItem.screenshotUrl)}
                          className="relative w-12 h-12 rounded-xl overflow-hidden border border-scalora-blue/30 group/img hover:border-scalora-blue transition-all flex items-center justify-center bg-black/40"
                          title="Click to Zoom Screenshot"
                        >
                          {reqItem.screenshotUrl.startsWith('data:image') ? (
                            <img
                              src={reqItem.screenshotUrl}
                              alt="Proof"
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                            />
                          ) : (
                            <FileText className="w-6 h-6 text-scalora-blue" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        <div>{new Date(reqItem.submittedAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(reqItem.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} inline-flex items-center gap-1.5`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {reqItem.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(reqItem.id)}
                                disabled={processingAction}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1 shadow-lg"
                                title="Approve & Grant Course Access"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedRequest(reqItem);
                                  setIsRejectOpen(true);
                                }}
                                disabled={processingAction}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1"
                                title="Reject Payment"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => openDetails(reqItem)}
                            className="p-2 rounded-lg bg-scalora-blue/10 text-scalora-blue hover:bg-scalora-blue hover:text-white transition-all"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(reqItem)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. DETAILS DRAWER / MODAL */}
      {/* ========================================================================= */}
      {isDetailOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] bg-[#04152D] border border-scalora-blue/30 rounded-3xl shadow-2xl overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-scalora-blue/15 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Payment Verification Details</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      STATUS_CONFIG[selectedRequest.status]?.bg
                    } ${STATUS_CONFIG[selectedRequest.status]?.text} ${
                      STATUS_CONFIG[selectedRequest.status]?.border
                    }`}
                  >
                    {STATUS_CONFIG[selectedRequest.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Submitted on {new Date(selectedRequest.submittedAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 rounded-xl bg-scalora-navy text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Student Info Card */}
              <div className="glass-card p-5 rounded-2xl border border-scalora-blue/20 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-scalora-accent flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>Student Information</span>
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-white text-sm">{selectedRequest.user?.name}</div>
                  <div className="text-slate-300">{selectedRequest.user?.email}</div>
                  <div className="text-slate-400 text-[11px] pt-1">
                    Student ID: <code className="font-mono text-scalora-blue">{selectedRequest.userId}</code>
                  </div>
                </div>
              </div>

              {/* Course Info Card */}
              <div className="glass-card p-5 rounded-2xl border border-scalora-blue/20 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-scalora-accent flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Purchased Course</span>
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-white text-sm">{selectedRequest.course?.title}</div>
                  <div className="text-slate-300 font-black text-emerald-400">
                    Amount: ${selectedRequest.amount.toFixed(2)} USD
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Method: <strong className="text-white font-mono">InstaPay Egyptian Bank Transfer</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Reference & Screenshot Display */}
            <div className="glass-card p-5 rounded-2xl border border-scalora-blue/20 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">InstaPay Transaction Reference:</span>
                  <span className="text-lg font-mono font-black text-scalora-blue flex items-center gap-2">
                    {selectedRequest.referenceNumber}
                    <button
                      onClick={() => handleCopyRef(selectedRequest.referenceNumber)}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                      title="Copy Reference Number"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </span>
                </div>

                {selectedRequest.notes && (
                  <div className="text-right max-w-xs">
                    <span className="text-[11px] text-slate-400 block">Student Note:</span>
                    <p className="text-xs text-slate-200 italic">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              {/* Screenshot Preview */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Payment Proof Screenshot
                </span>
                <div
                  onClick={() => setLightboxImage(selectedRequest.screenshotUrl)}
                  className="rounded-2xl overflow-hidden border border-scalora-blue/30 max-h-80 bg-black/60 flex items-center justify-center cursor-pointer group relative"
                >
                  <img
                    src={selectedRequest.screenshotUrl}
                    alt="Payment Receipt"
                    className="max-h-80 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-bold text-xs transition-opacity">
                    <Maximize2 className="w-5 h-5" />
                    <span>Click to Open Fullscreen Lightbox</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status Banner / Action Area */}
            {selectedRequest.status === 'PENDING' ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div className="text-xs font-semibold">
                    Verify that the transaction reference and amount match your InstaPay bank statement before granting enrollment access.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={processingAction}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Payment & Grant Instant Course Access</span>
                  </button>

                  <button
                    onClick={() => setIsRejectOpen(true)}
                    disabled={processingAction}
                    className="px-6 py-3.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Payment</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-scalora-navy/60 border border-scalora-blue/20 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Reviewed By: <strong className="text-white">{selectedRequest.reviewedBy || 'Admin'}</strong></span>
                  <span>Reviewed At: {selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : '-'}</span>
                </div>
                {selectedRequest.rejectionReason && (
                  <div className="text-rose-400 pt-1">
                    Rejection Reason: <strong>{selectedRequest.rejectionReason}</strong>
                  </div>
                )}
                {selectedRequest.adminNotes && (
                  <div className="text-slate-400 pt-1">
                    Admin Note: <em>{selectedRequest.adminNotes}</em>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REJECT MODAL */}
      {/* ========================================================================= */}
      {isRejectOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#04152D] border border-rose-500/30 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-scalora-blue/15 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Reject Payment Verification</span>
              </h3>
              <button onClick={() => setIsRejectOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Reason for Rejection *
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-scalora-navy"
                  required
                >
                  <option value="">Select Rejection Reason...</option>
                  <option value="Transaction reference not found on InstaPay">Transaction reference not found on InstaPay</option>
                  <option value="Transferred amount is less than course price">Transferred amount is less than course price</option>
                  <option value="Screenshot is unclear, corrupted, or invalid">Screenshot is unclear, corrupted, or invalid</option>
                  <option value="Duplicate transaction proof submitted">Duplicate transaction proof submitted</option>
                  <option value="Transferred to wrong InstaPay account">Transferred to wrong InstaPay account</option>
                  <option value="Other">Other reason (explain below)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Internal Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Additional context for audit records..."
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-panel text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction || !rejectionReason}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 disabled:opacity-50 transition-all"
                >
                  {processingAction ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LIGHTBOX ZOOM MODAL */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Fullscreen Receipt"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-scalora-blue/30 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
