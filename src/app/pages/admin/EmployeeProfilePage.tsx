import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Clock, Calendar, User, Briefcase, Activity,
  CheckCircle, XCircle, Wifi, RefreshCw, TrendingUp, Mail,
  Monitor, Star, BarChart2, Shield,
} from 'lucide-react';
import api from '../../services/api';

const STATUS_STYLES: Record<string, string> = {
  Present: 'bg-emerald-100 text-emerald-700',
  Absent: 'bg-red-100 text-red-600',
  'Half Day': 'bg-amber-100 text-amber-700',
  WFH: 'bg-blue-100 text-blue-700',
  'On Leave': 'bg-violet-100 text-violet-700',
  Holiday: 'bg-orange-100 text-orange-700',
  Weekend: 'bg-slate-100 text-slate-500',
};

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'history' | 'logs' | 'performance'>('overview');
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [summaryData, logsData] = await Promise.all([
        api.getEmployeeAttendanceSummary(id, year),
        api.getLogs({ userId: id, limit: '20' }).catch(() => ({ logs: [] })),
      ]);
      setSummary(summaryData);
      setLogs((logsData as any).logs || []);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, year]);

  const emp = summary?.employee;
  const yearly = summary?.yearlySummary;
  const monthly = summary?.monthlyData || [];
  const recent = summary?.recentRecords || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <User className="w-10 h-10 text-slate-400" />
        <p className="text-slate-500 text-sm">Employee not found</p>
        <button onClick={() => navigate(-1)} className="text-green-600 text-sm hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl text-slate-800" style={{ fontWeight: 700 }}>Employee Profile</h1>
          </div>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none">
            {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl" style={{ fontWeight: 700 }}>
                {emp.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl" style={{ fontWeight: 700 }}>{emp.name}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-white/80 text-sm">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {emp.employeeId}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 capitalize" /> {emp.role}</span>
                {emp.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {emp.email}</span>}
                {emp.isWFH !== undefined && (
                  <span className="flex items-center gap-1.5">
                    {emp.isWFH ? <Wifi className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                    {emp.isWFH ? 'WFH' : 'Office'}
                  </span>
                )}
              </div>
              {(emp.joinedDate || emp.lastLogin || emp.isActive !== undefined) && (
                <div className="flex flex-wrap gap-4 mt-2 text-white/60 text-xs">
                  {emp.joinedDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {new Date(emp.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  {emp.lastLogin && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last login {new Date(emp.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                  {emp.isActive !== undefined && (
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${emp.isActive ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'}`} style={{ fontWeight: 500 }}>
                      <Shield className="w-3 h-3" /> {emp.isActive ? 'Active' : 'Suspended'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Yearly Stats */}
        {yearly && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Present', value: yearly.presentDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Absent', value: yearly.absentDays, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'WFH', value: yearly.wfhDays, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Half Days', value: yearly.halfDays, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Holidays', value: yearly.totalHolidays, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Earned Leaves', value: yearly.earnedLeaves, color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-2xl p-3 text-center shadow-sm border border-white`}>
                <div className={`text-2xl ${s.color}`} style={{ fontWeight: 700 }}>{s.value ?? '—'}</div>
                <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 px-4 pt-4 flex gap-1 overflow-x-auto">
            {([
              { key: 'overview', label: 'Overview', icon: TrendingUp },
              { key: 'monthly', label: 'Monthly', icon: Calendar },
              { key: 'history', label: 'Recent Activity', icon: Clock },
              { key: 'logs', label: 'System Logs', icon: Activity },
              { key: 'performance', label: 'Performance', icon: BarChart2 },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg border-b-2 transition-colors mb-[-1px] ${activeTab === t.key ? 'border-green-500 text-green-600 bg-green-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                style={{ fontWeight: activeTab === t.key ? 600 : 400 }}>
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm text-slate-700 mb-3" style={{ fontWeight: 600 }}>Yearly Performance — {year}</h4>
                  {yearly ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        ['Working Days', yearly.workingDays ?? '—'],
                        ['Total Present', yearly.presentDays ?? '—'],
                        ['Total Absent', yearly.absentDays ?? '—'],
                        ['Attendance Rate', yearly.workingDays ? `${Math.round((yearly.presentDays / yearly.workingDays) * 100)}%` : '—'],
                        ['WFH Days', yearly.wfhDays ?? '—'],
                        ['Leave Days', yearly.leaveDays ?? '—'],
                      ].map(([label, value]) => (
                        <div key={label as string} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-500 text-xs">{label}</span>
                          <span className="text-slate-800 text-xs" style={{ fontWeight: 600 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-slate-400 text-sm">No data available</p>}
                </div>
                {(summary?.holidays || []).length > 0 && (
                  <div>
                    <h4 className="text-sm text-slate-700 mb-3" style={{ fontWeight: 600 }}>Declared Holidays</h4>
                    <div className="space-y-1.5">
                      {summary.holidays.map((h: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-xl text-xs">
                          <span className="text-slate-700" style={{ fontWeight: 500 }}>{h.name}</span>
                          <span className="text-slate-500">{h.date ? new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Monthly Table */}
            {activeTab === 'monthly' && (
              monthly.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No monthly data available</p>
              ) : (
                <div className="space-y-2">
                  {monthly.map((m: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-700 text-xs" style={{ fontWeight: 700 }}>{m.monthName}</span>
                      </div>
                      <div className="flex-1 grid grid-cols-5 gap-2 text-center text-xs">
                        <div><div className="text-emerald-600" style={{ fontWeight: 700 }}>{m.present}</div><div className="text-slate-400">Present</div></div>
                        <div><div className="text-red-500" style={{ fontWeight: 700 }}>{m.absent}</div><div className="text-slate-400">Absent</div></div>
                        <div><div className="text-blue-600" style={{ fontWeight: 700 }}>{m.wfh}</div><div className="text-slate-400">WFH</div></div>
                        <div><div className="text-amber-600" style={{ fontWeight: 700 }}>{m.holidays}</div><div className="text-slate-400">Holidays</div></div>
                        <div><div className="text-violet-600" style={{ fontWeight: 700 }}>{m.earnedLeave}</div><div className="text-slate-400">EL</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Recent Activity */}
            {activeTab === 'history' && (
              recent.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No recent records</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recent.map((rec: any, i: number) => {
                    const isLateLogin = rec.login !== '—' && rec.login > '09:30';
                    const isEarlyLogout = rec.logout !== '—' && rec.logout < '18:00';
                    return (
                      <div key={i} className="py-3 flex items-center gap-4">
                        <div className="w-16 flex-shrink-0">
                          <p className="text-slate-600 text-xs" style={{ fontWeight: 600 }}>{rec._date}</p>
                        </div>
                        <div className="flex-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-green-500" /> {rec.login}
                            {isLateLogin && <span className="text-amber-500">(Late)</span>}
                          </span>
                          <span>→</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-red-400" /> {rec.logout}
                            {isEarlyLogout && rec.logout !== '—' && <span className="text-orange-500">(Early)</span>}
                          </span>
                          {rec.totalHours > 0 && <span className="text-slate-400">·{rec.totalHours.toFixed(1)}h</span>}
                          {rec.wfh && <span className="text-blue-600"><Wifi className="w-3 h-3 inline" /></span>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[rec.status] || 'bg-slate-100 text-slate-500'}`}>
                          {rec.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* System Logs */}
            {activeTab === 'logs' && (
              logs.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No system logs found</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {logs.map((log: any, i: number) => (
                    <div key={i} className="py-3 flex items-start gap-3">
                      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${log.action?.includes('DELETE') ? 'bg-red-100' : log.action?.includes('CREATE') ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {log.action?.includes('DELETE') ? (
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-xs" style={{ fontWeight: 500 }}>{log.action} {log.entity && `· ${log.entity}`}</p>
                        {log.details && <p className="text-slate-400 text-xs truncate">{log.details}</p>}
                      </div>
                      <span className="text-slate-400 text-xs whitespace-nowrap flex-shrink-0">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Performance */}
            {activeTab === 'performance' && (() => {
              const attendanceRate = yearly?.workingDays
                ? Math.round(((yearly.presentDays + yearly.wfhDays) / yearly.workingDays) * 100)
                : null;
              const lateCount = (recent as any[]).filter(r => r.login !== '—' && r.login > '09:30').length;
              const onTimeRate = recent.length > 0 ? Math.round(((recent.length - lateCount) / recent.length) * 100) : null;
              const createCount = logs.filter((l: any) => l.action?.includes('CREATE')).length;
              const updateCount = logs.filter((l: any) => l.action?.includes('UPDATE') || l.action?.includes('EDIT')).length;
              const deleteCount = logs.filter((l: any) => l.action?.includes('DELETE')).length;
              return (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm text-slate-700 mb-3" style={{ fontWeight: 600 }}>Attendance Performance — {year}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Attendance Rate', value: attendanceRate !== null ? `${attendanceRate}%` : '—', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
                        { label: 'Punctuality Rate', value: onTimeRate !== null ? `${onTimeRate}%` : '—', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
                        { label: 'Days Present', value: yearly?.presentDays ?? '—', color: 'text-violet-600', bg: 'bg-violet-50', icon: Star },
                        { label: 'Leave Utilisation', value: yearly?.leaveDays ?? '—', color: 'text-amber-600', bg: 'bg-amber-50', icon: Calendar },
                      ].map((m, i) => (
                        <div key={i} className={`${m.bg} rounded-2xl p-4 text-center border border-white shadow-sm`}>
                          <m.icon className={`w-5 h-5 ${m.color} mx-auto mb-1.5`} />
                          <div className={`text-2xl ${m.color}`} style={{ fontWeight: 700 }}>{m.value}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-slate-700 mb-3" style={{ fontWeight: 600 }}>System Activity Breakdown</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Records Created', value: createCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Records Updated', value: updateCount, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Records Deleted', value: deleteCount, color: 'text-red-500', bg: 'bg-red-50' },
                      ].map((s, i) => (
                        <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                          <div className={`text-xl ${s.color}`} style={{ fontWeight: 700 }}>{s.value}</div>
                          <div className="text-slate-500 text-xs">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-400 text-xs mt-2">Based on last 20 system log entries.</p>
                  </div>

                  {yearly && (
                    <div>
                      <h4 className="text-sm text-slate-700 mb-3" style={{ fontWeight: 600 }}>Work Pattern Summary</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'WFH vs Office Split', value: yearly.workingDays ? `${Math.round((yearly.wfhDays / yearly.workingDays) * 100)}% WFH` : '—' },
                          { label: 'Late Logins (recent)', value: `${lateCount} of ${recent.length} days` },
                          { label: 'Half Day Rate', value: yearly.workingDays ? `${Math.round((yearly.halfDays / yearly.workingDays) * 100)}%` : '—' },
                          { label: 'Earned Leaves Remaining', value: yearly.earnedLeaves ?? '—' },
                        ].map(({ label, value }) => (
                          <div key={label as string} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl text-xs">
                            <span className="text-slate-500">{label}</span>
                            <span className="text-slate-800" style={{ fontWeight: 600 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
