import { useState, useEffect } from 'react';
import {
  Users, LogIn, LogOut, Clock, Calendar, Search,
  Download, Loader2, Monitor, Wifi, TrendingUp, Activity,
} from 'lucide-react';
import api from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  Present: 'bg-emerald-100 text-emerald-700',
  WFH: 'bg-blue-100 text-blue-700',
  Absent: 'bg-red-100 text-red-600',
  'Half Day': 'bg-amber-100 text-amber-700',
  Leave: 'bg-purple-100 text-purple-700',
};

function fmt2(n: number) {
  return String(n).padStart(2, '0');
}

function hoursLabel(h: number) {
  if (!h) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${fmt2(mins)}m` : `${hrs}h`;
}

export function TLActivityPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [tls, setTls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tlFilter, setTlFilter] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { from: fromDate, to: toDate };
      if (tlFilter) params.userId = tlFilter;
      const data = await api.getTLActivity(params);
      setRecords(data.records || []);
      setTls(data.tls || []);
    } catch (err) {
      console.error('Failed to load TL activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [fromDate, toDate, tlFilter]);

  const filtered = records.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary metrics
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date?.startsWith(today));
  const loggedInToday = todayRecords.filter(r => r.loginTime).length;
  const avgHours = records.length > 0
    ? records.filter(r => r.totalHours > 0).reduce((s, r) => s + r.totalHours, 0) /
      Math.max(1, records.filter(r => r.totalHours > 0).length)
    : 0;
  const wfhCount = todayRecords.filter(r => r.isWFH).length;

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Date', 'Login Time', 'Logout Time', 'Total Hours', 'Status', 'WFH'],
      ...filtered.map(r => [
        r.name, r.email,
        r.date ? new Date(r.date).toLocaleDateString('en-IN') : '',
        r.loginHHMM || '—',
        r.logoutHHMM || '—',
        r.totalHours ? hoursLabel(r.totalHours) : '—',
        r.status || '—',
        r.isWFH ? 'Yes' : 'No',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tl-activity-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800 text-xl" style={{ fontWeight: 700 }}>TL Login Activity</h1>
          <p className="text-slate-500 text-sm mt-0.5">Team Leader login & logout history</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
          style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <LogIn className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-slate-500 text-xs" style={{ fontWeight: 500 }}>Logged In Today</span>
          </div>
          <p className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>{loggedInToday}</p>
          <p className="text-slate-400 text-xs mt-0.5">of {tls.length} TLs</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-slate-500 text-xs" style={{ fontWeight: 500 }}>WFH Today</span>
          </div>
          <p className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>{wfhCount}</p>
          <p className="text-slate-400 text-xs mt-0.5">working from home</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-slate-500 text-xs" style={{ fontWeight: 500 }}>Avg Hours</span>
          </div>
          <p className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>{hoursLabel(avgHours)}</p>
          <p className="text-slate-400 text-xs mt-0.5">per session (range)</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-slate-500 text-xs" style={{ fontWeight: 500 }}>Total Sessions</span>
          </div>
          <p className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>{records.length}</p>
          <p className="text-slate-400 text-xs mt-0.5">in selected range</p>
        </div>
      </div>

      {/* TL Last Login Summary */}
      {tls.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-slate-700 text-sm mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Users className="w-4 h-4 text-violet-500" /> Team Leaders — Last Login
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tls.map((tl: any) => {
              const todayRecord = records.find(r =>
                String(r.userId) === String(tl._id) && r.date?.startsWith(today)
              );
              const isOnline = todayRecord && todayRecord.loginTime && !todayRecord.logoutTime;
              return (
                <div key={tl._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="relative">
                    <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-700 text-sm" style={{ fontWeight: 700 }}>
                        {tl.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm truncate" style={{ fontWeight: 500 }}>{tl.name}</p>
                    <p className="text-slate-400 text-xs">
                      {tl.lastLogin
                        ? `Last login: ${new Date(tl.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                        : 'Never logged in'}
                    </p>
                  </div>
                  {isOnline && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>Online</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Search Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Filter by name..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-400" />
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Team Leader</label>
            <select value={tlFilter} onChange={e => setTlFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-400">
              <option value="">All TLs</option>
              {tls.map((tl: any) => <option key={tl._id} value={tl._id}>{tl.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-400" />
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
            Login Sessions
            <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
              {filtered.length}
            </span>
          </h2>
          {loading && <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />}
        </div>

        {filtered.length === 0 && !loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No login activity found for the selected range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs text-slate-500" style={{ fontWeight: 600 }}>Name</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500" style={{ fontWeight: 600 }}>Date</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500" style={{ fontWeight: 600 }}>
                    <span className="flex items-center gap-1"><LogIn className="w-3 h-3 text-emerald-500" /> Login</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500" style={{ fontWeight: 600 }}>
                    <span className="flex items-center gap-1"><LogOut className="w-3 h-3 text-red-400" /> Logout</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500" style={{ fontWeight: 600 }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Hours</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500" style={{ fontWeight: 600 }}>Status</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500" style={{ fontWeight: 600 }}>Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r: any) => {
                  const isToday = r.date?.startsWith(today);
                  const stillOnline = isToday && r.loginTime && !r.logoutTime;
                  return (
                    <tr key={r._id} className={`hover:bg-slate-50 transition-colors ${isToday ? 'bg-violet-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-violet-700 text-xs" style={{ fontWeight: 700 }}>
                                {r.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            {stillOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-slate-700" style={{ fontWeight: 500 }}>{r.name}</p>
                            {stillOnline && <p className="text-emerald-600 text-xs">Currently online</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' }) : '—'}
                          {isToday && <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded ml-1" style={{ fontWeight: 500 }}>Today</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.loginHHMM
                          ? <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs" style={{ fontWeight: 600 }}>{r.loginHHMM}</span>
                          : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.logoutHHMM
                          ? <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs" style={{ fontWeight: 600 }}>{r.logoutHHMM}</span>
                          : stillOnline
                            ? <span className="text-amber-600 text-xs">Active session</span>
                            : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {r.totalHours > 0
                          ? <span className={`px-2 py-0.5 rounded ${r.totalHours >= 8 ? 'bg-emerald-50 text-emerald-700' : r.totalHours >= 4 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`} style={{ fontWeight: 600 }}>
                              {hoursLabel(r.totalHours)}
                            </span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-500'}`} style={{ fontWeight: 500 }}>
                          {r.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.isWFH
                          ? <span className="flex items-center gap-1 text-blue-600 text-xs"><Wifi className="w-3 h-3" /> WFH</span>
                          : <span className="flex items-center gap-1 text-slate-400 text-xs"><Monitor className="w-3 h-3" /> Office</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
