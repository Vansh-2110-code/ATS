import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Loader2, AlertCircle, Briefcase, User, Phone, Mail,
  MapPin, Calendar, FileText, Upload, Award, CheckCircle2, Send, Lock, Shield,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────

// ─── Form State ────────────────────────────────────────────
const EMPTY_FORM = {
  // ── SECTION 1: Interview Assignment
  interviewCaller: '',
  recruiterEmail: '',
  questionsFile: null as File | null,
};

export function WalkInInterviewFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTLOrAdmin = user?.role === 'tl' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recruiters, setRecruiters] = useState<any[]>([]);

  // ── Load recruiters ──────────────────────────────────────────
  useEffect(() => {
    api.getRecruiters().then((data: any) => {
      setRecruiters(Array.isArray(data) ? data : (data.users || data.recruiters || []));
    }).catch(() => {});
  }, []);

  // ── Helper to set form values ────────────────────────────────
  const set = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors(e => {
        const copy = { ...e };
        delete copy[key];
        return copy;
      });
    }
  };

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};

    // Required fields
    if (!form.candidateName.trim()) e.candidateName = 'Candidate name is required';
    if (!form.candidatePhone.match(/^[0-9+\- ]{7,15}$/)) e.candidatePhone = 'Enter a valid phone number';
    if (!form.candidateEmail?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.candidateEmail = 'Enter a valid email';
    if (!form.interviewType) e.interviewType = 'Interview type is required';
    if (!form.recruiter) e.recruiter = 'Recruiter name is required';

    // Experience
    if (form.experienceYears < 0) e.experienceYears = 'Experience years cannot be negative';
    if (form.experienceMonths < 0) e.experienceMonths = 'Experience months cannot be negative';

    // File uploads (optional but validate if present)
    if (form.resume && form.resume.size > 10 * 1024 * 1024) {
      e.resume = 'Resume file must be less than 10MB';
    }
    if (form.questionsFile && form.questionsFile.size > 10 * 1024 * 1024) {
      e.questionsFile = 'Questions file must be less than 10MB';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Handle Submit ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();

      // Append all form fields
      Object.entries(form).forEach(([key, value]) => {
        if (value instanceof File) {
          fd.append(key, value);
        } else if (value !== null && value !== '' && value !== 0) {
          fd.append(key, String(value));
        }
      });

      // Mark first call as submitted
      fd.append('firstCallSubmitted', 'true');

      // Append assessment tests
      assessmentTests.forEach((test, idx) => {
        if (test.testName) fd.append(`assessmentTests[${idx}][testName]`, test.testName);
        if (test.questionsFile) fd.append(`assessmentTests[${idx}][questionsFile]`, test.questionsFile);
        if (test.answersFile) fd.append(`assessmentTests[${idx}][answersFile]`, test.answersFile);
      });

      // Call API (adjust endpoint as needed)
      await api.registerWalkIn(fd);
      setSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setForm(EMPTY_FORM);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Form submission failed:', err);
      setErrors({ form: 'Failed to submit form. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Assessment Tests State ──────────────────────────────────
  const [assessmentTests, setAssessmentTests] = useState<Array<{
    testName: string; questionsFile: File | null; answersFile: File | null;
  }>>(Array.from({ length: 6 }, () => ({ testName: '', questionsFile: null, answersFile: null })));

  const setTestField = (idx: number, field: string, value: any) => {
    setAssessmentTests(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  // ─── Render Section ─────────────────────────────────────────
  type SectionKey = 'section1' | 'section9';
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    section1: true,
    section9: false,
  });

  const toggleSection = (section: SectionKey) => {
    setExpandedSections(s => ({ ...s, [section]: !s[section] }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <h2 className="text-slate-800 mb-2" style={{ fontWeight: 700, fontSize: '1.5rem' }}>
            Assessment Form Submitted!
          </h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            Thank you! Candidate <strong className="text-slate-700">{form.candidateName}</strong>'s interview details have been recorded successfully.
          </p>

          <button
            onClick={() => navigate('/recruiter/walkin-queue')}
            className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            style={{ fontWeight: 600 }}
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.75rem' }}>
            Assessment Form
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Comprehensive candidate profile, interview details, and assessment tracking
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errors.form}</p>
            </div>
          )}

          {/* ══════════ SECTION 1: Interview Assignment ══════════ */}
          <SectionCard
            title="Interview Assignment"
            section="section1"
            expanded={expandedSections.section1}
            onToggle={toggleSection}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Who Called You for Interview <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.interviewCaller}
                  onChange={e => set('interviewCaller', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                    errors.interviewCaller
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 focus:border-green-400'
                  }`}
                >
                  <option value="">Select recruiter</option>
                  {recruiters.map(r => (
                    <option key={r._id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {errors.interviewCaller && (
                  <p className="mt-1 text-xs text-red-500">{errors.interviewCaller}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Recruiter Email ID
                </label>
                <input
                  type="email"
                  value={form.recruiterEmail}
                  onChange={e => set('recruiterEmail', e.target.value)}
                  placeholder="recruiter@company.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                  <FileText className="inline w-4 h-4 mr-1" />
                  Attach Questions/Answer PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => set('questionsFile', e.target.files?.[0] || null)}
                  className={`block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer ${
                    errors.questionsFile ? 'border-red-300 bg-red-50' : ''
                  }`}
                />
                {errors.questionsFile && (
                  <p className="mt-1 text-xs text-red-500">{errors.questionsFile}</p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ══════════ SECTION 9: Assessment Tests ══════════ */}
          <SectionCard
            title="Assessment Tests (up to 6)"
            section="section9"
            expanded={expandedSections.section9}
            onToggle={toggleSection}
          >
            <p className="text-xs text-slate-500 mb-4">
              Admin can upload questions and answer keys for each test. System will auto-evaluate responses.
            </p>
            <div className="space-y-4">
              {assessmentTests.map((test, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <p className="text-sm text-slate-700 mb-3" style={{ fontWeight: 600 }}>Test {idx + 1}</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide" style={{ fontWeight: 600 }}>Test Name</label>
                      <input
                        type="text"
                        value={test.testName}
                        onChange={e => setTestField(idx, 'testName', e.target.value)}
                        placeholder={`e.g. Aptitude Test ${idx + 1}`}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide" style={{ fontWeight: 600 }}>
                        <Upload className="inline w-3 h-3 mr-1" />Questions PDF
                        {!isAdmin && <span className="text-slate-400 font-normal ml-1">(Admin only)</span>}
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        disabled={!isAdmin}
                        onChange={e => setTestField(idx, 'questionsFile', e.target.files?.[0] || null)}
                        className={`block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {test.questionsFile && <p className="mt-1 text-xs text-green-600">✓ {test.questionsFile.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide" style={{ fontWeight: 600 }}>
                        <Upload className="inline w-3 h-3 mr-1" />Answers PDF
                        {!isAdmin && <span className="text-slate-400 font-normal ml-1">(Admin only)</span>}
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        disabled={!isAdmin}
                        onChange={e => setTestField(idx, 'answersFile', e.target.files?.[0] || null)}
                        className={`block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {test.answersFile && <p className="mt-1 text-xs text-blue-600">✓ {test.answersFile.name}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ══════════ Action Buttons ══════════ */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 -m-6 mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              style={{ fontWeight: 600 }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Helper Component: Section Card ────────────────────────
type SectionKey2 = 'section1' | 'section9';

interface SectionCardProps {
  title: string;
  section: SectionKey2;
  expanded: boolean;
  onToggle: (section: SectionKey2) => void;
  children: React.ReactNode;
}

function SectionCard({ title, section, expanded, onToggle, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(section)}
        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-transform ${
          expanded ? 'border-green-600 bg-green-50' : 'border-slate-300'
        }`}>
          {expanded && <div className="w-2.5 h-2.5 bg-green-600 rounded-sm" />}
        </div>
        <h2 className="text-slate-800 flex-1 text-left" style={{ fontWeight: 600 }}>
          {title}
        </h2>
      </button>

      {expanded && (
        <div className="px-6 py-4 border-t border-slate-100 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
