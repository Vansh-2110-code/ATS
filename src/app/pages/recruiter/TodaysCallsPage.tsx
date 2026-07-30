import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Phone, Clock, Loader2, PhoneOff,
  PhoneCall, PhoneMissed, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

const OUTCOME_COLORS: Record<string, { bg: string; icon: string }> = {
  'Interested':     { bg: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-500' },
  'Not Interested': { bg: 'bg-red-100 text-red-600',         icon: 'text-red-400' },
  'Call Back':      { bg: 'bg-amber-100 text-amber-700',     icon: 'text-amber-500' },
  'No Answer':      { bg: 'bg-slate-100 text-slate-600',     icon: 'text-slate-400' },
  'Busy':           { bg: 'bg-orange-100 text-orange-700',   icon: 'text-orange-500' },
  'Wrong Number':   { bg: 'bg-red-100 text-red-600',         icon: 'text-red-400' },
};

const OUTCOME_ICONS: Record<string, any> = {
  'Interested':     CheckCircle2,
  'Not Interested': XCircle,
  'Call Back':      PhoneCall,
  'No Answer':      PhoneMissed,
  'Busy':           PhoneOff,
  'Wrong Number':   PhoneOff,
};

const outcomeStats = (calls: any[]) => {
  const counts: Record<string, number> = {};
  calls.forEach(c => {
    const key = c.outcome || 'Pending';
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

export function TodaysCallsPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyCalls(today)
      .then((data: any) => setCalls(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (secs: number) => {
    if (!secs || secs < 0) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const stats = outcomeStats(calls);
  const completed = calls.filter(c => c.completed).length;
  const pending = calls.filter(c => !c.completed).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>
            Today's Calls
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-center min-w-[70px]">
            <div className="text-green-700" style={{ fontWeight: 700, fontSize: '1.4rem' }}>{calls.length}</div>
            <div className="text-green-600 text-xs">Total</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-center min-w-[70px]">
            <div className="text-emerald-700" style={{ fontWeight: 700, fontSize: '1.4rem' }}>{completed}</div>
            <div className="text-emerald-600 text-xs">Completed</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center min-w-[70px]">
            <div className="text-amber-700" style={{ fontWeight: 700, fontSize: '1.4rem' }}>{pending}</div>
            <div className="text-amber-600 text-xs">Pending</div>
          </div>
        </div>
      </div>

      {/* Outcome Summary */}
      {!loading && calls.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-3" style={{ fontWeight: 600 }}>Outcome Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats).map(([outcome, count]) => (
              <span
                key={outcome}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${OUTCOME_COLORS[outcome]?.bg || 'bg-slate-100 text-slate-600'}`}
                style={{ fontWeight: 500 }}
              >
                <Phone className="w-3 h-3" />
                {outcome}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Calls Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      ) : calls.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-700 mb-1" style={{ fontWeight: 600 }}>No calls made today</p>
          <p className="text-slate-400 text-sm">Start calling candidates to see your activity here.</p>
          <button
            onClick={() => navigate('/recruiter/resumes')}
            className="mt-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            style={{ fontWeight: 500 }}
          >
            Go to Resume Pool
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-slate-600 text-sm" style={{ fontWeight: 600 }}>
              {calls.length} call{calls.length !== 1 ? 's' : ''} recorded
            </span>
            <span className="text-slate-400 text-xs">All times in local timezone</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>#</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>Candidate</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>Phone</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>Time</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>Duration</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>Outcome</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>Recruiter</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {calls.map((call: any, i: number) => {
                  const OutcomeIcon = OUTCOME_ICONS[call.outcome] || AlertCircle;
                  return (
                    <tr key={call._id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-sm">{i + 1}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-700 text-xs" style={{ fontWeight: 700 }}>
                              {(call.candidateName || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <button
                            onClick={() => call.candidate && navigate(`/recruiter/candidate/${call.candidate}`)}
                            className={`text-sm text-left ${call.candidate ? 'text-slate-700 hover:text-green-600 cursor-pointer' : 'text-slate-600 cursor-default'}`}
                            style={{ fontWeight: 500 }}
                          >
                            {call.candidateName || '—'}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {call.candidatePhone || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(call.startTime || call.createdAt)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-sm font-mono">
                        {formatDuration(call.duration)}
                      </td>

                      <td className="px-4 py-3">
                        {call.outcome ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${OUTCOME_COLORS[call.outcome]?.bg || 'bg-slate-100 text-slate-600'}`}
                            style={{ fontWeight: 500 }}
                          >
                            <OutcomeIcon className="w-3 h-3" />
                            {call.outcome}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Pending</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-sm">{call.recruiterName || '—'}</td>

                      <td className="px-4 py-3">
                        {call.candidate && (
                          <button
                            onClick={() => navigate(`/recruiter/candidate/${call.candidate}`)}
                            className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50"
                            style={{ fontWeight: 500 }}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
