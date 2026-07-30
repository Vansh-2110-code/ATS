import { useState, useEffect, useCallback } from 'react';
import {
  Users, ChevronDown, ChevronUp, Phone, Calendar, AlertCircle,
  Loader2, Eye, BarChart3, TrendingUp, User, Briefcase, Clock,
  CheckCircle2, XCircle, PauseCircle, Activity,
} from 'lucide-react';
import api from '../../services/api';

// ── Status pill colours ────────────────────────────────────────
const STATUS_META: Record<string, { bg: string; text: string }> = {
  'Interview Scheduled':  { bg: 'bg-violet-100', text: 'text-violet-700' },
  'Interview Completed':  { bg: 'bg-blue-100',   text: 'text-blue-700' },
  'Selected':             { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Offer Released':       { bg: 'bg-green-100',   text: 'text-green-700' },
  'Offer Accepted':       { bg: 'bg-green-200',   text: 'text-green-800' },
  'Joined':               { bg: 'bg-teal-100',    text: 'text-teal-700' },
  'Rejected – Interview Round': { bg: 'bg-red-100', text: 'text-red-600' },
  'On Hold':              { bg: 'bg-amber-100',   text: 'text-amber-700' },
  'Screening in Progress':{ bg: 'bg-cyan-100',    text: 'text-cyan-700' },
  'Eligible':             { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  'SPOC Shortlisted':     { bg: 'bg-purple-100',  text: 'text-purple-700' },
  'Not Interested':       { bg: 'bg-slate-100',   text: 'text-slate-500' },
  'Duplicate Profile':    { bg: 'bg-orange-100',  text: 'text-orange-600' },
};

function statusMeta(s?: string) {
  return STATUS_META[s || ''] ?? { bg: 'bg-slate-100', text: 'text-slate-500' };
}

// ── Pipeline stage from firstCallStatus ──────────────────────
function pipelineStage(status?: string): string {
  if (!status) return 'New';
  if (['Interview Scheduled', 'Interview Rescheduled', 'Interview Completed',
       'Interview Feedback Pending', 'Shortlisted', 'HR Round Scheduled',
       'Rejected – Interview Round'].includes(status)) return 'Interview';
  if (['Offer Released', 'Offer Accepted', 'Offer Declined',
       'Offer in Progress', 'Offer Approval Pending',
       'Salary Negotiation in Progress'].includes(status)) return 'Offer';
  if (['Joining Date Confirmed', 'Joining Postponed', 'Joined'].includes(status)) return 'Joining';
  if (['Selected'].includes(status)) return 'Selected';
  if (['Eligible', 'SPOC Shortlisted', 'Screening in Progress'].includes(status)) return 'Screening';
  if (['Rejected – Communication', 'Rejected – Experience Mismatch',
       'Rejected – Salary Mismatch', 'Rejected – Location Constraint',
       'Rejected – Notice Period'].includes(status)) return 'Rejected';
  if (['No response', 'Not reachable', 'Call back scheduled'].includes(status)) return 'Pending';
  return 'In Progress';
}

const PIPELINE_COLORS: Record<string, string> = {
  New: 'bg-slate-200 text-slate-600',
  Pending: 'bg-orange-100 text-orange-600',
  Screening: 'bg-cyan-100 text-cyan-700',
  Interview: 'bg-violet-100 text-violet-700',
  Offer: 'bg-green-100 text-green-700',
  Selected: 'bg-emerald-100 text-emerald-700',
  Joining: 'bg-teal-100 text-teal-700',
  Rejected: 'bg-red-100 text-red-600',
  'In Progress': 'bg-blue-100 text-blue-600',
};

// ── Candidate Row ─────────────────────────────────────────────
function CandidateRow({
  cand,
  onOpenTLView,
}: {
  cand: any;
  onOpenTLView: (c: any) => void;
}) {
  const status = cand.firstCallStatus || cand.status || '';
  const sm = statusMeta(status);
  const pipe = pipelineStage(status);
  const pipeColor = PIPELINE_COLORS[pipe] ?? 'bg-slate-100 text-slate-500';
  const interviewStatus = cand.interviewStatus || '';
  const isInterviewScheduled = status === 'Interview Scheduled';

  return (
    <div
      className={`flex items-start justify-between gap-2 px-4 py-3 rounded-xl border transition-all cursor-pointer group
        ${isInterviewScheduled
          ? 'border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 hover:border-indigo-300 hover:from-indigo-50 hover:to-violet-50'
          : 'border-slate-100 bg-white hover:border-green-200 hover:bg-green-50/20'
        }`}
      onClick={() => onOpenTLView(cand)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpenTLView(cand)}
    >
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-semibold truncate ${isInterviewScheduled ? 'text-indigo-800' : 'text-slate-800'} group-hover:underline`}
          >
            {cand.name || cand.candidateName || 'Unknown'}
          </span>
          {isInterviewScheduled && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
              📅 Interview
            </span>
          )}
        </div>
        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-1.5 mt-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sm.bg} ${sm.text}`}>
            {status || 'No status'}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pipeColor}`}>
            {pipe}
          </span>
          {interviewStatus && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">
              {interviewStatus}
            </span>
          )}
          {cand.qualification && (
            <span className="text-[10px] text-slate-400">{cand.qualification}</span>
          )}
        </div>
      </div>
      <div className={`flex items-center gap-1 shrink-0 pt-0.5 ${isInterviewScheduled ? 'text-indigo-300 group-hover:text-indigo-600' : 'text-slate-300 group-hover:text-green-600'}`}>
        <span className={`text-[10px] font-semibold ${isInterviewScheduled ? 'text-indigo-400 group-hover:text-indigo-600' : 'text-slate-400 group-hover:text-green-600'}`}>
          {isInterviewScheduled ? 'Update' : 'View'}
        </span>
        <Eye className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

// ── Recruiter Card ────────────────────────────────────────────
function RecruiterCard({
  recruiter,
  onOpenTLView,
}: {
  recruiter: any;
  onOpenTLView: (c: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCands, setLoadingCands] = useState(false);
  const [candFilter, setCandFilter] = useState('');

  const calls = recruiter.calls ?? recruiter.todayCalls ?? 0;
  const target = recruiter.target ?? recruiter.callTarget ?? recruiter.dailyTarget ?? 50;
  const interviews = recruiter.interviews ?? recruiter.interviewsScheduled ?? recruiter.todayInterviews ?? 0;
  const followUps = recruiter.followUps ?? recruiter.pendingFollowUps ?? 0;
  const totalCands = recruiter.totalCandidates ?? 0;
  const activeCands = recruiter.activeCandidates ?? 0;
  const pct = Math.min(100, Math.round((calls / (target || 50)) * 100));

  const initials = (recruiter.name || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase();

  const loadCandidates = useCallback(async () => {
    if (candidates.length > 0) return; // already loaded for this recruiter card instance
    setLoadingCands(true);
    try {
      // Use _id or id – whichever the API returned for this recruiter
      const id = recruiter._id || recruiter.id || recruiter.userId;
      if (!id) {
        setCandidates([]);
        return;
      }
      // Pass recruiter=<id> so backend returns ONLY this recruiter's candidates
      const res = await api.getCandidates({ recruiter: String(id), limit: '200' });
      setCandidates(res.candidates || res.data || []);
    } catch {
      setCandidates([]);
    } finally {
      setLoadingCands(false);
    }
  }, [recruiter, candidates.length]);

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadCandidates();
  };

  const displayCands = candidates;
  const filteredCands = candFilter
    ? displayCands.filter(c =>
        (c.name || c.candidateName || '').toLowerCase().includes(candFilter.toLowerCase()) ||
        (c.firstCallStatus || c.status || '').toLowerCase().includes(candFilter.toLowerCase())
      )
    : displayCands;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Recruiter Header (always visible) ── */}
      <button
        onClick={handleExpand}
        className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {initials}
          </div>
          {calls > 0 && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
          )}
        </div>

        {/* Name + metrics summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-800 text-sm font-semibold">{recruiter.name}</span>
          </div>
          {/* Mini stats row */}
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {calls}/{target} calls
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-violet-400" /> {interviews} interviews
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-400" /> {activeCands}/{totalCands} active
            </span>
          </div>
        </div>

        {/* Progress pill + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
            pct >= 80 ? 'bg-emerald-100 text-emerald-700' :
            pct >= 50 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {pct}%
          </span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      {/* ── Progress bar ── */}
      <div className="px-5 pb-3">
        <div className="bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-green-500' : 'bg-amber-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* Performance metrics grid */}
          <div className="px-5 py-4 bg-slate-50/60">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-green-600" /> Performance Metrics
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Calls Today',    value: calls,       suffix: `/ ${target}`, icon: Phone,        bg: 'bg-green-50',  text: 'text-green-700' },
                { label: 'Interviews',     value: interviews,  icon: Calendar,         bg: 'bg-violet-50', text: 'text-violet-700' },
                { label: 'Follow-Ups',     value: followUps,   icon: AlertCircle,      bg: 'bg-amber-50',  text: 'text-amber-700' },
                { label: 'Active / Total', value: `${activeCands}/${totalCands}`, icon: Users, bg: 'bg-blue-50', text: 'text-blue-700' },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className={`rounded-lg p-3 ${m.bg}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${m.text}`} />
                      <span className="text-xs text-slate-500">{m.label}</span>
                    </div>
                    <div className={`text-base font-bold ${m.text}`}>
                      {m.value}
                      {m.suffix && <span className="text-slate-400 text-xs font-normal ml-1">{m.suffix}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Candidate list */}
          <div className="px-5 py-4">
            {/* Search */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {candidates.length > 0 && (
                <input
                  type="text"
                  value={candFilter}
                  onChange={e => setCandFilter(e.target.value)}
                  placeholder="Search candidates..."
                  className="ml-auto text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-green-400 bg-white w-40"
                />
              )}
            </div>

            {/* Candidate rows */}
            {loadingCands ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              </div>
            ) : filteredCands.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-sm">
                {candFilter
                  ? 'No candidates match your search'
                  : 'No candidates found for this recruiter'
                }
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredCands.map((cand: any) => (
                  <CandidateRow
                    key={cand._id || cand.id}
                    cand={cand}
                    onOpenTLView={onOpenTLView}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────
interface MyTeamSectionProps {
  teamFromDashboard: any[];        // recruiters already loaded by dashboard
  onOpenTLView: (c: any) => void;  // opens TLCandidateViewModal
}

export function MyTeamSection({ teamFromDashboard, onOpenTLView }: MyTeamSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Try /team/members; fall back to dashboard data
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getTeamMembers();
        const members = res.members || res.data || res || [];
        if (Array.isArray(members) && members.length > 0) {
          // Merge with dashboard metrics if available
          const merged = members.map((m: any) => {
            const dash = teamFromDashboard.find(
              d => d.id === (m._id || m.id || m.userId) || d.name === m.name
            );
            return { ...m, ...(dash ?? {}) };
          });
          setTeamMembers(merged);
        } else {
          // Fall back to dashboard data
          setTeamMembers(teamFromDashboard);
        }
      } catch {
        // Fall back silently
        setTeamMembers(teamFromDashboard);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamFromDashboard]);

  // Summary stats
  const totalInterviewScheduled = 0; // loaded lazily per-recruiter
  const activeCount = teamMembers.filter(r => (r.calls ?? 0) > 0).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-slate-800 text-sm font-bold flex items-center gap-2">
              My Team
              <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                {teamMembers.length} recruiters
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeCount} active today · Click a recruiter to expand
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-300" />
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-6 py-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <p>No team members assigned yet.</p>
              <p className="text-xs mt-1">Ask your admin to assign recruiters to your team.</p>
            </div>
          ) : (
            teamMembers.map((recruiter: any) => (
              <RecruiterCard
                key={recruiter._id || recruiter.id || recruiter.userId || recruiter.name}
                recruiter={recruiter}
                onOpenTLView={onOpenTLView}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
