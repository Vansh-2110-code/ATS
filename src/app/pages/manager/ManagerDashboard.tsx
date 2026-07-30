import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, BarChart2, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../services/api';

const PIE_COLORS = ['#16A34A', '#7C3AED', '#059669', '#D97706', '#DC2626'];

export function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [conversionData, setConversionData] = useState<any[]>([]);
  const [recruiterData, setRecruiterData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getManagerDashboard();
        const rawFunnel = data.funnelData || data.conversionData || data.funnel || [];
        setConversionData(rawFunnel.map((f: any) => ({
          month: f.month,
          resumes: f.resumes ?? f.applied ?? 0,
          interviews: f.interviews ?? f.interviewed ?? 0,
          hired: f.hired ?? f.selected ?? f.joined ?? 0,
        })));
        setRecruiterData((data.recruiterProductivity || data.recruiterData || []).map((r: any) => ({
          ...r,
          placed: r.placed ?? r.placements ?? 0,
        })));
        const src = (data.sourceDistribution || data.sourceData || []).map((s: any, i: number) => ({
          name: s.name || s.source || '',
          value: s.value ?? s.count ?? 0,
          color: s.color || PIE_COLORS[i % PIE_COLORS.length],
        }));
        setSourceData(src);
        setRevenueData(data.revenueData || data.revenueTrend || []);
        const kpiData = data.kpis || data.summary || {};
        setKpis({
          ...kpiData,
          conversionRate: kpiData.conversionRate ?? kpiData.interviewToHireRate ?? '—',
        });
      } catch (err) {
        console.error('Failed to load manager dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.5rem' }}>Manager Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Performance snapshot — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <Link to="/manager/reports" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700" style={{ fontWeight: 500 }}>
          <BarChart2 className="w-4 h-4" /> Full Report
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
                  { label: 'Total Placements', value: kpis.totalPlacements ?? '—',        sub: 'This month',    trend: kpis.placementsTrend || '+0%',  up: (kpis.placementsTrend || '').startsWith('+'),  icon: Users,      color: 'blue',    adminOnly: false, href: '/manager/reports' },
          { label: 'Interview → Hire', value: kpis.conversionRate ?? '—',     sub: 'Conversion',    trend: kpis.conversionTrend || '+0%', up: (kpis.conversionTrend || '').startsWith('+'),  icon: TrendingUp, color: 'emerald', adminOnly: false, href: '/manager/reports' },
          { label: 'Revenue Earned',   value: kpis.revenue ? fmt(kpis.revenue) : '—', sub: 'This month',    trend: kpis.revenueTrend || '+0%',  up: (kpis.revenueTrend || '').startsWith('+'),  icon: DollarSign, color: 'violet',  adminOnly: true,  href: '/revenue'  },
          { label: 'Avg Time to Hire', value: kpis.avgTimeToHire ?? '—', sub: 'From source',   trend: kpis.timeToHireTrend || '0d', up: (kpis.timeToHireTrend || '').startsWith('-'),  icon: Calendar,   color: 'amber',   adminOnly: false, href: '/manager/reports' },
        ]
          .filter(m => !m.adminOnly || isAdmin)
          .map((m, i) => {
            const Icon = m.icon;
            const bg: Record<string, string> = {
              blue: 'bg-green-50 text-green-600',
              emerald: 'bg-emerald-50 text-emerald-600',
              violet: 'bg-violet-50 text-violet-600',
              amber: 'bg-amber-50 text-amber-600',
            };
            return (
              <button key={i} onClick={() => navigate(m.href)}
                className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all w-full">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg[m.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-slate-800 mb-0.5" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{m.value}</div>
                <div className="text-slate-500 text-xs mb-1.5">{m.sub}</div>
                <div className={`text-xs flex items-center gap-1 ${m.up ? 'text-emerald-600' : 'text-red-500'}`} style={{ fontWeight: 500 }}>
                  {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {m.trend} vs last month
                </div>
              </button>
            );
          })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Resume to Interview to Hire */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Recruitment Funnel (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={conversionData} barSize={16} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="resumes" name="Resumes" fill="#BBF7D0" radius={[3, 3, 0, 0]} />
              <Bar dataKey="interviews" name="Interviews" fill="#4ADE80" radius={[3, 3, 0, 0]} />
              <Bar dataKey="hired" name="Hired" fill="#16A34A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Revenue Trend (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [fmt(v), 'Revenue']}
                contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2.5} dot={{ fill: '#16A34A', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recruiter Productivity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Recruiter Productivity — Today</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recruiterData} barSize={20} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="calls" name="Calls" fill="#BBF7D0" radius={[3, 3, 0, 0]} />
              <Bar dataKey="interviews" name="Interviews" fill="#4ADE80" radius={[3, 3, 0, 0]} />
              <Bar dataKey="placed" name="Placed" fill="#16A34A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Candidate Source</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                {sourceData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {sourceData.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                </div>
                <span className="text-slate-500" style={{ fontWeight: 500 }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
