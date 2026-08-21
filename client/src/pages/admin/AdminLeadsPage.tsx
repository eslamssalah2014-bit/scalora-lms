import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { Lead, LeadStatus, LeadStats, LeadNote } from '../../types';
import {
  Target,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  TrendingUp,
  Mail,
  Phone,
  Building2,
  Layers,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  X,
  Send,
  Trash2,
  UserCheck,
  Sparkles,
  ExternalLink,
  Briefcase,
  AlertCircle,
  Check,
  FileText,
  Activity,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  NEW: {
    label: 'New Lead',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  CONTACTED: {
    label: 'Contacted',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400',
  },
  MEETING_SCHEDULED: {
    label: 'Meeting Scheduled',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  DISCOVERY_COMPLETED: {
    label: 'Discovery Done',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  PROPOSAL_SENT: {
    label: 'Proposal Sent',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    dot: 'bg-purple-400',
  },
  NEGOTIATION: {
    label: 'Negotiation',
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
  },
  WON: {
    label: 'Won / Closed',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  LOST: {
    label: 'Lost',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

const ALL_STATUSES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'MEETING_SCHEDULED',
  'DISCOVERY_COMPLETED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'WON',
  'LOST',
];

export const AdminLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    totalLeads: 0,
    newLeads: 0,
    meetingsScheduled: 0,
    wonDeals: 0,
    lostDeals: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [industryFilter, setIndustryFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [assigneesList, setAssigneesList] = useState<string[]>([
    'Unassigned',
    'Eslam Salah (Admin)',
    'Sales Manager',
    'Senior Operations Consultant',
  ]);

  // Modals & Drawers
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Create Form State
  const [newForm, setNewForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    industry: 'Marketing Agencies',
    teamSize: '11-50 Employees',
    goalsAndBottlenecks: '',
  });
  const [creatingLead, setCreatingLead] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{
        success: boolean;
        leads: Lead[];
        stats: LeadStats;
      }>('/leads?limit=200');

      if (res.success) {
        setLeads(res.leads);
        setStats(res.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignees = async () => {
    try {
      const res = await api.get<{ success: boolean; assignees: string[] }>('/leads/assignees');
      if (res.success && res.assignees?.length) {
        setAssigneesList(res.assignees);
      }
    } catch (err) {
      console.warn('Could not load dynamic assignees list');
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchAssignees();
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status Filter
      if (statusFilter !== 'ALL' && lead.status !== statusFilter) {
        return false;
      }
      // Industry Filter
      if (industryFilter !== 'ALL' && lead.industry !== industryFilter) {
        return false;
      }
      // Assignee Filter
      if (assigneeFilter !== 'ALL' && (lead.assignedTo || 'Unassigned') !== assigneeFilter) {
        return false;
      }
      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = lead.fullName.toLowerCase().includes(q);
        const matchEmail = lead.email.toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q) || false;
        const matchCompany = lead.companyName?.toLowerCase().includes(q) || false;
        const matchCode = lead.leadCode.toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchCompany || matchCode;
      }
      return true;
    });
  }, [leads, statusFilter, industryFilter, assigneeFilter, search]);

  // Unique Industries from Data
  const industries = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.industry) set.add(l.industry);
    });
    return Array.from(set);
  }, [leads]);

  // Update Status Inline / in Modal
  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await api.put<{ success: boolean; lead: Lead }>(`/leads/${leadId}`, {
        status: newStatus,
      });

      if (res.success) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? res.lead : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead(res.lead);
        }
        setActionSuccess(`Status changed to ${STATUS_CONFIG[newStatus].label}`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Update Assignee
  const handleUpdateAssignee = async (leadId: string, assignedTo: string) => {
    try {
      const res = await api.put<{ success: boolean; lead: Lead }>(`/leads/${leadId}`, {
        assignedTo,
      });

      if (res.success) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? res.lead : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead(res.lead);
        }
        setActionSuccess(`Assigned to ${assignedTo}`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update assignment');
    }
  };

  // Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteText.trim()) return;

    try {
      setSubmittingNote(true);
      const res = await api.post<{ success: boolean; lead: Lead }>(
        `/leads/${selectedLead.id}/notes`,
        { text: noteText.trim() }
      );

      if (res.success) {
        setSelectedLead(res.lead);
        setLeads((prev) => prev.map((l) => (l.id === res.lead.id ? res.lead : l)));
        setNoteText('');
        setActionSuccess('Note added successfully');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (lead: Lead) => {
    if (!window.confirm(`Are you sure you want to delete lead ${lead.leadCode} (${lead.fullName})?`)) {
      return;
    }

    try {
      const res = await api.delete<{ success: boolean; message: string }>(`/leads/${lead.id}`);
      if (res.success) {
        setLeads((prev) => prev.filter((l) => l.id !== lead.id));
        if (selectedLead?.id === lead.id) {
          setIsDetailOpen(false);
          setSelectedLead(null);
        }
        setActionSuccess(`Lead ${lead.leadCode} deleted`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete lead');
    }
  };

  // Create Lead Manually
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingLead(true);
      const res = await api.post<{ success: boolean; lead: Lead; message: string }>('/leads', newForm);
      if (res.success) {
        setLeads((prev) => [res.lead, ...prev]);
        setStats((prev) => ({
          ...prev,
          totalLeads: prev.totalLeads + 1,
          newLeads: prev.newLeads + 1,
        }));
        setIsCreateOpen(false);
        setNewForm({
          fullName: '',
          email: '',
          phone: '',
          companyName: '',
          industry: 'Marketing Agencies',
          teamSize: '11-50 Employees',
          goalsAndBottlenecks: '',
        });
        setActionSuccess('New lead created successfully');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    } finally {
      setCreatingLead(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      alert('No leads available to export');
      return;
    }

    const headers = [
      'Lead Code',
      'Full Name',
      'Email',
      'Phone',
      'Company Name',
      'Industry',
      'Team Size',
      'Status',
      'Assigned To',
      'Goals & Bottlenecks',
      'Submitted Date',
      'Last Updated',
    ];

    const rows = filteredLeads.map((l) => [
      `"${l.leadCode}"`,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.phone || ''}"`,
      `"${(l.companyName || '').replace(/"/g, '""')}"`,
      `"${(l.industry || '').replace(/"/g, '""')}"`,
      `"${l.teamSize || ''}"`,
      `"${STATUS_CONFIG[l.status]?.label || l.status}"`,
      `"${l.assignedTo || 'Unassigned'}"`,
      `"${(l.goalsAndBottlenecks || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${new Date(l.createdAt).toLocaleDateString()} ${new Date(l.createdAt).toLocaleTimeString()}"`,
      `"${new Date(l.updatedAt).toLocaleDateString()}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scalora-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel HTML format
  const handleExportExcel = () => {
    if (filteredLeads.length === 0) {
      alert('No leads available to export');
      return;
    }

    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /></head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #04152D; color: #ffffff; font-weight: bold;">
              <th>Lead Code</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Industry</th>
              <th>Team Size</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Goals & Bottlenecks</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredLeads.forEach((l) => {
      tableHtml += `
        <tr>
          <td>${l.leadCode}</td>
          <td>${l.fullName}</td>
          <td>${l.email}</td>
          <td>${l.phone || '-'}</td>
          <td>${l.companyName || '-'}</td>
          <td>${l.industry || '-'}</td>
          <td>${l.teamSize || '-'}</td>
          <td>${STATUS_CONFIG[l.status]?.label || l.status}</td>
          <td>${l.assignedTo || 'Unassigned'}</td>
          <td>${(l.goalsAndBottlenecks || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${new Date(l.createdAt).toLocaleString()}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table></body></html>`;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scalora-leads-crm-${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-scalora-blue/15 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-scalora-navy to-scalora-blue p-0.5 shadow-glow-blue flex items-center justify-center">
              <Target className="w-5 h-5 text-scalora-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Leads Center & CRM
                {stats.newLeads > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                    {stats.newLeads} New
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400">
                Track, qualify, and convert consultation requests into enterprise consulting engagements
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 hover:bg-white/5 transition-all"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 hover:bg-scalora-blue/10 border border-scalora-blue/20 transition-all"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-scalora-blue" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
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
      {/* 1. DASHBOARD SUMMARY WIDGETS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Leads */}
        <div className="glass-card p-5 rounded-2xl border border-scalora-blue/20 space-y-2 hover:border-scalora-blue/40 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Leads</span>
            <Users className="w-4 h-4 text-scalora-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.totalLeads}</div>
          <div className="text-[11px] text-slate-400">All-time consultations</div>
        </div>

        {/* New Leads */}
        <div className="glass-card p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-2 hover:border-blue-400 transition-all shadow-glow-blue">
          <div className="flex items-center justify-between text-blue-300">
            <span className="text-xs font-bold uppercase tracking-wider">New Leads</span>
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.newLeads}</div>
          <div className="text-[11px] text-blue-300/80">Pending review</div>
        </div>

        {/* Meetings Scheduled */}
        <div className="glass-card p-5 rounded-2xl border border-amber-500/20 space-y-2 hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-bold uppercase tracking-wider">Meetings</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.meetingsScheduled}</div>
          <div className="text-[11px] text-slate-400">Scheduled calls</div>
        </div>

        {/* Won Deals */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-bold uppercase tracking-wider">Won Deals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.wonDeals}</div>
          <div className="text-[11px] text-emerald-400/80">Closed clients</div>
        </div>

        {/* Lost Deals */}
        <div className="glass-card p-5 rounded-2xl border border-rose-500/20 space-y-2 hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-xs font-bold uppercase tracking-wider">Lost Deals</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.lostDeals}</div>
          <div className="text-[11px] text-slate-400">Unconverted</div>
        </div>

        {/* Conversion Rate */}
        <div className="glass-card p-5 rounded-2xl border border-cyan-500/20 space-y-2 hover:border-cyan-400 transition-all">
          <div className="flex items-center justify-between text-cyan-300">
            <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.conversionRate}%</div>
          <div className="text-[11px] text-slate-400">Consultation to client</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PIPELINE STAGE TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            statusFilter === 'ALL'
              ? 'bg-gradient-to-r from-scalora-blue to-scalora-hover text-white shadow-glow-blue'
              : 'glass-panel text-slate-400 hover:text-white'
          }`}
        >
          <span>All Leads</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/15">
            {leads.length}
          </span>
        </button>

        {ALL_STATUSES.map((st) => {
          const cfg = STATUS_CONFIG[st];
          const count = leads.filter((l) => l.status === st).length;
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

      {/* ========================================================================= */}
      {/* 3. SEARCH & CONTROLS TOOLBAR */}
      {/* ========================================================================= */}
      <div className="glass-card p-4 rounded-2xl border border-scalora-blue/20 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email, phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Industry Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-scalora-blue" />
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl glass-input text-xs bg-scalora-navy text-slate-200"
            >
              <option value="ALL">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <UserCheck className="w-3.5 h-3.5 text-scalora-accent" />
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl glass-input text-xs bg-scalora-navy text-slate-200"
            >
              <option value="ALL">All Assignees</option>
              {assigneesList.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(search || statusFilter !== 'ALL' || industryFilter !== 'ALL' || assigneeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setIndustryFilter('ALL');
                setAssigneeFilter('ALL');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LEADS DATA TABLE */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl border border-scalora-blue/20 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-scalora-blue animate-spin mx-auto" />
            <p className="text-sm text-slate-400 font-medium">Loading consultation leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-scalora-navy/60 border border-scalora-blue/20 flex items-center justify-center mx-auto text-slate-400">
              <Target className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No Leads Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {leads.length === 0
                  ? 'No consultation requests have been submitted yet. Submissions from the Services page will automatically appear here.'
                  : 'No leads match your current search or filter criteria.'}
              </p>
            </div>
            {leads.length === 0 && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-scalora-blue text-white text-xs font-bold hover:opacity-95 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Lead</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-scalora-blue/15 bg-scalora-navy/40 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-4">Lead ID</th>
                  <th className="py-4 px-4">Prospect & Contact</th>
                  <th className="py-4 px-4">Company & Industry</th>
                  <th className="py-4 px-4">Team Size</th>
                  <th className="py-4 px-4">Pipeline Status</th>
                  <th className="py-4 px-4">Assigned To</th>
                  <th className="py-4 px-4">Submitted</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scalora-blue/10 text-xs">
                {filteredLeads.map((lead) => {
                  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => openLeadDetails(lead)}
                    >
                      {/* Lead Code */}
                      <td className="py-4 px-4 font-mono font-bold text-scalora-blue whitespace-nowrap">
                        <span className="px-2 py-1 rounded-lg bg-scalora-blue/10 border border-scalora-blue/20">
                          {lead.leadCode}
                        </span>
                      </td>

                      {/* Prospect & Contact */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-white text-sm group-hover:text-scalora-accent transition-colors">
                            {lead.fullName}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-scalora-blue" />
                              <a
                                href={`mailto:${lead.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline hover:text-white"
                              >
                                {lead.email}
                              </a>
                            </span>
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline hover:text-white"
                                >
                                  {lead.phone}
                                </a>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company & Industry */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.companyName || 'Not specified'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{lead.industry || 'General Consulting'}</div>
                        </div>
                      </td>

                      {/* Team Size */}
                      <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-scalora-navy/60 border border-scalora-blue/15 text-[11px]">
                          {lead.teamSize || '1-10 Employees'}
                        </span>
                      </td>

                      {/* Status Selector */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} bg-scalora-navy cursor-pointer focus:outline-none focus:ring-1 focus:ring-scalora-blue`}
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-[#04152D] text-slate-200">
                              {STATUS_CONFIG[st].label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Assigned To Selector */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.assignedTo || 'Unassigned'}
                          onChange={(e) => handleUpdateAssignee(lead.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-medium glass-input bg-scalora-navy text-slate-300 cursor-pointer"
                        >
                          {assigneesList.map((a) => (
                            <option key={a} value={a} className="bg-[#04152D] text-slate-200">
                              {a}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openLeadDetails(lead)}
                            className="p-2 rounded-lg bg-scalora-blue/10 text-scalora-blue hover:bg-scalora-blue hover:text-white transition-all"
                            title="View Lead Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                            title="Delete Lead"
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
      {/* 5. LEAD DETAILS DRAWER / MODAL */}
      {/* ========================================================================= */}
      {isDetailOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-[#04152D] border border-scalora-blue/30 rounded-3xl shadow-2xl overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-scalora-blue/15 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-scalora-blue/20 text-scalora-blue border border-scalora-blue/30">
                    {selectedLead.leadCode}
                  </span>
                  <h2 className="text-2xl font-black text-white">{selectedLead.fullName}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      STATUS_CONFIG[selectedLead.status]?.bg
                    } ${STATUS_CONFIG[selectedLead.status]?.text} ${STATUS_CONFIG[selectedLead.status]?.border}`}
                  >
                    {STATUS_CONFIG[selectedLead.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {selectedLead.companyName ? `${selectedLead.companyName} • ` : ''}
                  Submitted on {new Date(selectedLead.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 rounded-xl bg-scalora-navy text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Pipeline Stage Stepper */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                CRM Pipeline Stage
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_STATUSES.map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  const isCurrent = selectedLead.status === st;

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedLead.id, st)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                        isCurrent
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-lg ring-1 ring-white/20`
                          : 'glass-panel text-slate-400 hover:text-white border-scalora-blue/15'
                      }`}
                    >
                      <span>{cfg.label}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two Column Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Contact & Company Profile */}
              <div className="glass-card p-6 rounded-2xl border border-scalora-blue/20 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-scalora-accent flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Prospect Information</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Email Address</span>
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="text-scalora-blue hover:underline font-bold text-sm flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{selectedLead.email}</span>
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Phone Number</span>
                    {selectedLead.phone ? (
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="text-emerald-400 hover:underline font-bold text-sm flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{selectedLead.phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">Not provided</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Company Name</span>
                    <span className="text-white font-semibold">{selectedLead.companyName || 'Not specified'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Industry</span>
                      <span className="text-white">{selectedLead.industry || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Team Size</span>
                      <span className="text-white">{selectedLead.teamSize || '1-10 Employees'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-scalora-blue/15">
                    <span className="text-slate-400 block mb-1.5">Assigned Consultant</span>
                    <select
                      value={selectedLead.assignedTo || 'Unassigned'}
                      onChange={(e) => handleUpdateAssignee(selectedLead.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-scalora-navy text-slate-200"
                    >
                      {assigneesList.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Consultation Inquiry */}
              <div className="glass-card p-6 rounded-2xl border border-scalora-blue/20 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-scalora-accent flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Operational Goals & Bottlenecks</span>
                </h3>

                <div className="p-4 rounded-xl bg-scalora-navy/60 border border-scalora-blue/15 text-xs text-slate-200 leading-relaxed min-h-[140px] whitespace-pre-wrap">
                  {selectedLead.goalsAndBottlenecks || 'No description provided by user.'}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={`mailto:${selectedLead.email}?subject=Scalora%20Consultation%20Advisory%20Follow-up%20%5B${selectedLead.leadCode}%5D`}
                    className="flex-1 py-2.5 rounded-xl bg-scalora-blue text-white text-xs font-bold text-center hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-glow-blue"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email Reply</span>
                  </a>

                  {selectedLead.phone && (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-2"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 6. INTERNAL NOTES SECTION */}
            {/* ========================================================================= */}
            <div className="glass-card p-6 rounded-2xl border border-scalora-blue/20 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-scalora-accent flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Internal Team Notes</span>
              </h3>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add internal qualification note, call summary, pricing discussion, or next steps..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingNote || !noteText.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingNote ? 'Adding...' : 'Post Internal Note'}</span>
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pt-2">
                {selectedLead.notes && selectedLead.notes.length > 0 ? (
                  selectedLead.notes.map((note: LeadNote) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl bg-scalora-navy/50 border border-scalora-blue/15 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-scalora-accent">{note.authorName}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">No internal notes added yet.</p>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 7. ACTIVITY LOG & AUDIT TIMELINE */}
            {/* ========================================================================= */}
            <div className="glass-card p-6 rounded-2xl border border-scalora-blue/20 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Audit & Timeline History</span>
              </h3>

              <div className="space-y-3 max-h-48 overflow-y-auto text-xs">
                {selectedLead.activityLog && selectedLead.activityLog.length > 0 ? (
                  selectedLead.activityLog.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-slate-300 pb-2 border-b border-white/5">
                      <div className="w-2 h-2 rounded-full bg-scalora-blue mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-200">{act.description}</div>
                        <div className="text-[10px] text-slate-500">
                          By {act.actorName} • {new Date(act.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No history records found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. CREATE LEAD MODAL */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#04152D] border border-scalora-blue/30 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-scalora-blue/15 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-scalora-accent" />
                <span>Create New Consultation Lead</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.fullName}
                    onChange={(e) => setNewForm({ ...newForm, fullName: e.target.value })}
                    placeholder="Sarah Jenkins"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    placeholder="s.jenkins@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newForm.companyName}
                    onChange={(e) => setNewForm({ ...newForm, companyName: e.target.value })}
                    placeholder="Apex Innovations"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Industry
                  </label>
                  <select
                    value={newForm.industry}
                    onChange={(e) => setNewForm({ ...newForm, industry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-scalora-navy"
                  >
                    <option value="Marketing Agencies">Marketing Agencies</option>
                    <option value="Startups">Startups & Tech</option>
                    <option value="E-Commerce">E-Commerce & Retail</option>
                    <option value="Educational Businesses">Educational Businesses</option>
                    <option value="Healthcare">Healthcare & Clinics</option>
                    <option value="Restaurants & Cafes">Restaurants & Hospitality</option>
                    <option value="Service Businesses">Professional Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Team Size
                  </label>
                  <select
                    value={newForm.teamSize}
                    onChange={(e) => setNewForm({ ...newForm, teamSize: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-scalora-navy"
                  >
                    <option value="1-10 Employees">1-10 Employees</option>
                    <option value="11-50 Employees">11-50 Employees</option>
                    <option value="51-200 Employees">51-200 Employees</option>
                    <option value="200+ Employees">200+ Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Goals & Bottlenecks Description
                </label>
                <textarea
                  rows={3}
                  value={newForm.goalsAndBottlenecks}
                  onChange={(e) => setNewForm({ ...newForm, goalsAndBottlenecks: e.target.value })}
                  placeholder="Current software stack, bottlenecks, automation goals..."
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-scalora-blue/15">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-panel text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 disabled:opacity-50"
                >
                  {creatingLead ? 'Saving...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
