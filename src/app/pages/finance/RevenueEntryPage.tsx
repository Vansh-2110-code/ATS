import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft, TrendingUp, Lock, CheckCircle2, Loader2, DollarSign, Info,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const INVOICE_STATUSES = ['Pending', 'Paid', 'Due Soon', 'Overdue'];

export function RevenueEntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';

  // Pre-fill from query params if coming from a candidate link
  const prefillCandidate = searchParams.get('candidate') || '';
  const prefillClient = searchParams.get('client') || '';
  const prefillRecruiter = searchParams.get('recruiter') || '';
  const prefillRecruiterId = searchParams.get('recruiterId') || '';

  const [form, setForm] = useState({
    candidateName: prefillCandidate,
    candidateId: '',
    client: prefillClient,
    recruiterName: prefillRecruiter,
    recruiterId: prefillRecruiterId,
    amount: '',
    dueDate: '',
    status: 'Pending',
    description: '',
  });
  const [candidateSearch, setCandidateSearch] = useState(prefillCandidate);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  // Search joined candidates
  useEffect(() => {
    if (!isAdmin || candidateSearch.length < 2) { setCandidates([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res: any = await api.getCandidates({ search: candidateSearch, status: 'Joined', limit: '10' });
        setCandidates(res.candidates || []);
      } catch { setCandidates([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [candidateSearch, isAdmin]);

  const selectCandidate = (c: any) => {
    setForm(f => ({
      ...f,
      candidateName: c.name,
      candidateId: c._id,
      client: c.clientName || f.client,
      recruiterName: c.assignedRecruiterName || f.recruiterName,
      recruiterId: c.assignedRecruiter?._id || c.assignedRecruiter || f.recruiterId,
      amount: c.joiningSalary || f.amount,
    }));
    setCandidateSearch(c.name);
    setCandidates([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client || !form.amount || !form.dueDate) {
      setError('Client, Amount, and Due Date are required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.createInvoice({
        client: form.client,
        amount: form.amount,
        dueDate: form.dueDate,
        status: form.status,
        description: form.description,
        candidateId: form.candidateId || undefined,
        recruiterId: form.recruiterId || undefined,
        candidateName: form.candidateName,
        recruiterName: form.recruiterName,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create revenue entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Non-admin view
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Link to="/recruiter" className="flex items-center gap-1.5 text-slate-500 text-sm mb-6 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-slate-800 text-lg mb-2" style={{ fontWeight: 700 }}>Admin Action Required</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
            Revenue entries can only be added or edited by an Admin. Please inform your admin to process this joined candidate's revenue.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-left mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-sm" style={{ fontWeight: 600 }}>What to do</p>
                <p className="text-amber-700 text-xs mt-1">
                  Share the candidate's name, client company, joining date and salary with your Admin. They'll add the revenue entry in the Revenue Dashboard.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(-1)}
              className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
              style={{ fontWeight: 500 }}>
              Go Back
            </button>
            <Link to="/revenue"
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              style={{ fontWeight: 500 }}>
              View Revenue Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success view
  if (submitted) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-slate-800 text-lg mb-2" style={{ fontWeight: 700 }}>Revenue Entry Added</h2>
          <p className="text-slate-500 text-sm mb-6">The invoice has been created and revenue dashboard updated.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSubmitted(false); setForm({ candidateName: '', candidateId: '', client: '', recruiterName: '', recruiterId: '', amount: '', dueDate: '', status: 'Pending', description: '' }); setCandidateSearch(''); }}
              className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
              style={{ fontWeight: 500 }}>
              Add Another
            </button>
            <Link to="/revenue"
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              style={{ fontWeight: 500 }}>
              Revenue Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/revenue" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.25rem' }}>
            <TrendingUp className="inline w-5 h-5 mr-1.5 text-green-600" />
            Add Revenue Entry
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Create an invoice for a joined candidate placement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Candidate (search + select) */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>Candidate & Recruiter</h2>

          <div className="relative">
            <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 500 }}>
              Candidate Name <span className="text-slate-400">(search joined candidates)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={candidateSearch}
                onChange={e => { setCandidateSearch(e.target.value); set('candidateName', e.target.value); }}
                placeholder="Type name to search..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400"
              />
              {searching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
            </div>
            {candidates.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {candidates.map((c: any) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => selectCandidate(c)}
                    className="w-full text-left px-3 py-2.5 hover:bg-green-50 border-b border-slate-50 last:border-0"
                  >
                    <p className="text-slate-700 text-sm" style={{ fontWeight: 500 }}>{c.name}</p>
                    <p className="text-slate-400 text-xs">{c.clientName || c.positionApplied || c.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 500 }}>Recruiter Name</label>
              <input type="text" value={form.recruiterName} onChange={e => set('recruiterName', e.target.value)}
                placeholder="Recruiter who placed"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 500 }}>Client / Company *</label>
              <input type="text" value={form.client} onChange={e => set('client', e.target.value)}
                placeholder="Client company name"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400" />
            </div>
          </div>
        </div>

        {/* Revenue Details */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>Revenue Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 500 }}>
                <DollarSign className="inline w-3 h-3 mr-0.5" />Revenue Amount (₹) *
              </label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 500 }}>Invoice Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 500 }}>Invoice Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400">
              {INVOICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 500 }}>Description / Notes</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Placement details, contract type, etc."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 resize-none" />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
            style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            style={{ fontWeight: 600 }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            Add Revenue Entry
          </button>
        </div>
      </form>
    </div>
  );
}
