import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Search, Briefcase, Plus, Edit2, Trash2, RefreshCw,
  X, ChevronLeft, ChevronRight, Building2, Users, AlertCircle,
  Eye, Phone, MapPin, UserCheck, Tag, UserPlus, Lock,
  Copy, Check, FileText,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { dedupeCompanies } from '../../utils/companyUtils';

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-emerald-100 text-emerald-700',
  Closed: 'bg-slate-100 text-slate-500',
  'On Hold': 'bg-amber-100 text-amber-700',
};

const EMPTY_FORM = {
  companyName: '', jrNumber: '', jobTitle: '', division: 'BPO',
  jobType: '', experience: '', location: '', positions: 1,
  skills: '', description: '', requirements: '', status: 'Open',
};

export function JobsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canCreate = ['admin', 'manager', 'tl'].includes(user?.role || '');
  const canEdit = ['admin', 'manager', 'tl'].includes(user?.role || '');
  const canDelete = ['admin', 'manager'].includes(user?.role || '');
  const searchParams = new URLSearchParams(location.search);
  const urlCompany = searchParams.get('company') || searchParams.get('customer') || (location.state as any)?.company || '';
  const urlStatus = searchParams.get('status') || '';
  const urlDivision = searchParams.get('division') || '';

  const [jobs, setJobs] = useState<any[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [companyQ, setCompanyQ] = useState(urlCompany);
  const [divisionQ, setDivisionQ] = useState(urlDivision);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [stats, setStats] = useState({ open: 0, closed: 0, onHold: 0 });

  // Sync URL search params when navigation changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const c = params.get('company') || params.get('customer') || '';
    const s = params.get('status') || '';
    const d = params.get('division') || '';

    if (c) setCompanyQ(c);
    if (s) setStatusFilter(s);
    if (d) setDivisionQ(d);
  }, [location.search]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editJob, setEditJob] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Candidate panel
  const [candidatePanel, setCandidatePanel] = useState<{ job: any; candidates: any[]; loading: boolean } | null>(null);

  // Refer Candidate panel
  const [referPanel, setReferPanel] = useState<{ job: any } | null>(null);
  const [referSearch, setReferSearch] = useState('');
  const [referResults, setReferResults] = useState<any[]>([]);
  const [referLoading, setReferLoading] = useState(false);
  const [referring, setReferring] = useState<string | null>(null);
  const [referDone, setReferDone] = useState<string[]>([]);

  // View JR & Job Description modal state
  const [viewJdJob, setViewJdJob] = useState<any | null>(null);
  const [copiedJdId, setCopiedJdId] = useState<string | null>(null);

  const openCandidatePanel = async (job: any) => {
    setCandidatePanel({ job, candidates: [], loading: true });
    try {
      const data = await api.getCandidatesForJob(job._id);
      setCandidatePanel({ job, candidates: data.candidates || [], loading: false });
    } catch {
      setCandidatePanel({ job, candidates: [], loading: false });
    }
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), limit: '20' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (companyQ) params.company = companyQ;
      if (divisionQ) params.division = divisionQ;
      const data = await api.getJobs(params);
      setJobs(data.jobs || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, companyQ, divisionQ, page]);

  useEffect(() => {
    Promise.all([
      api.getJobs({ status: 'Open', limit: '1', company: companyQ || undefined, division: divisionQ || undefined }),
      api.getJobs({ status: 'Closed', limit: '1', company: companyQ || undefined, division: divisionQ || undefined }),
      api.getJobs({ status: 'On Hold', limit: '1', company: companyQ || undefined, division: divisionQ || undefined }),
    ]).then(([open, closed, hold]) => {
      setStats({
        open: (open as any)?.pagination?.totalPositions ?? (open as any)?.pagination?.total ?? 0,
        closed: (closed as any)?.pagination?.totalPositions ?? (closed as any)?.pagination?.total ?? 0,
        onHold: (hold as any)?.pagination?.totalPositions ?? (hold as any)?.pagination?.total ?? 0,
      });
    }).catch(() => {});
  }, [companyQ, divisionQ]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { setPage(1); }, [search, statusFilter, companyQ, divisionQ]);
  useEffect(() => {
    api.getCompanyList().then((data: any) => {
      const raw = Array.isArray(data) ? data : (data.companies || []);
      setCompaniesList(dedupeCompanies(raw));
    }).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditJob(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (job: any) => {
    setEditJob(job);
    setForm({
      companyName: job.companyName || '',
      jrNumber: job.jrNumber || '',
      jobTitle: job.jobTitle || '',
      division: job.division || 'BPO',
      jobType: job.jobType || '',
      experience: job.experience || '',
      location: job.location || '',
      positions: job.positions || 1,
      skills: (job.skills || []).join(', '),
      description: job.description || '',
      requirements: job.requirements || '',
      status: job.status || 'Open',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.companyName.trim() || !form.jobTitle.trim() || !form.jrNumber.trim()) {
      setError('Company name, JR number, and job title are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      if (editJob) {
        await api.updateJob(editJob._id, {
          ...form,
          skills,
          positions: Number(form.positions),
        });
      } else {
        const fd = new FormData();
        Object.entries({ ...form, positions: Number(form.positions) }).forEach(([k, v]) => {
          if (k !== 'skills') fd.append(k, String(v));
        });
        skills.forEach(s => fd.append('skills[]', s));
        await api.createJob(fd);
      }
      setModalOpen(false);
      fetchJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to save job requirement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteJob(id);
      setDeleteConfirm(null);
      fetchJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete.');
    }
  };

  const openReferPanel = (job: any) => {
    setReferPanel({ job });
    setReferSearch('');
    setReferResults([]);
    setReferDone([]);
  };

  const searchReferCandidates = async (term: string) => {
    setReferSearch(term);
    if (!term || term.length < 2) { setReferResults([]); return; }
    try {
      setReferLoading(true);
      const data = await api.getCandidates({ search: term, limit: '10' });
      setReferResults(data.candidates || []);
    } catch { setReferResults([]); }
    finally { setReferLoading(false); }
  };

  const handleRefer = async (candidateId: string) => {
    if (!referPanel) return;
    try {
      setReferring(candidateId);
      await api.updateCandidate(candidateId, {
        positionApplied: referPanel.job.jobTitle,
        jrNumber: referPanel.job.jrNumber,
        clientName: referPanel.job.companyName,
      });
      setReferDone(prev => [...prev, candidateId]);
    } catch (err: any) {
      alert(err.message || 'Failed to refer candidate.');
    } finally {
      setReferring(null);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>Job Requirements</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage all JRs across companies</p>
          </div>
          {canCreate && (
            <button onClick={openCreate} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors">
              <Plus className="w-4 h-4" /> Post New JR
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open Positions', value: stats.open, color: 'text-emerald-600', bg: 'bg-emerald-50', filter: 'Open' },
            { label: 'Closed Positions', value: stats.closed, color: 'text-slate-500', bg: 'bg-slate-100', filter: 'Closed' },
            { label: 'On Hold Positions', value: stats.onHold, color: 'text-amber-600', bg: 'bg-amber-50', filter: 'On Hold' },
          ].map((s, i) => (
            <button key={i} onClick={() => setStatusFilter(statusFilter === s.filter ? '' : s.filter)}
              className={`${s.bg} rounded-2xl p-4 text-left border-2 transition-all ${statusFilter === s.filter ? 'border-green-400' : 'border-transparent'} shadow-sm`}>
              <div className={`text-2xl ${s.color}`} style={{ fontWeight: 700 }}>{s.value}</div>
              <div className="text-slate-500 text-sm mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search title, company, JR number…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/30" />
          </div>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={companyQ} onChange={e => setCompanyQ(e.target.value)}
              placeholder="Filter by company…"
              className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/30" />
          </div>
          <select value={divisionQ} onChange={e => setDivisionQ(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none">
            <option value="">All Divisions</option>
            <option value="BPO">BPO Division</option>
            <option value="IT">IT Division</option>
            <option value="Lateral">Lateral Division</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none">
            <option value="">All Status</option>
            <option>Open</option>
            <option>Closed</option>
            <option>On Hold</option>
          </select>
          {(search || statusFilter || companyQ || divisionQ) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setCompanyQ(''); setDivisionQ(''); }}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 px-2 py-2 rounded-xl hover:bg-red-50">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button onClick={fetchJobs} className="p-2 text-slate-400 hover:text-green-600 rounded-xl hover:bg-green-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 ml-auto">{pagination.total} JRs</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No job requirements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['JR #', 'Title', 'Company', 'Raised By', 'Location', 'Positions', 'Candidates', 'Status', 'Created', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {jobs.map(j => (
                    <tr key={j._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs" style={{ fontWeight: 500 }}>
                        <button
                          onClick={() => navigate(`/recruiter/jobs/${j._id}/summary`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-mono"
                        >
                          {j.jrNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 text-xs" style={{ fontWeight: 600 }}>{j.jobTitle}</p>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate('/admin/companies', { state: { company: j.companyName } })}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Building2 className="w-3 h-3" /> {j.companyName}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 text-xs font-semibold">
                          {j.createdBy?.name || j.recruiterName || '—'}
                        </p>
                        {(j.createdBy?.employeeId || j.createdBy?.role) && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            {j.createdBy?.employeeId || ''} {j.createdBy?.role ? `· ${j.createdBy.role}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{j.location || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Users className="w-3 h-3 text-slate-300" /> {j.positions}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); openCandidatePanel(j); }}
                          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors ${
                            j.candidateCount > 0
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          <UserCheck className="w-3 h-3" />
                          {j.candidateCount || 0}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[j.status] || 'bg-slate-100 text-slate-500'}`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {j.createdAt ? new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {canEdit ? (
                            <button onClick={() => openEdit(j)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit JR">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="p-1.5 text-slate-300 cursor-not-allowed" title="Only Admin can edit posted jobs">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <button onClick={() => setViewJdJob(j)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View JR & Job Description">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openCandidatePanel(j)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="View candidates">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openReferPanel(j)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Refer a Candidate">
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button onClick={() => setDeleteConfirm(j._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete JR">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 pr-20 bg-slate-50/50">
              <div className="text-xs text-slate-500 font-medium">
                Showing Page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{pagination.pages}</span> ({pagination.total || 0} total JRs)
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {/* Page Number Pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.pages }, (_, idx) => idx + 1).map(pNum => (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        page === pNum
                          ? 'bg-green-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>

                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-slate-800" style={{ fontWeight: 700 }}>{editJob ? 'Edit Job Requirement' : 'New Job Requirement'}</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Company Name *</label>
                  <select
                    value={form.companyName}
                    onChange={e => setForm(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/30"
                  >
                    <option value="" disabled>Select Company</option>
                    {dedupeCompanies(companiesList).map((c: any) => (
                      <option key={c._id || c.id || c.companyName} value={c.companyName}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
                {[
                  { label: 'JR Number *', key: 'jrNumber', type: 'text' },
                  { label: 'Job Title *', key: 'jobTitle', type: 'text' },
                  { label: 'Location', key: 'location', type: 'text' },
                  { label: 'Experience Required', key: 'experience', type: 'text' },
                  { label: 'No. of Positions', key: 'positions', type: 'number' },
                  { label: 'Skills (comma-separated)', key: 'skills', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>{f.label}</label>
                    <input type={f.type} value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/30" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Division *</label>
                  <select
                    value={form.division}
                    onChange={e => setForm(prev => ({ ...prev, division: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="BPO">BPO</option>
                    <option value="IT">IT</option>
                    <option value="Lateral">Lateral</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Status</label>
                  <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option>Open</option>
                    <option>Closed</option>
                    <option>On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block" style={{ fontWeight: 500 }}>Description</label>
                  <textarea rows={3} value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end flex-shrink-0">
                <button onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  style={{ fontWeight: 500 }}>
                  {saving ? 'Saving…' : editJob ? 'Update JR' : 'Create JR'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
              <Trash2 className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="text-slate-800 mb-1" style={{ fontWeight: 700 }}>Delete Job Requirement?</h3>
              <p className="text-slate-500 text-sm mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors" style={{ fontWeight: 500 }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ── Candidates per JR slide panel ── */}
    {candidatePanel && (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/30" onClick={() => setCandidatePanel(null)} />
        <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>Candidates for JR</p>
              </div>
              <p className="text-slate-600 text-xs" style={{ fontWeight: 600 }}>{candidatePanel.job.jobTitle}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {candidatePanel.job.jrNumber} · {candidatePanel.job.companyName}
                {candidatePanel.job.status && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${STATUS_COLORS[candidatePanel.job.status] || 'bg-slate-100 text-slate-500'}`}>
                    {candidatePanel.job.status}
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => setCandidatePanel(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {candidatePanel.loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading candidates…</span>
              </div>
            ) : candidatePanel.candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                <Users className="w-8 h-8 opacity-30" />
                <p className="text-sm">No candidates linked to this JR yet.</p>
                <p className="text-xs text-slate-300">Candidates are tracked via their "Position Applied" field.</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                  <span className="text-blue-700 text-xs" style={{ fontWeight: 600 }}>
                    {candidatePanel.candidates.length} candidate{candidatePanel.candidates.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {candidatePanel.candidates.map((c: any, i: number) => (
                    <div key={i} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                            {(c.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-800 text-sm truncate" style={{ fontWeight: 600 }}>{c.name}</p>
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              {c.phone && (
                                <span className="flex items-center gap-1 text-slate-400 text-xs">
                                  <Phone className="w-3 h-3" />{c.phone}
                                </span>
                              )}
                              {(c.city || c.location) && (
                                <span className="flex items-center gap-1 text-slate-400 text-xs">
                                  <MapPin className="w-3 h-3" />{c.city || c.location}
                                </span>
                              )}
                            </div>
                            {c.source && (
                              <span className="flex items-center gap-1 text-slate-300 text-xs mt-0.5">
                                <Tag className="w-3 h-3" />{c.source}
                                {c.assignedRecruiterName ? ` · ${c.assignedRecruiterName}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                            c.status === 'Joined' ? 'bg-emerald-100 text-emerald-700' :
                            c.status === 'Selected' ? 'bg-green-100 text-green-700' :
                            c.status === 'Rejected' ? 'bg-red-100 text-red-500' :
                            c.status === 'Interview Scheduled' ? 'bg-violet-100 text-violet-700' :
                            'bg-slate-100 text-slate-500'
                          }`} style={{ fontWeight: 500 }}>
                            {c.status}
                          </span>
                          <p className="text-slate-300 text-xs mt-1">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}

    {/* ── Refer a Candidate slide panel ── */}
    {referPanel && (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/30" onClick={() => setReferPanel(null)} />
        <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <UserPlus className="w-4 h-4 text-violet-600" />
                <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>Refer a Candidate</p>
              </div>
              <p className="text-slate-600 text-xs" style={{ fontWeight: 600 }}>{referPanel.job.jobTitle}</p>
              <p className="text-slate-400 text-xs mt-0.5">{referPanel.job.jrNumber} · {referPanel.job.companyName}</p>
            </div>
            <button onClick={() => setReferPanel(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={referSearch}
                onChange={e => searchReferCandidates(e.target.value)}
                placeholder="Search candidate by name or phone…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/30"
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Linking a candidate sets their Position Applied to this JR.</p>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {referLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Searching…</span>
              </div>
            ) : referSearch.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <Users className="w-8 h-8 mb-2" />
                <p className="text-sm">Type at least 2 characters to search</p>
              </div>
            ) : referResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No candidates found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {referResults.map((c: any) => {
                  const done = referDone.includes(c._id);
                  return (
                    <div key={c._id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="text-slate-700 text-sm truncate" style={{ fontWeight: 500 }}>{c.name}</p>
                        <p className="text-slate-400 text-xs">{c.phone} · {c.status}</p>
                        {c.positionApplied && (
                          <p className="text-slate-300 text-xs truncate">Currently: {c.positionApplied}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRefer(c._id)}
                        disabled={referring === c._id || done}
                        className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          done
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {done ? '✓ Referred' : referring === c._id ? 'Linking…' : 'Refer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* ── View JR & Job Description Modal ── */}
    {viewJdJob && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {viewJdJob.jrNumber}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[viewJdJob.status] || 'bg-slate-100 text-slate-500'}`}>
                    {viewJdJob.status}
                  </span>
                </div>
                <h2 className="text-slate-900 font-bold text-base mt-0.5">{viewJdJob.jobTitle}</h2>
              </div>
            </div>
            <button
              onClick={() => setViewJdJob(null)}
              className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-sm">
            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-medium">Raised By / Creator</p>
                <p className="text-blue-700 font-bold">
                  {viewJdJob.createdBy?.name || viewJdJob.recruiterName || '—'}
                  {viewJdJob.createdBy?.employeeId ? ` (${viewJdJob.createdBy.employeeId})` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Company / Client</p>
                <p className="text-slate-800 font-semibold">{viewJdJob.companyName || viewJdJob.client || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Location</p>
                <p className="text-slate-800 font-semibold">{viewJdJob.location || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Experience</p>
                <p className="text-slate-800 font-semibold">{viewJdJob.experience || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Job Type</p>
                <p className="text-slate-800 font-semibold">{viewJdJob.jobType || 'Full Time'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Open Positions</p>
                <p className="text-blue-600 font-bold">{viewJdJob.positions || 1}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Division</p>
                <p className="text-slate-800 font-semibold">{viewJdJob.division || 'BPO'}</p>
              </div>
            </div>

            {/* Job Description Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold">Job Description</h3>
                <button
                  onClick={() => {
                    const text = `Job Title: ${viewJdJob.jobTitle}\nJR Number: ${viewJdJob.jrNumber}\nCompany: ${viewJdJob.companyName || viewJdJob.client}\nLocation: ${viewJdJob.location || 'N/A'}\nExperience: ${viewJdJob.experience || 'N/A'}\n\nJob Description:\n${viewJdJob.description || 'N/A'}\n\nRequirements:\n${viewJdJob.requirements || 'N/A'}\n\nSkills:\n${Array.isArray(viewJdJob.skills) ? viewJdJob.skills.join(', ') : viewJdJob.skills || 'N/A'}`;
                    navigator.clipboard.writeText(text);
                    setCopiedJdId(viewJdJob._id);
                    setTimeout(() => setCopiedJdId(null), 2000);
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  {copiedJdId === viewJdJob._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedJdId === viewJdJob._id ? 'Copied!' : 'Copy JD'}
                </button>
              </div>
              {viewJdJob.description ? (
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {viewJdJob.description}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">No detailed description entered for this JR.</p>
              )}
            </div>

            {/* Requirements */}
            {viewJdJob.requirements && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Requirements & Qualifications</h3>
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {viewJdJob.requirements}
                </div>
              </div>
            )}

            {/* Skills */}
            {((Array.isArray(viewJdJob.skills) && viewJdJob.skills.length > 0) || (typeof viewJdJob.skills === 'string' && viewJdJob.skills.trim())) && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(viewJdJob.skills) ? viewJdJob.skills : viewJdJob.skills.split(',')).map((sk: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs rounded-full font-medium">
                      {sk.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <button
              onClick={() => {
                const j = viewJdJob;
                setViewJdJob(null);
                navigate(`/recruiter/jobs/${j._id}/summary`);
              }}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              Open Full JR Summary Page →
            </button>
            <button
              onClick={() => setViewJdJob(null)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
