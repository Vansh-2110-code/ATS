import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, X, Loader2, Filter } from 'lucide-react';
import api from '../../services/api';

interface AccessRequest {
  _id: string;
  recruiterId: {
    _id: string;
    name: string;
    email: string;
  };
  salaryMonth: string;
  salaryYear: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  expiresAt?: string;
  durationDays: number;
  rejectionReason?: string;
}

export function SalaryAccessManagementPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [actionLoading, setActionLoading] = useState<string>('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string>('');

  // Load access requests
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getSalaryAccessRequests?.({ status: statusFilter }) || [];
        setRequests(Array.isArray(res) ? res : res.requests || []);
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [statusFilter]);

  const handleApprove = async (requestId: string, durationDays: number) => {
    try {
      setActionLoading(requestId);
      await api.approveSalaryAccessRequest?.(requestId, durationDays);
      setRequests(requests.map(r => r._id === requestId ? { ...r, status: 'Approved' } : r));
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionNote.trim()) {
      alert('Please provide rejection reason');
      return;
    }
    try {
      setActionLoading(requestId);
      await api.rejectSalaryAccessRequest?.(requestId, rejectionNote);
      setRequests(requests.map(r => r._id === requestId ? { ...r, status: 'Rejected' } : r));
      setRejectingId('');
      setRejectionNote('');
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setActionLoading('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Expired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-800 text-2xl" style={{ fontWeight: 700 }}>
          Salary Slip Access Requests
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage recruiter requests for salary slip access
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No {statusFilter.toLowerCase()} requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Recruiter</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Salary Month</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Reason</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Duration</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Requested</th>
                  <th className="px-4 py-3 text-center text-slate-700 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {requests.map(request => (
                  <tr key={request._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-800 font-semibold">{request.recruiterId.name}</p>
                        <p className="text-xs text-slate-500">{request.recruiterId.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {request.salaryMonth} {request.salaryYear}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {request.reason}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                        {request.durationDays}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {new Date(request.requestedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {request.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request._id, request.durationDays)}
                              disabled={actionLoading === request._id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                              title="Approve request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectingId(request._id)}
                              disabled={actionLoading === request._id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              title="Reject request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Reject Request</h3>
            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-semibold">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionNote}
                onChange={e => setRejectionNote(e.target.value)}
                placeholder="Provide reason for rejection..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-20 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setRejectingId('');
                  setRejectionNote('');
                }}
                disabled={actionLoading !== ''}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={!rejectionNote.trim() || actionLoading !== ''}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-semibold"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
          <p className="text-yellow-600 text-xs font-semibold mb-1">Pending</p>
          <p className="text-2xl text-yellow-800 font-bold">
            {requests.filter(r => r.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
          <p className="text-green-600 text-xs font-semibold mb-1">Approved</p>
          <p className="text-2xl text-green-800 font-bold">
            {requests.filter(r => r.status === 'Approved').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
          <p className="text-red-600 text-xs font-semibold mb-1">Rejected</p>
          <p className="text-2xl text-red-800 font-bold">
            {requests.filter(r => r.status === 'Rejected').length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-gray-600 text-xs font-semibold mb-1">Expired</p>
          <p className="text-2xl text-gray-800 font-bold">
            {requests.filter(r => r.status === 'Expired').length}
          </p>
        </div>
      </div>
    </div>
  );
}
