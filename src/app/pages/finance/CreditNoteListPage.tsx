import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Plus, Eye, Download, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface CreditNote {
  _id: string;
  creditNoteNumber: string;
  invoiceNumber: string;
  clientName: string;
  candidates: Array<{ name: string }>;
  totalAmount: number;
  grandTotal: number;
  reason: string;
  status: string;
  noteDate: string;
  createdAt: string;
}

export function CreditNoteListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Access control - admin only
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/recruiter', { replace: true });
    }
  }, [user, navigate]);

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Load credit notes
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getCreditNotes?.() || [];
        setCreditNotes(Array.isArray(res) ? res : res.creditNotes || []);
      } catch (err) {
        console.error('Failed to load credit notes:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCreditNotes = creditNotes.filter(cn => {
    const matchesSearch = 
      cn.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cn.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cn.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cn.candidates?.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || cn.status === statusFilter;
    const matchesDate = !dateFilter || cn.noteDate.startsWith(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalCredit = creditNotes.reduce((sum, cn) => sum + cn.grandTotal, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-2xl" style={{ fontWeight: 700 }}>
            Credit Notes
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage billing reversals for candidate exits</p>
        </div>
        <button
          onClick={() => navigate('/credit-notes/create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New Credit Note
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 ml-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by note #, invoice #, client, or candidate..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 ml-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Generated">Generated</option>
              <option value="Approved">Approved</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 ml-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : filteredCreditNotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No credit notes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Credit Note #</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Reference Invoice</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Client</th>
                  <th className="px-4 py-3 text-right text-slate-700 font-semibold">Credit Amount</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Reason</th>
                  <th className="px-4 py-3 text-left text-slate-700 font-semibold">Date</th>
                  <th className="px-4 py-3 text-center text-slate-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCreditNotes.map(creditNote => (
                  <tr key={creditNote._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800 font-semibold">{creditNote.creditNoteNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{creditNote.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{creditNote.clientName}</td>
                    <td className="px-4 py-3 text-right text-slate-800 font-semibold">
                      ₹{creditNote.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">
                      {creditNote.reason}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(creditNote.noteDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => navigate(`/credit-notes/view/${creditNote._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/credit-notes/view/${creditNote._id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
          <p className="text-red-600 text-xs font-semibold mb-1">Total Credit Notes</p>
          <p className="text-2xl text-red-800 font-bold">{creditNotes.length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 text-center">
          <p className="text-orange-600 text-xs font-semibold mb-1">Total Credit Amount</p>
          <p className="text-2xl text-orange-800 font-bold">₹{totalCredit.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
          <p className="text-blue-600 text-xs font-semibold mb-1">Avg. Credit per Note</p>
          <p className="text-2xl text-blue-800 font-bold">
            ₹{creditNotes.length > 0 ? Math.round(totalCredit / creditNotes.length).toLocaleString('en-IN') : '0'}
          </p>
        </div>
      </div>
    </div>
  );
}
