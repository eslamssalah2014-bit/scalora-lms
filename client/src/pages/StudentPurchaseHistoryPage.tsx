import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveMediaUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Search,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  FileText,
  Smartphone,
  Zap,
} from 'lucide-react';
import { Modal } from '../components/Modal';

interface PurchaseItem {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  provider: string;
  createdAt: string;
  refundReason?: string;
  refundedAt?: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    level?: string;
  };
  enrollments?: Array<{
    id: string;
    status: string;
  }>;
}

interface ManualRequestItem {
  id: string;
  referenceNumber: string;
  amount: number;
  status: string;
  paymentMethod: string;
  submittedAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
  };
}

export const StudentPurchaseHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [manualRequests, setManualRequests] = useState<ManualRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<PurchaseItem | null>(null);
  const [copiedTxn, setCopiedTxn] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchaseHistory();
  }, []);

  const fetchPurchaseHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{
        success: boolean;
        purchases: PurchaseItem[];
        manualRequests: ManualRequestItem[];
      }>('/payments/history');

      if (res && res.success) {
        setPurchases(res.purchases || []);
        setManualRequests(res.manualRequests || []);
      }
    } catch (err: any) {
      console.error('[PURCHASE HISTORY ERROR]', err);
      setError(err.message || 'Failed to load purchase history from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxn(text);
    setTimeout(() => setCopiedTxn(null), 2500);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Filtered Purchases
  const filteredPurchases = purchases.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch =
      search === '' ||
      p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      p.course?.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalSpent = purchases
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const completedCount = purchases.filter((p) => p.status === 'COMPLETED').length;

  const getStatusBadge = (status: PurchaseItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refunded</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Declined</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider === 'KASHIER') {
      return (
        <div className="flex items-center gap-1 text-cyan-300 font-bold text-xs">
          <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
          <span>Kashier Live</span>
        </div>
      );
    }
    if (provider === 'INSTAPAY') {
      return (
        <div className="flex items-center gap-1 text-emerald-300 font-bold text-xs">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>InstaPay Transfer</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-slate-400 font-bold text-xs">
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span>{provider}</span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-scalora-blue/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white">Purchase & Order History</h1>
          </div>
          <p className="text-sm text-slate-400">
            View all your course enrollments, Kashier Live transactions, and download official receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPurchaseHistory}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-scalora-navy/80 hover:bg-scalora-navy border border-scalora-blue/30 text-xs font-bold text-slate-200 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/courses"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-scalora-blue to-cyan-500 text-white text-xs font-extrabold hover:opacity-95 transition-all shadow-md"
          >
            Explore More Courses
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#04152D] border border-scalora-blue/30 space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">Total Courses Enrolled</span>
          <div className="text-2xl font-black text-white">{completedCount} Tracks</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#04152D] border border-emerald-500/30 space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">Total Tuition Invested</span>
          <div className="text-2xl font-black text-emerald-400">
            {totalSpent.toLocaleString()} EGP
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#04152D] border border-cyan-500/30 space-y-1 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">Account Security</span>
          <div className="flex items-center gap-1.5 text-cyan-300 text-sm font-bold mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kashier 3D-Secure Protected</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Course or Transaction ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-scalora-navy/60 border border-scalora-blue/25 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'COMPLETED', 'PENDING', 'REFUNDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-scalora-navy/40 text-slate-400 hover:text-white border border-scalora-blue/15'
              }`}
            >
              {st === 'ALL' ? 'All Transactions' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions Table / List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading your purchase history...</p>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-scalora-navy/40 border border-scalora-blue/20 space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Purchases Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL'
                ? 'No transactions matched your search criteria.'
                : 'You have not made any course purchases yet. Explore our technical catalog to start learning.'}
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-cyan-500 text-white font-bold text-xs hover:opacity-95 transition-all shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Courses Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#04152D] border border-scalora-blue/25 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 border-b border-scalora-blue/20 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-4">Course Track</th>
                  <th className="px-5 py-4">Transaction ID</th>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-5 py-4">Gateway</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scalora-blue/15 text-slate-200 font-medium">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-scalora-navy/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            resolveMediaUrl(purchase.course?.thumbnail) ||
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                          }
                          alt={purchase.course?.title}
                          className="w-10 h-10 rounded-lg object-cover border border-scalora-blue/30 flex-shrink-0"
                        />
                        <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                          <span className="font-bold text-white block truncate">
                            {purchase.course?.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {purchase.course?.level || 'All Levels'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleCopy(purchase.transactionId)}
                        className="font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 transition-colors"
                        title="Click to copy Transaction ID"
                      >
                        <span className="truncate max-w-[120px]">{purchase.transactionId}</span>
                        {copiedTxn === purchase.transactionId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                      {new Date(purchase.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {getProviderIcon(purchase.provider)}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-black text-white">
                        {purchase.amount.toLocaleString()} {purchase.currency}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(purchase.status)}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {purchase.status === 'COMPLETED' && (
                          <Link
                            to={`/learn/${purchase.course.slug}`}
                            className="px-3 py-1.5 rounded-lg bg-scalora-blue/20 hover:bg-scalora-blue text-cyan-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 border border-scalora-blue/30"
                          >
                            <span>Learn</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(purchase)}
                          className="px-2.5 py-1.5 rounded-lg bg-scalora-navy/80 hover:bg-scalora-navy text-slate-300 hover:text-white text-xs border border-scalora-blue/20 transition-all flex items-center gap-1"
                          title="View Official Receipt"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Receipt / Invoice Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Official Payment Receipt"
          maxWidth="max-w-lg"
        >
          <div className="space-y-6 text-slate-200">
            {/* Printable Receipt Card */}
            <div id="print-receipt" className="p-6 rounded-2xl bg-white text-slate-900 space-y-6 shadow-xl border border-slate-200">
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#04152D] text-cyan-400 p-1 flex items-center justify-center font-black">
                    S
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">Scalora LMS</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Invoice #{selectedReceipt.transactionId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    {selectedReceipt.status}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {new Date(selectedReceipt.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Student & Course Particulars */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Billed To:</span>
                  <span className="font-bold text-slate-900 block">{user?.name}</span>
                  <span className="text-slate-600 block">{user?.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Payment Method:</span>
                  <span className="font-bold text-slate-900 block">
                    {selectedReceipt.provider === 'KASHIER'
                      ? 'Kashier Live Payment Gateway'
                      : selectedReceipt.provider}
                  </span>
                  <span className="text-slate-600 font-mono text-[11px] block">
                    Ref: {selectedReceipt.transactionId}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                  <span>Item Description</span>
                  <span>Amount</span>
                </div>
                <div className="p-3 flex items-center justify-between text-xs border-t border-slate-100">
                  <div>
                    <span className="font-bold text-slate-900 block">{selectedReceipt.course.title}</span>
                    <span className="text-[10px] text-slate-500">Full Course Track Access + Verified Certificate</span>
                  </div>
                  <span className="font-black text-slate-900 text-sm">
                    {selectedReceipt.amount.toLocaleString()} {selectedReceipt.currency}
                  </span>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 border-t border-slate-200 pt-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{selectedReceipt.amount.toLocaleString()} {selectedReceipt.currency}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax & Platform Fee:</span>
                  <span>0.00 {selectedReceipt.currency}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-2">
                  <span>Total Paid:</span>
                  <span>{selectedReceipt.amount.toLocaleString()} {selectedReceipt.currency}</span>
                </div>
              </div>

              {/* Refund Info if applicable */}
              {selectedReceipt.status === 'REFUNDED' && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                    <span>This payment was refunded</span>
                  </div>
                  {selectedReceipt.refundReason && (
                    <p className="text-[11px] text-purple-700">Reason: {selectedReceipt.refundReason}</p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                <span>Thank you for choosing Scalora LMS. For inquiries, contact support@scalora.com</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-4 py-2.5 rounded-xl bg-scalora-blue text-white font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print or Save as PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2.5 rounded-xl bg-scalora-navy text-slate-300 hover:text-white font-bold text-xs border border-scalora-blue/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
