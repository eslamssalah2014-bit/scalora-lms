import React, { useState, useEffect } from 'react';
import { api, resolveMediaUrl } from '../../lib/api';
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertCircle,
  FileText,
  User,
  BookOpen,
  Copy,
  Check,
  Smartphone,
  Zap,
  Eye,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../../components/Modal';

interface GatewayPayment {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  provider: string;
  metadata?: string;
  refundReason?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  course: {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail?: string;
  };
  enrollments?: Array<{
    id: string;
    status: string;
  }>;
}

interface GatewayStats {
  totalRevenue: number;
  kashierVolume: number;
  refundedAmount: number;
  totalTransactions: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
}

export const AdminGatewayLedger: React.FC = () => {
  const [payments, setPayments] = useState<GatewayPayment[]>([]);
  const [stats, setStats] = useState<GatewayStats>({
    totalRevenue: 0,
    kashierVolume: 0,
    refundedAmount: 0,
    totalTransactions: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');

  // Transaction Detail Modal
  const [selectedPayment, setSelectedPayment] = useState<GatewayPayment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refund Workflow Modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundingPayment, setRefundingPayment] = useState<GatewayPayment | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, providerFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (providerFilter !== 'ALL') params.append('provider', providerFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get<{
        success: boolean;
        payments: GatewayPayment[];
        stats: GatewayStats;
      }>(`/payments/admin/all?${params.toString()}`);

      if (res && res.success) {
        setPayments(res.payments || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err: any) {
      console.error('[ADMIN GATEWAY PAYMENTS ERROR]', err);
      setError(err.message || 'Failed to load gateway transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const openRefundModal = (payment: GatewayPayment) => {
    setRefundingPayment(payment);
    setRefundReason('');
    setRefundError(null);
    setRefundModalOpen(true);
  };

  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingPayment) return;
    if (!refundReason.trim()) {
      setRefundError('Please specify a detailed reason for the refund.');
      return;
    }

    setRefundProcessing(true);
    setRefundError(null);

    try {
      const res = await api.post<{
        success: boolean;
        message: string;
        payment: GatewayPayment;
      }>(`/payments/admin/${refundingPayment.id}/refund`, {
        reason: refundReason.trim(),
      });

      if (res && res.success) {
        setRefundSuccess(`Transaction ${refundingPayment.transactionId} refunded successfully.`);
        setTimeout(() => setRefundSuccess(null), 4000);
        setRefundModalOpen(false);
        setRefundingPayment(null);
        setRefundReason('');
        fetchPayments();
      }
    } catch (err: any) {
      console.error('[REFUND ACTION ERROR]', err);
      setRefundError(err.message || 'Failed to execute refund.');
    } finally {
      setRefundProcessing(false);
    }
  };

  const getStatusBadge = (status: GatewayPayment['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <RotateCcw className="w-3 h-3" />
            <span>Refunded</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getProviderBadge = (provider: string) => {
    if (provider === 'KASHIER') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
          <CreditCard className="w-3 h-3 text-cyan-400" />
          <span>Kashier Live</span>
        </span>
      );
    }
    if (provider === 'INSTAPAY') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
          <Smartphone className="w-3 h-3 text-emerald-400" />
          <span>InstaPay</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-[11px] font-bold">
        <Zap className="w-3 h-3 text-amber-400" />
        <span>{provider}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {refundSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{refundSuccess}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#04152D] border border-scalora-blue/30 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Revenue (Completed)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.totalRevenue.toLocaleString()} EGP
          </div>
          <p className="text-[11px] text-slate-400">{stats.completedCount} successful enrollments</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#04152D] border border-cyan-500/30 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Kashier Live Volume</span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300">
            {stats.kashierVolume.toLocaleString()} EGP
          </div>
          <p className="text-[11px] text-slate-400">Direct Cards, Meeza & Mobile Wallets</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#04152D] border border-purple-500/30 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Refunded Amount</span>
            <RotateCcw className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">
            {stats.refundedAmount.toLocaleString()} EGP
          </div>
          <p className="text-[11px] text-slate-400">{stats.refundedCount} refund requests processed</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#04152D] border border-scalora-blue/30 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Gateway Traffic</span>
            <TrendingUp className="w-4 h-4 text-scalora-accent" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalTransactions}</div>
          <p className="text-[11px] text-slate-400">
            {stats.pendingCount} pending / {stats.failedCount} cancelled
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#04152D] border border-scalora-blue/25 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Transaction ID, Student, Email, Course..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-scalora-navy/60 border border-scalora-blue/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-scalora-navy/60 border border-scalora-blue/20 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Gateways</option>
            <option value="KASHIER">Kashier Live</option>
            <option value="INSTAPAY">InstaPay</option>
            <option value="MOCK">Fast Sandbox</option>
            <option value="STRIPE">Stripe</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-scalora-navy/60 border border-scalora-blue/20 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>

          <button
            type="button"
            onClick={fetchPayments}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-scalora-navy hover:bg-scalora-navy/80 border border-scalora-blue/25 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payments Ledger Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading gateway transactions...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-scalora-navy/30 border border-scalora-blue/20 space-y-3">
          <CreditCard className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Transactions Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No gateway payments matched the active filters.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#04152D] border border-scalora-blue/25 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 border-b border-scalora-blue/20 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Course Track</th>
                  <th className="px-5 py-4">Transaction ID</th>
                  <th className="px-5 py-4">Gateway</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scalora-blue/15 text-slate-200 font-medium">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-scalora-navy/30 transition-colors">
                    {/* Student Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-scalora-blue/20 text-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {p.user?.name ? p.user.name.charAt(0) : 'U'}
                        </div>
                        <div className="min-w-0 max-w-[160px]">
                          <span className="font-bold text-white block truncate">{p.user?.name || 'Student'}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{p.user?.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Course Info */}
                    <td className="px-5 py-4">
                      <div className="min-w-0 max-w-[180px]">
                        <span className="font-bold text-white block truncate">{p.course?.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {p.course?.id.slice(-6)}</span>
                      </div>
                    </td>

                    {/* Transaction ID with 1-click copy */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleCopy(p.transactionId)}
                        className="font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 transition-colors"
                        title="Copy Transaction ID"
                      >
                        <span className="truncate max-w-[110px]">{p.transactionId}</span>
                        {copiedId === p.transactionId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    </td>

                    {/* Gateway */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getProviderBadge(p.provider)}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-black text-white">
                        {p.amount.toLocaleString()} {p.currency}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(p.status)}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(p)}
                          className="p-1.5 rounded-lg bg-scalora-navy/80 hover:bg-scalora-navy text-slate-300 hover:text-white border border-scalora-blue/20 transition-all"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {p.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => openRefundModal(p)}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Inspection Modal */}
      {selectedPayment && (
        <Modal
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          title="Gateway Transaction Details"
          maxWidth="max-w-xl"
        >
          <div className="space-y-5 text-xs text-slate-200">
            <div className="p-4 rounded-2xl bg-black/40 border border-scalora-blue/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-bold text-cyan-300">{selectedPayment.transactionId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Gateway Provider:</span>
                <span className="font-bold text-white">{selectedPayment.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Amount & Currency:</span>
                <span className="font-black text-emerald-400 text-sm">
                  {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                {getStatusBadge(selectedPayment.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Initiated At:</span>
                <span className="text-slate-300">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Student & Course Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-scalora-navy/50 border border-scalora-blue/20 space-y-1">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Student Info</span>
                <span className="font-bold text-white block">{selectedPayment.user.name}</span>
                <span className="text-slate-400 block">{selectedPayment.user.email}</span>
                {selectedPayment.user.phone && (
                  <span className="text-slate-400 block">{selectedPayment.user.phone}</span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-scalora-navy/50 border border-scalora-blue/20 space-y-1">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Course Track</span>
                <span className="font-bold text-white block">{selectedPayment.course.title}</span>
                <span className="text-slate-400 block">Tuition: {selectedPayment.course.price} EGP</span>
              </div>
            </div>

            {/* Refund Information if applicable */}
            {selectedPayment.status === 'REFUNDED' && (
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1 text-purple-200">
                <span className="font-bold flex items-center gap-1.5 text-purple-300">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refunded Record</span>
                </span>
                {selectedPayment.refundReason && (
                  <p className="text-[11px] text-slate-300">Reason: {selectedPayment.refundReason}</p>
                )}
                {selectedPayment.refundedAt && (
                  <p className="text-[10px] text-slate-400">
                    Timestamp: {new Date(selectedPayment.refundedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Raw Metadata Viewer */}
            {selectedPayment.metadata && (
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Gateway Metadata</span>
                <pre className="p-3 rounded-xl bg-black/60 border border-scalora-blue/20 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-40">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedPayment.metadata), null, 2);
                    } catch {
                      return selectedPayment.metadata;
                    }
                  })()}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              {selectedPayment.status === 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPayment;
                    setSelectedPayment(null);
                    openRefundModal(p);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Issue Refund</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-xl bg-scalora-navy text-slate-300 hover:text-white font-bold text-xs border border-scalora-blue/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Confirmation Workflow Modal */}
      {refundModalOpen && refundingPayment && (
        <Modal
          isOpen={refundModalOpen}
          onClose={() => setRefundModalOpen(false)}
          title="Process Transaction Refund"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleExecuteRefund} className="space-y-4 text-xs text-slate-200">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Confirm Refund Execution</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                This action will mark the transaction as <strong>REFUNDED</strong>, call the Kashier Live Gateway API, and automatically revoke the student's active course access.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-scalora-blue/20 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Reference:</span>
                <span className="font-mono font-bold text-white">{refundingPayment.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-white">{refundingPayment.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Refund Amount:</span>
                <span className="font-black text-rose-400 text-sm">
                  {refundingPayment.amount.toLocaleString()} {refundingPayment.currency}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">
                Refund Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g., Student requested refund within policy window / Duplicate charge"
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-scalora-navy/80 border border-scalora-blue/25 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {refundError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{refundError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                disabled={refundProcessing}
                className="px-4 py-2.5 rounded-xl bg-scalora-navy text-slate-300 hover:text-white font-bold text-xs border border-scalora-blue/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={refundProcessing}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {refundProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm & Process Refund</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
