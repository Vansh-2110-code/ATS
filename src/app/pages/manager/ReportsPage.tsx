import { useState, useEffect } from 'react';
import { Download, Filter, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../services/api';

export function ReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(todayStr);
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced reports states
  const [activeView, setActiveView] = useState<'recruiter' | 'customer' | 'division' | 'aging' | 'conversion'>('recruiter');
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [divisionData, setDivisionData] = useState<any[]>([]);
  const [agingData, setAgingData] = useState<any>({ avgStageAging: {}, candidates: [] });
  const [conversionData, setConversionData] = useState<any[]>([]);

  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

  const loadReports = async (from: string, to: string) => {
    try {
      setLoading(true);
      const data = await api.getManagerReports({ from, to });
      const raw = data.reports || data.performanceData || data.recruiterPerformance || [];
      setPerformanceData(raw.map((r: any) => ({
        recruiter: r.recruiter || r.name || '',
        calls: r.calls ?? r.totalCalls ?? 0,
        interviews: r.interviews ?? 0,
        placed: r.placed ?? r.placements ?? 0,
        convRate: r.convRate || (r.conversionRate != null ? `${r.conversionRate}%` : '0%'),
        revenue: r.revenue ?? ((r.placements || 0) * 25000),
        trend: r.trend || ((r.conversionRate ?? 0) > 30 ? 'up' : 'down'),
      })));
      setMonthlyData(data.monthlyData || data.monthlyOverview || []);

      // Fetch advanced reports data
      const advData = await api.getAdvancedReports({ from, to });
      setCustomerData(advData.customerReport || []);
      setDivisionData(advData.divisionReport || []);
      setAgingData(advData.aging || { avgStageAging: {}, candidates: [] });
      setConversionData(advData.conversionReport || []);

      // Fetch additional dashboard data for department distribution
      const dashData = await api.getManagerDashboard();
      setDepartmentData(dashData.departmentDistribution || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(dateFrom, dateTo);
  }, []);

  const sorted = [...performanceData].sort((a, b) => {
    const va = (a as any)[sortField];
    const vb = (b as any)[sortField];
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-slate-300" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-green-500" /> : <ChevronDown className="w-3 h-3 text-green-500" />;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>Performance Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Detailed analytics and recruiter performance breakdown</p>
        </div>
        <button
          onClick={() => {
            const header = 'Recruiter,Calls,Interviews,Placed,Conv Rate,Revenue\n';
            const rows = performanceData.map((r: any) => `${r.recruiter},${r.calls},${r.interviews},${r.placed},${r.convRate},${r.revenue}`).join('\n');
            const blob = new Blob([header + rows], { type: 'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `performance_report_${dateFrom}_${dateTo}.csv`; a.click();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors" style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span style={{ fontWeight: 500 }}>Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 bg-white"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 bg-white"
            />
          </div>
          <button onClick={() => loadReports(dateFrom, dateTo)} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors" style={{ fontWeight: 500 }}>
            Apply
          </button>
          {['This Week', 'This Month', 'Last Month', 'Q1 2026'].map(p => (
            <button key={p} className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50" style={{ fontWeight: 500 }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls', value: monthlyData.reduce((s: number, m: any) => s + (m.calls || 0), 0).toLocaleString(), color: 'blue' },
          { label: 'Total Placements', value: monthlyData.reduce((s: number, m: any) => s + (m.placed || 0), 0), color: 'emerald' },
          { label: 'Total Revenue', value: fmt(monthlyData.reduce((s: number, m: any) => s + (m.revenue || 0), 0)), color: 'violet' },
          { label: 'Avg Conv. Rate', value: performanceData.length ? (performanceData.reduce((s: number, r: any) => s + parseFloat(r.convRate || '0'), 0) / performanceData.length).toFixed(1) + '%' : '—', color: 'amber' },
        ].map((s, i) => {
          const bgMap: Record<string, string> = {
            blue: 'text-green-600 bg-green-50',
            emerald: 'text-emerald-600 bg-emerald-50',
            violet: 'text-violet-600 bg-violet-50',
            amber: 'text-amber-600 bg-amber-50',
          };
          return (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <div className={`text-xl mb-1 ${bgMap[s.color]}`} style={{ fontWeight: 700 }}>{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Monthly Overview — Calls vs Placements</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barSize={18} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="calls" name="Calls" fill="#BBF7D0" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="right" dataKey="placed" name="Placed" fill="#16A34A" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department Distribution Chart */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Department-wise Candidate Distribution</h3>
        {departmentData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={departmentData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#64748B' }} width={120} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
              <Bar dataKey="count" name="Candidates" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
            No department data available for this period.
          </div>
        )}
      </div>

      {/* Report View Switcher */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl w-fit">
        {[
          { id: 'recruiter', label: 'Recruiter Wise' },
          { id: 'customer', label: 'Customer Wise' },
          { id: 'division', label: 'Division Wise' },
          { id: 'aging', label: 'Aging Report' },
          { id: 'conversion', label: 'Conversion Ratio' },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === v.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ─── VIEW: RECRUITER WISE ─── */}
      {activeView === 'recruiter' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Recruiter Performance Breakdown</h3>
            <span className="text-slate-400 text-xs">Click column headers to sort</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    { label: 'Recruiter', field: 'recruiter' },
                    { label: 'Calls', field: 'calls' },
                    { label: 'Interviews', field: 'interviews' },
                    { label: 'Placed', field: 'placed' },
                    { label: 'Conv. Rate', field: 'convRate' },
                    { label: 'Revenue', field: 'revenue' },
                    { label: 'Trend', field: 'trend' },
                  ].map(col => (
                    <th
                      key={col.field}
                      onClick={() => toggleSort(col.field)}
                      className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 select-none"
                      style={{ fontWeight: 600 }}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.field} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 text-xs" style={{ fontWeight: 600 }}>
                            {r.recruiter.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-slate-700 text-sm" style={{ fontWeight: 500 }}>{r.recruiter}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm">{r.calls.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm">{r.interviews}</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{r.placed}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm">{r.convRate}</td>
                    <td className="px-5 py-3.5 text-slate-700 text-sm" style={{ fontWeight: 500 }}>{fmt(r.revenue)}</td>
                    <td className="px-5 py-3.5">
                      {r.trend === 'up'
                        ? <span className="flex items-center gap-1 text-emerald-600 text-xs"><TrendingUp className="w-3.5 h-3.5" /> Up</span>
                        : <span className="flex items-center gap-1 text-red-500 text-xs"><TrendingDown className="w-3.5 h-3.5" /> Down</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── VIEW: CUSTOMER WISE ─── */}
      {activeView === 'customer' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Customer Performance Breakdown</h3>
            <span className="text-slate-400 text-xs">Grouped by client company</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-semibold">Client Company</th>
                  <th className="px-5 py-3 font-semibold text-center">Profiles Shared</th>
                  <th className="px-5 py-3 font-semibold text-center">Interviews Scheduled</th>
                  <th className="px-5 py-3 font-semibold text-center">Selected</th>
                  <th className="px-5 py-3 font-semibold text-center">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {customerData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">No client data available for this range</td>
                  </tr>
                ) : (
                  customerData.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{c._id || 'General'}</td>
                      <td className="px-5 py-3.5 text-center">{c.shared}</td>
                      <td className="px-5 py-3.5 text-center">{c.interviews}</td>
                      <td className="px-5 py-3.5 text-center text-blue-600 font-semibold">{c.selected}</td>
                      <td className="px-5 py-3.5 text-center text-emerald-600 font-semibold">{c.joined}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── VIEW: DIVISION WISE ─── */}
      {activeView === 'division' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Division Performance Breakdown</h3>
            <span className="text-slate-400 text-xs">Grouped by ATS Division</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-semibold">ATS Division</th>
                  <th className="px-5 py-3 font-semibold text-center">Profiles Shared</th>
                  <th className="px-5 py-3 font-semibold text-center">Interviews Scheduled</th>
                  <th className="px-5 py-3 font-semibold text-center">Selected</th>
                  <th className="px-5 py-3 font-semibold text-center">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {divisionData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">No division data available</td>
                  </tr>
                ) : (
                  divisionData.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{d._id || 'BPO'} Division</td>
                      <td className="px-5 py-3.5 text-center">{d.shared}</td>
                      <td className="px-5 py-3.5 text-center">{d.interviews}</td>
                      <td className="px-5 py-3.5 text-center text-blue-600 font-semibold">{d.selected}</td>
                      <td className="px-5 py-3.5 text-center text-emerald-600 font-semibold">{d.joined}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── VIEW: AGING REPORT ─── */}
      {activeView === 'aging' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Applied', 'Screening', 'Interview', 'Offer', 'Joining'].map(stg => {
              const avgDays = agingData.avgStageAging?.[stg] || 0;
              return (
                <div key={stg} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                  <div className="text-2xl text-violet-600 font-bold">{avgDays} Days</div>
                  <div className="text-slate-500 text-xs mt-0.5 font-medium">{stg} Stage (Avg)</div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Pipeline Candidates Aging Details</h3>
              <span className="text-xs text-slate-400">Showing active candidates in process</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3 font-semibold">Candidate Name</th>
                    <th className="px-5 py-3 font-semibold">Current Stage</th>
                    <th className="px-5 py-3 font-semibold">Detailed Status</th>
                    <th className="px-5 py-3 font-semibold">Pending Since</th>
                    <th className="px-5 py-3 font-semibold">Days Pending</th>
                    <th className="px-5 py-3 font-semibold">Recruiter</th>
                    <th className="px-5 py-3 font-semibold">Team Lead</th>
                    <th className="px-5 py-3 font-semibold">Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {(!agingData.candidates || agingData.candidates.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">No active candidates in the pipeline</td>
                    </tr>
                  ) : (
                    agingData.candidates.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{c.name}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">{c.stage}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{c.status}</td>
                        <td className="px-5 py-3.5 text-slate-600">{c.pendingSince ? new Date(c.pendingSince).toLocaleDateString() : '--'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 text-xs rounded font-semibold ${
                            c.daysPending > 15 ? 'bg-red-50 text-red-600' :
                            c.daysPending > 7 ? 'bg-amber-50 text-amber-600' :
                            'bg-green-50 text-green-600'
                          }`}>
                            {c.daysPending} days
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{c.recruiter}</td>
                        <td className="px-5 py-3.5 text-slate-600">{c.teamLead || '--'}</td>
                        <td className="px-5 py-3.5 text-slate-600">{c.manager || '--'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW: CONVERSION RATIO ─── */}
      {activeView === 'conversion' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Recruiter Conversion Ratio</h3>
            <span className="text-slate-400 text-xs">Profiles shared to achieve selections & joins</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-semibold">Recruiter</th>
                  <th className="px-5 py-3 font-semibold text-center">Shared Profiles</th>
                  <th className="px-5 py-3 font-semibold text-center">Interviews</th>
                  <th className="px-5 py-3 font-semibold text-center">Selected</th>
                  <th className="px-5 py-3 font-semibold text-center">Joined</th>
                  <th className="px-5 py-3 font-semibold text-center text-blue-600">Shared : Select</th>
                  <th className="px-5 py-3 font-semibold text-center text-emerald-600">Shared : Join</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {conversionData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">No conversion metrics available</td>
                  </tr>
                ) : (
                  conversionData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{r.recruiter}</td>
                      <td className="px-5 py-3.5 text-center">{r.shared}</td>
                      <td className="px-5 py-3.5 text-center">{r.interviews}</td>
                      <td className="px-5 py-3.5 text-center text-blue-600 font-semibold">{r.selected}</td>
                      <td className="px-5 py-3.5 text-center text-emerald-600 font-semibold">{r.joined}</td>
                      <td className="px-5 py-3.5 text-center text-blue-700 font-bold bg-blue-50/30">{r.sharedPerSelect}</td>
                      <td className="px-5 py-3.5 text-center text-emerald-700 font-bold bg-emerald-50/30">{r.sharedPerJoin}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
