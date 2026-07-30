import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Loader2, Eye, Edit3, Download } from 'lucide-react';
import api from '../../services/api';
import { CreditNoteTemplate } from '../../components/CreditNoteTemplate';
import { convertNumberToWords } from '../../utils/numberToWords';

interface Candidate {
  _id: string;
  name: string;
  eid: string;
  offerDetails?: { dateOfJoining?: string };
  joiningDate?: string;
  exitDate?: string;
  designation?: string;
  location?: string;
  joiningSalary?: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientPin: string;
  clientCountry: string;
  clientGST: string;
  gstNumber: string;
  sacCode: string;
  lutArn: string;
  lutApplied: boolean;
  locationName: string;
  candidates: Array<{
    candidateId: string;
    eid: string;
    name: string;
    doj: string;
    designation: string;
    location: string;
    amount: number;
  }>;
  totalAmount: number;
  igst: number;
  grandTotal: number;
  amountInWords: string;
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

interface CreditNoteFormData {
  creditNoteNumber: string;
  noteDate: string;
  invoiceId: string;
  invoiceNumber: string;
  selectedCandidateIds: string[];
  reason: string;
  customAmounts: Record<string, number>;
  exitDates: Record<string, string>;
}

export function CreateCreditNotePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const candidateIdParam = searchParams.get('candidateId');
  const invoiceIdParam = searchParams.get('invoiceId');
  const { user } = useAuth();

  // Access control - admin only
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/recruiter', { replace: true });
    }
  }, [user, navigate]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [eligibleCandidates, setEligibleCandidates] = useState<Candidate[]>([]);

  const [form, setForm] = useState<CreditNoteFormData>({
    creditNoteNumber: '',
    noteDate: new Date().toISOString().split('T')[0],
    invoiceId: '',
    invoiceNumber: '',
    selectedCandidateIds: [],
    reason: 'Billing reversal due to candidate exit within 180 days',
    customAmounts: {},
    exitDates: {},
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [invRes, candRes, nextNumRes] = await Promise.all([
          api.getInvoices?.() || Promise.resolve([]),
          api.getCandidates?.() || Promise.resolve([]),
          api.getNextCreditNoteNumber?.() || Promise.resolve({ nextNumber: '' })
        ]);
        
        const invs = Array.isArray(invRes) ? invRes : invRes.invoices || [];
        setInvoices(invs);
        setCandidates(Array.isArray(candRes) ? candRes : candRes.candidates || []);
        
        if (nextNumRes?.nextNumber) {
          setForm(f => ({ ...f, creditNoteNumber: nextNumRes.nextNumber }));
        }

        // Auto-fill from query params
        if (invoiceIdParam) {
          const inv = invs.find((i: any) => i._id === invoiceIdParam);
          if (inv) {
            setForm(f => ({
              ...f,
              invoiceId: inv._id,
              invoiceNumber: inv.invoiceNumber,
              selectedCandidateIds: candidateIdParam ? [candidateIdParam] : [],
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invoiceIdParam, candidateIdParam]);

  const set = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const selectedInvoice = invoices.find(inv => inv._id === form.invoiceId);
  const selectedCandidates = selectedInvoice?.candidates || [];

  const getEffectiveDOJ = (cand: any, invCand: any) => {
    const raw = cand?.offerDetails?.dateOfJoining || cand?.joiningDate || invCand?.doj;
    if (!raw || raw === 'N/A' || raw === 'null' || raw === 'undefined') return selectedInvoice?.invoiceDate || form.noteDate;
    return raw;
  };

  const creditCandidates = selectedCandidates.filter(c =>
    form.selectedCandidateIds.includes(c.candidateId)
  ).map((c) => {
    const candData = candidates.find(can => can._id === c.candidateId);
    const dojRaw = getEffectiveDOJ(candData, c);
    const exitDate = form.exitDates[c.candidateId] || candData?.exitDate || '';
    
    let diffDays = 0;
    let isEligible = false;
    if (dojRaw && exitDate) {
      const doj = new Date(dojRaw);
      const exit = new Date(exitDate);
      diffDays = Math.floor((exit.getTime() - doj.getTime()) / (1000 * 60 * 60 * 24));
      isEligible = diffDays >= 0 && diffDays < 180;
    }

    return {
      candidateId: c.candidateId,
      eid: c.eid,
      name: c.name,
      doj: dojRaw,
      exitDate,
      duration: diffDays,
      isEligible,
      designation: c.designation,
      location: c.location,
      amount: form.customAmounts[c.candidateId] || c.amount,
    };
  });

  const totalCredit = creditCandidates.reduce((sum, c) => sum + (parseFloat(c.amount as any) || 0), 0);
  const igst = form.reason.includes('LUT') ? 0 : Math.round(totalCredit * 0.18);
  const grandTotal = totalCredit + igst;
  const amountInWords = convertNumberToWords(grandTotal);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.invoiceId) newErrors.invoice = 'Invoice required';
    if (form.selectedCandidateIds.length === 0) newErrors.candidates = 'Select at least 1 candidate';
    
    // Check if all selected candidates have an exit date and are eligible
    creditCandidates.forEach(c => {
      if (!c.exitDate) newErrors[`exit_${c.candidateId}`] = 'Exit date required';
      else if (!c.isEligible) newErrors[`eligibility_${c.candidateId}`] = `Ineligible (${c.duration} days)`;
    });

    if (!form.reason.trim()) newErrors.reason = 'Reason required';

    setErrors(newErrors);
    return Object.keys(newErrors).filter(k => !k.includes('eligibility') && !k.includes('exit')).length === 0 && 
           creditCandidates.every(c => c.exitDate && c.isEligible);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fix validation errors');
      return;
    }

    try {
      setSubmitting(true);
      const creditNoteData = {
        creditNoteNumber: form.creditNoteNumber,
        noteDate: form.noteDate,
        invoiceId: form.invoiceId,
        invoiceNumber: form.invoiceNumber,
        invoiceDate: selectedInvoice?.invoiceDate || form.noteDate,
        clientName: selectedInvoice?.clientName || '',
        clientAddress: selectedInvoice?.clientAddress || '',
        clientCity: selectedInvoice?.clientCity || '',
        clientState: selectedInvoice?.clientState || '',
        clientPin: selectedInvoice?.clientPin || '',
        clientCountry: selectedInvoice?.clientCountry || '',
        clientGST: selectedInvoice?.clientGST || '',
        gstNumber: selectedInvoice?.gstNumber || '',
        sacCode: selectedInvoice?.sacCode || '',
        lutArn: selectedInvoice?.lutArn || '',
        lutApplied: selectedInvoice?.lutApplied || false,
        locationName: selectedInvoice?.locationName || '',
        candidates: creditCandidates.map(c => ({
          candidateId: c.candidateId,
          eid: c.eid,
          name: c.name,
          doj: c.doj,
          exitDate: c.exitDate,
          duration: c.duration,
          designation: c.designation || '',
          location: c.location || '',
          amount: c.amount,
        })),
        totalAmount: totalCredit,
        igst,
        grandTotal,
        amountInWords,
        reason: form.reason,
      };

      const created = await api.createCreditNote?.(creditNoteData);
      alert('Credit Note generated successfully!');
      navigate('/credit-notes');
    } catch (err: any) {
      alert(err.message || 'Failed to generate credit note');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Preview mode
  if (preview && selectedInvoice && creditCandidates.length > 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <button
          onClick={() => setPreview(false)}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
        >
          <Edit3 className="w-4 h-4" /> Edit Credit Note
        </button>

        <CreditNoteTemplate
          creditNoteNumber={form.creditNoteNumber}
          invoiceNumber={selectedInvoice.invoiceNumber}
          invoiceDate={form.noteDate}
          referenceInvoiceNumber={form.invoiceNumber}
          clientName={selectedInvoice.clientName}
          clientAddress={selectedInvoice.clientAddress}
          clientCity={selectedInvoice.clientCity}
          clientState={selectedInvoice.clientState}
          clientPin={selectedInvoice.clientPin}
          clientCountry={selectedInvoice.clientCountry}
          clientGST={selectedInvoice.clientGST}
          gstNumber={selectedInvoice.gstNumber}
          sacCode={selectedInvoice.sacCode}
          lutArn={selectedInvoice.lutArn}
          lutApplied={selectedInvoice.lutApplied}
          locationName={selectedInvoice.locationName}
          candidates={creditCandidates.map((c, idx) => ({
            sl: idx + 1,
            eid: c.eid,
            name: c.name,
            doj: typeof c.doj === 'string' && !isNaN(Date.parse(c.doj)) ? new Date(c.doj).toLocaleDateString('en-IN') : c.doj,
            exitDate: c.exitDate,
            duration: c.duration,
            designation: c.designation || '',
            location: c.location || '',
            amount: c.amount,
          }))}
          totalAmount={totalCredit}
          igst={igst}
          grandTotal={grandTotal}
          amountInWords={amountInWords}
          reason={form.reason}
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
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {submitting ? 'Generating...' : 'Generate Credit Note'}
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
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>
            Generate Credit Note
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Billing reversal for candidates exiting within 180 days
          </p>
        </div>
      </div>


      <form onSubmit={handleSave} className="space-y-6">

        {/* ─── Section 1: Credit Note Details ─── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Credit Note Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Credit Note Number</label>
              <input
                type="text"
                value={form.creditNoteNumber}
                onChange={e => set('creditNoteNumber', e.target.value)}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Credit Note Date</label>
              <input
                type="date"
                value={form.noteDate}
                onChange={e => set('noteDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* ─── Section 2: Invoice Selection ─── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Reference Invoice</h2>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5" style={{ fontWeight: 600 }}>Select Invoice *</label>
            <select
              value={form.invoiceId}
              onChange={e => {
                const inv = invoices.find(i => i._id === e.target.value);
                set('invoiceId', e.target.value);
                set('invoiceNumber', inv?.invoiceNumber || '');
                set('selectedCandidateIds', []);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">-- Select Invoice --</option>
              {invoices.map(inv => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} ({inv.clientName}) - ₹{(inv.grandTotal || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
            {errors.invoice && <p className="text-xs text-red-600 mt-1">{errors.invoice}</p>}
          </div>
          {selectedInvoice && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg space-y-1 text-xs">
              <p><span style={{ fontWeight: 600 }}>Invoice Date:</span> {new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}</p>
              <p><span style={{ fontWeight: 600 }}>Client:</span> {selectedInvoice.clientName}</p>
              <p><span style={{ fontWeight: 600 }}>Total Amount:</span> ₹{(selectedInvoice.grandTotal || 0).toLocaleString('en-IN')}</p>
            </div>
          )}
        </div>

        {/* ─── Section 3: Candidate Selection (180-day filtered) ─── */}
        {selectedInvoice && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>
              Select Candidates for Credit *
              <span className="text-slate-500 text-xs ml-2">(Showing eligible candidates within 180 days)</span>
            </h2>
            {selectedInvoice.candidates.length === 0 ? (
              <p className="text-sm text-slate-500">No candidates in this invoice</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {selectedInvoice.candidates.map(candidate => {
                  const candData = candidates.find(can => can._id === candidate.candidateId);
                  const isSelected = form.selectedCandidateIds.includes(candidate.candidateId);
                  const dojRaw = getEffectiveDOJ(candData, candidate);
                  const currentExitDate = form.exitDates[candidate.candidateId] || candData?.exitDate || '';
                  
                  let diffDays = 0;
                  let isEligible = false;
                  if (dojRaw && currentExitDate) {
                    const doj = new Date(dojRaw);
                    const exit = new Date(currentExitDate);
                    diffDays = Math.floor((exit.getTime() - doj.getTime()) / (1000 * 60 * 60 * 24));
                    isEligible = diffDays >= 0 && diffDays < 180;
                  }

                  const formatDate = (d: any) => {
                    if (!d) return 'N/A';
                    const dt = new Date(d);
                    return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString('en-IN');
                  };

                  const isUsingFallback = dojRaw === (selectedInvoice?.invoiceDate || form.noteDate) && (!candData?.offerDetails?.dateOfJoining && !candData?.joiningDate);

                  return (
                    <div key={candidate.candidateId} className={`p-4 border rounded-xl transition-all ${isSelected ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCandidate(candidate.candidateId)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800">{candidate.name}</h3>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{candidate.eid} • {candidate.designation}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-700">₹{candidate.amount.toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Joining Date</label>
                              <div className="text-xs text-slate-600 font-medium">
                                {formatDate(dojRaw)}
                                {isUsingFallback && <span className="ml-1 text-[10px] text-amber-600 font-normal">(Invoice Date Fallback)</span>}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Exit Date *</label>
                              <input
                                type="date"
                                value={currentExitDate}
                                onChange={e => set('exitDates', { ...form.exitDates, [candidate.candidateId]: e.target.value })}
                                className="w-full px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-400"
                              />
                            </div>
                          </div>

                          {currentExitDate && (
                            <div className="mt-3 flex items-center justify-between">
                              <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${isEligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isEligible ? '✅ Eligible' : '❌ Ineligible'} ({diffDays} days)
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] text-slate-400 uppercase font-bold">Credit Amt:</label>
                                  <input
                                    type="number"
                                    value={form.customAmounts[candidate.candidateId] || candidate.amount}
                                    onChange={e => set('customAmounts', { ...form.customAmounts, [candidate.candidateId]: parseInt(e.target.value) || 0 })}
                                    className="w-24 px-2 py-1 border border-slate-200 rounded text-xs font-bold"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.candidates && <p className="text-xs text-red-600 mt-2">{errors.candidates}</p>}
          </div>
        )}

        {/* ─── Section 4: Reason ─── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Reason for Credit Note</h2>
          <textarea
            value={form.reason}
            onChange={e => set('reason', e.target.value)}
            placeholder="Enter reason for credit note..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-20 resize-none"
          />
          {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason}</p>}
        </div>

        {/* ─── Summary ─── */}
        {creditCandidates.length > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-700">Total Credit Amount</span>
              <span className="text-red-800" style={{ fontWeight: 600 }}>₹{(totalCredit || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">IGST @18%</span>
              <span className="text-red-800" style={{ fontWeight: 600 }}>₹{(igst || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-red-200 pt-2 flex justify-between">
              <span className="text-red-800" style={{ fontWeight: 700 }}>Grand Total Credit</span>
              <span className="text-red-800 text-base" style={{ fontWeight: 700 }}>₹{(grandTotal || 0).toLocaleString('en-IN')}</span>
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
            onClick={() => { if (validateForm()) setPreview(true); }}
            disabled={creditCandidates.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>
      </form>
    </div>
  );
}
