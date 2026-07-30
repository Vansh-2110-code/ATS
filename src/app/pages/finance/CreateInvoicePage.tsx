import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Save, Loader2, AlertCircle, Eye, Edit3, Plus, Trash2, X
} from 'lucide-react';
import api from '../../services/api';
import { InvoiceTemplate } from '../../components/InvoiceTemplate';
import { convertNumberToWords } from '../../utils/numberToWords';

interface Candidate {
  _id: string;
  name: string;
  eid: string;
  dateOfJoining: string;
  designation?: string;
  location?: string;
  joiningSalary?: string | number;
  offerDetails?: {
    dateOfJoining?: string;
    joiningSalary?: string | number;
    designationOffered?: string;
  };
  clientName?: string;
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

interface InvoiceFormData {
  invoiceNumber: string;
  invoiceDate: string;
  selectedClientId: string;
  selectedCandidateIds: string[];
  gstNumber: string;
  sacCode: string;
  lutArn: string;
  lutExpiry: string;
  lutApplied: boolean;
  locationName: string;
  panNumber: string;
  requesterName: string;
  taxType: string;
  customAmounts: Record<string, number>;
}

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Access control
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/recruiter', { replace: true });
    }
  }, [user, navigate]);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<InvoiceFormData>({
    invoiceNumber: `WHM/IN/${new Date().getFullYear()}-${new Date().getFullYear() + 1}/001`,
    invoiceDate: new Date().toISOString().split('T')[0],
    selectedClientId: '',
    selectedCandidateIds: [],
    gstNumber: '',
    sacCode: '',
    lutArn: '',
    lutExpiry: '',
    lutApplied: false,
    locationName: '',
    panNumber: '',
    requesterName: '',
    taxType: 'IGST@18',
    customAmounts: {},
  });

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [candRes, compRes, nextNumRes] = await Promise.all([
          api.getCandidates?.({ status: 'Joined' }) || Promise.resolve([]),
          api.getCompanies?.() || Promise.resolve([]),
          api.getNextInvoiceNumber?.() || Promise.resolve({ nextNumber: '' }),
        ]);
        setCandidates(Array.isArray(candRes) ? candRes : candRes.candidates || []);
        setCompanies(Array.isArray(compRes) ? compRes : compRes.companies || []);
        if (nextNumRes?.nextNumber) {
          set('invoiceNumber', nextNumRes.nextNumber);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const selectedClient = companies.find(c => c._id === form.selectedClientId);
  const selectedCandidates = candidates.filter(c => form.selectedCandidateIds.includes(c._id));

  const invoiceCandidates: InvoiceCandidate[] = selectedCandidates.map((c, idx) => {
    const dojRaw = c.offerDetails?.dateOfJoining || c.dateOfJoining;
    const amountRaw = form.customAmounts[c._id] || c.offerDetails?.joiningSalary || c.joiningSalary || 0;
    
    return {
      candidateId: c._id,
      eid: c.eid || c._id.slice(-6).toUpperCase(),
      name: c.name,
      doj: dojRaw && !isNaN(new Date(dojRaw).getTime()) 
        ? new Date(dojRaw).toLocaleDateString('en-IN') 
        : 'N/A',
      designation: c.offerDetails?.designationOffered || (c as any).eligibleRole || 'Employee',
      location: c.location || 'India',
      amount: parseFloat(amountRaw as any) || 0,
    };
  });

  const totalAmount = invoiceCandidates.reduce((sum, c) => sum + (parseFloat(c.amount as any) || 0), 0);
  
  let igst = 0;
  let cgst = 0;
  let sgst = 0;
  if (!form.lutApplied) {
    if (form.taxType === 'IGST@18') {
      igst = Math.round(totalAmount * 0.18);
    } else if (form.taxType === 'SGST@9') {
      sgst = Math.round(totalAmount * 0.09);
    } else if (form.taxType === 'CGST@9') {
      cgst = Math.round(totalAmount * 0.09);
    } else if (form.taxType === 'CGST@9_SGST@9') {
      cgst = Math.round(totalAmount * 0.09);
      sgst = Math.round(totalAmount * 0.09);
    }
  }
  const taxAmount = igst + cgst + sgst;
  const grandTotal = totalAmount + taxAmount;
  const amountInWords = convertNumberToWords(grandTotal);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.selectedClientId) newErrors.client = '• Please select a client from the database';
    if (form.selectedCandidateIds.length === 0) newErrors.candidates = '• You must select at least one candidate for billing';
    if (!form.invoiceNumber) newErrors.invoiceNumber = '• Invoice number is required';
    if (!form.invoiceDate) newErrors.invoiceDate = '• Invoice date is required';

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: any) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const newErrors = validateForm();
    const errorMessages = Object.values(newErrors);
    
    if (errorMessages.length > 0) {
      alert("PLEASE FILL ALL REQUIRED FIELDS:\n\n" + errorMessages.join("\n"));
      return;
    }

    try {
      setSubmitting(true);
      const invoiceData = {
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate,
        clientId: form.selectedClientId,
        clientName: selectedClient?.companyName || '',
        clientAddress: selectedClient?.address || '',
        clientCity: selectedClient?.city || '',
        clientState: selectedClient?.state || '',
        clientPin: (selectedClient as any)?.localArea || selectedClient?.zip || '',
        clientCountry: selectedClient?.country || '',
        clientGST: selectedClient?.gst || '',
        gstNumber: form.gstNumber || '27ABCDE1234F1Z0',
        sacCode: form.sacCode || '9985',
        lutArn: form.lutArn,
        lutExpiry: form.lutExpiry,
        lutApplied: form.lutApplied,
        locationName: form.locationName,
        panNumber: form.panNumber,
        requesterName: form.requesterName,
        candidates: invoiceCandidates,
        totalAmount,
        taxType: form.taxType,
        igst,
        cgst,
        sgst,
        grandTotal,
        amountInWords,
        status: 'Draft',
      };

      const response = await api.createInvoice(invoiceData);
      if (response.error || response.message?.includes('required')) {
        alert("BACKEND VALIDATION ERROR:\n" + (response.message || response.error));
        return;
      }

      alert('Invoice created successfully!');
      navigate('/revenue');
    } catch (err: any) {
      alert('SERVER ERROR:\n' + (err.message || 'Failed to save invoice. Please check all fields.'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCandidate = (candidateId: string) => {
    const isSelected = form.selectedCandidateIds.includes(candidateId);
    const newSelected = isSelected
      ? form.selectedCandidateIds.filter(id => id !== candidateId)
      : [...form.selectedCandidateIds, candidateId];
    
    set('selectedCandidateIds', newSelected);

    // Auto-select client if not already selected
    if (!isSelected && !form.selectedClientId) {
      const candidate = candidates.find(c => c._id === candidateId);
      if (candidate?.clientName) {
        const company = companies.find(comp => comp.companyName === candidate.clientName);
        if (company) set('selectedClientId', company._id);
      }
    }
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

  if (preview && selectedCandidates.length > 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <button
          onClick={() => setPreview(false)}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
        >
          <Edit3 className="w-4 h-4" /> Edit Invoice
        </button>

        <InvoiceTemplate
          invoiceNumber={form.invoiceNumber}
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
          lutExpiry={form.lutExpiry}
          lutApplied={form.lutApplied}
          locationName={form.locationName}
          panNumber={form.panNumber}
          requesterName={form.requesterName}
          taxType={form.taxType}
          candidates={invoiceCandidates}
          totalAmount={totalAmount}
          igst={igst}
          cgst={cgst}
          sgst={sgst}
          grandTotal={grandTotal}
          amountInWords={amountInWords}
        />

        <div className="flex justify-center gap-3 py-6">
          <button
            onClick={() => setPreview(false)}
            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Saving...' : 'Save Invoice'}
          </button>
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
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>Create Invoice</h1>
          <p className="text-slate-500 text-sm mt-0.5">Generate professional invoices for joined candidates</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ─── Section 1: Invoice Details ─── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Invoice Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Invoice Number</label>
              <input type="text" value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)}
                placeholder="WHM/IN/YY-YY/XXX" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
              {errors.invoiceNumber && <p className="text-xs text-red-600 mt-1">{errors.invoiceNumber}</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Invoice Date</label>
              <input type="date" value={form.invoiceDate} onChange={e => set('invoiceDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>GST Number</label>
              <input type="text" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)}
                placeholder="e.g., 27ABCDE1234F1Z0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>SAC Code</label>
              <input type="text" value={form.sacCode} onChange={e => set('sacCode', e.target.value)}
                placeholder="e.g., 9950" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>LUT ARN</label>
              <input type="text" value={form.lutArn} onChange={e => set('lutArn', e.target.value)}
                placeholder="LUT Authorization Reference Number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>LUT Expiry</label>
              <input type="date" value={form.lutExpiry} onChange={e => set('lutExpiry', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Location / Office Name</label>
              <input type="text" value={form.locationName} onChange={e => set('locationName', e.target.value)}
                placeholder="e.g., IBPO Pune SEZ" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>PAN Number</label>
              <input type="text" value={form.panNumber} onChange={e => set('panNumber', e.target.value)}
                placeholder="e.g., ABCDE1234F" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Requester Name (HR)</label>
              <input type="text" value={form.requesterName} onChange={e => set('requesterName', e.target.value)}
                placeholder="Name of Requester/HR" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Tax Type</label>
              <select value={form.taxType} onChange={e => set('taxType', e.target.value)}
                disabled={form.lutApplied}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white disabled:bg-slate-100 disabled:text-slate-400">
                <option value="IGST@18">IGST @ 18%</option>
                <option value="SGST@9">SGST @ 9%</option>
                <option value="CGST@9">CGST @ 9%</option>
                <option value="CGST@9_SGST@9">CGST @ 9% & SGST @ 9%</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input type="checkbox" checked={form.lutApplied} onChange={e => set('lutApplied', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-slate-600">LUT Applied (Tax: 0%)</span>
          </label>
        </div>

        {/* ─── Section 2: Client Selection ─── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Bill To (Client)</h2>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Select Client *</label>
            <select value={form.selectedClientId} onChange={e => set('selectedClientId', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white">
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
              {selectedClient.lut && <p><span style={{ fontWeight: 600 }}>LUT:</span> {selectedClient.lut}</p>}
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
                <label key={candidate._id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.selectedCandidateIds.includes(candidate._id)}
                    onChange={() => toggleCandidate(candidate._id)}
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
                      {candidate.clientName && <p className="text-xs text-indigo-600"><span style={{ fontWeight: 500 }}>Client:</span> {candidate.clientName}</p>}
                    </div>
                  </div>
                  {form.selectedCandidateIds.includes(candidate._id) && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={form.customAmounts[candidate._id] || candidate.joiningSalary || 50000}
                        onChange={e => setCustomAmount(candidate._id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-400"
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
            {form.taxType === 'IGST@18' && (
              <div className="flex justify-between">
                <span className="text-blue-700">IGST @18% {form.lutApplied ? '(LUT Applied)' : ''}</span>
                <span className="text-blue-800" style={{ fontWeight: 600 }}>₹{igst.toLocaleString('en-IN')}</span>
              </div>
            )}
            {form.taxType === 'SGST@9' && (
              <div className="flex justify-between">
                <span className="text-blue-700">SGST @9% {form.lutApplied ? '(LUT Applied)' : ''}</span>
                <span className="text-blue-800" style={{ fontWeight: 600 }}>₹{sgst.toLocaleString('en-IN')}</span>
              </div>
            )}
            {form.taxType === 'CGST@9' && (
              <div className="flex justify-between">
                <span className="text-blue-700">CGST @9% {form.lutApplied ? '(LUT Applied)' : ''}</span>
                <span className="text-blue-800" style={{ fontWeight: 600 }}>₹{cgst.toLocaleString('en-IN')}</span>
              </div>
            )}
            {form.taxType === 'CGST@9_SGST@9' && (
              <>
                <div className="flex justify-between">
                  <span className="text-blue-700">CGST @9% {form.lutApplied ? '(LUT Applied)' : ''}</span>
                  <span className="text-blue-800" style={{ fontWeight: 600 }}>₹{cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">SGST @9% {form.lutApplied ? '(LUT Applied)' : ''}</span>
                  <span className="text-blue-800" style={{ fontWeight: 600 }}>₹{sgst.toLocaleString('en-IN')}</span>
                </div>
              </>
            )}
            <div className="border-t border-blue-200 pt-2 flex justify-between">
              <span className="text-blue-800" style={{ fontWeight: 700 }}>Grand Total</span>
              <span className="text-blue-800 text-base" style={{ fontWeight: 700 }}>₹{grandTotal.toLocaleString('en-IN')}</span>
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
          <button
            type="button"
            onClick={() => { 
              const newErrors = validateForm();
              if (Object.keys(newErrors).length === 0) setPreview(true); 
              else alert("VALIDATION ERRORS:\n\n" + Object.values(newErrors).join("\n"));
            }}
            disabled={selectedCandidates.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            <Eye className="w-4 h-4" /> Preview Invoice
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
