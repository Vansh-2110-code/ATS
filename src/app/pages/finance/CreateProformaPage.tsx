import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Save, Loader2, AlertCircle, Eye, Edit3, Plus, Trash2, X, Check, XCircle, Send
} from 'lucide-react';
import api from '../../services/api';
import { ProformaInvoiceTemplate } from '../../components/ProformaInvoiceTemplate';
import { convertNumberToWords } from '../../utils/numberToWords';

interface Candidate {
  _id: string;
  name: string;
  eid: string;
  dateOfJoining: string;
  designation?: string;
  location?: string;
  joiningSalary?: number;
}

interface Company {
  _id: string;
  companyName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  gst?: string;
  lut?: string;
}

interface InvoiceCandidate {
  candidateId: string;
  eid: string;
  name: string;
  doj: string;
  designation: string;
  location: string;
  amount: number;
}

interface ProformaFormData {
  proformaNumber: string;
  invoiceDate: string;
  selectedClientId: string;
  selectedCandidateIds: string[];
  gstNumber: string;
  sacCode: string;
  lutArn: string;
  lutApplied: boolean;
  locationName: string;
  customAmounts: Record<string, number>;
}

export function CreateProformaPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  // Access control
  useEffect(() => {
    if (user && !['admin', 'tl'].includes(user.role)) {
      navigate('/recruiter', { replace: true });
    }
  }, [user, navigate]);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [approvalModal, setApprovalModal] = useState(false);
  const [proformaData, setProformaData] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [poNumber, setPoNumber] = useState('');

  const [form, setForm] = useState<ProformaFormData>({
    proformaNumber: `WHM/PROF/${new Date().getFullYear()}-${new Date().getFullYear() + 1}/001`,
    invoiceDate: new Date().toISOString().split('T')[0],
    selectedClientId: '',
    selectedCandidateIds: [],
    gstNumber: '',
    sacCode: '',
    lutArn: '',
    lutApplied: false,
    locationName: '',
    customAmounts: {},
  });

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [candRes, compRes] = await Promise.all([
          api.getCandidates?.({ status: 'Joined' }) || Promise.resolve([]),
          api.getCompanies?.() || Promise.resolve([]),
        ]);
        setCandidates(Array.isArray(candRes) ? candRes : candRes.candidates || []);
        setCompanies(Array.isArray(compRes) ? compRes : compRes.companies || []);

        // If editing existing proforma
        if (id) {
          const existing = await api.getProforma?.(id);
          if (existing) {
            setProformaData(existing);
            setForm({
              proformaNumber: existing.proformaNumber,
              invoiceDate: existing.invoiceDate.split('T')[0],
              selectedClientId: existing.clientId,
              selectedCandidateIds: existing.candidates.map((c: any) => c.candidateId),
              gstNumber: existing.gstNumber,
              sacCode: existing.sacCode,
              lutArn: existing.lutArn,
              lutApplied: existing.lutApplied,
              locationName: existing.locationName,
              customAmounts: Object.fromEntries(
                existing.candidates.map((c: any) => [c.candidateId, c.amount])
              ),
            });
            setPoNumber(existing.poNumber || '');
            setApprovalNotes(existing.approvalNotes || '');
            setRejectionReason(existing.rejectionReason || '');
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const set = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const selectedClient = companies.find(c => c._id === form.selectedClientId);
  const selectedCandidates = candidates.filter(c => form.selectedCandidateIds.includes(c._id));

  const invoiceCandidates: InvoiceCandidate[] = selectedCandidates.map((c, idx) => ({
    candidateId: c._id,
    eid: c.eid || c._id.slice(-6).toUpperCase(),
    name: c.name,
    doj: new Date(c.dateOfJoining).toLocaleDateString('en-IN'),
    designation: c.designation || 'Employee',
    location: c.location || 'India',
    amount: form.customAmounts[c._id] || c.joiningSalary || 50000,
  }));

  const totalAmount = invoiceCandidates.reduce((sum, c) => sum + (parseFloat(c.amount as any) || 0), 0);
  const igst = form.lutApplied ? 0 : Math.round(totalAmount * 0.18);
  const grandTotal = totalAmount + igst;
  const amountInWords = convertNumberToWords(grandTotal);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.selectedClientId) newErrors.client = 'Client required';
    if (form.selectedCandidateIds.length === 0) newErrors.candidates = 'Select at least 1 candidate';
    if (!form.proformaNumber) newErrors.proformaNumber = 'Proforma number invalid';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canEdit = (user?.role === 'admin' || (user?.role === 'tl' && proformaData?.createdBy === user._id))
    && proformaData?.status === 'Draft';

  const canApprove = user?.role === 'admin' || user?.role === 'manager';
  const canSend = user?.role === 'admin' || user?.role === 'tl';
  const canConvert = user?.role === 'admin';

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fix validation errors');
      return;
    }

    try {
      setSubmitting(true);
      const proformaDataToSave = {
        proformaNumber: form.proformaNumber,
        invoiceDate: form.invoiceDate,
        clientId: form.selectedClientId,
        clientName: selectedClient?.companyName || '',
        clientAddress: selectedClient?.address || '',
        clientCity: selectedClient?.city || '',
        clientState: selectedClient?.state || '',
        clientPin: selectedClient?.zip || '',
        clientCountry: selectedClient?.country || '',
        clientGST: selectedClient?.gst || '',
        gstNumber: form.gstNumber,
        sacCode: form.sacCode,
        lutArn: form.lutArn,
        lutApplied: form.lutApplied,
        locationName: form.locationName,
        candidates: invoiceCandidates,
        totalAmount,
        igst,
        grandTotal,
        amountInWords,
        status: 'Draft',
        poNumber: '',
      };

      if (proformaData) {
        await api.updateProforma?.(id, proformaDataToSave);
        alert('Proforma updated as draft!');
      } else {
        const created = await api.createProforma?.(proformaDataToSave);
        alert('Proforma saved as draft!');
        navigate(`/proformas/edit/${created._id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save proforma');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fix validation errors');
      return;
    }

    try {
      setSubmitting(true);
      if (proformaData) {
        await api.submitProformaForApproval?.(id);
        alert('Proforma submitted for approval!');
        setProformaData({ ...proformaData, status: 'Pending Approval' });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit proforma');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReject = async (action: 'approve' | 'reject') => {
    try {
      setSubmitting(true);
      if (action === 'approve') {
        await api.approveProforma?.(id, approvalNotes);
        alert('Proforma approved!');
        setProformaData({ ...proformaData, status: 'Approved', approvalNotes });
      } else {
        if (!rejectionReason.trim()) {
          alert('Please provide rejection reason');
          return;
        }
        await api.rejectProforma?.(id, rejectionReason);
        alert('Proforma rejected!');
        setProformaData({ ...proformaData, status: 'Rejected', rejectionReason });
      }
      setApprovalModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update proforma');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToClient = async () => {
    try {
      setSubmitting(true);
      await api.sendProformaToClient?.(id);
      alert('Proforma sent to client!');
      setProformaData({ ...proformaData, status: 'Sent' });
    } catch (err: any) {
      alert(err.message || 'Failed to send proforma');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePO = async () => {
    if (!poNumber.trim()) {
      alert('Please enter PO number');
      return;
    }

    try {
      setSubmitting(true);
      await api.updateProformaPONumber?.(id, poNumber);
      alert('PO number updated!');
      setProformaData({ ...proformaData, poNumber });
    } catch (err: any) {
      alert(err.message || 'Failed to update PO');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (proformaData?.status !== 'Approved' || !poNumber) {
      alert('Proforma must be Approved and have PO number to convert');
      return;
    }

    try {
      setSubmitting(true);
      const invoice = await api.convertProformaToInvoice?.(id);
      alert('Proforma converted to invoice!');
      navigate(`/invoices/view/${invoice._id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to convert to invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCandidate = (candidateId: string) => {
    set('selectedCandidateIds', form.selectedCandidateIds.includes(candidateId)
      ? form.selectedCandidateIds.filter(id => id !== candidateId)
      : [...form.selectedCandidateIds, candidateId]
    );
  };

  const setCustomAmount = (candidateId: string, amount: number) => {
    set('customAmounts', { ...form.customAmounts, [candidateId]: amount });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Preview mode
  if (preview && selectedCandidates.length > 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <button
          onClick={() => setPreview(false)}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
        >
          <Edit3 className="w-4 h-4" /> Edit Proforma
        </button>

        <ProformaInvoiceTemplate
          proformaNumber={form.proformaNumber}
          invoiceNumber={form.proformaNumber}
          invoiceDate={form.invoiceDate}
          clientName={selectedClient?.companyName || ''}
          clientAddress={selectedClient?.address || ''}
          clientCity={selectedClient?.city || ''}
          clientState={selectedClient?.state || ''}
          clientPin={selectedClient?.zip || ''}
          clientCountry={selectedClient?.country || ''}
          clientGST={selectedClient?.gst || ''}
          gstNumber={form.gstNumber}
          sacCode={form.sacCode}
          lutArn={form.lutArn}
          lutApplied={form.lutApplied}
          locationName={form.locationName}
          candidates={invoiceCandidates.map((c, idx) => ({
            sl: idx + 1,
            eid: c.eid,
            name: c.name,
            doj: c.doj,
            designation: c.designation,
            location: c.location,
            amount: c.amount,
          }))}
          totalAmount={totalAmount}
          igst={igst}
          grandTotal={grandTotal}
          amountInWords={amountInWords}
          status={proformaData?.status || 'Draft'}
          poNumber={poNumber}
        />

        <div className="flex justify-center gap-3 py-6">
          <button
            onClick={() => setPreview(false)}
            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            Cancel
          </button>
          {proformaData?.status === 'Draft' || !proformaData ? (
            <button
              onClick={handleSaveDraft}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              style={{ fontWeight: 600 }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? 'Saving...' : 'Save Proforma'}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>
            {proformaData ? 'Proforma Invoice' : 'Create Proforma Invoice'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {proformaData ? `Status: ${proformaData.status}` : 'Generate proforma invoice for client approval'}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      {proformaData && (
        <div className={`px-4 py-3 rounded-lg border-l-4 ${
          proformaData.status === 'Draft' ? 'bg-gray-50 border-gray-300' :
          proformaData.status === 'Pending Approval' ? 'bg-amber-50 border-amber-300' :
          proformaData.status === 'Approved' ? 'bg-green-50 border-green-300' :
          proformaData.status === 'Sent' ? 'bg-blue-50 border-blue-300' :
          'bg-red-50 border-red-300'
        }`}>
          <p className="text-sm font-semibold">
            {proformaData.status === 'Pending Approval' && 'Awaiting approval by manager/admin'}
            {proformaData.status === 'Approved' && 'Approved. Send to client to request PO.'}
            {proformaData.status === 'Sent' && 'Sent to client. Enter PO number after approval.'}
            {proformaData.status === 'Rejected' && `Rejected: ${proformaData.rejectionReason}`}
          </p>
        </div>
      )}

      <form onSubmit={handleSaveDraft} className="space-y-6">

        {/* ─── Section 1: Proforma Details ─── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Proforma Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Proforma Number</label>
              <input
                type="text"
                value={form.proformaNumber}
                onChange={e => set('proformaNumber', e.target.value)}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Invoice Date</label>
              <input
                type="date"
                value={form.invoiceDate}
                onChange={e => set('invoiceDate', e.target.value)}
                disabled={proformaData?.status !== 'Draft' && !!proformaData}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>GST Number</label>
              <input
                type="text"
                value={form.gstNumber}
                onChange={e => set('gstNumber', e.target.value)}
                disabled={proformaData?.status !== 'Draft' && !!proformaData}
                placeholder="e.g., 27ABCDE1234F1Z0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>SAC Code</label>
              <input
                type="text"
                value={form.sacCode}
                onChange={e => set('sacCode', e.target.value)}
                disabled={proformaData?.status !== 'Draft' && !!proformaData}
                placeholder="e.g., 9950"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>LUT ARN</label>
              <input
                type="text"
                value={form.lutArn}
                onChange={e => set('lutArn', e.target.value)}
                disabled={proformaData?.status !== 'Draft' && !!proformaData}
                placeholder="LUT Authorization Reference Number"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Location / Office Name</label>
              <input
                type="text"
                value={form.locationName}
                onChange={e => set('locationName', e.target.value)}
                disabled={proformaData?.status !== 'Draft' && !!proformaData}
                placeholder="e.g., IBPO Pune SEZ"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.lutApplied}
              onChange={e => set('lutApplied', e.target.checked)}
              disabled={proformaData?.status !== 'Draft' && !!proformaData}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-600">LUT Applied (GST: 0%)</span>
          </label>
        </div>

        {/* ─── Section 2: Client Selection ─── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Bill To (Client)</h2>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Select Client *</label>
            <select
              value={form.selectedClientId}
              onChange={e => set('selectedClientId', e.target.value)}
              disabled={proformaData?.status !== 'Draft' && !!proformaData}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">-- Select Client --</option>
              {companies.map(c => (
                <option key={c._id} value={c._id}>{c.companyName}</option>
              ))}
            </select>
            {errors.client && <p className="text-xs text-red-600 mt-1">{errors.client}</p>}
          </div>
          {selectedClient && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg space-y-1 text-xs">
              <p><span style={{ fontWeight: 600 }}>Address:</span> {selectedClient.address}</p>
              {selectedClient.gst && <p><span style={{ fontWeight: 600 }}>GST:</span> {selectedClient.gst}</p>}
            </div>
          )}
        </div>

        {/* ─── Section 3: Candidate Selection ─── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Select Candidates *</h2>
          {candidates.length === 0 ? (
            <p className="text-sm text-slate-500">No joined candidates available</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {candidates.map(candidate => (
                <label
                  key={candidate._id}
                  className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.selectedCandidateIds.includes(candidate._id)}
                    onChange={() => toggleCandidate(candidate._id)}
                    disabled={proformaData?.status !== 'Draft' && !!proformaData}
                    className="mt-1 w-4 h-4"
                  />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>{candidate.name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <p className="text-xs text-slate-500"><span style={{ fontWeight: 500 }}>EID:</span> {candidate.candidateEmployeeId || candidate.eid || candidate._id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-slate-500">
                          <span style={{ fontWeight: 500 }}>DOJ:</span> {
                            (() => {
                              const d = candidate.offerDetails?.dateOfJoining || candidate.dateOfJoining || (candidate as any).joiningDate;
                              if (!d) return 'N/A';
                              if (typeof d === 'string' && d.includes('/')) {
                                const [day, month, year] = d.split('/').map(Number);
                                if (day && month && year) {
                                  const dt = new Date(year, month - 1, day);
                                  return dt.toLocaleDateString('en-IN');
                                }
                              }
                              const dt = new Date(d);
                              return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString('en-IN');
                            })()
                          }
                        </p>
                        <p className="text-xs text-slate-500"><span style={{ fontWeight: 500 }}>Role:</span> {candidate.offerDetails?.designationOffered || (candidate as any).eligibleRole || candidate.role || 'N/A'}</p>
                      </div>
                    </div>
                  {form.selectedCandidateIds.includes(candidate._id) && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={form.customAmounts[candidate._id] || candidate.joiningSalary || 50000}
                        onChange={e => setCustomAmount(candidate._id, parseInt(e.target.value) || 0)}
                        disabled={proformaData?.status !== 'Draft' && !!proformaData}
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
                        placeholder="Amount"
                      />
                    </div>
                  )}
                </label>
              ))}
            </div>
          )}
          {errors.candidates && <p className="text-xs text-red-600 mt-2">{errors.candidates}</p>}
        </div>

        {/* ─── Summary ─── */}
        {selectedCandidates.length > 0 && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Selected Candidates</span>
              <span className="text-blue-800" style={{ fontWeight: 600 }}>{selectedCandidates.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Total Amount</span>
              <span className="text-blue-800" style={{ fontWeight: 600 }}>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">IGST @18% {form.lutApplied ? '(LUT Applied)' : ''}</span>
              <span className="text-blue-800" style={{ fontWeight: 600 }}>₹{igst.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-blue-200 pt-2 flex justify-between">
              <span className="text-blue-800" style={{ fontWeight: 700 }}>Grand Total</span>
              <span className="text-blue-800 text-base" style={{ fontWeight: 700 }}>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* ─── Approval/Rejection Notes ─── */}
        {proformaData?.status === 'Pending Approval' && canApprove && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Approval Decision</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Approval Notes (Optional)</label>
                <textarea
                  value={approvalNotes}
                  onChange={e => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes for approval..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-24 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* PO Number Entry */}
        {proformaData?.status === 'Sent' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Purchase Order</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                placeholder="Enter PO number..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={handleUpdatePO}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
              >
                Save PO
              </button>
            </div>
          </div>
        )}

        {/* ─── Buttons ─── */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            Cancel
          </button>

          {proformaData?.status === 'Draft' && (canEdit || !proformaData) && (
            <>
              <button
                type="button"
                onClick={() => { if (validateForm()) setPreview(true); }}
                disabled={selectedCandidates.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                style={{ fontWeight: 600 }}
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={submitting || selectedCandidates.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                style={{ fontWeight: 600 }}
              >
                <Send className="w-4 h-4" /> Submit for Approval
              </button>
            </>
          )}

          {proformaData?.status === 'Pending Approval' && canApprove && (
            <>
              <button
                type="button"
                onClick={() => handleApproveReject('approve')}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                style={{ fontWeight: 600 }}
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setApprovalModal(true)}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                style={{ fontWeight: 600 }}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}

          {proformaData?.status === 'Approved' && canSend && (
            <button
              type="button"
              onClick={handleSendToClient}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
              style={{ fontWeight: 600 }}
            >
              <Send className="w-4 h-4" /> Send to Client
            </button>
          )}

          {proformaData?.status === 'Approved' && poNumber && canConvert && (
            <button
              type="button"
              onClick={handleConvertToInvoice}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
              style={{ fontWeight: 600 }}
            >
              <Check className="w-4 h-4" /> Convert to Invoice
            </button>
          )}
        </div>
      </form>

      {/* Rejection Modal */}
      {approvalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold">Reject Proforma?</h3>
            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-semibold">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Please provide reason for rejection..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-24 resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setApprovalModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveReject('reject')}
                disabled={submitting || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
