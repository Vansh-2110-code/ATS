import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Loader2, AlertCircle, CheckCircle2, UserPlus, Trash2 } from 'lucide-react';
import api from '../services/api';

interface Employee {
  _id: string;
  name: string;
  employeeId: string;
  email: string;
  role: string;
}

export function TeamStructureManager() {
  const [leaders, setLeaders] = useState<Employee[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<Employee | null>(null);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [availableRecruiters, setAvailableRecruiters] = useState<Employee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAddLeaderModal, setShowAddLeaderModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedNewLeaderId, setSelectedNewLeaderId] = useState('');
  const [selectedNewMemberId, setSelectedNewMemberId] = useState('');

  useEffect(() => {
    loadLeaders();
  }, []);

  const loadLeaders = async () => {
    setLoadingLeaders(true);
    try {
      const data = await api.getTeamLeaders();
      setLeaders(data.leaders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team leaders');
    } finally {
      setLoadingLeaders(false);
    }
  };

  const loadTeamMembers = async (leaderId: string) => {
    setLoadingMembers(true);
    try {
      const data = await api.getTeamMembers(leaderId);
      setTeamMembers(data.members || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSelectLeader = (leader: Employee) => {
    setSelectedLeader(leader);
    loadTeamMembers(leader._id);
  };

  const handleOpenAddLeader = async () => {
    setShowAddLeaderModal(true);
    setSelectedNewLeaderId('');
    try {
      const data = await api.getAvailableEmployees('tl');
      setAvailableEmployees(data.employees || []);
    } catch (err) {
      setError('Failed to load available employees for TL');
    }
  };

  const handleOpenAddMember = async () => {
    setShowAddMemberModal(true);
    setSelectedNewMemberId('');
    try {
      const data = await api.getAvailableEmployees('recruiter');
      setAvailableRecruiters(data.employees || []);
    } catch (err) {
      setError('Failed to load available recruiters');
    }
  };

  const handleAddLeader = async () => {
    if (!selectedNewLeaderId) return;
    setActionLoading(true);
    try {
      await api.addTeamLeader(selectedNewLeaderId);
      setSuccess('Team leader created successfully');
      setShowAddLeaderModal(false);
      await loadLeaders();
    } catch (err: any) {
      setError(err.message || 'Failed to create team leader');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleRemoveLeader = async (leaderId: string) => {
    if (!confirm('Are you sure you want to demote this Team Leader? Their team will be unassigned.')) return;
    setActionLoading(true);
    try {
      await api.removeTeamLeader(leaderId);
      setSuccess('Team leader removed successfully');
      if (selectedLeader?._id === leaderId) {
        setSelectedLeader(null);
        setTeamMembers([]);
      }
      await loadLeaders();
    } catch (err: any) {
      setError(err.message || 'Failed to remove team leader');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleAddMember = async () => {
    if (!selectedNewMemberId || !selectedLeader) return;
    setActionLoading(true);
    try {
      await api.addTeamMember(selectedNewMemberId, selectedLeader._id);
      setSuccess('Recruiter assigned to team successfully');
      setShowAddMemberModal(false);
      await loadTeamMembers(selectedLeader._id);
    } catch (err: any) {
      setError(err.message || 'Failed to assign recruiter');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedLeader) return;
    if (!confirm('Are you sure you want to remove this recruiter from the team?')) return;
    setActionLoading(true);
    try {
      await api.removeTeamMember(memberId, selectedLeader._id);
      setSuccess('Recruiter removed from team successfully');
      await loadTeamMembers(selectedLeader._id);
    } catch (err: any) {
      setError(err.message || 'Failed to remove recruiter');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Notifications */}
      {(error || success) && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
              <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* Left Column: Team Leaders */}
      <div className="w-full md:w-1/3 flex flex-col border border-slate-200 rounded-xl bg-slate-50 overflow-hidden h-[600px]">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" />
            Team Leaders
          </h3>
          <button
            onClick={handleOpenAddLeader}
            className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Plus className="w-3 h-3" /> Create TL
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loadingLeaders ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : leaders.length === 0 ? (
            <div className="text-center p-8 text-sm text-slate-500">No Team Leaders found.</div>
          ) : (
            <div className="space-y-1">
              {leaders.map(leader => (
                <div
                  key={leader._id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedLeader?._id === leader._id
                      ? 'bg-violet-50 border-violet-200 shadow-sm'
                      : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-100'
                  }`}
                  onClick={() => handleSelectLeader(leader)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                      {leader.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{leader.name}</p>
                      <p className="text-xs text-slate-500">{leader.employeeId}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveLeader(leader._id); }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Demote Team Leader"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Assigned Recruiters */}
      <div className="w-full md:w-2/3 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden h-[600px]">
        {selectedLeader ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-semibold text-slate-800">
                  {selectedLeader.name}'s Team
                </h3>
                <p className="text-xs text-slate-500">{teamMembers.length} Recruiter(s) assigned</p>
              </div>
              <button
                onClick={handleOpenAddMember}
                className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Assign Recruiter
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              {loadingMembers ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
              ) : teamMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">No recruiters assigned</p>
                    <p className="text-xs text-slate-500">Click "Assign Recruiter" to add team members.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teamMembers.map(member => (
                    <div key={member._id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between hover:border-green-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center text-sm font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.employeeId} • {member.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from team"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
              <Users className="w-10 h-10 text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-700">Select a Team Leader</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                Choose a Team Leader from the list on the left to view and manage their assigned recruiters.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddLeaderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Create Team Leader</h3>
              <button onClick={() => setShowAddLeaderModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Promote an existing recruiter to a Team Leader role.</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Employee</label>
              <select
                value={selectedNewLeaderId}
                onChange={e => setSelectedNewLeaderId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                <option value="">-- Choose an employee --</option>
                {availableEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAddLeaderModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">Cancel</button>
              <button
                onClick={handleAddLeader}
                disabled={actionLoading || !selectedNewLeaderId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Create TL
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMemberModal && selectedLeader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Assign Recruiter</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Assign a recruiter to <span className="font-semibold text-slate-700">{selectedLeader.name}'s</span> team.</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Recruiter</label>
              <select
                value={selectedNewMemberId}
                onChange={e => setSelectedNewMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                <option value="">-- Choose a recruiter --</option>
                {availableRecruiters.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAddMemberModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">Cancel</button>
              <button
                onClick={handleAddMember}
                disabled={actionLoading || !selectedNewMemberId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
