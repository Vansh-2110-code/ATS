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

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

<<<<<<< HEAD
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;
=======
  // 4 New Specific Reports Datasets
  const [activeJRsData, setActiveJRsData] = useState<any[]>([]);
  const [activeProfilesData, setActiveProfilesData] = useState<any[]>([]);
  const [expectedRevenueData, setExpectedRevenueData] = useState<{
    customerRevenue: any[];
    divisionRevenue: any[];
    totalExpectedRevenue: number;
  }>({ customerRevenue: [], divisionRevenue: [], totalExpectedRevenue: 0 });
  const [leadPerformanceData, setLeadPerformanceData] = useState<any[]>([]);
  const [teamWiseData, setTeamWiseData] = useState<{ teams: any[]; unassignedMembers: any[] }>({ teams: [], unassignedMembers: [] });
  const [leadPerfMode, setLeadPerfMode] = useState<'team-wise' | 'flat'>('team-wise');

  // Sub-filters for views
  const [activeJRSearch, setActiveJRSearch] = useState('');
  const [activeProfileFilter, setActiveProfileFilter] = useState<string>('All');
  const [revenueSubView, setRevenueSubView] = useState<'joined-candidates' | 'customer' | 'division'>('joined-candidates');
  const [expandedJR, setExpandedJR] = useState<string | null>(null);

  const fmt = (n: number) => {
    if (!n) return '₹0';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    return `₹${(n / 1000).toFixed(0)} K`;
  };
>>>>>>> d278b7f (fix: resolve multiple issues - status counts, joining form validation, copy contact, quick search filters)

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

<<<<<<< HEAD
=======
      // New 4 Reports
      setActiveJRsData(advData.activeJRsReport || []);
      setActiveProfilesData(advData.activeProfilesReport || []);
      setExpectedRevenueData(advData.expectedRevenueReport || { customerRevenue: [], divisionRevenue: [], totalExpectedRevenue: 0 });
      setLeadPerformanceData(advData.leadRecruiterPerformanceReport || []);
      setTeamWiseData(advData.teamWisePerformanceReport || { teams: [], unassignedMembers: [] });

>>>>>>> d278b7f (fix: resolve multiple issues - status counts, joining form validation, copy contact, quick search filters)
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

<<<<<<< HEAD
=======
  // Filtered Active Profiles
  const filteredActiveProfiles = activeProfilesData.filter(c => {
    if (activeProfileFilter === 'All') return true;
    if (activeProfileFilter === 'Documentation') return ['Documentation', 'Document Pending', 'Documents Pending'].includes(c.status);
    if (activeProfileFilter === 'Pending Customer') return ['HR Shortlist', 'SPOC Shortlisted', 'Selected for Call', 'Operations Round', 'Interview Scheduled', 'Written Test'].includes(c.status);
    if (activeProfileFilter === 'Yet To Join') return ['Yet To Join', 'Joining Date Confirmed', 'Joining Postponed'].includes(c.status);
    if (activeProfileFilter === 'Screening') return ['Screening', 'Contacted', 'Interested', 'Selected for Call', 'Eligible Candidates', 'Call Back'].includes(c.status);
    return true;
  });

  // Filtered Active JRs
  const filteredActiveJRs = activeJRsData.filter(j =>
    !activeJRSearch.trim() ||
    j.jrNumber.toLowerCase().includes(activeJRSearch.toLowerCase()) ||
    j.customerName.toLowerCase().includes(activeJRSearch.toLowerCase()) ||
    j.jobTitle.toLowerCase().includes(activeJRSearch.toLowerCase()) ||
    j.skills.toLowerCase().includes(activeJRSearch.toLowerCase())
  );

  // Generic CSV exporter for current view
  const exportCurrentViewCSV = () => {
    let filename = `report_${activeView}_${dateFrom}_${dateTo}.csv`;
    let csv = '';

    if (activeView === 'active-jr') {
      filename = `active_jr_report_${dateFrom}_${dateTo}.csv`;
      csv = 'JR Number,Customer Name,Job Title,Skills,Open Positions,Active Pipeline,Screening,Interview,Offered,Yet To Join,Joined,Creator / Owner,Status\n' +
        filteredActiveJRs.map(j => `"${j.jrNumber}","${j.customerName}","${j.jobTitle}","${j.skills.replace(/"/g, '""')}",${j.positions},${j.activeProfilesCount},${j.screeningCount || 0},${j.interviewCount || 0},${j.offeredCount || 0},${j.yetToJoinCount || 0},${j.joinedCount || 0},"${j.createdBy}","${j.status}"`).join('\n');
    } else if (activeView === 'active-profiles') {
      filename = `active_profiles_report_${dateFrom}_${dateTo}.csv`;
      csv = 'Candidate Name,Phone,Email,Position Applied,Customer Name,Active Status,JR Number,Recruiter,Days Pending,Last Updated\n' +
        filteredActiveProfiles.map(c => `"${c.name}","${c.phone}","${c.email}","${c.positionApplied}","${c.clientName}","${c.status}","${c.jrNumber}","${c.recruiter}",${c.daysPending},"${c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ''}"`).join('\n');
    } else if (activeView === 'expected-revenue') {
      filename = `joined_candidates_revenue_report_${dateFrom}_${dateTo}.csv`;
      if (revenueSubView === 'joined-candidates') {
        csv = 'Candidate Name,Customer Name,Position / Division,Offered CTC,Date of Joining,Placement Revenue,Recruiter\n' +
          ((expectedRevenueData as any).joinedCandidates || []).map((c: any) => `"${c.name}","${c.customerName}","${c.positionApplied} / ${c.division}",${c.ctc},"${c.doj}",${c.revenue},"${c.recruiter}"`).join('\n');
      } else if (revenueSubView === 'customer') {
        csv = 'Customer Name,Joined Count,Actual Joined Revenue\n' +
          expectedRevenueData.customerRevenue.map(c => `"${c.customerName}",${c.joinedCount},${c.actualJoinedRevenue}`).join('\n');
      } else {
        csv = 'Division,Joined Count,Actual Joined Revenue\n' +
          expectedRevenueData.divisionRevenue.map(d => `"${d.division}",${d.joinedCount},${d.actualJoinedRevenue}`).join('\n');
      }
    } else if (activeView === 'lead-performance') {
      filename = `lead_recruiter_performance_${dateFrom}_${dateTo}.csv`;
      let rows: string[] = [];
      rows.push('Team Lead / Recruiter,Employee ID,Role,Profiles Submitted,Selects,Joinees,Joinees vs Submitted %,Joinees vs Selects %');
      
      (teamWiseData.teams || []).forEach(team => {
        const tl = team.teamLeader;
        rows.push(`"TEAM LEAD: ${tl.name}","${tl.employeeId}","Team Lead",${tl.totalSubmitted},${tl.totalSelects},${tl.totalJoinees},"${tl.totalJoineesVsSubmittedRatio}","${tl.totalJoineesVsSelectsRatio}"`);
        (team.members || []).forEach((m: any) => {
          rows.push(`"  └─ ${m.name}","${m.employeeId}","Recruiter",${m.submitted},${m.selects},${m.joinees},"${m.joineesVsSubmittedRatio}","${m.joineesVsSelectsRatio}"`);
        });
      });

      if ((teamWiseData.unassignedMembers || []).length > 0) {
        rows.push('"--- DIRECT / UNASSIGNED RECRUITERS ---",,,,,,,');
        (teamWiseData.unassignedMembers || []).forEach((m: any) => {
          rows.push(`"${m.name}","${m.employeeId}","Recruiter",${m.submitted},${m.selects},${m.joinees},"${m.joineesVsSubmittedRatio}","${m.joineesVsSelectsRatio}"`);
        });
      }

      csv = rows.join('\n');
    } else {
      csv = 'Recruiter,Calls,Interviews,Placed,Conv Rate,Revenue\n' +
        performanceData.map((r: any) => `"${r.recruiter}",${r.calls},${r.interviews},${r.placed},"${r.convRate}",${r.revenue}`).join('\n');
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

>>>>>>> d278b7f (fix: resolve multiple issues - status counts, joining form validation, copy contact, quick search filters)
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

<<<<<<< HEAD
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
=======
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3 font-semibold">JR Number</th>
                    <th className="px-4 py-3 font-semibold">Customer / Client</th>
                    <th className="px-4 py-3 font-semibold">Job Title</th>
                    <th className="px-4 py-3 font-semibold">Required Skills</th>
                    <th className="px-4 py-3 font-semibold text-center">Open Positions</th>
                    <th className="px-4 py-3 font-semibold text-center">Pipeline Breakdown (Screening / Int / Offer / YTJ / Joined)</th>
                    <th className="px-4 py-3 font-semibold">Raised By / Owner</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredActiveJRs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">No active job requisitions found matching your search.</td>
                    </tr>
                  ) : (
                    filteredActiveJRs.map(j => (
                      <Fragment key={j._id}>
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-blue-600">{j.jrNumber}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">{j.customerName}</td>
                          <td className="px-4 py-3.5 font-medium">{j.jobTitle}</td>
                          <td className="px-4 py-3.5 max-w-xs truncate text-slate-600" title={j.skills}>{j.skills}</td>
                          <td className="px-4 py-3.5 text-center font-semibold text-slate-800">{j.positions}</td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100" title="Screening">
                                Scr: {j.screeningCount || 0}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100" title="Interview">
                                Int: {j.interviewCount || 0}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100" title="Offered">
                                Off: {j.offeredCount || 0}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-100" title="Yet To Join">
                                YTJ: {j.yetToJoinCount || 0}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100" title="Joined">
                                Jnd: {j.joinedCount || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-700">{j.createdBy}</td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setExpandedJR(expandedJR === j._id ? null : j._id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {expandedJR === j._id ? 'Hide Candidates' : `View (${j.activeProfilesCount})`}
                            </button>
                          </td>
                        </tr>
                        {/* Expanded Candidate Pipeline */}
                        {expandedJR === j._id && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={8} className="p-4">
                              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                                <h4 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-blue-600" />
                                  Active Pipeline Candidates for {j.jrNumber} – {j.jobTitle} ({j.activeCandidates.length})
                                </h4>
                                {j.activeCandidates.length === 0 ? (
                                  <p className="text-slate-400 text-xs italic">No active candidates linked to this JR currently in progress.</p>
                                ) : (
                                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {j.activeCandidates.map((c: any) => (
                                      <div key={c._id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                                        <div className="font-bold text-slate-800">{c.name}</div>
                                        <div className="text-slate-500">{c.phone} · {c.email || 'No email'}</div>
                                        <div className="mt-1 flex items-center justify-between text-[11px]">
                                          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">{c.status}</span>
                                          <span className="text-slate-400">{c.recruiter}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. ACTIVE STATUS PROFILES REPORT VIEW */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeView === 'active-profiles' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-slate-800 font-bold text-sm">Active Pipeline Profiles Report</h3>
              <p className="text-slate-500 text-xs mt-0.5">Filter active candidates across Documentation, Pending with Customer, Yet to Join & Screening</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Documentation', 'Pending Customer', 'Yet To Join', 'Screening'].map(flt => (
                <button
                  key={flt}
                  onClick={() => setActiveProfileFilter(flt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeProfileFilter === flt
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {flt}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3 font-semibold">Candidate Name</th>
                    <th className="px-4 py-3 font-semibold">Contact Info</th>
                    <th className="px-4 py-3 font-semibold">Position Applied</th>
                    <th className="px-4 py-3 font-semibold">Customer / Client</th>
                    <th className="px-4 py-3 font-semibold">Active Status</th>
                    <th className="px-4 py-3 font-semibold">JR Number</th>
                    <th className="px-4 py-3 font-semibold">Recruiter</th>
                    <th className="px-4 py-3 font-semibold text-center">Days Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {filteredActiveProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">No active profiles matching the selected status filter.</td>
                    </tr>
                  ) : (
                    filteredActiveProfiles.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{c.name}</td>
                        <td className="px-4 py-3.5 text-slate-500">{c.phone} {c.email ? `· ${c.email}` : ''}</td>
                        <td className="px-4 py-3.5 font-medium">{c.positionApplied}</td>
                        <td className="px-4 py-3.5 font-semibold text-blue-600">{c.clientName}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">{c.jrNumber}</td>
                        <td className="px-4 py-3.5 text-slate-600">{c.recruiter}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-semibold ${
                            c.daysPending > 14 ? 'bg-red-100 text-red-700' :
                            c.daysPending > 7 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {c.daysPending} days
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. JOINED CANDIDATES REVENUE REPORT VIEW */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeView === 'expected-revenue' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-slate-800 font-bold text-sm">Joined Candidates Revenue Report</h3>
              <p className="text-slate-500 text-xs mt-0.5">Comprehensive tracking of Joined candidates with offered CTC, Date of Joining (DOJ), and actual revenue</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRevenueSubView('joined-candidates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  revenueSubView === 'joined-candidates' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Joined Candidates List
              </button>
              <button
                onClick={() => setRevenueSubView('customer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  revenueSubView === 'customer' ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Customer Breakdown
              </button>
              <button
                onClick={() => setRevenueSubView('division')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  revenueSubView === 'division' ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Division Breakdown
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-slate-700 font-semibold text-xs">Total Joined Placements: <strong className="text-emerald-700 font-bold">{(expectedRevenueData as any).totalJoinedCount || 0}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-semibold text-xs">Total Revenue Generated:</span>
                <span className="text-emerald-700 font-extrabold text-base">{fmt((expectedRevenueData as any).totalJoinedRevenue || (expectedRevenueData as any).totalExpectedRevenue)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {revenueSubView === 'joined-candidates' ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-3 font-semibold">Candidate Name</th>
                      <th className="px-5 py-3 font-semibold">Customer / Client Name</th>
                      <th className="px-5 py-3 font-semibold">Position / Division</th>
                      <th className="px-5 py-3 font-semibold text-right text-slate-700">Offered CTC</th>
                      <th className="px-5 py-3 font-semibold text-center text-slate-700">Date of Joining (DOJ)</th>
                      <th className="px-5 py-3 font-semibold text-right text-emerald-700">Placement Revenue</th>
                      <th className="px-5 py-3 font-semibold">Recruiter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {((expectedRevenueData as any).joinedCandidates || []).length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-slate-400">No joined candidates recorded in this date range.</td></tr>
                    ) : (
                      ((expectedRevenueData as any).joinedCandidates || []).map((c: any, i: number) => (
                        <tr key={c._id || i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{c.name}</td>
                          <td className="px-5 py-3.5 font-semibold text-blue-600">{c.customerName}</td>
                          <td className="px-5 py-3.5 text-slate-600">{c.positionApplied} <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold">{c.division}</span></td>
                          <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{c.ctc ? fmt(c.ctc) : '—'}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-emerald-700 bg-emerald-50/30">{c.doj}</td>
                          <td className="px-5 py-3.5 text-right font-extrabold text-emerald-700">{fmt(c.revenue)}</td>
                          <td className="px-5 py-3.5 text-slate-600">{c.recruiter}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : revenueSubView === 'customer' ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-3 font-semibold">Customer / Client Name</th>
                      <th className="px-5 py-3 font-semibold text-center">Joined Candidates</th>
                      <th className="px-5 py-3 font-semibold text-right text-emerald-700">Actual Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {expectedRevenueData.customerRevenue.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-10 text-slate-400">No customer revenue data available.</td></tr>
                    ) : (
                      expectedRevenueData.customerRevenue.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{r.customerName}</td>
                          <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">{r.joinedCount}</td>
                          <td className="px-5 py-3.5 text-right font-bold text-emerald-700">{fmt(r.actualJoinedRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-3 font-semibold">Division</th>
                      <th className="px-5 py-3 font-semibold text-center">Joined Candidates</th>
                      <th className="px-5 py-3 font-semibold text-right text-emerald-700">Actual Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {expectedRevenueData.divisionRevenue.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-10 text-slate-400">No division revenue data available.</td></tr>
                    ) : (
                      expectedRevenueData.divisionRevenue.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{r.division} Division</td>
                          <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">{r.joinedCount}</td>
                          <td className="px-5 py-3.5 text-right font-bold text-emerald-700">{fmt(r.actualJoinedRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. LEAD & RECRUITER PERFORMANCE REPORT VIEW (TEAM-WISE HIERARCHY) */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeView === 'lead-performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-slate-800 font-bold text-sm">Team Lead & Recruiter Performance Ratios</h3>
              <p className="text-slate-500 text-xs mt-0.5">Hierarchical breakdown by Team Lead, displaying team totals and individual recruiter ratios</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLeadPerfMode('team-wise')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  leadPerfMode === 'team-wise' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Team-Wise Hierarchy View
              </button>
              <button
                onClick={() => setLeadPerfMode('flat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  leadPerfMode === 'flat' ? 'bg-slate-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Members (Flat List)
              </button>
            </div>
          </div>

          {leadPerfMode === 'team-wise' ? (
            <div className="space-y-6">
              {(teamWiseData.teams || []).length === 0 && (teamWiseData.unassignedMembers || []).length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400">
                  No team performance data available for this selection.
                </div>
              ) : (
                <>
                  {(teamWiseData.teams || []).map((team: any, index: number) => {
                    const tl = team.teamLeader;
                    return (
                      <div key={tl.userId || index} className="bg-white rounded-xl border border-amber-200/70 shadow-sm overflow-hidden">
                        {/* Team Lead Header Banner */}
                        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-white p-4 border-b border-amber-200/70 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                              TL
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm">{tl.name}</h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  TEAM LEAD
                                </span>
                                <span className="text-slate-400 text-xs font-mono">({tl.employeeId})</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Team Members: <strong className="text-slate-700 font-semibold">{team.members.length} Recruiters</strong>
                              </p>
                            </div>
                          </div>

                          {/* Team Summary Ratios */}
                          <div className="flex items-center gap-4 flex-wrap bg-white/80 backdrop-blur px-4 py-2 rounded-lg border border-amber-100 text-xs">
                            <div className="text-center">
                              <div className="text-slate-400 text-[10px] font-medium uppercase">Team Submitted</div>
                              <div className="font-bold text-slate-800 text-sm">{tl.totalSubmitted}</div>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div className="text-center">
                              <div className="text-slate-400 text-[10px] font-medium uppercase">Team Selects</div>
                              <div className="font-bold text-blue-600 text-sm">{tl.totalSelects}</div>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div className="text-center">
                              <div className="text-slate-400 text-[10px] font-medium uppercase">Team Joinees</div>
                              <div className="font-extrabold text-emerald-600 text-sm">{tl.totalJoinees}</div>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div className="text-center">
                              <div className="text-blue-600 text-[10px] font-bold uppercase">Joinees / Submitted</div>
                              <div className="font-extrabold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded mt-0.5">{tl.totalJoineesVsSubmittedRatio}</div>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div className="text-center">
                              <div className="text-emerald-600 text-[10px] font-bold uppercase">Joinees / Selects</div>
                              <div className="font-extrabold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded mt-0.5">{tl.totalJoineesVsSelectsRatio}</div>
                            </div>
                          </div>
                        </div>

                        {/* Team Recruiters Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 uppercase tracking-wide">
                                <th className="px-5 py-3 font-semibold">Recruiter Name</th>
                                <th className="px-5 py-3 font-semibold">Employee ID</th>
                                <th className="px-5 py-3 font-semibold text-center">Profiles Submitted</th>
                                <th className="px-5 py-3 font-semibold text-center">Selects</th>
                                <th className="px-5 py-3 font-semibold text-center">Joinees</th>
                                <th className="px-5 py-3 font-semibold text-center text-blue-700 bg-blue-50/50">Joinees Vs Submitted</th>
                                <th className="px-5 py-3 font-semibold text-center text-emerald-700 bg-emerald-50/50">Joinees Vs Selects</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {team.members.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="text-center py-6 text-slate-400 italic">No recruiters currently assigned under this Team Lead.</td>
                                </tr>
                              ) : (
                                team.members.map((m: any) => (
                                  <tr key={m.userId} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                                      <span className="text-slate-400 font-mono text-[10px]">└─</span> {m.name}
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-slate-500">{m.employeeId}</td>
                                    <td className="px-5 py-3.5 text-center font-medium text-slate-800">{m.submitted}</td>
                                    <td className="px-5 py-3.5 text-center font-semibold text-blue-600">{m.selects}</td>
                                    <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{m.joinees}</td>
                                    <td className="px-5 py-3.5 text-center font-extrabold text-blue-700 bg-blue-50/30">
                                      {m.joineesVsSubmittedRatio} ({m.joinees}/{m.submitted})
                                    </td>
                                    <td className="px-5 py-3.5 text-center font-extrabold text-emerald-700 bg-emerald-50/30">
                                      {m.joineesVsSelectsRatio} ({m.joinees}/{m.selects})
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  {/* Direct / Unassigned Recruiters Section */}
                  {(teamWiseData.unassignedMembers || []).length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Direct / Unassigned Recruiters</h4>
                          <p className="text-xs text-slate-500">Recruiters not assigned to a specific Team Lead</p>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-bold text-xs">
                          {teamWiseData.unassignedMembers.length} Members
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 uppercase tracking-wide">
                              <th className="px-5 py-3 font-semibold">Recruiter Name</th>
                              <th className="px-5 py-3 font-semibold">Employee ID</th>
                              <th className="px-5 py-3 font-semibold text-center">Profiles Submitted</th>
                              <th className="px-5 py-3 font-semibold text-center">Selects</th>
                              <th className="px-5 py-3 font-semibold text-center">Joinees</th>
                              <th className="px-5 py-3 font-semibold text-center text-blue-700 bg-blue-50/50">Joinees Vs Submitted</th>
                              <th className="px-5 py-3 font-semibold text-center text-emerald-700 bg-emerald-50/50">Joinees Vs Selects</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {teamWiseData.unassignedMembers.map((m: any) => (
                              <tr key={m.userId} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-slate-900">{m.name}</td>
                                <td className="px-5 py-3.5 font-mono text-slate-500">{m.employeeId}</td>
                                <td className="px-5 py-3.5 text-center font-medium text-slate-800">{m.submitted}</td>
                                <td className="px-5 py-3.5 text-center font-semibold text-blue-600">{m.selects}</td>
                                <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{m.joinees}</td>
                                <td className="px-5 py-3.5 text-center font-extrabold text-blue-700 bg-blue-50/30">
                                  {m.joineesVsSubmittedRatio} ({m.joinees}/{m.submitted})
                                </td>
                                <td className="px-5 py-3.5 text-center font-extrabold text-emerald-700 bg-emerald-50/30">
                                  {m.joineesVsSelectsRatio} ({m.joinees}/{m.selects})
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Employee ID</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold text-center">Profiles Submitted</th>
                      <th className="px-4 py-3 font-semibold text-center">Selects</th>
                      <th className="px-4 py-3 font-semibold text-center">Joinees</th>
                      <th className="px-4 py-3 font-semibold text-center text-blue-700 bg-blue-50/50">Joinees Vs Submitted</th>
                      <th className="px-4 py-3 font-semibold text-center text-emerald-700 bg-emerald-50/50">Joinees Vs Selects</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {leadPerformanceData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">No performance activity recorded for this period.</td>
                      </tr>
                    ) : (
                      leadPerformanceData.map((l, i) => (
                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-900">{l.name}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-500">{l.employeeId}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${l.role.includes('Lead') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                              {l.role}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-medium">{l.submitted}</td>
                          <td className="px-4 py-3.5 text-center font-semibold text-blue-600">{l.selects}</td>
                          <td className="px-4 py-3.5 text-center font-bold text-emerald-600">{l.joinees}</td>
                          <td className="px-4 py-3.5 text-center font-extrabold text-blue-700 bg-blue-50/30">
                            {l.joineesVsSubmittedRatio} ({l.joinees}/{l.submitted})
                          </td>
                          <td className="px-4 py-3.5 text-center font-extrabold text-emerald-700 bg-emerald-50/30">
                            {l.joineesVsSelectsRatio} ({l.joinees}/{l.selects})
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. EXISTING VIEWS: RECRUITER, CUSTOMER, DIVISION, AGING, CONVERSION */}
      {/* ────────────────────────────────────────────────────────── */}
>>>>>>> d278b7f (fix: resolve multiple issues - status counts, joining form validation, copy contact, quick search filters)
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
