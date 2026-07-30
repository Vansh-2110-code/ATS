import { useState, useEffect } from 'react';
import { Search, UserCheck, Clock, Phone, Eye, CheckCircle2, XCircle, RotateCcw, Filter, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface WalkInEntry {
  id: string;
  token: string;
  name: string;
  phone: string;
  experience: string;
  registeredAt: string;
  resumeUploaded: boolean;
  status: 'Waiting' | 'In Review' | 'Interviewed' | 'Selected' | 'Rejected';
  assignedTo: string;
}

const STATUS_STYLES: Record<WalkInEntry['status'], string> = {
  Waiting: 'bg-amber-100 text-amber-700',
  'In Review': 'bg-green-100 text-green-700',
  Interviewed: 'bg-violet-100 text-violet-700',
  Selected: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-600',
};

interface RecruiterOption {
  id: string;
  name: string;
}

export function WalkInQueuePage() {
  const { user } = useAuth();
  const canAssign = ['tl', 'manager', 'admin'].includes(user?.role || '');
  const [queue, setQueue] = useState<WalkInEntry[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [assignModal, setAssignModal] = useState<WalkInEntry | null>(null);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState<RecruiterOption[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [queueData, recruiterData] = await Promise.all([
          api.getWalkInQueue(),
          api.getRecruiters().catch(() => []),
        ]);
        const list = queueData.queue || queueData || [];
        setQueue(list.map((e: any) => ({
          id: e._id || e.id,
          token: e.token || '',
          name: e.candidate?.name || e.name || '',
          phone: e.candidate?.phone || e.phone || '',
          experience: e.candidate?.experience || e.experience || '',
          registeredAt: e.registeredAt || (e.createdAt ? new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
          resumeUploaded: !!(e.resumeUploaded || e.resumePath || e.candidate?.resumePath),
          status: e.status || 'Waiting',
          assignedTo: e.assignedRecruiter?.name || e.assignedToName || e.assignedTo || '—',
        })));
        const recList = Array.isArray(recruiterData)
          ? recruiterData
          : (recruiterData.recruiters || []);
        if (recList.length > 0) {
          setRecruiters(recList.map((r: any) => ({
            id: r._id || r.id || '',
            name: r.name || '',
          })).filter((r: RecruiterOption) => !!r.id && !!r.name));
        }
      } catch (err) {
        console.error('Failed to load walk-in queue:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = queue.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.token.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const waiting = queue.filter(e => e.status === 'Waiting').length;
  const inReview = queue.filter(e => e.status === 'In Review').length;
  const interviewed = queue.filter(e => e.status === 'Interviewed').length;
  const selected = queue.filter(e => e.status === 'Selected').length;

  const updateStatus = async (id: string, status: WalkInEntry['status']) => {
    try {
      await api.updateWalkInStatus(id, status);
      setQueue(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedRecruiterId) return;
    const selectedRecruiter = recruiters.find(r => r.id === selectedRecruiterId);
    if (!selectedRecruiter) return;

    try {
      await api.assignWalkIn(assignModal.id, selectedRecruiter.id);
      setQueue(prev => prev.map(e =>
        e.id === assignModal.id
          ? { ...e, assignedTo: selectedRecruiter.name, status: 'In Review' }
          : e
      ));
      setAssignModal(null);
      setSelectedRecruiterId('');
    } catch (err) {
      console.error('Failed to assign recruiter:', err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>Walk-In Queue</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage today's walk-in candidates — {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          {/* Register Walk-In button removed as per flow requirements */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Waiting', value: waiting, color: 'amber' },
          { label: 'In Review', value: inReview, color: 'green' },
          { label: 'Interviewed', value: interviewed, color: 'violet' },
          { label: 'Selected', value: selected, color: 'emerald' },
        ].map(({ label, value, color }) => {
          const colors: Record<string, string> = {
            amber: 'bg-amber-50 border-amber-100 text-amber-700',
            green: 'bg-green-50 border-green-100 text-green-700',
            violet: 'bg-violet-50 border-violet-100 text-violet-700',
            emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
          };
          return (
            <div key={label} className={`rounded-xl border p-4 text-center ${colors[color]}`}>
              <div style={{ fontWeight: 700, fontSize: '1.75rem' }}>{value}</div>
              <div className="text-sm opacity-80 mt-0.5">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or token..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All', 'Waiting', 'In Review', 'Interviewed', 'Selected', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              style={{ fontWeight: statusFilter === s ? 600 : 400 }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Token', 'Candidate', 'Experience', 'Phone', 'Resume', 'Registered', 'Assigned To', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
                      {entry.token}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 text-xs" style={{ fontWeight: 600 }}>
                          {entry.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-slate-700 text-sm" style={{ fontWeight: 500 }}>{entry.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-sm">{entry.experience}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-sm">{entry.phone}</td>
                  <td className="px-4 py-3.5">
                    {entry.resumeUploaded
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : <XCircle className="w-4 h-4 text-slate-300" />
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Clock className="w-3 h-3" />
                      {entry.registeredAt}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {entry.assignedTo === '—' && canAssign
                      ? <button
                          onClick={() => { setAssignModal(entry); setSelectedRecruiterId(''); }}
                          className="text-xs text-green-600 hover:text-green-700 px-2 py-1 bg-green-50 rounded-md"
                          style={{ fontWeight: 500 }}
                        >
                          + Assign
                        </button>
                      : <span className="text-slate-600 text-xs">{entry.assignedTo}</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_STYLES[entry.status]}`} style={{ fontWeight: 500 }}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {entry.status === 'Waiting' && (
                        <button
                          onClick={() => updateStatus(entry.id, 'In Review')}
                          className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                          style={{ fontWeight: 500 }}
                        >
                          Review
                        </button>
                      )}
                      {entry.status === 'In Review' && (
                        <>
                          <button
                            onClick={() => updateStatus(entry.id, 'Interviewed')}
                            className="text-xs px-2 py-1 bg-violet-50 text-violet-600 rounded-md hover:bg-violet-100"
                            style={{ fontWeight: 500 }}
                          >
                            Interviewed
                          </button>
                        </>
                      )}
                      {entry.status === 'Interviewed' && (
                        <>
                          <button
                            onClick={() => updateStatus(entry.id, 'Selected')}
                            className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100"
                            style={{ fontWeight: 500 }}
                          >
                            Select
                          </button>
                          <button
                            onClick={() => updateStatus(entry.id, 'Rejected')}
                            className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-md hover:bg-red-100"
                            style={{ fontWeight: 500 }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(entry.status === 'Selected' || entry.status === 'Rejected') && (
                        <button
                          onClick={() => updateStatus(entry.id, 'Waiting')}
                          className="text-xs p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Link
                        to={`/recruiter/candidate/${entry.id}`}
                        className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map(entry => (
            <div key={entry.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-md" style={{ fontWeight: 700 }}>{entry.token}</span>
                  <span className="text-slate-700 text-sm" style={{ fontWeight: 500 }}>{entry.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[entry.status]}`} style={{ fontWeight: 500 }}>
                  {entry.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span>{entry.experience}</span>
                <span>{entry.phone}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.registeredAt}</span>
                {entry.resumeUploaded && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Resume</span>}
              </div>
              {entry.status === 'Waiting' && (
                <button
                  onClick={() => updateStatus(entry.id, 'In Review')}
                  className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg"
                  style={{ fontWeight: 500 }}
                >
                  Mark In Review
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && canAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-slate-800 mb-1" style={{ fontWeight: 700 }}>Assign Recruiter</h3>
            <p className="text-slate-500 text-sm mb-4">
              Assign <strong className="text-slate-700">{assignModal.name}</strong> ({assignModal.token}) to a recruiter
            </p>
            <select
              value={selectedRecruiterId}
              onChange={e => setSelectedRecruiterId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 bg-white mb-4"
            >
              <option value="">Select recruiter...</option>
              {recruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAssign}
                disabled={!selectedRecruiterId}
                className="flex-1 py-2.5 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 disabled:opacity-40"
                style={{ fontWeight: 600 }}
              >
                Assign & Start Review
              </button>
              <button
                onClick={() => setAssignModal(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
