import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  Phone, Calendar, AlertCircle, TrendingUp, ArrowRight, Users, Edit3, Loader2, Mail,
  X, Eye, BarChart3, Zap, Target, Award, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { getGreeting } from '../../utils/greetingUtils';
import { TLCandidateViewModal } from './TLCandidateViewModal';
import { TeamPerformanceReviews } from '../../components/TeamPerformanceReviews';

interface TeamMember {
  id: string;
  name: string;
  calls: number;
  totalCalls: number;
  target: number;
  interviews: number;
  totalInterviewsScheduled: number;
  followUps: number;
  totalCandidates: number;
  activeCandidates: number;
  status: string;
  joined: string;
}



const STATUS_COLORS: Record<string, { dot: string; badge: string }> = {
  online: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  'on-target': { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  break: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  offline: { dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500' },
};

export function TLDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Recruiter detail view state
  const [selectedRecruiter, setSelectedRecruiter] = useState<TeamMember | null>(null);
  const [recruiterCandidates, setRecruiterCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [tlCandidate, setTlCandidate] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [dashData, tasksData] = await Promise.all([
          api.getTLDashboard(),
          api.getTasks({ status: 'Pending,In Progress' }).catch(() => ({ tasks: [] })),
        ]);
        const t = dashData.teamMembers || dashData.team || dashData.recruiters || [];
        setTeam(t.map((r: any) => ({
          id: r._id || r.id,
          name: r.name || '',
          calls: r.calls ?? r.todayCalls ?? 0,
          target: r.target ?? r.callTarget ?? r.dailyTarget ?? 50,
          interviews: r.interviews ?? r.todayInterviews ?? r.interviewsScheduled ?? 0,
          totalInterviewsScheduled: r.totalInterviewsScheduled ?? 0,
          followUps: r.followUps ?? r.pendingFollowUps ?? 0,
          totalCandidates: r.totalCandidates ?? 0,
          activeCandidates: r.activeCandidates ?? 0,
          status: r.onTarget ? 'on-target' : (r.status || 'offline'),
          joined: r.joined || r.loginTime || '—',
        })));

        setTasks(tasksData.tasks || []);
      } catch (err) {
        console.error('Failed to load TL dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load candidates for selected recruiter
  const loadRecruiterCandidates = async (recruiterId: string) => {
    setLoadingCandidates(true);
    try {
      const res = await api.getCandidates({ recruiter: recruiterId, limit: '200' });
      setRecruiterCandidates(res.candidates || res.data || []);
    } catch (err) {
      console.error('Failed to load recruiter candidates:', err);
      setRecruiterCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Open recruiter detail
  const openRecruiterDetail = async (recruiter: TeamMember) => {
    setSelectedRecruiter(recruiter);
    await loadRecruiterCandidates(recruiter.id);
  };

  // Open TL candidate view Modal
  const openTLCandidateView = (cand: any) => {
    setTlCandidate(cand);
  };

  const totalCallsDone = team.reduce((s, r) => s + (r.totalCalls || r.calls), 0);
  const totalInterviews = team.reduce((s, r) => s + (r.totalInterviewsScheduled || r.interviews), 0);
  const totalFollowUps = team.reduce((s, r) => s + r.followUps, 0);
  const totalActiveCandidates = team.reduce((s, r) => s + r.activeCandidates, 0);
  const totalCandidatesCount = team.reduce((s, r) => s + r.totalCandidates, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.5rem' }}>Team Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">{getGreeting()}, {user?.name.split(' ')[0]}! Here's your team's performance today.</p>
      </div>

      {/* Team Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Calls Done', value: totalCallsDone, icon: Phone, color: 'blue', href: '/recruiter/resumes' },
          { label: 'Interviews Scheduled', value: totalInterviews, icon: Calendar, color: 'violet', href: '/recruiter/interviews' },
          { label: 'Pending Follow-Ups', value: totalFollowUps, icon: AlertCircle, color: 'amber', href: '/tl/follow-ups' },

          { label: 'Active Recruiters', value: `${team.filter(r => r.calls > 0).length}/${team.length}`, icon: Users, color: 'emerald', href: '' },
          { label: 'Active Candidates', value: totalActiveCandidates, icon: Users, color: 'blue', href: '' },
          { label: 'Total Candidates', value: totalCandidatesCount, icon: Users, color: 'violet', href: '' },
        ].map((m, i) => {
          const Icon = m.icon;
          const colors: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-600',
            violet: 'bg-violet-50 text-violet-600',
            amber: 'bg-amber-50 text-amber-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            red: 'bg-red-50 text-red-600',
          };
          const card = (
            <>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[m.color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-slate-800 mb-0.5" style={{ fontWeight: 700, fontSize: '1.75rem' }}>{m.value}</div>
              <div className="text-slate-500 text-sm">{m.label}</div>
            </>
          );
          return m.href ? (
            <button key={i} onClick={() => navigate(m.href)}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all w-full">
              {card}
            </button>
          ) : (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">{card}</div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recruiter Performance Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Recruiter Performance — Today</h2>
          </div>
          {team.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
              No active recruiters found.
            </div>
          )}
          {team.map(r => {
            const pct = Math.min(100, Math.round((r.calls / (r.target || 50)) * 100));
            const sc = STATUS_COLORS[r.status] || STATUS_COLORS.offline;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 text-sm" style={{ fontWeight: 600 }}>
                          {r.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${sc.dot}`} />
                    </div>
                    <div>
                      <button
                        onClick={() => openRecruiterDetail(r)}
                        className="text-slate-700 text-sm hover:text-green-600 transition-colors text-left flex items-center gap-2"
                        style={{ fontWeight: 600 }}
                      >
                        {r.name}
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <p className="text-slate-400 text-xs">Joined: {r.joined}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${sc.badge}`} style={{ fontWeight: 500 }}>
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Call Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Calls: {r.calls} / {r.target}</span>
                    <span style={{ fontWeight: 500 }}>{pct}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-slate-700 text-sm" style={{ fontWeight: 700 }}>{r.calls}</div>
                    <div className="text-slate-400 text-xs">Calls Today</div>
                  </div>
                  <button onClick={() => navigate('/recruiter/interviews')} className="hover:bg-violet-50 rounded-lg py-1 transition-colors">
                    <div className="text-violet-600 text-sm" style={{ fontWeight: 700 }}>{r.interviews}</div>
                    <div className="text-slate-400 text-xs">Interviews</div>
                  </button>
                  <button onClick={() => navigate('/tl/follow-ups')} className="hover:bg-amber-50 rounded-lg py-1 transition-colors">
                    <div className={`text-sm ${r.followUps > 5 ? 'text-amber-600' : 'text-slate-700'}`} style={{ fontWeight: 700 }}>{r.followUps}</div>
                    <div className="text-slate-400 text-xs">Follow-Ups</div>
                  </button>
                  <button onClick={() => openRecruiterDetail(r)} className="hover:bg-green-50 rounded-lg py-1 transition-colors">
                    <div className="text-green-700 text-sm" style={{ fontWeight: 700 }}>{r.activeCandidates}<span className="text-slate-400 text-xs font-normal">/{r.totalCandidates}</span></div>
                    <div className="text-slate-400 text-xs">Active</div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">


          {/* My Tasks */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
                My Tasks
                <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">{tasks.length}</span>
              </h3>
              <Link to="/admin/tasks" className="text-xs text-green-600 hover:underline" style={{ fontWeight: 500 }}>
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {tasks.slice(0, 5).map(task => {
                const redirectUrl = task.entityType === 'candidate'
                  ? `/recruiter/candidate/${task.entityId || task.candidateId}`
                  : task.entityType === 'job'
                    ? `/recruiter/jobs/${task.entityId}`
                    : '/admin/tasks';

                return (
                  <div key={task._id}
                    onClick={() => navigate(redirectUrl)}
                    className="px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-slate-700 text-sm truncate group-hover:text-green-600" style={{ fontWeight: 600 }}>{task.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${task.priority === 'Urgent' ? 'bg-red-100 text-red-600' :
                          task.priority === 'High' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-1">{task.description || 'No description'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Zap className="w-3 h-3" /> {task.taskCategory}
                      </div>
                      <span className="text-green-600 text-[10px] font-bold group-hover:underline">Details</span>
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <div className="px-5 py-8 text-center text-slate-400 text-xs italic">No pending tasks</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'View Resumes', href: '/recruiter/resumes', icon: Phone, color: 'text-green-600' },
                { label: 'Interview Schedule', href: '/recruiter/interviews', icon: Calendar, color: 'text-violet-600' },
                { label: 'Add Candidate', href: '/recruiter/add', icon: Users, color: 'text-emerald-600' },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={i}
                    to={action.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-slate-600 text-sm group-hover:text-slate-800">{action.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Team Performance Reviews Section */}
        <div className="mt-8">
          <TeamPerformanceReviews />
        </div>
      </div>

      {/* Recruiter Detail Modal */}
      {selectedRecruiter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedRecruiter.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-lg text-slate-800" style={{ fontWeight: 700 }}>{selectedRecruiter.name}</h2>
                  <p className="text-xs text-slate-500">Joined: {selectedRecruiter.joined}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecruiter(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Performance Metrics Grid */}
              <div>
                <h3 className="text-slate-800 text-sm mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
                  <BarChart3 className="w-4 h-4 text-green-600" /> Performance Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Calls Today', value: selectedRecruiter.calls, target: selectedRecruiter.target, icon: Phone, color: 'bg-green-50 text-green-600' },
                    { label: 'Interviews', value: selectedRecruiter.interviews, icon: Calendar, color: 'bg-violet-50 text-violet-600' },
                    { label: 'Follow-Ups', value: selectedRecruiter.followUps, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Active/Total', value: `${selectedRecruiter.activeCandidates}/${selectedRecruiter.totalCandidates}`, icon: Users, color: 'bg-blue-50 text-blue-600' },
                  ].map((metric, i) => {
                    const Icon = metric.icon;
                    return (
                      <div key={i} className={`rounded-lg p-4 ${metric.color}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs text-slate-600">{metric.label}</span>
                        </div>
                        <div className="text-xl" style={{ fontWeight: 700 }}>{metric.value}</div>
                        {metric.target && (
                          <div className="text-xs text-slate-500 mt-1">Target: {metric.target}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Call Progress Bar */}
                <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600" style={{ fontWeight: 500 }}>Call Target Progress</span>
                    <span className="text-sm text-slate-800" style={{ fontWeight: 700 }}>
                      {Math.min(100, Math.round((selectedRecruiter.calls / selectedRecruiter.target) * 100))}%
                    </span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                      style={{ width: `${Math.min(100, (selectedRecruiter.calls / selectedRecruiter.target) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Candidates List */}
              <div>
                {loadingCandidates ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {recruiterCandidates.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        No candidates found for this recruiter
                      </div>
                    ) : (
                      recruiterCandidates.slice(0, 25).map((cand: any) => (
                        <button
                          key={cand._id || cand.id}
                          onClick={() => openTLCandidateView(cand)}
                          className="w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-green-300 transition-colors group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-slate-800 group-hover:text-green-600" style={{ fontWeight: 500 }}>
                                {cand.name || cand.candidateName || 'Unknown'}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {cand.firstCallStatus || cand.status || 'No status'} • {cand.qualification || '—'}
                              </p>
                            </div>
                            <Eye className="w-4 h-4 text-slate-300 group-hover:text-green-600" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setSelectedRecruiter(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigate(`/tl/my-team`);
                    setSelectedRecruiter(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  View All Candidates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TL Candidate Modal */}
      {tlCandidate && (
        <TLCandidateViewModal
          candidate={tlCandidate}
          onClose={() => setTlCandidate(null)}
          onSaved={() => {
            if (selectedRecruiter) {
              loadRecruiterCandidates(selectedRecruiter.id);
            }
          }}
        />
      )}
    </div>
  );
}
