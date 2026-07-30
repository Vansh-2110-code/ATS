import { useState, useRef } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle, XCircle, Loader2, Eye, EyeOff, ChevronDown, Check, Edit2 } from 'lucide-react';
import api from '../../services/api';

interface FieldCorrection {
  field: string;
  type: string;
  raw?: string;
  suggestion?: string;
  suggestions?: {
    autoFix?: string;
    keepBoth?: string;
    altPhone?: string;
  };
}

interface PreviewRow {
  row: number;
  data: Record<string, any>;
  status: 'valid' | 'needs_correction' | 'duplicate';
  corrections?: FieldCorrection[];
}

interface DuplicateMatch {
  row: number;
  excelData: Record<string, any>;
  existingCandidate: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
  };
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  importBatchId: string;
  errors?: string[];
}

export function ExcelCandidateImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'duplicates' | 'confirm' | 'result'>('upload');
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'allow'>('skip');
  
  // Correction State
  const [selectedCorrectionRow, setSelectedCorrectionRow] = useState<{row: PreviewRow, field: string} | null>(null);
  const [selectedErrorRow, setSelectedErrorRow] = useState<PreviewRow | null>(null);
  const [manualEditValue, setManualEditValue] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(selectedFile.type)) {
        alert('Please upload a valid Excel (.xlsx) or CSV file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('preview', 'true');

      const API_URL = window.location.origin;
      const response = await fetch(`${API_URL}/api/candidates/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${api.getToken()}` },
        body: fd
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Validation failed');
      
      setPreviewData(data.preview || []);
      setDuplicates(data.duplicates || []);
      setStep('preview');
    } catch (err) {
      alert('Error preview: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const finalData = previewData.map(p => ({
        data: p.data,
        status: p.status
      }));

      const API_URL = window.location.origin;
      const response = await fetch(`${API_URL}/api/candidates/import`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${api.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          finalData: JSON.stringify(finalData),
          duplicateHandling,
          preview: false
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Import failed');
      
      setResult(data);
      setStep('result');
    } catch (err) {
      alert('Import error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const applyCorrection = (rowId: number, field: string, value: string, type: 'auto' | 'keep' | 'manual' | 'split', altValue?: string) => {
    setPreviewData(prev => prev.map(p => {
      if (p.row !== rowId) return p;
      const newData = { ...p.data, [field]: value };
      if (type === 'split' && altValue) newData.altPhone = altValue;
      
      const newCorrections = p.corrections?.filter(c => c.field !== field);
      const newStatus = (!newCorrections || newCorrections.length === 0) ? (p.status === 'duplicate' ? 'duplicate' : 'valid') : 'needs_correction';
      
      return { ...p, data: newData, corrections: newCorrections, status: newStatus };
    }));
    setSelectedCorrectionRow(null);
    setManualEditValue('');
  };

  const downloadTemplate = () => {
    const headers = [
      'Job Title', 'Date of application', 'Name', 'Email ID', 'Phone Number',
      'Current Location', 'Preferred Locations', 'Total Experience', 'Curr. Company name',
      'Curr. Company Designation', 'Department', 'Role', 'Industry', 'Key Skills',
      'Annual Salary', 'Notice period/ Availability to join', 'Resume Headline', 'Summary',
      'Under Graduation degree', 'UG Specialization', 'UG University/institute Name', 'UG Graduation year',
      'Post graduation degree', 'PG specialization', 'PG university/institute name', 'PG graduation year',
      'Doctorate degree', 'Doctorate specialization', 'Doctorate university/institute name', 'Doctorate graduation year',
      'Gender', 'Marital Status', 'Home Town/City', 'Pin Code', 'Work permit for USA',
      'Date of Birth', 'Permanent Address'
    ];
    const sampleRow = [
      'Software Engineer', '2026-07-10', 'Raj Kumar', 'raj@email.com', '9876543210',
      'Bangalore', 'Bangalore/Chennai', '5', 'TechCorp',
      'Senior Developer', 'IT', 'Developer', 'Software', '"React, Node.js, Python"',
      '800000', '30 days', 'Experienced Full Stack Developer', 'Experienced developer in web technologies',
      'B.Tech', 'Computer Science', 'IIT Delhi', '2017',
      'M.Tech', 'Computer Science', 'IIT Delhi', '2019',
      'None', 'None', 'None', 'None',
      'Male', 'Married', 'Delhi', '110001', 'No',
      '1995-05-15', '123 Main St Delhi'
    ];
    const csvContent = `${headers.join(',')}\n${sampleRow.join(',')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidate_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validRows = previewData.filter(p => p.status === 'valid').length;
  const correctionRows = previewData.filter(p => p.status === 'needs_correction').length;
  const duplicateRows = previewData.filter(p => p.status === 'duplicate').length;
  
  // Total eligible for import includes valid and needs_correction (since we allow Keep Raw)
  const totalEligible = validRows + correctionRows + (duplicateHandling !== 'skip' ? duplicateRows : 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
      {/* ─── Row Error Detail Popup ─── */}
      {selectedErrorRow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-slate-800 font-bold">Correction Reasons: Row {selectedErrorRow.row}</h3>
              </div>
              <button onClick={() => setSelectedErrorRow(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Candidate Data</p>
                <p className="text-sm font-semibold text-slate-700">{selectedErrorRow.data.name || '(No Name)'}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedErrorRow.data.email || '(No Email)'} · {selectedErrorRow.data.phone || '(No Phone)'}</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Required Fixes</p>
                {selectedErrorRow.corrections?.map((err, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold uppercase text-[10px] opacity-70 mb-0.5">{err.field} - {err.type.replace('_', ' ')}</p>
                      <p className="mb-1">Raw Value: <span className="font-mono text-xs bg-amber-100 px-1 rounded">{err.raw || '(none)'}</span></p>
                      {err.suggestion && <p className="text-xs text-amber-700">Suggestion: {err.suggestion}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedErrorRow(null)} className="px-5 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cell Correction Popover ─── */}
      {selectedCorrectionRow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-slate-800 font-bold">Data Correction Required</h3>
              </div>
              <button onClick={() => setSelectedCorrectionRow(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {(() => {
                const row = selectedCorrectionRow.row;
                const fieldName = selectedCorrectionRow.field;
                const corr = row.corrections?.find(c => c.field === fieldName);
                if (!corr) return null;

                return (
                  <>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Original {fieldName} Data</p>
                      <p className="font-mono text-sm bg-white border border-red-200 text-red-700 p-2 rounded">{corr.raw || row.data[fieldName]}</p>
                      <p className="text-xs text-amber-700 mt-2 font-medium">Issue: {corr.type.replace('_', ' ').toUpperCase()}</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">How would you like to fix this?</p>
                      
                      {corr.suggestions?.autoFix && (
                        <button onClick={() => applyCorrection(row.row, fieldName, corr.suggestions!.autoFix!, 'auto')}
                          className="w-full text-left p-3 border border-green-200 hover:border-green-400 hover:bg-green-50 rounded-xl transition-all group flex items-start gap-3">
                          <div className="mt-0.5 bg-green-100 text-green-600 p-1 rounded-full group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Auto-fix (Recommended)</p>
                            <p className="text-sm text-slate-600 mt-0.5">Use extracted value: <span className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-slate-200">{corr.suggestions.autoFix}</span></p>
                          </div>
                        </button>
                      )}

                      {corr.suggestions?.keepBoth && (
                        <button onClick={() => applyCorrection(row.row, fieldName, corr.suggestions!.keepBoth!, 'keep')}
                          className="w-full text-left p-3 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all group flex items-start gap-3">
                          <div className="mt-0.5 bg-slate-100 text-slate-600 p-1 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Eye className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Keep Raw Value</p>
                            <p className="text-sm text-slate-600 mt-0.5">Save as comma-separated string</p>
                          </div>
                        </button>
                      )}

                      {corr.suggestions?.altPhone && (
                        <button onClick={() => applyCorrection(row.row, fieldName, corr.suggestions!.autoFix!, 'split', corr.suggestions!.altPhone)}
                          className="w-full text-left p-3 border border-slate-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl transition-all group flex items-start gap-3">
                          <div className="mt-0.5 bg-slate-100 text-slate-600 p-1 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Split into Primary & Alternate</p>
                            <p className="text-sm text-slate-600 mt-0.5">Primary: {corr.suggestions.autoFix} | Alt: {corr.suggestions.altPhone}</p>
                          </div>
                        </button>
                      )}

                      <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="mt-0.5 bg-slate-200 text-slate-600 p-1 rounded-full">
                            <Edit2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Manual Edit</p>
                            <p className="text-sm text-slate-600 mt-0.5">Type the correct value yourself</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input 
                            type="text" 
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="Enter correct value..."
                            value={manualEditValue}
                            onChange={(e) => setManualEditValue(e.target.value)}
                          />
                          <button 
                            disabled={!manualEditValue.trim()}
                            onClick={() => applyCorrection(row.row, fieldName, manualEditValue, 'manual')}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors">
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Excel Candidate Import</h1>
          <p className="text-slate-600 mt-1">Upload Excel file to bulk import candidates with smart validation and duplicate detection</p>
        </div>

        <div className="mb-8 flex justify-between">
          {['upload', 'preview', 'duplicates', 'confirm', 'result'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === s ? 'bg-green-600 text-white' :
                  ['upload', 'preview', 'duplicates', 'confirm', 'result'].indexOf(step) > i ? 'bg-green-100 text-green-600' :
                    'bg-slate-200 text-slate-500'
                }`}>
                {i + 1}
              </div>
              {i < 4 && <div className={`flex-1 h-1 mx-2 ${['upload', 'preview', 'duplicates', 'confirm', 'result'].indexOf(step) > i ? 'bg-green-200' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* ─── Step 1: Upload ─── */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Upload Excel File</h2>
              <p className="text-slate-600">Supported formats: .xlsx, .csv</p>
            </div>
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors mb-6"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-1">Drag and drop file here</h3>
              <p className="text-slate-600 text-sm">or click to browse</p>
            </div>
            {file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-sm text-green-700">
                ✓ File selected: <strong>{file.name}</strong>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
            <div className="flex gap-3">
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                <Download className="w-4 h-4" />Download Template
              </button>
              <button onClick={handlePreview} disabled={!file || loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                {loading ? 'Validating...' : 'Intelligent Preview'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Preview & Validation ─── */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-3xl font-bold text-blue-600">{previewData.length}</div>
                <p className="text-sm text-slate-600">Total Rows</p>
              </div>
              <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                <div className="text-3xl font-bold text-green-600">{validRows}</div>
                <p className="text-sm text-green-700">Ready</p>
              </div>
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <div className="text-3xl font-bold text-amber-600">{correctionRows}</div>
                <p className="text-sm text-amber-700">Needs Correction</p>
              </div>
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                <div className="text-3xl font-bold text-yellow-600">{duplicateRows}</div>
                <p className="text-sm text-yellow-700">Duplicates</p>
              </div>
            </div>

            {correctionRows > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Action Required: {correctionRows} row(s) have multi-value or malformed fields.
                </h3>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {previewData.filter(p => p.status === 'needs_correction').slice(0, 10).map((item) => (
                    <div key={item.row}
                      onClick={() => setSelectedErrorRow(item)}
                      className="group text-sm bg-white border border-amber-200 rounded p-2 flex items-center justify-between cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded flex items-center justify-center text-[10px] font-bold">R{item.row}</span>
                        <p className="font-semibold text-slate-700">{item.data.name || '(no name)'}</p>
                        <span className="text-xs text-slate-500">
                          ({item.corrections?.map(c => c.field).join(', ')})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-amber-600 font-bold group-hover:underline">
                        View Reasons <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                  {correctionRows > 10 && (
                    <p className="text-xs text-amber-600 italic">Showing first 10 rows with issues...</p>
                  )}
                </div>
                <p className="text-sm text-amber-800">Click on the highlighted cells in the table below to fix them. Rows left uncorrected will be imported as-is (Keep Raw).</p>
              </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600">Row</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600">Name</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600">Email</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.map((item) => (
                      <tr key={item.row} className={item.status === 'needs_correction' ? 'bg-amber-50/30' : item.status === 'duplicate' ? 'bg-yellow-50/50' : 'hover:bg-slate-50'}>
                        <td className="px-4 py-3 text-sm text-slate-500">{item.row}</td>
                        <td className="px-4 py-3 text-sm">
                          {item.status === 'valid' && <span className="inline-flex items-center gap-1 text-green-700 text-xs font-bold px-2 py-1 bg-green-100 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Valid</span>}
                          {item.status === 'needs_correction' && <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-bold px-2 py-1 bg-amber-100 rounded-full"><AlertCircle className="w-3.5 h-3.5" /> Needs Fix</span>}
                          {item.status === 'duplicate' && <span className="inline-flex items-center gap-1 text-yellow-700 text-xs font-bold px-2 py-1 bg-yellow-100 rounded-full"><AlertCircle className="w-3.5 h-3.5" /> Duplicate</span>}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.data.name}</td>
                        
                        {/* Dynamic Cells */}
                        {['email', 'phone'].map(field => {
                          const corr = item.corrections?.find(c => c.field === field);
                          if (corr) {
                            return (
                              <td key={field} className="px-4 py-2">
                                <button 
                                  onClick={() => { setSelectedCorrectionRow({row: item, field}); setManualEditValue(corr.raw || item.data[field]); }}
                                  className="text-left w-full px-3 py-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded text-amber-900 text-sm font-medium transition-colors group flex items-center justify-between"
                                >
                                  <span className="truncate max-w-[150px]">{corr.raw || item.data[field]}</span>
                                  <Edit2 className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                                </button>
                              </td>
                            );
                          }
                          return <td key={field} className="px-4 py-3 text-sm text-slate-600 truncate max-w-[150px]">{item.data[field] || '-'}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('upload')} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Back</button>
              {duplicateRows > 0 ? (
                <button onClick={() => setStep('duplicates')} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                  Handle Duplicates ({duplicateRows})
                </button>
              ) : (
                <button onClick={() => setStep('confirm')} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Proceed to Import ({validRows + correctionRows} rows)
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── Step 3: Handle Duplicates ─── */}
        {step === 'duplicates' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Handle Duplicates</h2>
              <div className="space-y-3 mb-6">
                {['skip', 'update', 'allow'].map(opt => (
                  <label key={opt} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input type="radio" name="duplicateHandling" value={opt} checked={duplicateHandling === opt} onChange={(e) => setDuplicateHandling(e.target.value as any)} />
                    <div>
                      <p className="font-medium text-slate-800 capitalize">{opt === 'allow' ? 'Allow Duplicates' : opt + ' Duplicates'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('preview')} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg">Back</button>
              <button onClick={() => setStep('confirm')} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Continue ({validRows + correctionRows + (duplicateHandling !== 'skip' ? duplicateRows : 0)} records)
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Confirmation ─── */}
        {step === 'confirm' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Confirm Final Import</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{totalEligible}</p>
                <p className="text-sm text-green-700">Total Rows to Import</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-slate-600">{previewData.length - totalEligible}</p>
                <p className="text-sm text-slate-600">Skipped (Duplicates)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('preview')} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg">Back</button>
              <button onClick={handleImport} disabled={loading} className="flex-1 flex justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {loading ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 5: Import Result ─── */}
        {step === 'result' && result && (
          <div className="space-y-6">
            <div className={`border-2 rounded-lg p-6 ${result.created > 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                {result.created > 0
                  ? <CheckCircle2 className="w-8 h-8 text-green-600" />
                  : <AlertCircle className="w-8 h-8 text-amber-600" />}
                <h2 className={`text-xl font-bold ${result.created > 0 ? 'text-green-900' : 'text-amber-900'}`}>
                  {result.created > 0 ? 'Import Completed Successfully!' : 'Import Completed with Issues'}
                </h2>
              </div>
              <p className="text-slate-600 text-sm">Batch ID: <code className="bg-white px-2 py-1 rounded">{result.importBatchId}</code></p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{result.created}</div>
                <p className="text-sm text-slate-600 mt-1">Created</p>
              </div>
              {result.updated > 0 && (
                <div className="bg-white rounded-lg border border-blue-200 p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{result.updated}</div>
                  <p className="text-sm text-slate-600 mt-1">Updated</p>
                </div>
              )}
              <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                <div className="text-3xl font-bold text-slate-600">{result.skipped}</div>
                <p className="text-sm text-slate-600 mt-1">Skipped</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                <div className="text-3xl font-bold text-slate-500">{result.total}</div>
                <p className="text-sm text-slate-600 mt-1">Total Rows</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> {result.errors.length} row(s) failed with errors:
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-700 font-mono bg-white border border-red-100 px-2 py-1 rounded">{err}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setStep('upload'); setFile(null); setResult(null); setPreviewData([]); setDuplicates([]); }} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg">Import Another</button>
              <button onClick={() => window.location.href = '/admin/candidates'} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">View Candidates</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
