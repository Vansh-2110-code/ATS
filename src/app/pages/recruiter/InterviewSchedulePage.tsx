import { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, MapPin, Video, Phone as PhoneIcon,
  CheckCircle2, XCircle, AlertCircle, Plus, Filter, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { Link } from 'react-router';
import api from '../../services/api';

interface Interview {
  id: string;
  candidateName: string;
  candidateId: string;
  role: string;
  recruiter: string;
  date: string;
  time: string;
  mode: 'In-Person' | 'Video' | 'Telephonic';
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  round: string;
  location?: string;
  link?: string;
  notes?: string;
}

const STATUS_STYLES: Record<Interview['status'], { badge: string; icon: React.ElementType }> = {
  Scheduled: { badge: 'bg-green-100 text-green-700', icon: Clock },
  Completed: { badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  Cancelled: { badge: 'bg-red-100 text-red-600', icon: XCircle },
  'No Show': { badge: 'bg-amber-100 text-amber-700', icon: AlertCircle },
};

const MODE_ICONS: Record<Interview['mode'], React.ElementType> = {
  'In-Person': MapPin,
  Video: Video,
  Telephonic: PhoneIcon,
};

const MODE_COLORS: Record<Interview['mode'], string> = {
  'In-Person': 'text-violet-600 bg-violet-50',
  Video: 'text-green-600 bg-green-50',
  Telephonic: 'text-emerald-600 bg-emerald-50',
};

export function InterviewSchedulePage() {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [modeFilter, setModeFilter] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ candidateId: '', candidateName: '', date: '', time: '', mode: 'Video' as Interview['mode'], round: 'HR Round', notes: '' });
  const [creating, setCreating] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateResults, setCandidateResults] = useState<{ _id: string; name: string; phone: string; status: string }[]>([]);
  const [searchingCandidates, setSearchingCandidates] = useState(false);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const data = await api.getInterviews();
        const list = data.interviews || data || [];
        setInterviews(list.map((i: any) => {
          const rawId = i._id || i.id || '';
          // Candidate-sourced interviews have id like "cand_<objectId>"
          const candidateId = i.candidateId?._id || i.candidateId || i.candidate?._id || i.candidate || '';
          return {
            id: rawId,
            candidateName: i.candidate?.name || i.candidateName || '',
            candidateId: String(candidateId),
            role: i.role || '',
            recruiter: i.recruiter?.name || i.recruiterName || i.recruiter || '',
            date: i.date ? new Date(i.date).toISOString().split('T')[0] : '',
            time: i.time || '',
            mode: (['In-Person', 'Video', 'Telephonic'].includes(i.mode) ? i.mode : 'In-Person') as Interview['mode'],
            status: (['Scheduled', 'Completed', 'Cancelled', 'No Show'].includes(i.status) ? i.status : 'Scheduled') as Interview['status'],
            round: i.round || 'HR Round',
            location: i.location,
            link: i.link,
            notes: i.notes,
          };
        }));
      } catch (err) {
        console.error('Failed to load interviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const searchCandidates = async (term: string) => {
    setCandidateSearch(term);
    if (!term || term.length < 2) { setCandidateResults([]); return; }
    try {
      setSearchingCandidates(true);
      const data = await api.getCandidates({ search: term, limit: '10' });
      setCandidateResults((data.candidates || []).map((c: any) => ({ _id: c._id, name: c.name, phone: c.phone, status: c.status })));
    } catch { setCandidateResults([]); }
    finally { setSearchingCandidates(false); }
  };

  const selectCandidate = (c: { _id: string; name: string }) => {
    setNewForm(f => ({ ...f, candidateId: c._id, candidateName: c.name }));
    setCandidateSearch(c.name);
    setCandidateResults([]);
  };

  const updateStatus = async (id: string, status: Interview['status']) => {
    try {
      await api.updateInterviewStatus(id, status);
      setInterviews(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (err) {
      console.error('Failed to update interview status:', err);
    }
  };

  const handleCreateInterview = async () => {
    if (!newForm.candidateId || !newForm.date || !newForm.time) return;
    try {
      setCreating(true);
      const data = await api.createInterview({ ...newForm, candidateId: newForm.candidateId });
      const created = data.interview || data;
      setInterviews(prev => [...prev, {
        id: created._id || created.id || Date.now().toString(),
        candidateName: created.candidateName || newForm.candidateName,
        candidateId: created.candidate || '',
        role: created.role || '',
        recruiter: created.recruiter?.name || '',
        date: created.date ? new Date(created.date).toISOString().split('T')[0] : newForm.date,
        time: created.time || newForm.time,
        mode: created.mode || newForm.mode,
        status: 'Scheduled',
        round: created.round || newForm.round,
        notes: created.notes || newForm.notes,
      }]);
      setShowNew(false);
      setNewForm({ candidateId: '', candidateName: '', date: '', time: '', mode: 'Video', round: 'HR Round', notes: '' });
      setCandidateSearch('');
      setCandidateResults([]);
    } catch (err) {
      console.error('Failed to create interview:', err);
    } finally {
      setCreating(false);
    }
  };

  const filtered = interviews.filter(i => {
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    const matchMode = modeFilter === 'All' || i.mode === modeFilter;
    const matchDate = selectedDate === 'All' || i.date === selectedDate;
    return matchStatus && matchMode && matchDate;
  });

  const today = new Date().toISOString().split('T')[0];
  // Dynamic next-14-days for the date filter dropdown
  const FILTER_DATES = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
  const WEEK_DATES = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + i);
    return d.toISOString().split('T')[0];
  });
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const todayInterviews = interviews.filter(i => i.date === today);
  const scheduled = interviews.filter(i => i.status === 'Scheduled').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>Interview Schedule</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage and track all scheduled interviews</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            style={{ fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" /> New Interview
          </button>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['list', 'calendar'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2 text-xs capitalize transition-colors ${view === v ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                style={{ fontWeight: view === v ? 600 : 400 }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New Interview Form */}
      {showNew && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5 space-y-4">
          <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Schedule New Interview</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Candidate *</label>
              <input
                type="text"
                value={candidateSearch}
                onChange={e => searchCandidates(e.target.value)}
                placeholder="Search candidate name or phone…"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400"
              />
              {newForm.candidateId && (
                <p className="text-xs text-green-600 mt-0.5">✓ {newForm.candidateName}</p>
              )}
              {candidateResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {searchingCandidates && <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>}
                  {candidateResults.map(c => (
                    <button key={c._id} type="button" onClick={() => selectCandidate(c)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                      <p className="text-sm text-slate-700" style={{ fontWeight: 500 }}>{c.name}</p>
                      <p className="text-xs text-slate-400">{c.phone} · {c.status}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Date *</label>
              <input type="date" value={newForm.date} onChange={e => setNewForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Time *</label>
              <input type="time" value={newForm.time} onChange={e => setNewForm(f => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Mode</label>
              <select value={newForm.mode} onChange={e => setNewForm(f => ({ ...f, mode: e.target.value as Interview['mode'] }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 bg-white">
                <option>Video</option><option>In-Person</option><option>Telephonic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Round</label>
              <select value={newForm.round} onChange={e => setNewForm(f => ({ ...f, round: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 bg-white">
                <option>HR Round</option><option>Technical Round</option><option>Operations Round</option><option>Final Round</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Notes</label>
              <input type="text" value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50" style={{ fontWeight: 500 }}>Cancel</button>
            <button onClick={handleCreateInterview} disabled={creating || !newForm.candidateId || !newForm.date || !newForm.time} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors" style={{ fontWeight: 600 }}>
              {creating ? 'Creating...' : 'Schedule Interview'}
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Today's Interviews", value: todayInterviews.length, color: 'blue' },
          { label: 'Scheduled (Total)', value: scheduled, color: 'violet' },
          { label: 'Completed', value: interviews.filter(i => i.status === 'Completed').length, color: 'emerald' },
          { label: 'No Shows', value: interviews.filter(i => i.status === 'No Show').length, color: 'amber' },
        ].map(({ label, value, color }) => {
          const c: Record<string, string> = {
            blue: 'text-green-600 bg-green-50 border-green-100',
            violet: 'text-violet-600 bg-violet-50 border-violet-100',
            emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            amber: 'text-amber-600 bg-amber-50 border-amber-100',
          };
          return (
            <div key={label} className={`rounded-xl border p-4 ${c[color]}`}>
              <div style={{ fontWeight: 700, fontSize: '1.75rem' }}>{value}</div>
              <div className="text-sm opacity-80 mt-0.5">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
              Week of {new Date(WEEK_DATES[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(WEEK_DATES[6]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
              <button className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {WEEK_DATES.map((date, idx) => {
              const dayInterviews = interviews.filter(i => i.date === date);
              const isToday = date === today;
              return (
                <div key={date} className={`min-h-[120px] p-2 ${isToday ? 'bg-green-50/50' : ''}`}>
                  <div className="text-center mb-2">
                    <div className="text-xs text-slate-400">{DAY_LABELS[idx]}</div>
                    <div className={`text-sm mx-auto w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-green-600 text-white' : 'text-slate-700'}`} style={{ fontWeight: isToday ? 700 : 500 }}>
                      {parseInt(date.split('-')[2])}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {dayInterviews.map(i => (
                      <div key={i.id} className={`text-xs px-1.5 py-1 rounded-md truncate ${STATUS_STYLES[i.status].badge}`} style={{ fontWeight: 500 }}>
                        {i.time} {i.candidateName.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Filter className="w-3.5 h-3.5" />
          <span style={{ fontWeight: 600 }}>FILTER BY:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700"
          >
            <option value="All">All Dates</option>
            {FILTER_DATES.map((d, i) => (
              <option key={d} value={d}>
                {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {i === 0 ? ' (Today)' : ''}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700"
          >
            <option value="All">All Status</option>
            {['Scheduled', 'Completed', 'Cancelled', 'No Show'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white text-slate-700"
          >
            <option value="All">All Modes</option>
            {['In-Person', 'Video', 'Telephonic'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} interviews</span>
      </div>

      {/* Interview Cards */}
      <div className="space-y-3">
        {filtered.map(interview => {
          const StatusIcon = STATUS_STYLES[interview.status].icon;
          const ModeIcon = MODE_ICONS[interview.mode];
          return (
            <div key={interview.id} className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
              <div className="flex items-start gap-4 flex-wrap">
                {/* Left: Time + Mode */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>{interview.time}</div>
                  <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${MODE_COLORS[interview.mode]}`} style={{ fontWeight: 500 }}>
                    <ModeIcon className="w-3 h-3" />
                    {interview.mode}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-slate-100 self-stretch hidden sm:block" />

                {/* Middle: Details */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <Link
                        to={`/recruiter/candidate/${interview.candidateId}`}
                        className="text-slate-800 text-sm hover:text-green-600 transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        {interview.candidateName}
                      </Link>
                      <p className="text-slate-500 text-xs mt-0.5">{interview.role}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${STATUS_STYLES[interview.status].badge}`} style={{ fontWeight: 500 }}>
                      <StatusIcon className="w-3 h-3" />
                      {interview.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(interview.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {interview.recruiter}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
                      {interview.round}
                    </span>
                    {interview.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {interview.location}
                      </span>
                    )}
                    {interview.link && (
                      <a href="#" className="flex items-center gap-1 text-green-500 hover:text-green-700">
                        <Video className="w-3 h-3" /> {interview.link}
                      </a>
                    )}
                  </div>

                  {interview.notes && (
                    <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border-l-2 border-green-200">
                      {interview.notes}
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {interview.status === 'Scheduled' && (
                    <>
                      <button
                        onClick={() => updateStatus(interview.id, 'Completed')}
                        className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                        style={{ fontWeight: 500 }}
                      >
                        Mark Done
                      </button>
                      <button
                        onClick={() => updateStatus(interview.id, 'No Show')}
                        className="text-xs px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100"
                        style={{ fontWeight: 500 }}
                      >
                        No Show
                      </button>
                      <button
                        onClick={() => updateStatus(interview.id, 'Cancelled')}
                        className="text-xs px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"
                        style={{ fontWeight: 500 }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <Link
                    to={`/recruiter/candidate/${interview.candidateId}`}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-1"
                    style={{ fontWeight: 500 }}
                  >
                    <User className="w-3 h-3" /> Profile
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-xl py-16 text-center">
            <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm" style={{ fontWeight: 500 }}>No interviews found</p>
            <p className="text-slate-400 text-xs mt-1">Adjust your filters or schedule a new interview</p>
          </div>
        )}
      </div>
    </div>
  );
}
