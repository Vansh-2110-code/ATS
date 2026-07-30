import { useState, useEffect } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import api from '../../services/api';
import { MyTeamSection } from './MyTeamSection';
import { TLCandidateViewModal } from './TLCandidateViewModal';

export function MyTeamPage() {
  const navigate = useNavigate();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tlCandidate, setTlCandidate] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const dashData = await api.getTLDashboard();
        const t = dashData.teamMembers || dashData.team || dashData.recruiters || [];
        setTeam(t.map((r: any) => ({
          id: r._id || r.id,
          name: r.name || '',
          calls: r.calls ?? r.todayCalls ?? 0,
          totalCalls: r.totalCalls ?? 0,
          target: r.target ?? r.callTarget ?? r.dailyTarget ?? 50,
          interviews: r.interviews ?? r.todayInterviews ?? r.interviewsScheduled ?? 0,
          totalInterviewsScheduled: r.totalInterviewsScheduled ?? 0,
          followUps: r.followUps ?? r.pendingFollowUps ?? 0,
          totalCandidates: r.totalCandidates ?? 0,
          activeCandidates: r.activeCandidates ?? 0,
          status: r.onTarget ? 'on-target' : (r.status || 'offline'),
          joined: r.joined ?? r.totalJoined ?? 0,
        })));
      } catch (err) {
        console.error('Failed to load team for My Team page:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openTLCandidateView = (cand: any) => {
    setTlCandidate(cand);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-slate-800 flex items-center gap-2" style={{ fontWeight: 700, fontSize: '1.5rem' }}>
          <Users className="w-6 h-6 text-green-600" />
          My Team
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Monitor your recruiters' daily activities and candidate pipelines.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <MyTeamSection
          teamFromDashboard={team}
          onOpenTLView={openTLCandidateView}
        />
      )}

      {/* TL Candidate Modal */}
      {tlCandidate && (
        <TLCandidateViewModal
          candidate={tlCandidate}
          onClose={() => setTlCandidate(null)}
          onSaved={() => {
            // Optional: trigger re-fetch of candidates if needed, 
            // but MyTeamSection handles its own local candidate fetching 
            // when expanding a recruiter, or you can force a refresh if desired.
          }}
        />
      )}
    </div>
  );
}
