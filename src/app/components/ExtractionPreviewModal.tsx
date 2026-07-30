import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Sparkles, Edit2 } from 'lucide-react';

interface ExtractedField {
  field: string;
  value: string | string[];
  confidence: 'high' | 'medium' | 'low';
  editable?: boolean;
}

interface ExtractedData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  skills?: Array<{ name: string; level?: string }>;
  experience?: Array<{ title?: string; company?: string; duration?: string; points?: string[] }>;
  education?: Array<{ degree?: string; university?: string; year?: string; gpa?: string }>;
  certifications?: string[];
  atsScore?: number;
  keywords?: { found: string[]; missing: string[] };
  suggestions?: Array<{ type: string; text: string }>;
  wordCount?: number;
  pageCount?: number;
  [key: string]: any;
}

interface ExtractionPreviewModalProps {
  isOpen: boolean;
  extractedData: ExtractedData;
  onConfirm: (editedData: Record<string, any>) => void;
  onCancel: () => void;
  fileName: string;
}

export function ExtractionPreviewModal({
  isOpen,
  extractedData,
  onConfirm,
  onCancel,
  fileName,
}: ExtractionPreviewModalProps) {
  const [editedData, setEditedData] = useState<Record<string, any>>({
    name: extractedData.name || '',
    email: extractedData.email || '',
    phone: extractedData.phone || '',
    location: extractedData.location || '',
    linkedin: extractedData.linkedin || '',
    summary: extractedData.summary || '',
    skills: extractedData.skills?.map((s: any) => s.name || s).join(', ') || '',
    experience: extractedData.experience?.[0]?.duration || '',
    experienceCompany: extractedData.experience?.[0]?.company || '',
    experienceTitle: extractedData.experience?.[0]?.title || '',
    education: extractedData.education?.[0]?.degree || '',
    university: extractedData.education?.[0]?.university || '',
    educationYear: extractedData.education?.[0]?.year || '',
    certifications: extractedData.certifications?.join(', ') || '',
    atsScore: extractedData.atsScore || 0,
  });

  // Sync editedData when extractedData prop changes
  useEffect(() => {
    setEditedData({
      name: extractedData.name || '',
      email: extractedData.email || '',
      phone: extractedData.phone || '',
      location: extractedData.location || '',
      linkedin: extractedData.linkedin || '',
      summary: extractedData.summary || '',
      skills: extractedData.skills?.map((s: any) => s.name || s).join(', ') || '',
      experience: extractedData.experience?.[0]?.duration || '',
      experienceCompany: extractedData.experience?.[0]?.company || '',
      experienceTitle: extractedData.experience?.[0]?.title || '',
      education: extractedData.education?.[0]?.degree || '',
      university: extractedData.education?.[0]?.university || '',
      educationYear: extractedData.education?.[0]?.year || '',
      certifications: extractedData.certifications?.join(', ') || '',
      atsScore: extractedData.atsScore || 0,
    });
  }, [extractedData]);

  // Confidence scoring based on extraction quality
  const getConfidence = (field: string, value: any): 'high' | 'medium' | 'low' => {
    if (!value || (typeof value === 'string' && !value.trim())) return 'low';

    switch (field) {
      case 'email':
        return value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? 'high' : 'low';
      case 'phone':
        return value.replace(/\D/g, '').length === 10 ? 'high' : 'low';
      case 'name':
        return value.trim().split(' ').length >= 2 ? 'high' : 'medium';
      case 'location':
        return value.length > 3 ? 'medium' : 'low';
      case 'skills':
        return Array.isArray(value) && value.length > 0 ? 'high' : 'medium';
      case 'experience':
      case 'education':
        return value ? 'medium' : 'low';
      default:
        return 'medium';
    }
  };

  const fields: ExtractedField[] = [
    { field: 'Candidate Name', value: editedData.name, confidence: getConfidence('name', editedData.name), editable: true },
    { field: 'Email', value: editedData.email, confidence: getConfidence('email', editedData.email), editable: true },
    { field: 'Phone', value: editedData.phone, confidence: getConfidence('phone', editedData.phone), editable: true },
    { field: 'Current Location', value: editedData.location, confidence: getConfidence('location', editedData.location), editable: true },
    { field: 'LinkedIn Profile', value: editedData.linkedin, confidence: getConfidence('location', editedData.linkedin), editable: true },
    { field: 'Summary/Headline', value: editedData.summary, confidence: getConfidence('location', editedData.summary), editable: true },
    { field: 'Skills', value: editedData.skills, confidence: getConfidence('skills', editedData.skills ? editedData.skills.split(', ') : []), editable: true },
    { field: 'Experience Title', value: editedData.experienceTitle, confidence: getConfidence('experience', editedData.experienceTitle), editable: true },
    { field: 'Current Company', value: editedData.experienceCompany, confidence: getConfidence('experience', editedData.experienceCompany), editable: true },
    { field: 'Experience (Years)', value: editedData.experience, confidence: getConfidence('experience', editedData.experience), editable: true },
    { field: 'Education Degree', value: editedData.education, confidence: getConfidence('education', editedData.education), editable: true },
    { field: 'University', value: editedData.university, confidence: getConfidence('education', editedData.university), editable: true },
    { field: 'Graduation Year', value: editedData.educationYear, confidence: getConfidence('education', editedData.educationYear), editable: true },
    { field: 'Certifications', value: editedData.certifications, confidence: getConfidence('education', editedData.certifications), editable: true },
    { field: 'ATS Score', value: editedData.atsScore ? editedData.atsScore.toString() : '', confidence: 'high' as const, editable: false },
  ].filter(f => f.value); // Only show fields with values

  const confidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'medium': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'low': return 'bg-orange-50 border-orange-200 text-orange-700';
    }
  };

  const confidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'medium': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'low': return <AlertTriangle className="w-3.5 h-3.5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-emerald-900 font-bold text-lg">Resume Data Preview</h2>
              <p className="text-emerald-600 text-xs mt-0.5">Review and edit extracted information from {fileName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-center font-semibold">No Data Extracted</p>
              <p className="text-slate-400 text-sm mt-2 text-center max-w-sm">
                The resume parser couldn't extract information from this resume. This might be due to:
              </p>
              <ul className="text-slate-400 text-xs mt-3 list-disc list-inside space-y-1">
                <li>Complex or unusual resume layout</li>
                <li>Image-based or scanned PDF</li>
                <li>Unsupported file format</li>
                <li>Protected or encrypted PDF</li>
              </ul>
              <p className="text-slate-500 text-sm mt-4 text-center">
                You can close this modal and fill in the candidate details manually.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.field} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700">{field.field}</label>
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${confidenceColor(field.confidence)}`}
                    >
                      {confidenceIcon(field.confidence)}
                      {field.confidence === 'high' && 'High confidence'}
                      {field.confidence === 'medium' && 'Medium confidence'}
                      {field.confidence === 'low' && 'Low confidence'}
                    </div>
                  </div>

                  {field.field === 'Skills' && Array.isArray(editedData.skills) ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editedData.skills.split(', ').map((skill: string, idx: number) => (
                        skill && <span key={idx} className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <input
                      type={field.field === 'Email' ? 'email' : field.field === 'Phone' ? 'tel' : field.field === 'ATS Score' ? 'number' : 'text'}
                      value={editedData[field.field === 'Candidate Name' ? 'name' :
                             field.field === 'Current Location' ? 'location' :
                             field.field === 'Experience (Years)' ? 'experience' :
                             field.field === 'LinkedIn Profile' ? 'linkedin' :
                             field.field === 'Summary/Headline' ? 'summary' :
                             field.field === 'Experience Title' ? 'experienceTitle' :
                             field.field === 'Current Company' ? 'experienceCompany' :
                             field.field === 'Education Degree' ? 'education' :
                             field.field === 'Graduation Year' ? 'educationYear' :
                             field.field === 'Certifications' ? 'certifications' :
                             field.field === 'ATS Score' ? 'atsScore' :
                             field.field.toLowerCase().replace(/ /g, '')] || ''}
                      onChange={(e) => {
                        const fieldKey = field.field === 'Candidate Name' ? 'name' :
                                       field.field === 'Current Location' ? 'location' :
                                       field.field === 'Experience (Years)' ? 'experience' :
                                       field.field === 'LinkedIn Profile' ? 'linkedin' :
                                       field.field === 'Summary/Headline' ? 'summary' :
                                       field.field === 'Experience Title' ? 'experienceTitle' :
                                       field.field === 'Current Company' ? 'experienceCompany' :
                                       field.field === 'Education Degree' ? 'education' :
                                       field.field === 'Graduation Year' ? 'educationYear' :
                                       field.field === 'Certifications' ? 'certifications' :
                                       field.field === 'ATS Score' ? 'atsScore' :
                                       field.field.toLowerCase().replace(/ /g, '');
                        setEditedData(prev => ({
                          ...prev,
                          [fieldKey]: e.target.value,
                        }));
                      }}
                      disabled={field.field === 'ATS Score'}
                      placeholder={`Edit ${field.field.toLowerCase()}`}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 mt-2 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  )}
                </div>
              ))}

              {fields.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 mt-4">
                  <Edit2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-700 text-xs">You can edit any extracted field above before confirming. Fields with low confidence are recommended to verify.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
          >
            {fields.length === 0 ? 'Close' : 'Cancel'}
          </button>
          {fields.length > 0 && (
            <button
              onClick={() => onConfirm(editedData)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Fill Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
