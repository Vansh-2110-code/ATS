import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { DollarSign, TrendingUp, AlertTriangle, Download, Loader2, Lock, Plus, Edit3, X, Save, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const INV_STATUS: Record<string, string> = {
  Overdue: 'bg-red-100 text-red-600',
  'Due Soon': 'bg-amber-100 text-amber-700',
  Pending: 'bg-slate-100 text-slate-600',
  Paid: 'bg-emerald-100 text-emerald-700',
};

export function RevenueDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fmt = (n: number) => n >= 1000000 ? `₹${(n / 1000000).toFixed(2)}M` : `₹${(n / 100000).toFixed(1)}L`;

  // Restrict to admin only
  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-slate-700 text-lg" style={{ fontWeight: 700 }}>Access Restricted</h2>
        <p className="text-slate-500 text-sm max-w-xs">Revenue data is only accessible to Admin users.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
          style={{ fontWeight: 500 }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const [loading, setLoading] = useState(true);
  
  // Edit Invoice State
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editForm, setEditForm] = useState({ invoiceNumber: '', invoiceDate: '' });
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [editError, setEditError] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [recruiterContribution, setRecruiterContribution] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [revData, contribData, invData] = await Promise.all([
          api.getMonthlyRevenue(),
          api.getRecruiterContribution(),
          api.getInvoices(),
        ]);
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const rawRev = revData.data || revData.monthly || (Array.isArray(revData) ? revData : []);
        setMonthlyRevenue(rawRev.map((m: any) => ({
          ...m,
          month: typeof m.month === 'number' ? MONTHS[m.month - 1] : m.month,
          revenue: m.revenue ?? m.actual ?? 0,
        })));
        const contribArr = contribData.data || contribData.contributions || (Array.isArray(contribData) ? contribData : []);
        const totalAmount = contribArr.reduce((s: number, c: any) => s + (c.amount || c.revenue || 0), 0);
        setRecruiterContribution(contribArr.map((r: any) => ({
          ...r,
          name: r.name || r.recruiterName || '',
          placements: r.placements ?? r.hires ?? 0,
          revenue: r.revenue ?? r.amount ?? 0,
          share: r.share ?? (totalAmount > 0 ? Math.round(((r.amount || r.revenue || 0) / totalAmount) * 100) : 0),
        })));
        const invList = invData.invoices || invData.data || (Array.isArray(invData) ? invData : []);
        setInvoices(invList.map((inv: any) => ({
          ...inv,
          due: inv.due || (inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'),
        })));
      } catch (err) {
        console.error('Failed to load revenue dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleEditInvoice = (inv: any) => {
    setEditingInvoice(inv);
    setEditForm({
      invoiceNumber: inv.invoiceNumber || inv.id || inv._id || '',
      invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : (inv.due ? new Date(inv.due).toISOString().split('T')[0] : '')
    });
    setEditError('');
  };

  const saveInvoiceEdit = async () => {
    try {
      setSavingInvoice(true);
      setEditError('');
      await api.updateInvoice(editingInvoice._id || editingInvoice.id, {
        invoiceNumber: editForm.invoiceNumber,
        invoiceDate: editForm.invoiceDate
      });
      // Update local state to reflect changes instantly
      setInvoices(invoices.map(i => {
        if ((i.id || i._id) === (editingInvoice.id || editingInvoice._id)) {
          return {
            ...i,
            invoiceNumber: editForm.invoiceNumber,
            id: editForm.invoiceNumber || i.id, // Display id mapping update
            invoiceDate: editForm.invoiceDate,
            due: new Date(editForm.invoiceDate || i.due).toLocaleDateString('en-IN')
          };
        }
        return i;
      }));
      setEditingInvoice(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update invoice');
    } finally {
      setSavingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  const totalRevenue = monthlyRevenue.reduce((s: number, m: any) => s + (m.revenue || 0), 0);
  const currentMonth = monthlyRevenue.length ? monthlyRevenue[monthlyRevenue.length - 1].revenue || 0 : 0;
  const prevMonth = monthlyRevenue.length >= 2 ? monthlyRevenue[monthlyRevenue.length - 2].revenue || 0 : 0;
  const growth = prevMonth > 0 ? Math.round(((currentMonth - prevMonth) / prevMonth) * 100) : 0;
  const pendingInvoices = invoices.filter((i: any) => i.status !== 'Paid').reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const avgPerPlacement = monthlyRevenue.length ? Math.round(currentMonth / (monthlyRevenue[monthlyRevenue.length - 1].placements || 1)) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>Revenue Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Financial performance — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/invoices/create"
            className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors"
            style={{ fontWeight: 600 }}>
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
          <Link to="/revenue/add"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            style={{ fontWeight: 500 }}>
            <Plus className="w-4 h-4" />
            Add Revenue Entry
          </Link>
          <button
            onClick={() => {
              if (!invoices || invoices.length === 0) {
                alert('No invoice data available to export');
                return;
              }
              const header = 'Invoice Number,Client,Amount,GST,Grand Total,Status,Date,Due Date,Candidates\n';
              const rows = invoices.map((inv: any) => {
                const safeClient = (inv.clientName || inv.client || 'N/A').replace(/,/g, '');
                const invNo = inv.invoiceNumber || inv.id || inv._id || 'N/A';
                const amt = inv.totalAmount || inv.amount || 0;
                const gst = inv.igst || 0;
                const total = inv.grandTotal || (amt + gst);
                const date = inv.invoiceDate || (inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A');
                const due = inv.due || (inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A');
                
                // List candidate names if available (semicolon separated within the column)
                const candNames = (inv.candidates || []).map((c: any) => c.name).join('; ').replace(/"/g, '""');
                
                return `${invNo},${safeClient},${amt},${gst},${total},${inv.status},${date},${due},"${candNames}"`;
              }).join('\n');
              const blob = new Blob([header + rows], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'invoice_data_export.csv'; a.click();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors" style={{ fontWeight: 500 }}>
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'This Month', value: fmt(currentMonth), sub: `+${growth}% vs last month`, color: 'blue', icon: TrendingUp },
          { label: 'YTD Revenue', value: fmt(totalRevenue), sub: '6-month total', color: 'violet', icon: DollarSign },
          { label: 'Pending Invoices', value: fmt(pendingInvoices), sub: `${invoices.filter((i: any) => i.status !== 'Paid').length} invoices`, color: 'amber', icon: AlertTriangle },
          { label: 'Avg Per Placement', value: avgPerPlacement ? fmt(avgPerPlacement) : '—', sub: 'This month', color: 'emerald', icon: DollarSign },
        ].map((m, i) => {
          const Icon = m.icon;
          const bg: Record<string, string> = {
            blue: 'bg-green-50 text-green-600',
            violet: 'bg-violet-50 text-violet-600',
            amber: 'bg-amber-50 text-amber-600',
            emerald: 'bg-emerald-50 text-emerald-600',
          };
          return (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg[m.color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-slate-800 mb-0.5" style={{ fontWeight: 700, fontSize: '1.4rem' }}>{m.value}</div>
              <div className="text-slate-500 text-sm">{m.label}</div>
              <div className="text-slate-400 text-xs mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Monthly Revenue vs Target</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue} barSize={22} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number, n) => [fmt(v), n === 'revenue' ? 'Revenue' : 'Target']}
                contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="#BBF7D0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recruiter Contribution */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Recruiter Revenue Share</h3>
          <div className="space-y-3">
            {recruiterContribution.map((r: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600" style={{ fontWeight: 500 }}>{r.name}</span>
                  <span className="text-slate-500">{r.placements} placed · {fmt(r.revenue)}</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${r.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Alerts */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
            Invoice Status
            {invoices.filter((i: any) => i.status === 'Overdue').length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                {invoices.filter((i: any) => i.status === 'Overdue').length} overdue
              </span>
            )}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Invoice ID', 'Client', 'Amount', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv: any) => (
                <tr key={inv.id || inv._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-slate-700 text-sm" style={{ fontWeight: 500 }}>{inv.id || inv._id}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-sm">{inv.client}</td>
                  <td className="px-5 py-3.5 text-slate-700 text-sm" style={{ fontWeight: 500 }}>
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-sm">{inv.due}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${INV_STATUS[inv.status]}`} style={{ fontWeight: 500 }}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditInvoice(inv)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="Edit Invoice Details">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/credit-notes/create?invoiceId=${inv.id || inv._id}`)} 
                        className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition-colors" 
                        title="Generate Credit Note"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-slate-800 text-lg" style={{ fontWeight: 600 }}>Edit Invoice</h3>
              <button onClick={() => setEditingInvoice(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Invoice Number</label>
                <input type="text" value={editForm.invoiceNumber} onChange={e => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Invoice Date</label>
                <input type="date" value={editForm.invoiceDate} onChange={e => setEditForm({ ...editForm, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
              </div>
              {editError && <p className="text-xs text-red-600">{editError}</p>}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setEditingInvoice(null)} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
              <button onClick={saveInvoiceEdit} disabled={savingInvoice} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors" style={{ fontWeight: 500 }}>
                {savingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
