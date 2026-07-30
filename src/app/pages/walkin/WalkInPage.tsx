import { useState } from 'react';
import { Navigate } from 'react-router';
import {
  CheckCircle2, Upload, User, Phone, Mail, Briefcase,
  Loader2, AlertCircle, MapPin, Calendar, Award, Send, Info, Sparkles,
} from 'lucide-react';
import logoImg from '../../../assets/Logo.png';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const API_BASE = window.location.origin;

// ─── Static Recruiter List ────────────────────────────────────
const STATIC_RECRUITERS = [
  'Ahmed', 'Babul', 'Bibifathima', 'Bolwin', 'Darshan', 'Fathima', 'Fawaz',
  'Gowthami', 'Javed', 'John', 'Khushi', 'Lakshmi', 'Mariam', 'Navya',
  'Nisha', 'Noor', 'Rahman', 'Rine', 'Ruby', 'Samir', 'Saniya', 'Suhail', 'Wasiq',
];

const getRecruiterEmail = (name: string) =>
  name ? `${name.toLowerCase()}@whitehorsemanpower.in` : '';

// ─── Location Data ────────────────────────────────────────────
const REGIONS = [
  'All India', 'All North India', 'All West India', 'All East India', 'All South India',
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi-NCR', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu-Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const CITIES_BY_STATE: Record<string, string[]> = {
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga'],
  'Maharashtra': ['Mumbai City', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli'],
  'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Delhi-NCR': ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad', 'Greater Noida'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kurnool'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Rohtak', 'Hisar', 'Panipat'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamsala', 'Solan'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Jammu-Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Sopore'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur'],
  'Meghalaya': ['Shillong', 'Tura', 'Nongstoin'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar'],
};

// ─── Qualification Data ───────────────────────────────────────
const QUALIFICATION_GROUPS = [
  {
    group: 'UG',
    options: [
      'B.E/B.Tech – Mechanical', 'B.E/B.Tech – Electrical', 'B.E/B.Tech – Civil',
      'B.E/B.Tech – Computer Science', 'B.E/B.Tech – IT',
      'B.E/B.Tech – Electronics & Communication', 'BCA', 'B.Sc – Computer Science',
      'B.Sc – IT', 'B.Sc – General', 'B.Com', 'BBA', 'BBM', 'BA', 'B.Ed',
      'B.Pharm', 'B.Arch', 'LLB', 'MBBS',
    ],
  },
  {
    group: 'PG',
    options: [
      'M.E/M.Tech', 'M.Tech – Computer Science', 'M.Tech – IT', 'MCA',
      'M.Sc – Computer Science', 'M.Sc – IT', 'MBA – HR', 'MBA – Finance',
      'MBA – Marketing', 'MBA – Operations', 'MBA – General', 'M.Com', 'MA',
      'M.Sc – General', 'LLM', 'M.Pharm',
    ],
  },
  {
    group: 'Diploma',
    options: [
      'Diploma – Mechanical', 'Diploma – Electrical', 'Diploma – Civil',
      'Diploma – Electronics', 'Diploma – Computer Science', 'Polytechnic', 'ITI',
    ],
  },
  {
    group: 'Certification',
    options: [
      'CA', 'CMA', 'CS', 'PMP', 'ITIL', 'SAP Certified',
      'AWS Certified', 'Azure Certified', 'CCNA',
    ],
  },
];

const NOTICE_PERIODS = [
  'Serving Notice period', '15 days or Less', '1 Month', '2 Months', '3 Months', 'N/A',
];

const JOB_SOURCES = [
  'Direct/Walk-in', 'Naukri', 'Shine', 'Internet', 'Friend', 'College', 'Jobfair',
];

const INTERVIEW_TYPES = ['Virtual', 'Face2Face'];

const GENDERS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];

const GRAD_YEARS = Array.from({ length: 2026 - 1975 + 1 }, (_, i) => 1975 + i);

const EXPERIENCE_OPTIONS = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '30+',
];

// ─── Location Picker Component ───────────────────────────────
interface LocationPickerProps {
  prefix: string;
  region: string;
  state: string;
  city: string;
  onRegionChange: (v: string) => void;
  onStateChange: (v: string) => void;
  onCityChange: (v: string) => void;
}

function LocationPicker({
  prefix, region, state, city,
  onRegionChange, onStateChange, onCityChange,
}: LocationPickerProps) {
  const cities = state ? (CITIES_BY_STATE[state] || []) : [];

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs text-slate-600 mb-1" style={{ fontWeight: 500 }}>
          {prefix} Region
        </label>
        <select
          value={region}
          onChange={e => onRegionChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
        >
          <option value="">Select Region</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-600 mb-1" style={{ fontWeight: 500 }}>
          {prefix} State
        </label>
        <select
          value={state}
          onChange={e => { onStateChange(e.target.value); onCityChange(''); }}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
        >
          <option value="">Select State</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-600 mb-1" style={{ fontWeight: 500 }}>
          {prefix} City
        </label>
        <select
          value={city}
          onChange={e => onCityChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
        >
          <option value="">Select City</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
          {state && <option value="Other">Other</option>}
        </select>
      </div>
    </div>
  );
}

// ─── Form State ────────────────────────────────────────────
const EMPTY_FORM = {
  interviewCaller: '',
  recruiterEmail: '',

  candidateName: '',
  candidatePhone: '',
  jobOpeningSource: '',
  interviewType: '',
  candidateEmail: '',

  currentRegion: '',
  currentState: '',
  currentCity: '',
  currentSubLocation: '',

  preferredRegion: '',
  preferredState: '',
  preferredCity: '',

  qualification: '',
  university: '',
  yearOfGraduation: '',
  experienceYears: '0',
  currentCompany: '',
  currentCTC: '',
  expectedCTC: '',
  noticePeriod: '',
  gender: '',
  alternatePhone: '',
  dateOfBirth: '',
  joiningAvailability: '',

  resume: null as File | null,
};

export function WalkInPage() {
  const { isAuthenticated, user } = useAuth();

  // Must be logged in with walkin role to access this page
  if (!isAuthenticated) return <Navigate to="/walkin/login" replace />;
  if (user?.role !== 'walkin') return <Navigate to="/login" replace />;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState('');

  // ── Resume auto-extraction ───────────────────────────────────
  const handleResumeUpload = async (file: File | null) => {
    if (!file) { setForm(f => ({ ...f, resume: null })); return; }
    setForm(f => ({ ...f, resume: file }));
    setExtracting(true);
    setExtractMsg('');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await fetch(`${API_BASE}/api/public/resume-extract`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Extraction failed');
      const data = await res.json();

      // Map extracted fields → form
      setForm(f => {
        const updated = { ...f };
        if (data.name)  updated.candidateName  = data.name;
        if (data.email) updated.candidateEmail  = data.email;
        if (data.phone) {
          const digits = data.phone.replace(/\D/g, '').slice(-10);
          if (digits.length === 10) updated.candidatePhone = digits;
        }
        if (data.experience?.length) {
          const durStr: string = data.experience[0]?.duration || '';
          const yr = durStr.match(/(\d+)/);
          if (yr) updated.experienceYears = yr[1];
        }
        if (data.education?.length) {
          const deg: string = data.education[0]?.degree || '';
          // Try to match against known qualification options
          const degLower = deg.toLowerCase();
          const matched = QUALIFICATION_GROUPS.flatMap(g => g.options).find(
            opt => degLower.includes(opt.toLowerCase().split(' – ')[0].toLowerCase())
              || opt.toLowerCase().split(' – ')[0].toLowerCase().split('/').some(p => degLower.includes(p.trim()))
          );
          if (matched) updated.qualification = matched;
        }
        return updated;
      });

      const filled = [data.name, data.email, data.phone].filter(Boolean).length;
      setExtractMsg(filled > 0
        ? `Auto-filled ${filled} field${filled > 1 ? 's' : ''} from resume. Please verify and complete the rest.`
        : 'Resume uploaded. Could not extract details automatically — please fill in manually.');
    } catch {
      setExtractMsg('Could not extract details from resume. Please fill in manually.');
    } finally {
      setExtracting(false);
    }
  };

  const set = (key: string, value: any) => {
    setForm(f => {
      const updated = { ...f, [key]: value };
      if (key === 'interviewCaller') {
        updated.recruiterEmail = getRecruiterEmail(value);
      }
      return updated;
    });
    if (errors[key]) {
      setErrors(e => { const c = { ...e }; delete c[key]; return c; });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.candidateName.trim()) e.candidateName = 'Candidate name is required';
    if (!form.candidatePhone.match(/^\d{10}$/)) e.candidatePhone = 'Enter a valid 10-digit phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.SyntheticEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value instanceof File) {
          fd.append(key, value);
        } else if (value !== null && value !== '') {
          fd.append(key, String(value));
        }
      });
      const res = await api.registerWalkIn(fd);
      setTicketNo(res.tokenNumber || res.ticketNo || 'WI-' + Math.floor(1000 + Math.random() * 9000));
      setSuccess(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrors({ form: 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <h2 className="text-slate-800 mb-2" style={{ fontWeight: 700, fontSize: '1.5rem' }}>
            Walk-In Registered!
          </h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            Thank you, <strong className="text-slate-700">{form.candidateName}</strong>!
            Your registration is complete. Please wait — a recruiter will call your token number shortly.
          </p>
          <div className="bg-green-600 rounded-2xl p-6 mb-6">
            <p className="text-green-200 text-sm mb-1">Your Token Number</p>
            <div className="text-white" style={{ fontWeight: 800, fontSize: '2.5rem', letterSpacing: '0.1em' }}>
              {ticketNo}
            </div>
            <p className="text-green-200 text-xs mt-2">Keep this for reference</p>
          </div>
          <div className="text-left space-y-2 text-sm mb-6">
            {['Resume submitted to recruiter queue', 'Registration timestamp recorded', 'Profile visible to available recruiters'].map(msg => (
              <div key={msg} className="flex items-center gap-2 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {msg}
              </div>
            ))}
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setSuccess(false); setErrors({}); }}
            className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            style={{ fontWeight: 600 }}
          >
            Register Another Candidate
          </button>
        </div>
      </div>
    );
  }

  // ── Main Form ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3 flex-1">
            <img src={logoImg} alt="White Horse Manpower" className="h-9 w-auto" />
            <div>
              <h1 className="text-slate-800 leading-tight" style={{ fontWeight: 700, fontSize: '1rem' }}>
                Walk-In Registration
              </h1>
              <p className="text-slate-500 text-xs">White Horse Manpower ATS</p>
            </div>
          </div>

          {/* Center: Who Called + Email */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex-1">
              <label className="block text-xs text-slate-600 mb-1" style={{ fontWeight: 500 }}>
                Who Called you for interview
              </label>
              <select
                value={form.interviewCaller}
                onChange={e => set('interviewCaller', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
              >
                <option value="">Select Recruiter</option>
                {STATIC_RECRUITERS.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-600 mb-1" style={{ fontWeight: 500 }}>
                Recruiter Email ID
              </label>
              <input
                type="email"
                value={form.recruiterEmail}
                readOnly
                placeholder="Auto-filled on selection"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-600 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Right: Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => { setForm(EMPTY_FORM); setErrors({}); }}
              className="px-5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm transition-colors"
              style={{ fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm transition-colors flex items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errors.form}</p>
            </div>
          )}

          {/* ══════════ SECTION 2: Candidate Details ══════════ */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <h2 className="text-green-800" style={{ fontWeight: 700, fontSize: '1rem' }}>
                Candidate Details
              </h2>
            </div>
            <div className="px-6 py-5 space-y-5">

              {/* Row 1: Name + Phone */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    <User className="inline w-3.5 h-3.5 mr-1" />
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.candidateName}
                    onChange={e => set('candidateName', e.target.value)}
                    placeholder="Full name"
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      errors.candidateName ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-green-400'
                    }`}
                  />
                  {errors.candidateName && <p className="mt-1 text-xs text-red-500">{errors.candidateName}</p>}
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    <Phone className="inline w-3.5 h-3.5 mr-1" />
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.candidatePhone}
                    onChange={e => set('candidatePhone', e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      errors.candidatePhone ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-green-400'
                    }`}
                  />
                  {errors.candidatePhone && <p className="mt-1 text-xs text-red-500">{errors.candidatePhone}</p>}
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    How did you know about Job Openings
                  </label>
                  <select
                    value={form.jobOpeningSource}
                    onChange={e => set('jobOpeningSource', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  >
                    <option value="">Select source</option>
                    {JOB_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Interview Type + Email + Alternate Phone */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Interview Type
                  </label>
                  <select
                    value={form.interviewType}
                    onChange={e => set('interviewType', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  >
                    <option value="">Select type</option>
                    {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    <Mail className="inline w-3.5 h-3.5 mr-1" />
                    Candidate Email Address
                  </label>
                  <input
                    type="email"
                    value={form.candidateEmail}
                    onChange={e => set('candidateEmail', e.target.value)}
                    placeholder="candidate@email.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    <Phone className="inline w-3.5 h-3.5 mr-1" />
                    Alternate Contact Number
                  </label>
                  <input
                    type="tel"
                    value={form.alternatePhone}
                    onChange={e => set('alternatePhone', e.target.value)}
                    placeholder="Alternate mobile number"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  />
                </div>
              </div>

              {/* Current Location */}
              <div>
                <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
                  <MapPin className="inline w-3.5 h-3.5 mr-1" />
                  Current Location
                </label>
                <LocationPicker
                  prefix="Current"
                  region={form.currentRegion}
                  state={form.currentState}
                  city={form.currentCity}
                  onRegionChange={v => set('currentRegion', v)}
                  onStateChange={v => set('currentState', v)}
                  onCityChange={v => set('currentCity', v)}
                />
                <div className="mt-3">
                  <input
                    type="text"
                    value={form.currentSubLocation}
                    onChange={e => set('currentSubLocation', e.target.value)}
                    placeholder="Current Sub-Location / Area (e.g. Koramangala)"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  />
                  <p className="mt-1 text-xs text-slate-400">Current Sub-Location</p>
                </div>
              </div>

              {/* Preferred Location */}
              <div>
                <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
                  <MapPin className="inline w-3.5 h-3.5 mr-1" />
                  Preferred Location
                </label>
                <LocationPicker
                  prefix="Preferred"
                  region={form.preferredRegion}
                  state={form.preferredState}
                  city={form.preferredCity}
                  onRegionChange={v => set('preferredRegion', v)}
                  onStateChange={v => set('preferredState', v)}
                  onCityChange={v => set('preferredCity', v)}
                />
              </div>

              {/* Row: Qualification + University + Year */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    <Award className="inline w-3.5 h-3.5 mr-1" />
                    Qualification
                  </label>
                  <select
                    value={form.qualification}
                    onChange={e => set('qualification', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  >
                    <option value="">Select qualification</option>
                    {QUALIFICATION_GROUPS.map(grp => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    University / College
                  </label>
                  <input
                    type="text"
                    value={form.university}
                    onChange={e => set('university', e.target.value)}
                    placeholder="e.g. Anna University"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    <Calendar className="inline w-3.5 h-3.5 mr-1" />
                    Year of Graduation
                  </label>
                  <select
                    value={form.yearOfGraduation}
                    onChange={e => set('yearOfGraduation', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  >
                    <option value="">Select year</option>
                    {GRAD_YEARS.slice().reverse().map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row: Experience + Company */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Total Experience (Years)
                  </label>
                  <select
                    value={form.experienceYears}
                    onChange={e => set('experienceYears', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  >
                    {EXPERIENCE_OPTIONS.map(y => (
                      <option key={y} value={y}>{y === '30+' ? '30+ Years' : `${y} Year${y === '1' ? '' : 's'}`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    <Briefcase className="inline w-3.5 h-3.5 mr-1" />
                    Current Company
                  </label>
                  <input
                    type="text"
                    value={form.currentCompany}
                    onChange={e => set('currentCompany', e.target.value)}
                    placeholder="Company name"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={e => set('gender', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* CTC Inputs */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Current CTC
                  </label>
                  <input
                    type="text"
                    value={form.currentCTC}
                    onChange={e => set('currentCTC', e.target.value)}
                    placeholder="e.g. 4.5 LPA or 45000/month"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Expected CTC
                  </label>
                  <input
                    type="text"
                    value={form.expectedCTC}
                    onChange={e => set('expectedCTC', e.target.value)}
                    placeholder="e.g. 6 LPA or 55000/month"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  />
                </div>
              </div>

              {/* Row: Notice Period + DOB + Joining Availability */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Notice Period
                  </label>
                  <select
                    value={form.noticePeriod}
                    onChange={e => set('noticePeriod', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  >
                    <option value="">Select notice period</option>
                    {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    <Calendar className="inline w-3.5 h-3.5 mr-1" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => set('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>
                    Joining Availability
                  </label>
                  <select
                    value={form.joiningAvailability}
                    onChange={e => set('joiningAvailability', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-400 transition-colors"
                  >
                    <option value="">Select availability</option>
                    {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* ══════════ Resume Attachment ══════════ */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <h2 className="text-green-800" style={{ fontWeight: 700, fontSize: '1rem' }}>
                Resume Attachment
              </h2>
            </div>
            <div className="px-6 py-5">
              {/* Auto-extract banner */}
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-blue-700 text-sm">
                  <strong>Tip:</strong> Upload your resume first — the system will auto-fill your details from it.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-green-300 transition-colors">
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-3">
                  {form.resume ? (
                    <span className="text-green-600 font-medium">{form.resume.name}</span>
                  ) : (
                    <span>There is no file.</span>
                  )}
                </p>
                <label className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors text-sm font-semibold text-white ${extracting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                  {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {extracting ? 'Extracting...' : 'Upload File'}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    disabled={extracting}
                    onChange={e => handleResumeUpload(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="text-xs text-slate-400 mt-2">Accepted: PDF, DOCX (max 10MB)</p>
              </div>

              {/* Extraction result message */}
              {extractMsg && (
                <div className={`mt-3 rounded-lg p-3 flex items-start gap-2 text-sm ${
                  extractMsg.includes('Could not')
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {extractMsg}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Submit (redundant but accessible) */}
          <div className="flex justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => { setForm(EMPTY_FORM); setErrors({}); }}
              className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm"
              style={{ fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
              style={{ fontWeight: 600 }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit & Get Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
