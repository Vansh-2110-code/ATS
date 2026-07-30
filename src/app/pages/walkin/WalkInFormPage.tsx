import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Upload, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Mail, Phone, User, MapPin, Briefcase, Award } from 'lucide-react';
import api from '../../services/api';

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

const QUALIFICATIONS = [
  'B.E/B.Tech – Computer Science', 'B.E/B.Tech – IT',
  'B.E/B.Tech – Mechanical', 'B.E/B.Tech – Electrical', 'B.E/B.Tech – Civil',
  'BCA', 'B.Sc – Computer Science', 'B.Sc – IT', 'B.Sc – General',
  'B.Com', 'BBA', 'BA', 'B.Ed',
  'M.Tech', 'MCA', 'M.Sc – Computer Science', 'M.Sc – IT', 'MBA',
  'M.Com', 'MA',
  'Diploma – Computer Science', 'Diploma – Mechanical', 'Diploma – Electrical',
  'Other', 'Not Specified',
];

const EXPERIENCE_YEARS = Array.from({ length: 31 }, (_, i) => i.toString());
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const JOB_SOURCES = ['Direct/Walk-in', 'Naukri', 'LinkedIn', 'Shine', 'Internet', 'Friend', 'Referral', 'Other'];
const INTERVIEW_TYPES = ['Virtual', 'Walk-in Company', 'Walk-in WHM', 'Video Call', 'Phone Call', 'Face2Face'];
const NOTICE_PERIODS = ['Serving Notice period', '15 days or Less', '1 Month', '2 Months', '3 Months', 'N/A'];

export function WalkInFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const walkinUser = localStorage.getItem('walkin_user');
  const walkinToken = localStorage.getItem('walkin_token');

  useEffect(() => {
    if (!walkinToken || !walkinUser) {
      navigate('/walkin/login');
    }
  }, [navigate, walkinToken, walkinUser]);

  const [form, setForm] = useState({
    // Personal Details
    name: walkinUser ? JSON.parse(walkinUser).name : '',
    email: walkinUser ? JSON.parse(walkinUser).email : '',
    phone: walkinUser ? JSON.parse(walkinUser).phone : '',
    alternatePhone: '',
    jobOpeningSource: '',
    interviewType: '',
    dateOfBirth: '',
    gender: '',

    // Location
    currentState: '',
    currentCity: '',
    currentSubLocation: '',

    // Professional
    qualification: '',
    university: '',
    yearOfGraduation: '',
    experienceYears: '0',
    currentCompany: '',
    currentRole: '',

    // Salary
    currentCTC: '',
    expectedCTC: '',

    // Other
    skills: '' as string,
    noticePeriod: '',
    joiningAvailability: '',
    additionalInfo: '',

    // Resume
    resume: null as File | null,
  });

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, resume: 'Resume must be PDF or DOCX' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, resume: 'Resume must be under 10MB' }));
      return;
    }

    setForm(prev => ({ ...prev, resume: file }));
    if (errors.resume) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.resume;
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    if (!form.currentState) newErrors.currentState = 'State is required';
    if (!form.currentCity) newErrors.currentCity = 'City is required';
    if (!form.qualification) newErrors.qualification = 'Qualification is required';
    if (!form.resume) newErrors.resume = 'Resume is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const formData = new FormData();

      // Add all form fields
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('alternatePhone', form.alternatePhone);
      formData.append('jobOpeningSource', form.jobOpeningSource);
      formData.append('interviewType', form.interviewType);
      formData.append('dateOfBirth', form.dateOfBirth);
      formData.append('gender', form.gender);
      formData.append('currentState', form.currentState);
      formData.append('currentCity', form.currentCity);
      formData.append('currentSubLocation', form.currentSubLocation);
      formData.append('qualification', form.qualification);
      formData.append('university', form.university);
      formData.append('yearOfGraduation', form.yearOfGraduation);
      formData.append('experienceYears', form.experienceYears);
      formData.append('currentCompany', form.currentCompany);
      formData.append('currentRole', form.currentRole);
      formData.append('currentCTC', form.currentCTC);
      formData.append('expectedCTC', form.expectedCTC);
      formData.append('noticePeriod', form.noticePeriod);
      formData.append('joiningAvailability', form.joiningAvailability);
      formData.append('additionalInfo', form.additionalInfo);

      // Skills as array
      const skillsArray = form.skills.split(',').map(s => s.trim()).filter(s => s);
      formData.append('skills', JSON.stringify(skillsArray));

      // Resume file
      if (form.resume) {
        formData.append('resume', form.resume);
      }

      const response = await api.submitWalkInForm(formData);
      const referenceId = response.referenceId || response.walkinReferenceId;

      // Store reference ID and redirect to thank you page
      localStorage.setItem('walkin_reference_id', referenceId);
      navigate('/walkin/thank-you');
    } catch (err: any) {
      setError(err.message || 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cities = form.currentState ? (CITIES_BY_STATE[form.currentState] || []) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/walk-in')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Application Form</h1>
          <p className="text-slate-600">Complete this form to submit your walk-in application</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
          {/* Section 1: Personal Details */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Details
            </h2>
            <div className="space-y-4 grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`}
                  placeholder="Your full name"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                <select
                  value={form.gender}
                  onChange={e => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Select Gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Alternate Phone</label>
                <input
                  type="tel"
                  value={form.alternatePhone}
                  onChange={e => handleInputChange('alternatePhone', e.target.value)}
                  placeholder="Optional alternate number"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Opening Source</label>
                <select
                  value={form.jobOpeningSource}
                  onChange={e => handleInputChange('jobOpeningSource', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">Select Source</option>
                  {JOB_SOURCES.map(source => <option key={source} value={source}>{source}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Interview Type</label>
                <select
                  value={form.interviewType}
                  onChange={e => handleInputChange('interviewType', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">Select Interview Type</option>
                  {INTERVIEW_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Current Location
            </h2>
            <div className="space-y-4 grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">State *</label>
                <select
                  value={form.currentState}
                  onChange={e => handleInputChange('currentState', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${errors.currentState ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`}
                >
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.currentState && <p className="text-xs text-red-600 mt-1">{errors.currentState}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City *</label>
                <select
                  value={form.currentCity}
                  onChange={e => handleInputChange('currentCity', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${errors.currentCity ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`}
                >
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  {form.currentState && <option value="Other">Other</option>}
                </select>
                {errors.currentCity && <p className="text-xs text-red-600 mt-1">{errors.currentCity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sub-location</label>
                <input
                  type="text"
                  value={form.currentSubLocation}
                  onChange={e => handleInputChange('currentSubLocation', e.target.value)}
                  placeholder="e.g., Whitefield, Banjara Hills"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Education */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Education
            </h2>
            <div className="space-y-4 grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Qualification *</label>
                <select
                  value={form.qualification}
                  onChange={e => handleInputChange('qualification', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${errors.qualification ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`}
                >
                  <option value="">Select Qualification</option>
                  {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                {errors.qualification && <p className="text-xs text-red-600 mt-1">{errors.qualification}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">University/Institute</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={e => handleInputChange('university', e.target.value)}
                  placeholder="Name of university"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Year of Graduation</label>
                <input
                  type="number"
                  value={form.yearOfGraduation}
                  onChange={e => handleInputChange('yearOfGraduation', e.target.value)}
                  placeholder="YYYY"
                  min="1970"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Professional Experience */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Professional Details
            </h2>
            <div className="space-y-4 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
                <select
                  value={form.experienceYears}
                  onChange={e => handleInputChange('experienceYears', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                >
                  {EXPERIENCE_YEARS.map(y => <option key={y} value={y}>{y} years</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Company</label>
                <input
                  type="text"
                  value={form.currentCompany}
                  onChange={e => handleInputChange('currentCompany', e.target.value)}
                  placeholder="Company name"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Role</label>
                <input
                  type="text"
                  value={form.currentRole}
                  onChange={e => handleInputChange('currentRole', e.target.value)}
                  placeholder="Job title/designation"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notice Period</label>
                <select
                  value={form.noticePeriod}
                  onChange={e => handleInputChange('noticePeriod', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">Select Notice Period</option>
                  {NOTICE_PERIODS.map(period => <option key={period} value={period}>{period}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current CTC</label>
                <input
                  type="text"
                  value={form.currentCTC}
                  onChange={e => handleInputChange('currentCTC', e.target.value)}
                  placeholder="e.g., 3.5 LPA"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected CTC</label>
                <input
                  type="text"
                  value={form.expectedCTC}
                  onChange={e => handleInputChange('expectedCTC', e.target.value)}
                  placeholder="e.g., 4.5 LPA"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Joining Availability</label>
                <select
                  value={form.joiningAvailability}
                  onChange={e => handleInputChange('joiningAvailability', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">Select Joining Availability</option>
                  {NOTICE_PERIODS.map(period => <option key={`joining-${period}`} value={period}>{period}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Skills & Resume */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Skills & Documents</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills (comma-separated)</label>
                <textarea
                  value={form.skills}
                  onChange={e => handleInputChange('skills', e.target.value)}
                  placeholder="e.g., Java, Python, React, SQL"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Additional Information</label>
                <textarea
                  value={form.additionalInfo}
                  onChange={e => handleInputChange('additionalInfo', e.target.value)}
                  placeholder="Any additional information you'd like to share"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Resume (PDF or DOCX) *</label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${errors.resume ? 'border-red-300 bg-red-50' : form.resume ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-blue-400'}`}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="resume-input"
                  />
                  <label htmlFor="resume-input" className="cursor-pointer block">
                    {form.resume ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle2 className="w-6 h-6" />
                        <div>
                          <p className="font-medium">{form.resume.name}</p>
                          <p className="text-xs text-slate-600">{(form.resume.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-600">
                        <Upload className="w-6 h-6" />
                        <div>
                          <p className="font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs">PDF or DOCX, max 10MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                {errors.resume && <p className="text-xs text-red-600 mt-1">{errors.resume}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/walk-in')}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
