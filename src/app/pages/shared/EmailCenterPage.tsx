import { useState, useEffect, useRef } from 'react';
import {
  Send, Mail, Clock, Search, ChevronDown, Loader2,
  CheckCircle2, AlertCircle, Eye, FileText, Inbox,
  LayoutTemplate, RefreshCw, AlertTriangle, X, User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─── Constants ───────────────────────────────────────────────
const TEMPLATES = [
  { value: 'interview_call_letter',    label: 'Interview Call Letter (1st Round)',    tag: 'Interview', color: 'violet' },
  { value: 'second_round_call_letter', label: 'Second Round Call Letter',             tag: 'Interview', color: 'blue'   },
  { value: 'final_round_call_letter',  label: 'Final Round Call Letter',              tag: 'Interview', color: 'indigo' },
  { value: 'selection_mail',           label: 'Selection / Offer Mail',               tag: 'Offer',     color: 'emerald'},
  { value: 'offer_letter',             label: 'Letter for Initial Job Offer',         tag: 'Offer',     color: 'green'  },
];

const TAG_COLORS: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700',
  blue:   'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  emerald:'bg-emerald-100 text-emerald-700',
  green:  'bg-green-100 text-green-700',
};

const TYPE_LABELS: Record<string, string> = {
  interview_call_letter:    'Interview Call Letter',
  second_round_call_letter: 'Second Round',
  final_round_call_letter:  'Final Round',
  selection_mail:           'Selection Mail',
  offer_letter:             'Offer Letter',
  general:                  'General',
};

type Tab = 'compose' | 'sent' | 'templates';

// ─── Component ───────────────────────────────────────────────
export function EmailCenterPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isAdminOrManager = ['admin', 'manager'].includes(user?.role || '');

  const [tab, setTab] = useState<Tab>('compose');

  // ── SMTP status ──────────────────────────────────────────────
  const [smtp, setSmtp] = useState<any>(null);
  useEffect(() => {
    if (isAdmin) {
      api.getSmtpStatus().then(d => setSmtp(d)).catch(() => {});
    }
  }, [isAdmin]);

  // ─────────────────────────────────────────────────────────────
  // COMPOSE TAB
  // ─────────────────────────────────────────────────────────────
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateResults, setCandidateResults] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [template, setTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [intDate, setIntDate] = useState('');
  const [intTime, setIntTime] = useState('');
  const [intMode, setIntMode] = useState('Face-to-Face');
  const [joinDate, setJoinDate] = useState('');
  const [salary, setSalary] = useState('');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Search candidates with debounce
  useEffect(() => {
    if (!candidateSearch.trim()) { setCandidateResults([]); return; }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.getCandidates({ search: candidateSearch, limit: '8' });
        setCandidateResults(res.candidates || res.data || []);
      } catch { setCandidateResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
  }, [candidateSearch]);

  const selectCandidate = (c: any) => {
    setSelectedCandidate(c);
    setCandidateSearch(c.name);
    setCandidateResults([]);
    setSendResult(null);
  };

  const loadTemplate = async (type: string) => {
    setTemplate(type);
    setSendResult(null);
    if (!type) { setSubject(''); setBody(''); return; }
    setLoadingTemplate(true);
    try {
      const params: Record<string, string> = {
        candidateName: selectedCandidate?.name || '',
        role, company, interviewDate: intDate,
        interviewTime: intTime, interviewMode: intMode,
        joiningDate: joinDate, offeredSalary: salary,
      };
      const res = await api.getEmailTemplate(type, params);
      setSubject(res.subject || '');
      setBody(res.body || '');
    } catch { /* keep empty */ }
    finally { setLoadingTemplate(false); }
  };

  // Reload template when fields change (if template already selected)
  useEffect(() => {
    if (!template) return;
    loadTemplate(template);
  }, [role, company, intDate, intTime, intMode, joinDate, salary, selectedCandidate]);

  const handleSend = async () => {
    if (!selectedCandidate || !template || !subject || !body) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await api.sendCandidateEmail({
        candidateId: selectedCandidate._id,
        templateType: template,
        customSubject: subject,
        customBody: body,
        role, company,
        interviewDate: intDate, interviewTime: intTime, interviewMode: intMode,
        joiningDate: joinDate, offeredSalary: salary,
      });
      setSendResult({ ok: true, msg: `Email sent to ${res.sentTo} (${res.candidateName})` });
      // reset
      setSelectedCandidate(null);
      setCandidateSearch('');
      setTemplate('');
      setSubject('');
      setBody('');
      setRole(''); setCompany(''); setIntDate(''); setIntTime('');
      setJoinDate(''); setSalary('');
    } catch (err: any) {
      setSendResult({ ok: false, msg: err.message || 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  const showInterviewFields = ['interview_call_letter', 'second_round_call_letter', 'final_round_call_letter'].includes(template);
  const showOfferFields = ['offer_letter', 'selection_mail'].includes(template);

  // ─────────────────────────────────────────────────────────────
  // SENT TAB
  // ─────────────────────────────────────────────────────────────
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [sentTotal, setSentTotal] = useState(0);
  const [sentSearch, setSentSearch] = useState('');
  const [sentLoading, setSentLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSent = async () => {
    setSentLoading(true);
    try {
      const params: Record<string, string> = {};
      if (sentSearch) params.search = sentSearch;
      const res = await api.getSentEmails(params);
      setSentEmails(res.messages || []);
      setSentTotal(res.total || 0);
    } catch { /* ignore */ }
    finally { setSentLoading(false); }
  };

  useEffect(() => {
    if (tab === 'sent') loadSent();
  }, [tab, sentSearch]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800 text-xl" style={{ fontWeight: 700 }}>Email Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">Send emails to candidates using pre-built templates</p>
        </div>
        {/* SMTP Status Badge (Admin only) */}
        {isAdmin && smtp && (
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${smtp.configured ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`} style={{ fontWeight: 500 }}>
            {smtp.configured
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> SMTP Connected · {smtp.user}</>
              : <><AlertTriangle className="w-3.5 h-3.5" /> SMTP not configured — emails will be mocked</>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: 'compose',   label: 'Compose',   icon: Send },
          { key: 'sent',      label: 'Sent',       icon: Inbox },
          { key: 'templates', label: 'Templates',  icon: LayoutTemplate },
        ] as { key: Tab; label: string; icon: any }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={{ fontWeight: tab === t.key ? 600 : 400 }}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.key === 'sent' && sentTotal > 0 && tab !== 'sent' && (
              <span className="bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{sentTotal}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ──────────────────────────────────────── */}
      {tab === 'compose' && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-4">

            {/* SMTP warning for non-admin */}
            {!isAdmin && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>Emails are sent via your company's SMTP. Contact Admin if emails aren't delivering.</span>
              </div>
            )}

            {/* Step 1: Select Candidate */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-slate-700 text-sm mb-3" style={{ fontWeight: 600 }}>
                <span className="w-5 h-5 bg-green-600 text-white text-xs rounded-full inline-flex items-center justify-center mr-2" style={{ fontWeight: 700 }}>1</span>
                Select Candidate
              </h3>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={candidateSearch}
                    onChange={e => { setCandidateSearch(e.target.value); setSelectedCandidate(null); }}
                    placeholder="Search by name or phone..."
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400"
                  />
                  {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
                  {selectedCandidate && !searchLoading && (
                    <button onClick={() => { setSelectedCandidate(null); setCandidateSearch(''); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown results */}
                {candidateResults.length > 0 && !selectedCandidate && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-52 overflow-y-auto">
                    {candidateResults.map((c: any) => (
                      <button key={c._id} onClick={() => selectCandidate(c)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0">
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-700 text-xs" style={{ fontWeight: 700 }}>
                            {c.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 text-sm truncate" style={{ fontWeight: 500 }}>{c.name}</p>
                          <p className="text-slate-400 text-xs">{c.email || 'No email'} · {c.phone}</p>
                        </div>
                        {!c.email && <span className="text-xs text-red-400">No email</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected candidate chip */}
              {selectedCandidate && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs" style={{ fontWeight: 700 }}>
                      {selectedCandidate.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-green-800 text-sm" style={{ fontWeight: 600 }}>{selectedCandidate.name}</p>
                    <p className="text-green-600 text-xs">{selectedCandidate.email || <span className="text-red-500">No email — cannot send</span>}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>

            {/* Step 2: Template + Variable Fields */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h3 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
                <span className="w-5 h-5 bg-green-600 text-white text-xs rounded-full inline-flex items-center justify-center mr-2" style={{ fontWeight: 700 }}>2</span>
                Choose Template & Fill Details
              </h3>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 500 }}>Email Template *</label>
                <select value={template} onChange={e => loadTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400">
                  <option value="">— Select a template —</option>
                  {TEMPLATES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Role / Position</label>
                  <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Sales Executive"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Company</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
                </div>
              </div>

              {showInterviewFields && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Interview Date</label>
                    <input type="date" value={intDate} onChange={e => setIntDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Interview Time</label>
                    <input type="time" value={intTime} onChange={e => setIntTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Interview Mode</label>
                    <select value={intMode} onChange={e => setIntMode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400">
                      <option>Face-to-Face</option>
                      <option>Video Call</option>
                      <option>Telephonic</option>
                    </select>
                  </div>
                </div>
              )}

              {showOfferFields && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Joining Date</label>
                    <input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Offered Salary</label>
                    <input value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 4.5 LPA"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Edit & Send */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
                  <span className="w-5 h-5 bg-green-600 text-white text-xs rounded-full inline-flex items-center justify-center mr-2" style={{ fontWeight: 700 }}>3</span>
                  Review & Edit Email
                </h3>
                {loadingTemplate && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Body (editable)</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={14}
                  placeholder="Select a template above to populate the email body..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 resize-y font-mono leading-relaxed" />
              </div>

              {sendResult && (
                <div className={`flex items-start gap-2 px-4 py-3 rounded-lg text-sm ${sendResult.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                  {sendResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  {sendResult.msg}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={handleSend}
                  disabled={sending || !selectedCandidate || !template || !subject || !body || !selectedCandidate?.email}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
                  style={{ fontWeight: 600 }}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending…' : 'Send Email'}
                </button>
              </div>

              {selectedCandidate && !selectedCandidate.email && (
                <p className="text-red-500 text-xs text-center">This candidate has no email address. Please update their profile first.</p>
              )}
            </div>
          </div>

          {/* Right: Template Picker */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-slate-700 text-sm mb-3" style={{ fontWeight: 600 }}>Quick Select Templates</h3>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button key={t.value} onClick={() => loadTemplate(t.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${template === t.value ? 'border-green-300 bg-green-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${template === t.value ? 'bg-green-100' : 'bg-slate-100'}`}>
                      <FileText className={`w-4 h-4 ${template === t.value ? 'text-green-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${template === t.value ? 'text-green-800' : 'text-slate-700'}`} style={{ fontWeight: 500 }}>{t.label}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${TAG_COLORS[t.color]}`} style={{ fontWeight: 500 }}>{t.tag}</span>
                    </div>
                    {template === t.value && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-600">Tips</p>
              <p>• Select a candidate first, then the template auto-fills their name.</p>
              <p>• Fill Role & Company before selecting a template for best results.</p>
              <p>• You can freely edit the subject and body before sending.</p>
              <p>• All sent emails are saved in the Sent tab.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SENT TAB ─────────────────────────────────────────── */}
      {tab === 'sent' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={sentSearch} onChange={e => setSentSearch(e.target.value)}
                placeholder="Search by subject..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
            </div>
            <button onClick={loadSent} className="flex items-center gap-1.5 px-3 py-2 text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            {isAdminOrManager && (
              <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>
                Viewing all team emails
              </span>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
                Sent Emails
                <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{sentEmails.length}</span>
              </span>
              {sentLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>

            {sentEmails.length === 0 && !sentLoading ? (
              <div className="p-10 text-center text-slate-400">
                <Mail className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No emails sent yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {sentEmails.map((msg: any) => (
                  <div key={msg._id}>
                    <button
                      onClick={() => setExpandedId(expandedId === msg._id ? null : msg._id)}
                      className="w-full flex items-start gap-4 px-5 py-4 hover:bg-slate-50 text-left transition-colors">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Mail className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>{msg.subject}</p>
                          {msg.messageType && msg.messageType !== 'general' && (
                            <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded" style={{ fontWeight: 500 }}>
                              {TYPE_LABELS[msg.messageType] || msg.messageType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {msg.candidateId && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              To: {msg.candidateId.name} ({msg.candidateId.email})
                            </span>
                          )}
                          {isAdminOrManager && msg.from && (
                            <span className="flex items-center gap-1">
                              By: {msg.from.name} ({msg.from.role})
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(msg.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 mt-1 flex-shrink-0 transition-transform ${expandedId === msg._id ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedId === msg._id && (
                      <div className="px-5 pb-5 bg-slate-50 border-t border-slate-100">
                        <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-400 mb-2" style={{ fontWeight: 500 }}>Subject: {msg.subject}</p>
                          <pre className="text-slate-600 text-xs whitespace-pre-wrap font-sans leading-relaxed">{msg.body}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TEMPLATES TAB ────────────────────────────────────── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <p className="text-slate-500 text-sm">All email templates used by the system. These auto-fill with candidate and job details when composing.</p>
          {TEMPLATES.map(t => (
            <TemplatePreviewCard key={t.value} template={t} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Template Preview Card ────────────────────────────────────
function TemplatePreviewCard({ template, user }: { template: (typeof TEMPLATES)[0]; user: any }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    if (preview) { setOpen(o => !o); return; }
    setLoading(true);
    try {
      const res = await api.getEmailTemplate(template.value, {
        candidateName: 'John Doe',
        role: 'Sales Executive',
        company: 'Acme Corp',
        interviewDate: new Date().toLocaleDateString('en-IN'),
        interviewTime: '10:00',
        interviewMode: 'Face-to-Face',
        joiningDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN'),
        offeredSalary: '4.5 LPA',
      });
      setPreview(res);
      setOpen(true);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={loadPreview}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 text-left transition-colors">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TAG_COLORS[template.color]}`}>
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>{template.label}</p>
          <p className="text-slate-400 text-xs mt-0.5">Template ID: {template.value}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${TAG_COLORS[template.color]}`} style={{ fontWeight: 500 }}>{template.tag}</span>
          {loading
            ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            : <Eye className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && preview && (
        <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500 mt-4 mb-1" style={{ fontWeight: 500 }}>
            Subject: <span className="text-slate-700">{preview.subject}</span>
          </p>
          <p className="text-xs text-slate-400 mb-2">Preview with sample data (John Doe, Sales Executive, Acme Corp)</p>
          <pre className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-4 whitespace-pre-wrap font-sans leading-relaxed max-h-80 overflow-y-auto">
            {preview.body}
          </pre>
        </div>
      )}
    </div>
  );
}
