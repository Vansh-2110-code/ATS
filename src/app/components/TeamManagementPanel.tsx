import { useState, useEffect } from 'react';
import { Users, Plus, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

interface TeamMember {
  _id: string;
  name: string;
  employeeId: string;
  email: string;
  role: string;
}

interface TeamManagementPanelProps {
  userRole: 'tl' | 'admin' | 'manager';
}

export function TeamManagementPanel({ userRole }: TeamManagementPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [leaders, setLeaders] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<TeamMember[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isTL = userRole === 'tl';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  // Load team members/leaders on mount
  useEffect(() => {
    if (expanded) {
      loadTeamData();
    }
  }, [expanded]);

  const loadTeamData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isTL) {
        const data = await api.getTeamMembers();
        setMembers(data.members || []);
      } else if (isAdmin) {
        const data = await api.getTeamLeaders();
        setLeaders(data.leaders || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setError('');
    setSuccess('');
    setSelectedEmployee('');

    // Load available employees
    try {
      const role = isTL ? 'recruiter' : 'tl';
      const data = await api.getAvailableEmployees(role);
      setAvailableEmployees(data.employees || []);
    } catch (err: any) {
      setError('Failed to load available employees');
    }
  };

  const handleAddMember = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    try {
      setLoading(true);
      if (isTL) {
        await api.addTeamMember(selectedEmployee);
        setSuccess('Team member added successfully');
        await loadTeamData();
      } else if (isAdmin) {
        await api.addTeamLeader(selectedEmployee);
        setSuccess('Team leader added successfully');
        await loadTeamData();
      }
      setShowAddModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      setLoading(true);
      if (isTL) {
        await api.removeTeamMember(employeeId);
        setSuccess('Team member removed');
        await loadTeamData();
      } else if (isAdmin) {
        await api.removeTeamLeader(employeeId);
        setSuccess('Team leader removed');
        await loadTeamData();
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const displayMembers = isTL ? members : leaders;
  const title = isTL ? 'Team Members' : 'Team Leaders';
  const subtitle = isTL ? 'Manage your recruiters' : 'Manage team leaders';

  // Only show panel for Admin, hide from Team Lead and Manager
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-white border-t border-slate-200">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-slate-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-700">{title}</p>
            <p className="text-xs text-slate-500">{displayMembers.length} member{displayMembers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3 max-h-96 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded text-xs text-green-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && !showAddModal && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          )}

          {/* Members List */}
          {!loading && displayMembers.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-2">No members assigned yet</p>
          )}

          {!loading && displayMembers.length > 0 && (
            <div className="space-y-2">
              {displayMembers.map(member => (
                <div key={member._id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(member._id)}
                    disabled={loading}
                    className="ml-2 p-1 hover:bg-red-50 text-red-600 rounded transition-colors disabled:opacity-50"
                    title="Remove member"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={handleOpenAddModal}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add {isTL ? 'Recruiter' : 'Team Leader'}
          </button>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Add {isTL ? 'Recruiter' : 'Team Leader'}
            </h3>

            {/* Employee Select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm"
              >
                <option value="">-- Choose an employee --</option>
                {availableEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={loading || !selectedEmployee}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
