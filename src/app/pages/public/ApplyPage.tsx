import { useState, useEffect } from 'react';
import { 
  CheckCircle2, Upload, User, Mail, Phone, Briefcase, Code, FileText, Loader2,
  MapPin, Building2, Calendar, Search, ChevronLeft, GraduationCap, Clock
} from 'lucide-react';
import api from '../../services/api';

const experienceLevels = ['Fresher (0 years)', '1 year', '2 years', '3 years', '4 years', '5 years', '6-8 years', '9-12 years', '12+ years'];

export function ApplyPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Application State
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    skills: '',
    resume: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await api.getPublicJobs();
        setJobs(data.jobs || []);
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email address';
    if (!form.phone.match(/^[0-9+\- ]{7,15}$/)) e.phone = 'Enter a valid phone number';
    if (!form.experience) e.experience = 'Please select your experience';
    if (!form.skills.trim()) e.skills = 'Please list at least one skill';
    if (!form.resume) e.resume = 'Please upload your resume';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('experience', form.experience);
      fd.append('skills', form.skills);
      
      // Link to selected job
      if (selectedJob?.jrNumber) {
        fd.append('jrNumber', selectedJob.jrNumber);
      }

      if (form.resume) fd.append('resume', form.resume);
      
      await api.applyPublic(fd);
      setSubmitted(true);
    } catch (err) {
      console.error('Application submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(f => ({ ...f, resume: file }));
      setFileName(file.name);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setSelectedJob(null);
    setForm({ fullName: '', email: '', phone: '', experience: '', skills: '', resume: null });
    setFileName('');
  };

  const filteredJobs = jobs.filter(j => 
    j.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── 1. Submitted View ── */
  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <h2 className="text-slate-800 mb-3 text-2xl font-bold">Application Submitted!</h2>
          <p className="text-slate-500 mb-4">
            Thank you, <strong className="text-slate-700">{form.fullName}</strong>! Your application for  
            <strong className="text-slate-700"> {selectedJob?.jobTitle || 'the position'}</strong> at 
            <strong className="text-slate-700"> {selectedJob?.companyName || 'White Horse Manpower'}</strong> has been successfully received.
          </p>
          <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-green-700 text-sm font-semibold mb-2">What happens next?</p>
            <ul className="space-y-1.5 text-sm text-green-600">
              <li>• A recruiter will review your profile.</li>
              <li>• You'll receive a call or email outlining the next round.</li>
              <li>• Match updates will be shared shortly!</li>
            </ul>
          </div>
          <button
            onClick={resetForm}
            className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
          >
            Explore More Jobs
          </button>
        </div>
      </div>
    );
  }

  /* ── 2. Application Form View (for selected job) ── */
  if (selectedJob) {
    return (
      <div className="bg-slate-50 py-12 px-4 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => setSelectedJob(null)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Jobs
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6 pb-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Apply for {selectedJob.jobTitle}</h2>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Building2 className="w-4 h-4"/> {selectedJob.companyName}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {selectedJob.location || 'Anywhere'}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Doe" className={`w-full pl-9 pr-4 py-3 rounded-lg border text-sm focus:outline-none transition ${errors.fullName ? 'border-red-300' : 'border-slate-200 focus:border-green-500'}`} />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className={`w-full pl-9 pr-4 py-3 rounded-lg border text-sm focus:outline-none transition ${errors.email ? 'border-red-300' : 'border-slate-200 focus:border-green-500'}`} />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0000" className={`w-full pl-9 pr-4 py-3 rounded-lg border text-sm focus:outline-none transition ${errors.phone ? 'border-red-300' : 'border-slate-200 focus:border-green-500'}`} />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <select value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} className={`w-full pl-9 pr-4 py-3 rounded-lg border text-sm focus:outline-none transition appearance-none bg-white ${errors.experience ? 'border-red-300' : 'border-slate-200 focus:border-green-500'}`}>
                    <option value="">Select experience level</option>
                    {experienceLevels.map((l, i) => <option key={i} value={l}>{l}</option>)}
                  </select>
                </div>
                {errors.experience && <p className="mt-1 text-xs text-red-500">{errors.experience}</p>}
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Code className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input type="text" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="e.g. React, Node.js, Sales, Marketing..." className={`w-full pl-9 pr-4 py-3 rounded-lg border text-sm focus:outline-none transition ${errors.skills ? 'border-red-300' : 'border-slate-200 focus:border-green-500'}`} />
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Resume / CV <span className="text-red-500">*</span></label>
                <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl py-8 px-4 cursor-pointer transition ${errors.resume ? 'border-red-300 bg-red-50' : fileName ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50'}`}>
                  {fileName ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                      <p className="text-green-700 text-sm font-medium">{fileName}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm font-medium">Click to upload resume</p>
                      <p className="text-slate-400 text-xs mt-1">PDF or DOC up to 5MB</p>
                    </>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <button type="submit" disabled={submitting} className="w-full py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 font-semibold">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── 3. Jobs Listing View ── */
  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Career Opportunities</h1>
          <p className="text-lg text-slate-500">Discover your next role. We are actively hiring for the positions below.</p>
          
          <div className="relative mt-6 max-w-md mx-auto">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Job Title or Company..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-full border border-slate-200 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition shadow-sm text-sm"
            />
          </div>
        </div>

        {/* Job List */}
        {loadingJobs ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-green-500" />
            <p>Loading open positions...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No open positions found</h3>
            <p className="text-slate-500">Check back later or try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <div key={job._id} className="bg-white border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all rounded-2xl p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 leading-snug">{job.jobTitle}</h3>
                    <p className="text-sm font-medium text-green-600 mt-1">{job.companyName}</p>
                  </div>
                  {job.priority === 'Urgent' && (
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100">
                      Urgent
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {job.location || 'Remote / Flexible'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                    {job.experience ? `${job.experience} Experience` : 'Experience Flexible'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                    {job.department || 'General'} Department
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <User className="w-4 h-4 mr-2 text-slate-400" />
                    {job.positions || 1} Openings
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 mt-auto">
                  <button 
                    onClick={() => setSelectedJob(job)}
                    className="w-full py-2.5 bg-green-600 text-white font-medium text-sm rounded-xl hover:bg-green-700 transition text-center"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
