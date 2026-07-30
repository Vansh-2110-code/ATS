import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader2, Eye, Calendar, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { TLCandidateViewModal } from './TLCandidateViewModal';

interface FollowUpCandidate {
  id: string;
  name: string;
  phone: string;
  email: string;
  skills: string;
  experience: string;
  source: string;
  status: string;
  recruiter: string;
  firstCallDate?: string;
  firstCallStatus?: string;
}

export function TLFollowUpPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<FollowUpCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tlCandidate, setTlCandidate] = useState<FollowUpCandidate | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Fetch candidates with firstCallStatus === 'Eligible' and tlCallSubmitted === false
        const res = await api.getCandidates({ tlFollowUpRequired: 'true', limit: '100' });
        const list = (res.candidates || res.data || []).map((c: any) => ({
          id: c._id || c.id,
          name: c.name || '',
          phone: c.phone || '',
          email: c.email || '',
          skills: Array.isArray(c.skills) ? c.skills.join(', ') : (c.skills || ''),
          experience: c.experience || '',
          source: c.source || '',
          status: c.status || 'New',
          recruiter: c.assignedRecruiterName || c.assignedRecruiter?.name || 'Unknown',
          firstCallDate: c.firstCallDate,
          firstCallStatus: c.firstCallStatus,
        }));
        setCandidates(list);
      } catch (err) {
        console.error('Failed to load TL follow ups:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelect = (c: FollowUpCandidate) => {
    setTlCandidate(c);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div>
        <h1 className="text-slate-800 flex items-center gap-2" style={{ fontWeight: 700, fontSize: '1.4rem' }}>
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Pending Follow-Ups
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Candidates marked as Eligible awaiting your Second Call.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
            Eligible Candidates
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{candidates.length}</span>
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye className="w-5 h-5 text-slate-300" />
            </div>
            No pending follow-ups right now.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {candidates.map(c => (
              <div key={c.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm text-slate-800" style={{ fontWeight: 600 }}>{c.name}</h3>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold border border-indigo-100">
                        {c.firstCallStatus || 'Eligible'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Recruiter: <span className="text-slate-700" style={{ fontWeight: 500 }}>{c.recruiter}</span></p>
                      <p>Phone: {c.phone} {c.email && `| Email: ${c.email}`}</p>
                      {c.firstCallDate && (
                        <p className="flex items-center gap-1 mt-1 text-amber-600">
                          <Clock className="w-3 h-3" />
                          Eligible since: {new Date(c.firstCallDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelect(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    Take Follow-up <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TL Candidate Modal */}
      {tlCandidate && (
        <TLCandidateViewModal
          candidate={tlCandidate}
          onClose={() => setTlCandidate(null)}
          onSaved={() => {
            // Re-fetch list to remove it if no longer pending, or just refresh
            setLoading(true);
            api.getCandidates({ tlFollowUpRequired: 'true', limit: '100' }).then(res => {
              const list = (res.candidates || res.data || []).map((c: any) => ({
                id: c._id || c.id,
                name: c.name || '',
                phone: c.phone || '',
                email: c.email || '',
                skills: Array.isArray(c.skills) ? c.skills.join(', ') : (c.skills || ''),
                experience: c.experience || '',
                source: c.source || '',
                status: c.status || 'New',
                recruiter: c.assignedRecruiterName || c.assignedRecruiter?.name || 'Unknown',
                firstCallDate: c.firstCallDate,
                firstCallStatus: c.firstCallStatus,
              }));
              setCandidates(list);
              setLoading(false);
            });
          }}
        />
      )}
    </div>
  );
}
