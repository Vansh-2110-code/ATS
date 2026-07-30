import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Phone, PhoneOff, CheckCircle2, Loader2, ExternalLink, Clock } from 'lucide-react';
import api from '../../services/api';

const CALL_OUTCOMES = [
  { label: 'Interested', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { label: 'Not Interested', color: 'bg-red-100 text-red-600 border-red-200' },
  { label: 'Call Back', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { label: 'No Answer', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { label: 'Busy', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { label: 'Wrong Number', color: 'bg-rose-100 text-rose-600 border-rose-200' },
];

/**
 * CallingScreen – native dialer workflow
 *
 * 1. Loads candidate data & creates a CallLog entry on the backend
 * 2. Opens the device's native phone dialer via the `tel:` protocol
 *    (mobile-to-mobile call — no VoIP, no data usage, no third-party service)
 * 3. A timer starts so the recruiter can track approximate call duration
 * 4. When the recruiter returns to the app, they mark the call ended,
 *    pick an outcome, add optional notes, and the log is saved
 */
export function CallingScreen() {
  const navigate = useNavigate();
  const { id: candidateId } = useParams();

  const [phase, setPhase] = useState<'loading' | 'ready' | 'calling' | 'log' | 'saved'>('loading');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [candidate, setCandidate] = useState<any>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [error, setError] = useState('');

  /* ── Load candidate + create call log ── */
  useEffect(() => {
    if (!candidateId) return;
    (async () => {
      try {
        const cand = await api.getCandidate(candidateId);
        setCandidate(cand.candidate || cand);
        const call = await api.initiateCall(candidateId);
        setCallId(call.call?._id || call._id || null);
        setPhase('ready');
      } catch (err) {
        console.error('Failed to initiate call:', err);
        setError('Could not load candidate. Please go back and try again.');
      }
    })();
  }, [candidateId]);

  /* ── Timer that runs while call is active ── */
  useEffect(() => {
    if (phase === 'calling') {
      timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  /* ── Open native dialer via tel: protocol ── */
  const handleDial = () => {
    const phone = candidate?.phone;
    if (!phone) return;

    // Open the device's default phone app — standard GSM call, no internet
    window.location.href = `tel:${phone}`;

    // Start the in-app timer so the recruiter can track duration
    setPhase('calling');
  };

  /* ── Mark call ended (recruiter taps after hanging up in phone app) ── */
  const handleEndCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('log');
    if (callId) {
      try {
        await api.endCall(callId, timer);
      } catch (err) {
        console.error('Failed to end call:', err);
      }
    }
  };

  /* ── Save outcome + notes ── */
  const handleSave = async () => {
    if (!outcome) return;
    if (callId) {
      try {
        await api.logCallOutcome(callId, outcome, note || undefined);
      } catch (err) {
        console.error('Failed to log outcome:', err);
      }
    }
    setPhase('saved');
    setTimeout(() => navigate(-1), 1500);
  };

  /* ── Saved confirmation ── */
  if (phase === 'saved') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <h2 className="text-slate-800 mb-2" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Call Logged</h2>
          <p className="text-slate-500 text-sm">Returning to candidate profile...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-slate-800 mb-2" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Unable to Call</h2>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700" style={{ fontWeight: 500 }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading state ── */
  if (phase === 'loading') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* ── Header Panel ── */}
        <div className={`p-8 text-center text-white transition-colors ${
          phase === 'ready' ? 'bg-green-600' :
          phase === 'calling' ? 'bg-emerald-600' : 'bg-slate-700'
        }`}>
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <span style={{ fontWeight: 700, fontSize: '2rem' }}>
              {candidate?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
            </span>
          </div>

          <h2 className="mb-1" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{candidate?.name || 'Candidate'}</h2>
          <p className="text-white/80 text-sm mb-4">{candidate?.phone || ''}</p>

          {/* Status text */}
          {phase === 'ready' && (
            <p className="text-white/80 text-sm mb-2">Tap the button below to dial via your phone</p>
          )}
          {phase === 'calling' && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm" style={{ fontWeight: 500 }}>Call in progress (via phone dialer)</span>
            </div>
          )}
          {phase === 'log' && (
            <span className="text-sm" style={{ fontWeight: 500 }}>Call Ended · {formatTime(timer)}</span>
          )}

          {/* Timer */}
          {phase === 'calling' && (
            <div className="text-2xl mt-1" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timer)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {phase === 'ready' && (
              <button
                onClick={handleDial}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <Phone className="w-7 h-7 text-green-600" />
              </button>
            )}

            {phase === 'calling' && (
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* ── Native Dialer Info Banner ── */}
        {(phase === 'ready' || phase === 'calling') && (
          <div className="px-6 py-4 bg-green-50 border-t border-green-100 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700 text-xs" style={{ fontWeight: 500 }}>
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Call opens in your phone's native dialer — normal mobile call, no internet needed</span>
            </div>
          </div>
        )}

        {/* ── Post-Call Logging Form ── */}
        {phase === 'log' && (
          <div className="p-6 space-y-5">
            {/* Duration summary */}
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Approximate call duration: <strong>{formatTime(timer)}</strong></span>
            </div>

            {/* Outcome */}
            <div>
              <h3 className="text-slate-800 text-sm mb-3" style={{ fontWeight: 600 }}>
                Call Outcome <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CALL_OUTCOMES.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setOutcome(opt.label)}
                    className={`px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                      outcome === opt.label
                        ? opt.color + ' border'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    style={{ fontWeight: outcome === opt.label ? 600 : 400 }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-700 text-sm mb-2" style={{ fontWeight: 500 }}>
                Call Notes
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What did you discuss? Any important details..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 resize-none"
                rows={3}
              />
            </div>

            {/* Save / Skip */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!outcome}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontWeight: 600 }}
              >
                Save & Close
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm"
                style={{ fontWeight: 500 }}
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
