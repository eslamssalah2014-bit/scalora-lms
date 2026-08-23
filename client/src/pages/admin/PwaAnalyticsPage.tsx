import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Smartphone,
  Download,
  Users,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Monitor,
  Laptop,
  Apple,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Flame,
  Globe,
} from 'lucide-react';

interface PwaInstallRecord {
  id: string;
  deviceId: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  platform: 'ANDROID' | 'IOS' | 'WINDOWS' | 'MACOS' | 'LINUX' | 'OTHER';
  deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP';
  installedAt: string;
  lastActiveAt: string;
  userAgent?: string;
}

interface PwaAnalyticsSummary {
  totalInstalls: number;
  androidInstalls: number;
  iosInstalls: number;
  windowsInstalls: number;
  macosInstalls: number;
  otherInstalls: number;
  activeToday: number;
  activeThisWeek: number;
  conversionRate: number;
  funnel: {
    registeredUsers: number;
    promptShown: number;
    promptClicked: number;
    successfullyInstalled: number;
  };
  dailyTrend: { date: string; installs: number; active: number }[];
  platformBreakdown: { platform: string; count: number; percentage: number }[];
  recentInstalls: PwaInstallRecord[];
}

export const PwaAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<PwaAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get<{ success: boolean; analytics: PwaAnalyticsSummary }>('/admin/pwa-analytics');
      if (res.success && res.analytics) {
        setData(res.analytics);
      }
    } catch (err) {
      console.error('Error fetching PWA analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'ANDROID':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'IOS':
        return <Apple className="w-4 h-4 text-sky-400" />;
      case 'WINDOWS':
        return <Monitor className="w-4 h-4 text-cyan-400" />;
      case 'MACOS':
        return <Laptop className="w-4 h-4 text-indigo-400" />;
      default:
        return <Globe className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const filteredInstalls = (data?.recentInstalls || []).filter((item) => {
    const matchesSearch =
      (item.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deviceId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform = platformFilter === 'ALL' || item.platform === platformFilter;

    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#071E3D] via-[#0B254E] to-[#04152D] border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-glow-accent">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-400/30">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Real-Time Installation Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">PWA Analytics</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Track Scalora Progressive Web App installations, conversion funnel, and active mobile users.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-extrabold text-xs border border-white/10 transition-all flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {loading && !refreshing ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400 font-bold">Loading PWA installation metrics...</p>
        </div>
      ) : (
        <>
          {/* 2. Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {/* 1. Total Installs */}
            <div className="p-5 rounded-3xl bg-[#061428] border border-cyan-500/20 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Total Installs</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white">{data?.totalInstalls || 0}</div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-cyan-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unique devices</span>
                </div>
              </div>
            </div>

            {/* 2. Active Installed Today */}
            <div className="p-5 rounded-3xl bg-[#061428] border border-emerald-500/20 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Active Today</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white">{data?.activeToday || 0}</div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-semibold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{data?.activeThisWeek || 0} this week</span>
                </div>
              </div>
            </div>

            {/* 3. Install Conversion Rate */}
            <div className="p-5 rounded-3xl bg-[#061428] border border-scalora-blue/20 shadow-xl relative overflow-hidden group hover:border-scalora-blue/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Conversion Rate</span>
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white">{data?.conversionRate || 0}%</div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-semibold">
                  <span>Of registered users</span>
                </div>
              </div>
            </div>

            {/* 4. Android Leading Share */}
            <div className="p-5 rounded-3xl bg-[#061428] border border-purple-500/20 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Android Installs</span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white">{data?.androidInstalls || 0}</div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-300 font-semibold">
                  <span>iOS: {data?.iosInstalls || 0} • Desktop: {(data?.windowsInstalls || 0) + (data?.macosInstalls || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Platform Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#051224] border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">Android</div>
                <div className="text-lg font-black text-white">{data?.androidInstalls || 0}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#051224] border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">iOS</div>
                <div className="text-lg font-black text-white">{data?.iosInstalls || 0}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#051224] border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">Windows</div>
                <div className="text-lg font-black text-white">{data?.windowsInstalls || 0}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#051224] border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">macOS</div>
                <div className="text-lg font-black text-white">{data?.macosInstalls || 0}</div>
              </div>
            </div>
          </div>

          {/* 4. Install Conversion Funnel Visualizer */}
          <div className="p-6 rounded-3xl bg-[#061428] border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>PWA Installation Funnel</span>
                </h3>
                <p className="text-xs text-slate-400">Step-by-step conversion from user registration to native install</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-extrabold">
                {data?.conversionRate || 0}% Conversion
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-[#081B38] border border-cyan-500/20 space-y-2 relative">
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Step 1</div>
                <div className="text-xs font-bold text-slate-300">Registered Users</div>
                <div className="text-2xl font-black text-white">{data?.funnel.registeredUsers || 0}</div>
                <div className="text-[11px] text-slate-400">Total User Base</div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-[#081B38] border border-cyan-500/20 space-y-2 relative">
                <div className="text-[10px] font-black text-sky-400 uppercase tracking-wider">Step 2</div>
                <div className="text-xs font-bold text-slate-300">Saw Install Prompt</div>
                <div className="text-2xl font-black text-white">{data?.funnel.promptShown || 0}</div>
                <div className="text-[11px] text-slate-400">Banner / CTA impressions</div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-[#081B38] border border-cyan-500/20 space-y-2 relative">
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Step 3</div>
                <div className="text-xs font-bold text-slate-300">Clicked Install</div>
                <div className="text-2xl font-black text-white">{data?.funnel.promptClicked || 0}</div>
                <div className="text-[11px] text-slate-400">Triggered install prompt</div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-[#082830] border border-emerald-400/40 space-y-2 relative shadow-lg shadow-emerald-500/5">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Step 4</div>
                <div className="text-xs font-bold text-slate-200">Installed PWA</div>
                <div className="text-2xl font-black text-emerald-300">{data?.funnel.successfullyInstalled || 0}</div>
                <div className="text-[11px] text-emerald-400 font-bold">✓ Native App Installed</div>
              </div>
            </div>
          </div>

          {/* 5. Platform Breakdown & Daily Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Distribution */}
            <div className="p-6 rounded-3xl bg-[#061428] border border-white/10 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <span>Platform Distribution</span>
              </h3>

              <div className="space-y-3">
                {(data?.platformBreakdown || []).map((item) => (
                  <div key={item.platform} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2 text-slate-300">
                        {getPlatformIcon(item.platform)}
                        <span>{item.platform}</span>
                      </div>
                      <span className="text-white">
                        {item.count} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#081B38] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-scalora-blue transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(item.percentage, item.count > 0 ? 5 : 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Trend (Last 14 Days) */}
            <div className="p-6 rounded-3xl bg-[#061428] border border-white/10 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span>Daily Install Trend (Last 14 Days)</span>
              </h3>

              <div className="space-y-2">
                {(data?.dailyTrend || []).slice(-7).map((item) => (
                  <div key={item.date} className="flex items-center justify-between p-2.5 rounded-xl bg-[#051124] border border-white/5 text-xs">
                    <span className="font-bold text-slate-300">{item.date}</span>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-black">
                        +{item.installs} new
                      </span>
                      <span className="text-slate-400 font-medium">{item.active} active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Installed Devices & Users Table */}
          <div className="p-6 rounded-3xl bg-[#061428] border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>Installed Devices & Users</span>
                </h3>
                <p className="text-xs text-slate-400">Verified unique installations on active devices</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search user or device..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-[#081B38] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#081B38] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Platforms</option>
                  <option value="ANDROID">Android</option>
                  <option value="IOS">iOS</option>
                  <option value="WINDOWS">Windows</option>
                  <option value="MACOS">macOS</option>
                </select>
              </div>
            </div>

            {filteredInstalls.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Smartphone className="w-8 h-8 mx-auto text-slate-500" />
                <p>No installation records found matching your query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-bold">
                      <th className="pb-3">User / Device</th>
                      <th className="pb-3">Platform</th>
                      <th className="pb-3">Device Type</th>
                      <th className="pb-3">Installed At</th>
                      <th className="pb-3">Last Active</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredInstalls.map((inst) => {
                      const isToday =
                        Date.now() - new Date(inst.lastActiveAt).getTime() <= 24 * 60 * 60 * 1000;

                      return (
                        <tr key={inst.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-semibold text-white">
                            {inst.userName ? (
                              <div>
                                <div>{inst.userName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{inst.userEmail}</div>
                              </div>
                            ) : (
                              <div className="text-slate-400 font-mono text-[11px] truncate max-w-[160px]">
                                {inst.deviceId}
                              </div>
                            )}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-slate-200 font-bold">
                              {getPlatformIcon(inst.platform)}
                              <span>{inst.platform}</span>
                            </span>
                          </td>
                          <td className="py-3 text-slate-300 font-medium">{inst.deviceType}</td>
                          <td className="py-3 text-slate-400">{formatDateTime(inst.installedAt)}</td>
                          <td className="py-3 text-slate-400">{formatDateTime(inst.lastActiveAt)}</td>
                          <td className="py-3 text-right">
                            {isToday ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                                Active Today
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-bold">
                                Installed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
