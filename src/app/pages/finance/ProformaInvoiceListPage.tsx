import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Plus, Eye, Edit3, CheckCircle, XCircle, Send, Download, Loader2, Filter } from 'lucide-react';
import api from '../../services/api';

interface Proforma {
  _id: string;
  proformaNumber: string;
  clientName: string;
  createdBy: {
    _id: string;
    name: string;
  };
  totalAmount: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Rejected';
  poNumber?: string;
  createdAt: string;
}

const statusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-700';
    case 'Pending Approval':
      return 'bg-amber-100 text-amber-700';
    case 'Approved':
      return 'bg-green-100 text-green-700';
    case 'Sent':
      return 'bg-blue-100 text-blue-700';
    case 'Rejected':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export function ProformaInvoiceListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Access control - admin only
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/recruiter', { replace: true });
    }
  }, [user, navigate]);

  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load proformas
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getProformas?.({ status: statusFilter || undefined }) || [];
        setProformas(Array.isArray(res) ? res : res.proformas || []);
      } catch (err) {
        console.error('Failed to load proformas:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [statusFilter]);

  const filteredProformas = proformas.filter(p =>
    p.proformaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-2xl" style={{ fontWeight: 700 }}>
            Proforma Invoices
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage 2-step billing workflow</p>
        </div>
        <button
          onClick={() => navigate('/proformas/create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New Proforma
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-600 mb-2 font-semibold">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Proforma no. or client name..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="sm:w-48">
            <label className="block text-xs text-slate-600 mb-2 font-semibold">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Sent">Sent</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : filteredProformas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No proformas found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Proforma #</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Client</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Created By</th>
                  <th className="px-4 py-3 text-right text-slate-700 font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">PO #</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Date</th>
                  <th className="px-4 py-3 text-center text-slate-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProformas.map(proforma => (
                  <tr key={proforma._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800 font-semibold">{proforma.proformaNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{proforma.clientName}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{proforma.createdBy?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-right text-slate-800 font-semibold">
                      ₹{proforma.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeColor(proforma.status)}`}>
                        {proforma.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {proforma.poNumber ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                          {proforma.poNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(proforma.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {/* View Button */}
                        <button
                          onClick={() => navigate(`/proformas/edit/${proforma._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Button (Draft only) */}
                        {proforma.status === 'Draft' && (
                          <button
                            onClick={() => navigate(`/proformas/edit/${proforma._id}`)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit proforma"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Approve/Reject (Pending only) */}
                        {proforma.status === 'Pending Approval' && (
                          <>
                            <button
                              onClick={() => navigate(`/proformas/edit/${proforma._id}`)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/proformas/edit/${proforma._id}`)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Send (Approved only) */}
                        {proforma.status === 'Approved' && (
                          <button
                            onClick={() => navigate(`/proformas/edit/${proforma._id}`)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Send to client"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {/* Convert (Approved + PO) */}
                        {proforma.status === 'Approved' && proforma.poNumber && (
                          <button
                            onClick={() => navigate(`/proformas/edit/${proforma._id}`)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Convert to invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-slate-600 text-xs font-semibold mb-1">Total</p>
          <p className="text-2xl text-slate-800 font-bold">{proformas.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-gray-600 text-xs font-semibold mb-1">Draft</p>
          <p className="text-2xl text-gray-800 font-bold">{proformas.filter(p => p.status === 'Draft').length}</p>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 text-center">
          <p className="text-amber-600 text-xs font-semibold mb-1">Pending</p>
          <p className="text-2xl text-amber-800 font-bold">{proformas.filter(p => p.status === 'Pending Approval').length}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
          <p className="text-green-600 text-xs font-semibold mb-1">Approved</p>
          <p className="text-2xl text-green-800 font-bold">{proformas.filter(p => p.status === 'Approved').length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
          <p className="text-blue-600 text-xs font-semibold mb-1">Sent</p>
          <p className="text-2xl text-blue-800 font-bold">{proformas.filter(p => p.status === 'Sent').length}</p>
        </div>
      </div>
    </div>
  );
}
