import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, TrendingUp, Users, UserCheck, Award, Clock, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────
interface Overview {
  totalCandidates: number;
  selectedCandidates: number;
  joinedCandidates: number;
  offersReleased: number;
  offersAccepted: number;
  offerAcceptanceRate: number;
  joinRatio: number;
  avgTimeToFill: number | null;
  conversionRate: number;
}

interface SourceRow {
  source: string;
  total: number;
  hired: number;
  conversionRate: number;
}

interface RecruiterRow {
  recruiterId: string;
  recruiterName: string;
  screened: number;
  selected: number;
  joined: number;
  conversionRate: number;
}

interface AnalyticsData {
  period: string;
  overview: Overview;
  sourcePerformance: SourceRow[];
  recruiterMetrics: RecruiterRow[];
}

// ─── Helpers ─────────────────────────────────────────────────
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);
const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

// ─── KPI Card ────────────────────────────────────────────────
function KpiCard({
  label, value, suffix = '', icon: Icon, color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>{label}</p>
        <p className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem', lineHeight: 1.1 }}>
          {value}<span className="text-sm text-slate-400 ml-1">{suffix}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export function AnalyticsPage() {
  const now = new Date();
  const [year, setYear] = useState(String(THIS_YEAR));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async (yr: string, mo: string) => {
    setLoading(true);
    setError('');
    try {
      const period = `${yr}-${mo}`;
      const res = await fetch(`/api/analytics/kpis?period=${period}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(year, month);
  }, [year, month]);

  const ov = data?.overview;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.5rem' }}>
            Recruitment Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">KPI dashboard — track hiring performance by period</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
          >
            {YEARS.map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Candidates" value={ov?.totalCandidates ?? 0} icon={Users} color="bg-blue-500" />
            <KpiCard label="Selected" value={ov?.selectedCandidates ?? 0} icon={UserCheck} color="bg-green-500" />
            <KpiCard label="Joined" value={ov?.joinedCandidates ?? 0} icon={Award} color="bg-emerald-600" />
            <KpiCard label="Offers Released" value={ov?.offersReleased ?? 0} icon={TrendingUp} color="bg-teal-500" />
            <KpiCard label="Offer Acceptance Rate" value={ov?.offerAcceptanceRate ?? 0} suffix="%" icon={TrendingUp} color="bg-purple-500" />
            <KpiCard label="Join Ratio" value={ov?.joinRatio ?? 0} suffix="%" icon={BarChart2} color="bg-orange-500" />
            <KpiCard
              label="Avg Time to Fill"
              value={ov?.avgTimeToFill != null ? ov.avgTimeToFill : 'N/A'}
              suffix={ov?.avgTimeToFill != null ? 'days' : ''}
              icon={Clock}
              color="bg-rose-500"
            />
            <KpiCard label="Conversion Rate" value={ov?.conversionRate ?? 0} suffix="%" icon={TrendingUp} color="bg-indigo-500" />
          </div>

          {/* Source Performance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-green-600" />
              <h2 className="text-slate-800" style={{ fontWeight: 600 }}>Source Performance</h2>
            </div>

            {data.sourcePerformance.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">No source data for this period.</p>
            ) : (
              <>
                {/* Bar Chart */}
                <div className="px-6 pt-4 pb-2" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.sourcePerformance} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Total" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="hired" name="Hired" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-t border-slate-100">
                        <th className="text-left px-6 py-3 text-slate-600 font-semibold">Source</th>
                        <th className="text-right px-6 py-3 text-slate-600 font-semibold">Total</th>
                        <th className="text-right px-6 py-3 text-slate-600 font-semibold">Hired</th>
                        <th className="text-right px-6 py-3 text-slate-600 font-semibold">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sourcePerformance.map((row, i) => (
                        <tr key={row.source} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
                          <td className="px-6 py-3 text-slate-700 font-medium">{row.source}</td>
                          <td className="px-6 py-3 text-right text-slate-600">{row.total}</td>
                          <td className="px-6 py-3 text-right text-slate-600">{row.hired}</td>
                          <td className="px-6 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              row.conversionRate >= 50 ? 'bg-green-100 text-green-700'
                                : row.conversionRate >= 25 ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {row.conversionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Recruiter Performance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <h2 className="text-slate-800" style={{ fontWeight: 600 }}>Recruiter Performance</h2>
            </div>

            {data.recruiterMetrics.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">No recruiter data for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-t border-slate-100">
                      <th className="text-left px-6 py-3 text-slate-600 font-semibold">Recruiter</th>
                      <th className="text-right px-6 py-3 text-slate-600 font-semibold">Screened</th>
                      <th className="text-right px-6 py-3 text-slate-600 font-semibold">Selected</th>
                      <th className="text-right px-6 py-3 text-slate-600 font-semibold">Joined</th>
                      <th className="text-right px-6 py-3 text-slate-600 font-semibold">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recruiterMetrics.map((row, i) => (
                      <tr key={row.recruiterId} className={i % 2 === 0 ? '' : 'bg-slate-50'}>
                        <td className="px-6 py-3 text-slate-700 font-medium">{row.recruiterName}</td>
                        <td className="px-6 py-3 text-right text-slate-600">{row.screened}</td>
                        <td className="px-6 py-3 text-right text-slate-600">{row.selected}</td>
                        <td className="px-6 py-3 text-right text-slate-600">{row.joined}</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.conversionRate >= 50 ? 'bg-green-100 text-green-700'
                              : row.conversionRate >= 25 ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {row.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
