import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Trash2, Upload, Download, CheckCircle2, XCircle,
  AlertCircle, ChevronRight, LayoutGrid, FileSpreadsheet, Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

import { DEPARTMENT_GROUPS, ALL_DEPARTMENTS } from '../../constants/departments';

// const DEPARTMENTS = ['BPO', 'ITES', 'IT', 'Non-IT', 'Healthcare', 'Sales', 'Finance', 'HR'];
const JOB_TYPES   = ['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Freelance'];
const PRIORITIES  = ['Urgent', 'High', 'Medium', 'Low'];

interface HRContact {
  _id: string;
  name: string;
  email: string;
}

interface JobRow {
  id: number;
  companyName: string;
  jobTitle: string;
  department: string;
  jobType: string;
  positions: string;
  location: string;
  experience: string;
  priority: string;
  hrName: string;
  hrEmail: string;
  skills: string;
}

interface BulkResult {
  created: number;
  failed: number;
  total: number;
  jobs: { jrNumber: string; jobTitle: string; companyName: string }[];
  errors: { row: number; error: string; jobTitle: string }[];
}

let nextId = 1;
const blankRow = (): JobRow => ({
  id: nextId++, companyName: '', jobTitle: '', department: '', jobType: 'Full-Time',
  positions: '1', location: '', experience: '', priority: 'Medium',
  hrName: '', hrEmail: '', skills: '',
});

const makeRows = (n: number): JobRow[] => Array.from({ length: n }, blankRow);

export function BulkJobPostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Role-based access control: Only TL, Manager, and Admin can bulk post jobs
  useEffect(() => {
    if (user && !['tl', 'manager', 'admin'].includes(user.role)) {
      navigate('/recruiter');
    }
  }, [user, navigate]);

  // Show "not allowed" message if recruiter tries to access
  if (user && !['tl', 'manager', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-lg text-slate-800 font-semibold mb-2">Access Restricted</h2>
          <p className="text-slate-600 mb-6">Bulk job posting is only available for Team Leads, Managers, and Admins.</p>
          <button onClick={() => navigate('/recruiter')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [importError, setImportError] = useState('');
  const [hrContacts, setHrContacts] = useState<HRContact[]>([]);
  const [loadingHR, setLoadingHR] = useState(false);
  const [rows, setRows] = useState<JobRow[]>(makeRows(5));
  const fileRef = useRef<HTMLInputElement>(null);

  // Get available departments
  const getAvailableDepartments = () => {
    return ALL_DEPARTMENTS;
  };

  const availableDepartments = getAvailableDepartments();

  // ── row helpers ──
  const updateRow = useCallback((id: number, field: keyof JobRow, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;

      const updated = { ...r, [field]: value };

      // Auto-populate email when HR Name is selected
      if (field === 'hrName' && value) {
        const selectedHR = hrContacts.find(hr => hr.name === value);
        if (selectedHR) {
          updated.hrEmail = selectedHR.email;
        }
      }

      return updated;
    }));
  }, [hrContacts]);

  // Load HR contacts on mount
  useEffect(() => {
    loadHRContacts();
  }, []);

  const loadHRContacts = async () => {
    try {
      setLoadingHR(true);
      const data = await api.getHRContacts();
      setHrContacts(data.hrContacts || []);
    } catch (error) {
      console.error('Failed to load HR contacts:', error);
    } finally {
      setLoadingHR(false);
    }
  };

  const deleteRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));

  const addRows = (n: number) => setRows(prev => [...prev, ...makeRows(n)]);

  const clearAll = () => { setRows(makeRows(12)); setResult(null); };

  // ── template CSV download ──
  const downloadTemplate = () => {
    const headers = ['companyName', 'jobTitle', 'department', 'jobType', 'positions', 'location',
                     'experience', 'priority', 'hrName', 'hrEmail', 'skills'];
    const example = ['White Horse Manpower', 'Sales Executive', 'Sales', 'Full-Time', '5',
                     'Mumbai', '1-3 years', 'High', 'HR Manager', 'hr@company.com', 'Communication,Sales'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'bulk_jobs_template.csv',
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Excel / CSV import (upload to backend for parsing & creation) ──
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target.files) return;
    e.target.value = '';
    if (!file) return;
    setImportError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.bulkCreateJobs(fd);
      setResult(res);
      setRows(makeRows(12));
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── manual table submit ──
  const handleSubmit = async () => {
    const filled = rows.filter(r => r.companyName.trim() || r.jobTitle.trim());
    if (!filled.length) return;

    const jobs = filled.map(r => ({
      companyName: r.companyName.trim(),
      jobTitle:    r.jobTitle.trim(),
      department:  r.department,
      jobType:     r.jobType,
      positions:   parseInt(r.positions) || 1,
      location:    r.location.trim(),
      experience:  r.experience.trim(),
      priority:    r.priority,
      hrName:      r.hrName.trim(),
      hrEmail:     r.hrEmail.trim(),
      skills:      r.skills.split(',').map(s => s.trim()).filter(Boolean),
    }));

    setSubmitting(true);
    try {
      const res = await api.bulkCreateJobs({ jobs });
      setResult(res);
      if (res.created > 0) setRows(makeRows(12));
    } catch (err: any) {
      setImportError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filledCount = rows.filter(r => r.companyName.trim() && r.jobTitle.trim()).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Bulk Job Posting</h1>
              <p className="text-xs text-slate-500">Fill the table below or import an Excel/CSV file</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" /> Download Template
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={submitting}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> Import Excel / CSV
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileImport} />
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-5">

        {/* HR Loading Status */}
        {loadingHR && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-sm">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            Loading HR contacts...
          </div>
        )}

        {/* Result panel */}
        {result && (
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Submission Result</h2>
              <button onClick={() => setResult(null)} className="text-xs text-slate-400 hover:text-slate-600">Dismiss</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2.5 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">{result.created} Created</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 px-4 py-2.5 rounded-xl">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-600">{result.failed} Failed</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-xl">
                  <span className="text-slate-600 text-sm">{result.total} Total</span>
                </div>
              </div>

              {result.jobs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Created Jobs</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {result.jobs.map(j => (
                      <div key={j.jrNumber} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-xs font-mono text-green-700 bg-green-100 px-1.5 py-0.5 rounded">{j.jrNumber}</span>
                        <span className="text-sm text-slate-700 truncate">{j.jobTitle}</span>
                        <span className="text-xs text-slate-400 truncate ml-auto">{j.companyName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Errors</p>
                  <div className="space-y-1">
                    {result.errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Row {e.row} — {e.jobTitle}: {e.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => navigate('/admin/jobs')}
                  className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  View Job Requirements
                </button>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Post More Jobs
                </button>
              </div>
            </div>
          </div>
        )}

        {importError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {importError}
            <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setImportError('')}>×</button>
          </div>
        )}

        {/* Spreadsheet table */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-800 text-sm">Job Rows</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{rows.length} rows</span>
              {filledCount > 0 && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{filledCount} ready</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => addRows(1)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
              <button
                onClick={() => addRows(12)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add 12 Rows
              </button>
            </div>
          </div>

          {/* Horizontally scrollable table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '1100px' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-8">#</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 150 }}>
                    Company <span className="text-red-400">*</span>
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 150 }}>
                    Job Title <span className="text-red-400">*</span>
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 110 }}>Department</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 110 }}>Job Type</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Positions</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 110 }}>Location</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 100 }}>Experience</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 90 }}>Priority</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 120 }}>HR Name</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 150 }}>HR Email</th>
                  <th className="w-9 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row, idx) => {
                  const isReady = row.companyName.trim() && row.jobTitle.trim();
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${isReady ? 'bg-green-50/30' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-3 py-1.5 text-xs text-slate-400 font-mono">{idx + 1}</td>

                      {/* Company */}
                      <td className="px-2 py-1.5">
                        <input
                          value={row.companyName}
                          onChange={e => updateRow(row.id, 'companyName', e.target.value)}
                          placeholder="Company name"
                          className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-colors bg-white"
                        />
                      </td>

                      {/* Job Title */}
                      <td className="px-2 py-1.5">
                        <input
                          value={row.jobTitle}
                          onChange={e => updateRow(row.id, 'jobTitle', e.target.value)}
                          placeholder="e.g. Sales Executive"
                          className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-colors bg-white"
                        />
                      </td>

                      {/* Department */}
                      <td className="px-2 py-1.5">
                        <select
                          value={row.department}
                          onChange={e => updateRow(row.id, 'department', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white"
                        >
                          <option value="">— Select —</option>
                          {DEPARTMENT_GROUPS.map(group => (
                            <optgroup key={group.category} label={group.category}>
                              {group.options.map(d => <option key={d} value={d}>{d}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </td>

                      {/* Job Type */}
                      <td className="px-2 py-1.5">
                        <select
                          value={row.jobType}
                          onChange={e => updateRow(row.id, 'jobType', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white"
                        >
                          {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>

                      {/* Positions */}
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min="1"
                          value={row.positions}
                          onChange={e => updateRow(row.id, 'positions', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white"
                        />
                      </td>

                      {/* Location */}
                      <td className="px-2 py-1.5">
                        <input
                          value={row.location}
                          onChange={e => updateRow(row.id, 'location', e.target.value)}
                          placeholder="City"
                          className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white"
                        />
                      </td>

                      {/* Experience */}
                      <td className="px-2 py-1.5">
                        <input
                          value={row.experience}
                          onChange={e => updateRow(row.id, 'experience', e.target.value)}
                          placeholder="1-3 yrs"
                          className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white"
                        />
                      </td>

                      {/* Priority */}
                      <td className="px-2 py-1.5">
                        <select
                          value={row.priority}
                          onChange={e => updateRow(row.id, 'priority', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white"
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>

                      {/* HR Name */}
                      <td className="px-2 py-1.5">
                        <select
                          value={row.hrName}
                          onChange={e => updateRow(row.id, 'hrName', e.target.value)}
                          disabled={loadingHR}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white disabled:opacity-50"
                        >
                          <option value="">— Select HR —</option>
                          {hrContacts.map(hr => (
                            <option key={hr._id} value={hr.name}>{hr.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* HR Email */}
                      <td className="px-2 py-1.5">
                        <input
                          type="email"
                          value={row.hrEmail}
                          onChange={e => updateRow(row.id, 'hrEmail', e.target.value)}
                          placeholder="Auto-populated"
                          className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-slate-50"
                          readOnly
                        />
                      </td>

                      {/* Delete */}
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-300 inline-block" />
              Green rows are ready to submit (Company + Job Title filled)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearAll}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || filledCount === 0}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {submitting ? 'Submitting…' : `Submit ${filledCount > 0 ? filledCount : ''} Job${filledCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">How to use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
            <div className="space-y-1">
              <p className="font-semibold text-slate-700">Manual Entry</p>
              <p>Fill Company Name and Job Title (required). Add any other details. Green rows are ready. Click Submit when done.</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-700">Excel / CSV Import</p>
              <p>Download the template, fill it in Excel or Google Sheets, then click <strong>Import Excel / CSV</strong>. Jobs will be created instantly.</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-700">Notes</p>
              <ul className="space-y-0.5 list-disc list-inside text-slate-500">
                <li>JR numbers auto-generated (JRWH format)</li>
                <li>Max 100 jobs per submission</li>
                <li>Rows with missing Company or Title are skipped</li>
                <li>Skills: comma-separated (e.g. "Excel,Sales")</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
