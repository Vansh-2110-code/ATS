import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import {
  FileSpreadsheet, Download, Search, RefreshCw, Filter,
  ChevronLeft, ChevronRight, Eye, EyeOff, CheckCircle2,
  AlertCircle, XCircle, Clock, Edit3, X, Save, Loader2,
  Trophy, ThumbsUp, TrendingDown, Info, BarChart2,
  Plus, Scan, Lock
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ─── Types ─────────────────────────────────────────────────── */
interface AtsRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  currentLocation: string;
  totalExperience: string;
  currentCompanyName: string;
  currentCompanyDesignation: string;
  keySkills: string;
  summary: string;
  atsScore: number;
  atsStatus: 'Selected' | 'Shortlisted' | 'Rejected (ATS Low Score)' | 'Not Processed';
  matchedSkills: string;
  missingSkills: string;
  keywordMatchPct: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  resumeQualityScore: number;
  scanDate: string;
  scannedByName: string;
  scannedByRole: string;
  source: string;
  remarks: string;
  reusable: boolean;
  jobTitle: string;
  ugDegree: string;
  ugInstitute: string;
  ugGraduationYear: string;
  pgDegree: string;
  pgInstitute: string;
  pgGraduationYear: string;
}

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  'Selected':               { label: 'Selected',        bg: 'bg-amber-100',  text: 'text-amber-800',  icon: Trophy },
  'Shortlisted':            { label: 'Shortlisted',     bg: 'bg-emerald-100',text: 'text-emerald-800',icon: ThumbsUp },
  'Not Processed':          { label: 'Not Processed',   bg: 'bg-blue-100',   text: 'text-blue-800',   icon: Clock },
  'Rejected (ATS Low Score)':{ label: 'Rejected',       bg: 'bg-red-100',    text: 'text-red-800',    icon: TrendingDown },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['Not Processed'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 78 ? 'text-amber-700 bg-amber-50'
              : score >= 52 ? 'text-emerald-700 bg-emerald-50'
              : 'text-red-700 bg-red-50';
  return (
    <span className={`font-bold text-sm px-2 py-0.5 rounded ${color}`}>{score}</span>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export function AtsDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [records, setRecords]       = useState<AtsRecord[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId]         = useState<string | null>(null);
  
  // Full Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<AtsRecord>>({});

  // Filters
  const [search,    setSearch]    = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMinScore, setFilterMinScore] = useState('');
  const [filterMaxScore, setFilterMaxScore] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd,   setFilterEnd]   = useState('');

  const LIMIT = 15;

  const fetchRecords = useCallback(async (pg = 1) => {
    if (user?.role === 'recruiter' && !search.trim()) {
      setRecords([]);
      setTotal(0);
      setPage(pg);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(pg), limit: String(LIMIT),
      };
      if (search)          params.search    = search;
      if (filterStatus)    params.status    = filterStatus;
      if (filterMinScore)  params.minScore  = filterMinScore;
      if (filterMaxScore)  params.maxScore  = filterMaxScore;
      if (filterStart)     params.startDate = filterStart;
      if (filterEnd)       params.endDate   = filterEnd;

      const data = await api.getAtsRecords(params);
      setRecords(data.records || []);
      setTotal(data.total || 0);
      setPage(pg);
    } catch (err) {
      console.error('Failed to load ATS records', err);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterMinScore, filterMaxScore, filterStart, filterEnd, user]);

  useEffect(() => {
    if (user) fetchRecords(1);
  }, [user]);

  const handleSearch = () => fetchRecords(1);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (search)         params.search    = search;
      if (filterStatus)   params.status    = filterStatus;
      if (filterMinScore) params.minScore  = filterMinScore;
      if (filterMaxScore) params.maxScore  = filterMaxScore;
      if (filterStart)    params.startDate = filterStart;
      if (filterEnd)      params.endDate   = filterEnd;
      await api.exportAtsRecords(params);
    } catch (err) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const openEditModal = (rec: AtsRecord) => {
    setEditFormData(rec);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (field: keyof AtsRecord, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveFullEdit = async () => {
    if (!editFormData._id) return;
    setSavingId(editFormData._id);
    try {
      const updated = await api.updateAtsRecord(editFormData._id, editFormData);
      setRecords(prev => prev.map(r => r._id === updated._id ? { ...r, ...updated } : r));
      setIsEditModalOpen(false);
    } catch (err) {
      alert('Failed to save record.');
    } finally {
      setSavingId(null);
    }
  };

  const isDateFiltered = !!(filterStart || filterEnd);
  const isFiltered = !!(search || filterStatus || filterMinScore || filterMaxScore || filterStart || filterEnd);

  const getExportButtonText = () => {
    if (exporting) return 'Exporting...';
    if (isDateFiltered) return 'Export Selected Date Range (Excel)';
    if (isFiltered) return 'Export Filtered Candidates (Excel)';
    return 'Export All Candidates (Excel)';
  };

  const totalPages = Math.ceil(total / LIMIT);

  /* ── Render ── */
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-slate-800 font-extrabold text-2xl flex items-center gap-2">
            <Scan className="w-8 h-8 text-green-600" />
            ATS Candidate Database
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage all scanned resumes. Every person you've ever scanned is stored here for permanent reuse.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/recruiter/scan"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-sm hover:shadow-green-100"
          >
            <Plus className="w-4 h-4" />
            Upload/Scan Resume
          </Link>
          {isAdmin && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {getExportButtonText()}
            </button>
          )}
          <button
            onClick={() => fetchRecords(page)}
            className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(STATUS_CFG).map(([status, cfg]) => {
          const count = records.filter(r => r.atsStatus === status).length;
          const Icon = cfg.icon;
          return (
            <button
              key={status}
              onClick={() => { setFilterStatus(filterStatus === status ? '' : status); fetchRecords(1); }}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left shadow-sm ${
                filterStatus === status ? `${cfg.bg} border-current ring-2 ring-current/20` : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                <Icon className={`w-5 h-5 ${cfg.text}`} />
              </div>
              <div>
                <p className={`text-lg font-black leading-none ${cfg.text}`}>{count}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{cfg.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">Search Keyword</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Name, email, phone, skill..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-400"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">ATS Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-400 bg-white"
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Score range */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">ATS Score Range</label>
            <div className="flex gap-2">
              <input
                type="number" min="0" max="100"
                value={filterMinScore}
                onChange={e => setFilterMinScore(e.target.value)}
                placeholder="Min"
                className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-400"
              />
              <input
                type="number" min="0" max="100"
                value={filterMaxScore}
                onChange={e => setFilterMaxScore(e.target.value)}
                placeholder="Max"
                className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-400"
              />
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">Date Range (From - To)</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filterStart}
                onChange={e => setFilterStart(e.target.value)}
                className="w-1/2 px-2 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-green-400 text-slate-600"
              />
              <input
                type="date"
                value={filterEnd}
                onChange={e => setFilterEnd(e.target.value)}
                className="w-1/2 px-2 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-green-400 text-slate-600"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setSearch(''); setFilterStatus(''); setFilterMinScore('');
              setFilterMaxScore(''); setFilterStart(''); setFilterEnd('');
              fetchRecords(1);
            }}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">ATS Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Keyword %</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Skills</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Scan Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Scanned By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Loading records...</p>
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    {user?.role === 'recruiter' && !search.trim() ? (
                      <>
                        <Lock className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-pulse" />
                        <p className="text-sm font-bold text-slate-600">Database Locked</p>
                        <p className="text-xs text-slate-400 mt-1">Please enter a search keyword (e.g., skills) to unlock records.</p>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No ATS records found. Scan a resume to get started.</p>
                      </>
                    )}
                  </td>
                </tr>
              )}
              {!loading && records.map(rec => (
                <tr
                  key={rec._id}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === rec._id ? null : rec._id)}
                >
                  {/* Candidate */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{rec.name}</p>
                    {rec.jobTitle && <p className="text-xs text-slate-400">{rec.jobTitle}</p>}
                    {rec.currentCompanyDesignation && (
                      <p className="text-xs text-slate-400">{rec.currentCompanyDesignation}</p>
                    )}
                  </td>
                  {/* Contact */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-600">{rec.email || '—'}</p>
                    <p className="text-xs text-slate-500">{rec.phone || '—'}</p>
                  </td>
                  {/* Score */}
                  <td className="px-4 py-3">
                    <ScoreBadge score={rec.atsScore} />
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={rec.atsStatus} />
                  </td>
                  {/* Keyword % */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rec.keywordMatchPct >= 70 ? 'bg-emerald-500' : rec.keywordMatchPct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${rec.keywordMatchPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{rec.keywordMatchPct}%</span>
                    </div>
                  </td>
                  {/* Skills */}
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="text-xs text-slate-600 truncate">{rec.keySkills || '—'}</p>
                  </td>
                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs text-slate-600">
                      {rec.scanDate ? new Date(rec.scanDate).toLocaleDateString('en-IN') : '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {rec.scanDate ? new Date(rec.scanDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </td>
                  {/* Scanned By */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-600">{rec.scannedByName || '—'}</p>
                    <p className="text-xs text-slate-400 capitalize">{rec.scannedByRole}</p>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setExpandedId(expandedId === rec._id ? null : rec._id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title="View details"
                      >
                        {expandedId === rec._id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { openEditModal(rec); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                        title="Edit full record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchRecords(page - 1)}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-xs text-slate-600 font-medium">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => fetchRecords(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                Edit ATS Record
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Section: Standard Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Candidate Details</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                    <input type="text" value={editFormData.name || ''} onChange={e => handleEditChange('name', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                      <input type="email" value={editFormData.email || ''} onChange={e => handleEditChange('email', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                      <input type="text" value={editFormData.phone || ''} onChange={e => handleEditChange('phone', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Current Location</label>
                    <input type="text" value={editFormData.currentLocation || ''} onChange={e => handleEditChange('currentLocation', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Total Experience</label>
                      <input type="text" value={editFormData.totalExperience || ''} onChange={e => handleEditChange('totalExperience', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Current Company</label>
                      <input type="text" value={editFormData.currentCompanyName || ''} onChange={e => handleEditChange('currentCompanyName', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                    <input type="text" value={editFormData.currentCompanyDesignation || ''} onChange={e => handleEditChange('currentCompanyDesignation', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Key Skills</label>
                    <textarea rows={2} value={editFormData.keySkills || ''} onChange={e => handleEditChange('keySkills', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none" />
                  </div>

                </div>

                {/* Section: ATS Info & Education */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b pb-2">ATS & Education</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ATS Status</label>
                      <select value={editFormData.atsStatus || ''} onChange={e => handleEditChange('atsStatus', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400">
                        {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ATS Score (Read-Only)</label>
                      <input type="number" readOnly value={editFormData.atsScore || 0} className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title</label>
                    <input type="text" value={editFormData.jobTitle || ''} onChange={e => handleEditChange('jobTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">UG Degree</label>
                      <input type="text" value={editFormData.ugDegree || ''} onChange={e => handleEditChange('ugDegree', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">UG Institute</label>
                      <input type="text" value={editFormData.ugInstitute || ''} onChange={e => handleEditChange('ugInstitute', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">PG Degree</label>
                      <input type="text" value={editFormData.pgDegree || ''} onChange={e => handleEditChange('pgDegree', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">PG Institute</label>
                      <input type="text" value={editFormData.pgInstitute || ''} onChange={e => handleEditChange('pgInstitute', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks / Feedback</label>
                    <textarea rows={3} value={editFormData.remarks || ''} onChange={e => handleEditChange('remarks', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none" />
                  </div>

                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveFullEdit}
                disabled={Boolean(savingId)}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {savingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
