import { useState, useEffect } from 'react';
import { Search, Download, Phone, Activity, LogIn, LogOut, Edit3, Trash2, CheckCircle2, FilePlus, FileText, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../services/api';

type LogType = 'call' | 'status' | 'login' | 'logout' | 'edit' | 'delete' | 'create' | 'document' | 'reassign' | 'system';

interface Log {
  id: string;
  type: LogType;
  user: string;
  role: string;
  action: string;
  target?: string;
  details?: Record<string, { from: any; to: any }>;
  timestamp: string;
  ip: string;
}

const LOG_STYLES: Record<LogType, { bg: string; text: string; icon: React.ElementType }> = {
  call:     { bg: 'bg-green-100',  text: 'text-green-700',  icon: Phone },
  status:   { bg: 'bg-violet-100', text: 'text-violet-700', icon: Activity },
  login:    { bg: 'bg-emerald-100',text: 'text-emerald-700',icon: LogIn },
  logout:   { bg: 'bg-slate-100',  text: 'text-slate-500',  icon: LogOut },
  edit:     { bg: 'bg-amber-100',  text: 'text-amber-700',  icon: Edit3 },
  delete:   { bg: 'bg-red-100',    text: 'text-red-600',    icon: Trash2 },
  create:   { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: FilePlus },
  document: { bg: 'bg-sky-100',    text: 'text-sky-700',    icon: FileText },
  reassign: { bg: 'bg-orange-100', text: 'text-orange-700', icon: RefreshCw },
  system:   { bg: 'bg-slate-100',  text: 'text-slate-600',  icon: CheckCircle2 },
};

const LOG_TYPE_LABELS: Record<LogType, string> = {
  call: 'Call/Note', status: 'Status', login: 'Login', logout: 'Logout',
  edit: 'Edit', delete: 'Delete', create: 'Create', document: 'Document',
  reassign: 'Reassign', system: 'System',
};

const ALL_TYPES = Object.keys(LOG_TYPE_LABELS) as LogType[];

export function SystemLogsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const loadLogs = async (p = page) => {
    try {
      setLoading(true);
      const params: Record<string, string> = { date: dateFilter, page: String(p), limit: '100' };
      if (typeFilter !== 'All') params.type = typeFilter;
      const data = await api.getLogs(params);
      const list = (data.logs || data || []).map((l: any) => ({
        id: l._id || l.id,
        type: l.type && LOG_STYLES[l.type as LogType] ? l.type : 'system',
        user: l.user?.name || l.userName || l.user || 'System',
        role: l.user?.role || l.userRole || l.role || '',
        action: l.action || l.message || '',
        target: l.target || l.targetName || undefined,
        details: l.details || undefined,
        timestamp: l.timestamp || l.createdAt || '',
        ip: l.ip || l.ipAddress || '',
      }));
      setLogs(list);
      setTotalPages(data.pagination?.pages || 1);
      setTotalLogs(data.pagination?.total || list.length);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadLogs(1);
  }, [dateFilter, typeFilter]);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.user.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      (l.target?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>System Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Complete audit trail of all system activity</p>
        </div>
        <button onClick={() => api.exportLogs({ date: dateFilter }).catch(() => {})} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors" style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user, action, or candidate..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 bg-white"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 bg-white"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('All')}
            className={`text-xs px-3 py-1.5 rounded-full ${typeFilter === 'All' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            style={{ fontWeight: 500 }}
          >
            All
          </button>
          {ALL_TYPES.map(t => {
            const s = LOG_STYLES[t];
            const Icon = s.icon;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                  typeFilter === t ? 'bg-green-600 text-white' : `${s.bg} ${s.text}`
                }`}
                style={{ fontWeight: 500 }}
              >
                <Icon className="w-3 h-3" />
                {LOG_TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Log Count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-500">
          {search ? `${filtered.length} matching` : totalLogs.toLocaleString()} log entries
          {totalPages > 1 && ` · page ${page} of ${totalPages}`}
        </p>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading logs…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">No log entries found for this date/filter.</div>
        )}
        {!loading && <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Type', 'User', 'Action', 'Target', 'Timestamp', 'IP'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(log => {
                const s = LOG_STYLES[log.type as LogType] || LOG_STYLES.system;
                const Icon = s.icon;
                return (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${s.bg} ${s.text}`} style={{ fontWeight: 500 }}>
                        <Icon className="w-3 h-3" />
                        {LOG_TYPE_LABELS[log.type]}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700 text-sm" style={{ fontWeight: 500 }}>{log.user}</p>
                      <p className="text-slate-400 text-xs">{log.role}</p>
                    </td>
                    <td className="px-5 py-3.5 max-w-[280px]">
                      <p className="text-slate-600 text-sm">{log.action}</p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {Object.entries(log.details).map(([field, { from, to }]) => (
                            <p key={field} className="text-xs text-slate-400">
                              <span className="text-slate-500">{field}:</span>{' '}
                              <span className="line-through text-red-400">{String(from || '—')}</span>
                              {' → '}
                              <span className="text-emerald-600">{String(to || '—')}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.target ? (
                        <span className="text-green-600 text-sm font-mono text-xs">{log.target.length > 24 ? log.target.slice(-8) : log.target}</span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{log.ip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}

        {!loading && <div className="md:hidden divide-y divide-slate-100">
          {filtered.map(log => {
            const s = LOG_STYLES[log.type as LogType] || LOG_STYLES.system;
            const Icon = s.icon;
            return (
              <div key={log.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                    <Icon className={`w-4 h-4 ${s.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm" style={{ fontWeight: 500 }}>{log.user} <span className="text-slate-400 text-xs">({log.role})</span></p>
                    <p className="text-slate-500 text-sm mt-0.5">{log.action}</p>
                    {log.target && <p className="text-green-600 text-xs mt-0.5">→ {log.target}</p>}
                    <p className="text-slate-400 text-xs mt-1">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page {page} of {totalPages} · {totalLogs.toLocaleString()} total</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); loadLogs(p); }}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-slate-100 text-slate-600 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); loadLogs(p); }}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-slate-100 text-slate-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
