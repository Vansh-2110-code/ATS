import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Upload, CheckCircle2, Loader2, User, Phone, Mail,
  MapPin, Briefcase, Calendar, File, ArrowLeft, LogOut
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../../assets/Logo.png';

// ─── Constants ────────────────────────────────────────────────
const YEARS_OPTIONS = Array.from({ length: 31 }, (_, i) => i.toString());
const MONTHS_OPTIONS = Array.from({ length: 12 }, (_, i) => i.toString());
const JOB_SOURCES = ['Direct/Walk-in', 'Naukri', 'LinkedIn', 'Shine', 'Internet', 'Friend', 'Referral', 'Other'];
const INTERVIEW_TYPES = ['Virtual', 'Walk-in Company', 'Walk-in WHM', 'Video Call', 'Phone Call', 'Face2Face'];
const GENDERS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];
const NOTICE_PERIODS = ['Serving Notice period', '15 days or Less', '1 Month', '2 Months', '3 Months', 'N/A'];
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
};
const QUALIFICATIONS = [
  'B.E/B.Tech – Mechanical', 'B.E/B.Tech – Electrical', 'B.E/B.Tech – Civil',
  'B.E/B.Tech – Computer Science', 'B.E/B.Tech – IT', 'BCA', 'B.Sc – Computer Science',
  'B.Com', 'BBA', 'BBM', 'BA', 'MCA', 'MBA', 'M.Com', 'MA', 'Diploma', 'Other'
];

export function WalkInDemoRegistrationForm() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    positionApplied: '',
    alternatePhone: '',
    jobOpeningSource: '',
    interviewType: '',
    experienceYears: '0',
    experienceMonths: '0',
    currentRegion: '',
    currentState: '',
    currentCity: '',
    currentSubLocation: '',
    qualification: '',
    university: '',
    yearOfGraduation: '',
    gender: '',
    dateOfBirth: '',
    joiningAvailability: '',
    currentCTC: '',
    expectedCTC: '',
    noticePeriod: '',
    interviewDate: '',
    status: 'New',
    notes: '',
    skills: '',
    resume: null as File | null,
  });

  const set = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(prev => {
      const e = { ...prev };
      delete e[key];
      return e;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone.match(/^[0-9+\- ]{7,15}$/)) e.phone = 'Valid phone number is required';
    if (!form.qualification) e.qualification = 'Qualification is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'resume' && value) {
          formData.append('resume', value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      // Calculate total experience string for backend
      const expStr = form.experienceYears === '0' && form.experienceMonths === '0' 
        ? 'Fresher' 
        : `${form.experienceYears} Years ${form.experienceMonths} Months`;
      formData.append('experience', expStr);

      await api.registerDemoCandidate(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({ ...form, name: '', phone: '', email: '', resume: null });
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const cities = form.currentState ? (CITIES_BY_STATE[form.currentState] || []) : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-100 flex items-center justify-center">
                <img src={logoImg} alt="Logo" className="h-8 w-auto object-contain" />
              </div>
              <div>
                <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Demo Registration Form</h1>
                <p className="text-slate-400 text-xs">Register a new walk-in candidate</p>
              </div>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm font-medium">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-medium">Candidate registered successfully!</p>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Basic Information */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Basic Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Candidate's full name"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-green-400'}`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-green-400'}`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="candidate@email.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400"
                  />
                </div>
              </div>
            </section>

            {/* Application Details */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" />
                Application Details
              </h2>
              <div className="grid sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Position Applied</label>
                  <input
                    type="text"
                    value={form.positionApplied}
                    onChange={e => set('positionApplied', e.target.value)}
                    placeholder="e.g. Sales Associate"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Alternate Phone</label>
                  <input
                    type="tel"
                    value={form.alternatePhone}
                    onChange={e => set('alternatePhone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Job Opening Source</label>
                  <select
                    value={form.jobOpeningSource}
                    onChange={e => set('jobOpeningSource', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 bg-white"
                  >
                    <option value="">Select source</option>
                    {JOB_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Interview Type</label>
                  <select
                    value={form.interviewType}
                    onChange={e => set('interviewType', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 bg-white"
                  >
                    <option value="">Select type</option>
                    {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Experience</label>
                  <div className="flex gap-2">
                    <select value={form.experienceYears} onChange={e => set('experienceYears', e.target.value)} className="flex-1 px-2 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-400 bg-white">
                      {YEARS_OPTIONS.map(y => <option key={y} value={y}>{y}y</option>)}
                    </select>
                    <select value={form.experienceMonths} onChange={e => set('experienceMonths', e.target.value)} className="flex-1 px-2 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-400 bg-white">
                      {MONTHS_OPTIONS.map(m => <option key={m} value={m}>{m}m</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Location */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                Location
              </h2>
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">State</label>
                  <select value={form.currentState} onChange={e => set('currentState', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 bg-white">
                    <option value="">Select state</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">City</label>
                  <select value={form.currentCity} onChange={e => set('currentCity', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 bg-white">
                    <option value="">Select city</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Sub Location</label>
                  <input
                    type="text"
                    value={form.currentSubLocation}
                    onChange={e => set('currentSubLocation', e.target.value)}
                    placeholder="e.g. Whitefield"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400"
                  />
                </div>
              </div>
            </section>

            {/* Education & Personal */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Education & Personal
              </h2>
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Qualification <span className="text-red-500">*</span></label>
                  <select
                    value={form.qualification}
                    onChange={e => set('qualification', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${errors.qualification ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-green-400'} bg-white`}
                  >
                    <option value="">Select</option>
                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">University</label>
                  <input type="text" value={form.university} onChange={e => set('university', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Year of Graduation</label>
                  <input type="text" value={form.yearOfGraduation} onChange={e => set('yearOfGraduation', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Gender</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 bg-white">
                    <option value="">Select</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Availability</label>
                  <select value={form.joiningAvailability} onChange={e => set('joiningAvailability', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 bg-white">
                    <option value="">Select</option>
                    {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Salary & Interview */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                Salary & Interview
              </h2>
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Current CTC</label>
                  <input type="text" value={form.currentCTC} onChange={e => set('currentCTC', e.target.value)} placeholder="e.g. 4.5 LPA" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Expected CTC</label>
                  <input type="text" value={form.expectedCTC} onChange={e => set('expectedCTC', e.target.value)} placeholder="e.g. 6 LPA" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Notice Period</label>
                  <select value={form.noticePeriod} onChange={e => set('noticePeriod', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 bg-white">
                    <option value="">Select</option>
                    {NOTICE_PERIODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Interview Date</label>
                  <input type="date" value={form.interviewDate} onChange={e => set('interviewDate', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400" />
                </div>
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 rotate-180" />
                Additional Information
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Notes</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400 resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-medium">Skills (comma separated)</label>
                  <input type="text" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="Java, SQL, Communication..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-400" />
                </div>
              </div>
            </section>

            {/* Resume Upload */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <File className="w-3.5 h-3.5" />
                Resume Upload
              </h2>
              <div>
                {form.resume ? (
                  <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-green-900 truncate">{form.resume.name}</p>
                      <p className="text-xs text-green-600">{(form.resume.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={() => set('resume', null)} className="text-green-600 hover:text-green-800 p-2">Remove</button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Click to upload resume</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX (Max 10MB)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={e => set('resume', e.target.files?.[0] || null)}
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 border-t border-slate-200 px-8 py-5 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Registering...' : 'Register Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
