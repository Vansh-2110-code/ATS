import { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  Upload, FileText, CheckCircle2, XCircle, AlertCircle, Loader2,
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Star,
  Zap, TrendingUp, Target, ChevronRight, RotateCcw, Download,
  Link as LinkIcon, Award, BookOpen, Clock, Lightbulb, X,
  ThumbsUp, ThumbsDown, Info, BarChart2, FileSearch, Send, Sparkles,
  Trophy, TrendingDown, Cpu, Database
} from 'lucide-react';
import api from '../../services/api';
import { matchKeywords, generateSuggestions, weightedScore, getFitTier } from '../../utils/atsKeywordEngine';
import { matchSkills, parseSkillRequirements } from '../../utils/skillsMatchingEngine';
import { SkillsMatchDisplay } from '../../components/SkillsMatchDisplay';

/* ─── Types ─────────────────────────────────────────────── */
type ParseStep = { label: string; status: 'pending' | 'running' | 'done' | 'error' };

interface ScoreBreakdown {
  skillMatch:          number;
  experienceRelevance: number;
  roleAlignment:       number;
  educationRelevance:  number;
  resumeQuality:       number;
}

interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github?: string;
  summary: string;
  atsScore: number;
  fitTier?: 'Top Match' | 'Good Fit' | 'Low Fit';
  scoreBreakdown?: ScoreBreakdown;
  skills: { name: string; level: 'expert' | 'intermediate' | 'beginner' }[];
  experience: { title: string; company: string; duration: string; points: string[] }[];
  education: { degree: string; institution: string; year: string; gpa?: string }[];
  certifications: string[];
  keywords: { found: string[]; missing: string[] };
  suggestions: { type: 'error' | 'warning' | 'success'; text: string }[];
  structuredFeedback?: {
    strengths:   { type: 'success'; text: string }[];
    weaknesses:  { type: 'error' | 'warning'; text: string }[];
    suggestions: { type: 'warning' | 'success'; text: string }[];
  };
  wordCount: number;
  pageCount: number;
  format: string;
}

/* ─── Mock parsed data ───────────────────────────────────── */
const MOCK_RESULT: ParsedResume = {
  name: 'Priya Ramesh',
  email: 'priya.ramesh@email.com',
  phone: '+91 98765 43210',
  location: 'Bangalore, Karnataka',
  linkedin: 'linkedin.com/in/priyaramesh',
  summary:
    'Frontend-focused full-stack developer with 4+ years building scalable web apps. Passionate about clean code, performance, and great user experiences.',
  atsScore: 78,
  skills: [
    { name: 'React.js', level: 'expert' },
    { name: 'TypeScript', level: 'expert' },
    { name: 'Node.js', level: 'intermediate' },
    { name: 'GraphQL', level: 'intermediate' },
    { name: 'PostgreSQL', level: 'intermediate' },
    { name: 'Docker', level: 'beginner' },
    { name: 'AWS', level: 'beginner' },
    { name: 'Tailwind CSS', level: 'expert' },
    { name: 'Git', level: 'expert' },
    { name: 'Jest / Testing', level: 'intermediate' },
  ],
  experience: [
    {
      title: 'Senior Frontend Developer',
      company: 'Infosys Technologies',
      duration: 'Jan 2022 – Present (2.5 yrs)',
      points: [
        'Led migration of legacy Angular app to React, cutting load time by 40%.',
        'Mentored team of 4 junior devs, conducting weekly code reviews.',
        'Implemented CI/CD pipeline using GitHub Actions + Docker.',
      ],
    },
    {
      title: 'Frontend Developer',
      company: 'Wipro Digital',
      duration: 'Jun 2020 – Dec 2021 (1.5 yrs)',
      points: [
        'Built reusable component library with 50+ components.',
        'Integrated REST APIs and managed state with Redux Toolkit.',
      ],
    },
  ],
  education: [
    { degree: 'B.E. Computer Science', institution: 'RV College of Engineering, Bangalore', year: '2020', gpa: '8.4/10' },
  ],
  certifications: ['AWS Certified Cloud Practitioner', 'Meta Front-End Developer Certificate', 'Google UX Design Certificate'],
  keywords: {
    found: ['React', 'TypeScript', 'Node.js', 'REST API', 'CI/CD', 'Agile', 'Git', 'Docker', 'PostgreSQL', 'Testing'],
    missing: ['Kubernetes', 'Microservices', 'Redis', 'System Design', 'gRPC'],
  },
  suggestions: [
    { type: 'error', text: 'No quantified impact in education section — add GPA or projects.' },
    { type: 'warning', text: 'Summary is under 50 words — expand to 80–100 for better ATS scoring.' },
    { type: 'warning', text: 'Missing keywords: Kubernetes, Microservices, Redis — add if applicable.' },
    { type: 'warning', text: 'No GitHub/portfolio link found — recruiters look for it.' },
    { type: 'success', text: 'Contact details are complete and properly formatted.' },
    { type: 'success', text: 'Work experience has strong action verbs and quantified results.' },
    { type: 'success', text: 'Skills section is well-structured and relevant.' },
  ],
  wordCount: 612,
  pageCount: 2,
  format: 'PDF',
};

const PARSE_STEPS: ParseStep[] = [
  { label: 'Reading file structure', status: 'pending' },
  { label: 'Phrase-aware skill extraction', status: 'pending' },
  { label: 'Detecting contact & location', status: 'pending' },
  { label: 'AI section classifier running', status: 'pending' },
  { label: 'Parsing work experience', status: 'pending' },
  { label: 'Analysing education & certs', status: 'pending' },
  { label: 'Weighted 6-component scoring', status: 'pending' },
  { label: 'Generating AI feedback', status: 'pending' },
];

/* ─── Fit Tier Badge ─────────────────────────────────────── */
function FitTierBadge({ tier }: { tier: 'Top Match' | 'Good Fit' | 'Low Fit' }) {
  const cfg = {
    'Top Match': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: Trophy },
    'Good Fit':  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', icon: ThumbsUp },
    'Low Fit':   { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    icon: TrendingDown },
  }[tier];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${cfg.bg} ${cfg.text} ${cfg.border}`} style={{ fontWeight: 700 }}>
      <Icon className="w-3.5 h-3.5" />
      {tier}
    </span>
  );
}

/* ─── Score Ring ─────────────────────────────────────────── */
function ScoreRing({ score, tier }: { score: number; tier?: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 78 ? '#f59e0b' : score >= 52 ? '#22c55e' : '#ef4444';
  const label = score >= 78 ? 'Top Match' : score >= 52 ? 'Good Fit' : 'Low Fit';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color }} className="leading-none">{score}</span>
          <span className="text-slate-400 text-xs mt-0.5">/ 100</span>
        </div>
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.78rem', color }}>{label}</span>
      <span className="text-slate-400 text-xs">AI ATS Score</span>
    </div>
  );
}

/* ─── Skill Badge ────────────────────────────────────────── */
function SkillBadge({ name, level }: { name: string; level: string }) {
  const colors = {
    expert: 'bg-green-100 text-green-700 border border-green-200',
    intermediate: 'bg-violet-100 text-violet-700 border border-violet-200',
    beginner: 'bg-slate-100 text-slate-600 border border-slate-200',
  };
  const dots = { expert: 3, intermediate: 2, beginner: 1 };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${colors[level as keyof typeof colors]}`} style={{ fontWeight: 500 }}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map(d => (
          <span key={d} className={`w-1 h-1 rounded-full ${d <= dots[level as keyof typeof dots] ? 'bg-current' : 'bg-current opacity-20'}`} />
        ))}
      </span>
      {name}
    </span>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export function ResumeScanPage() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<ParseStep[]>(PARSE_STEPS.map(s => ({ ...s })));
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParsedResume | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'keywords' | 'suggestions' | 'skills'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  // Skills matching state
  const [requiredSkillsInput, setRequiredSkillsInput] = useState('');
  const [skillsMatchResult, setSkillsMatchResult] = useState<any>(null);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);


  /* parse via API */
  const startParsing = useCallback(async (f: File) => {
    // Clear any existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setFile(f);
    setParsing(true);
    setResult(null);
    const fresh = PARSE_STEPS.map(s => ({ ...s, status: 'pending' as const }));
    setSteps(fresh);

    // Animate steps while API processes
    fresh.forEach((_, i) => {
      const t = window.setTimeout(() => {
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'running' } :
          idx < i ? { ...s, status: 'done' } : s
        ));
      }, i * 400);
      timeoutsRef.current.push(t);
    });

    try {
      const formData = new FormData();
      formData.append('resume', f);
      if (jobDesc) formData.append('jobDescription', jobDesc);
      
      // Add a safety timeout for the API call
      const scanPromise = api.scanResume(formData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scanning process timed out. Please try a smaller file.')), 45000)
      );

      let data = await Promise.race([scanPromise, timeoutPromise]) as any;
      const parsedResult: ParsedResume = data.result || data || MOCK_RESULT;

      // Stop all animations
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      // Client-side enhancement if needed
      if (jobDesc && parsedResult.name && !parsedResult.structuredFeedback) {
        try {
          const resumeText = [
            parsedResult.name,
            parsedResult.summary,
            parsedResult.skills?.map(s => s.name).join(' ') || '',
            parsedResult.experience?.map(e => `${e.title} ${e.company} ${e.points?.join(' ') || ''}`).join(' ') || '',
            parsedResult.education?.map(e => `${e.degree} ${e.institution}`).join(' ') || '',
            parsedResult.certifications?.join(' ') || '',
          ].join(' ');

          const enhancedKeywords = matchKeywords(resumeText, jobDesc);
          parsedResult.keywords = {
            found:   enhancedKeywords.found.map(kw => kw.original),
            missing: enhancedKeywords.missing.map(kw => kw.original),
          };

          const total = enhancedKeywords.found.length + enhancedKeywords.missing.length;
          const skillPct = total > 0 ? Math.round((enhancedKeywords.found.length / total) * 100) : 40;
          const expScore = Math.min(100, (parsedResult.experience?.length || 0) * 22);
          const eduScore = (parsedResult.education?.length || 0) > 0 ? 75 : 30;
          const quality = [parsedResult.email, parsedResult.phone, parsedResult.location].filter(Boolean).length >= 2 ? 80 : 50;
          
          const bd: ScoreBreakdown = {
            skillMatch: skillPct,
            experienceRelevance: expScore,
            roleAlignment: 50,
            educationRelevance: eduScore,
            resumeQuality: quality,
          };
          parsedResult.scoreBreakdown = bd;
          parsedResult.atsScore = weightedScore(bd);
          parsedResult.fitTier = getFitTier(parsedResult.atsScore);
          parsedResult.suggestions = generateSuggestions(enhancedKeywords, resumeText, jobDesc);
        } catch (e) {
          console.warn('Frontend enhancement failed, using raw backend result', e);
        }
      }

      if (!parsedResult.fitTier) {
        parsedResult.fitTier = getFitTier(parsedResult.atsScore || 0);
      }

      setSteps(prev => prev.map(s => ({ ...s, status: 'done' as const })));
      setResult(parsedResult);
    } catch (err: any) {
      console.error('Resume scan failed:', err);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      
      setSteps(prev => {
        const next = [...prev];
        const runningIdx = next.findIndex(s => s.status === 'running');
        if (runningIdx !== -1) {
          next[runningIdx] = { ...next[runningIdx], status: 'error' };
        } else {
          // If none are running, mark the last one or the first pending one
          const pendingIdx = next.findIndex(s => s.status === 'pending');
          if (pendingIdx !== -1) next[pendingIdx] = { ...next[pendingIdx], status: 'error' };
        }
        return next;
      });
      
      // Optionally show an error alert or feedback
    } finally {
      setParsing(false);
    }
  }, [jobDesc]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) startParsing(f);
  }, [startParsing]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) startParsing(f);
  };

  const reset = () => {
    setFile(null); setParsing(false); setResult(null);
    setSteps(PARSE_STEPS.map(s => ({ ...s, status: 'pending' })));
    setActiveTab('overview');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendEmail = async () => {
    if (!result || !emailTemplate || !emailSubject || !emailBody) return;
    setEmailSending(true);
    try {
      // Send email with resume data
      const res = await api.sendCandidateEmail({
        candidateName: result.name,
        templateType: emailTemplate,
        customSubject: emailSubject,
        customBody: emailBody,
      });
      setEmailResult({ ok: true, msg: `Email sent to ${result.email}` });
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailTemplate('');
        setEmailSubject('');
        setEmailBody('');
        setEmailResult(null);
      }, 1500);
    } catch (err: any) {
      setEmailResult({ ok: false, msg: err.message || 'Failed to send email' });
    } finally {
      setEmailSending(false);
    }
  };

  // Handle skills matching
  const handleEvaluateSkills = () => {
    if (!result || !requiredSkillsInput.trim()) {
      return;
    }

    try {
      // Parse required skills from textarea input (supports "React (expert)", "Node - intermediate", etc.)
      const parsedRequired = parseSkillRequirements(requiredSkillsInput);

      // Convert result.skills to the format expected by matchSkills
      const candidateSkills = result.skills.map(s => ({
        name: s.name,
        level: s.level
      }));

      // Calculate match result
      const matchResult = matchSkills(parsedRequired, candidateSkills);

      setSkillsMatchResult(matchResult);
      setActiveTab('skills');
    } catch (err) {
      console.error('Skills matching error:', err);
      setSkillsMatchResult(null);
    }
  };

  const completedSteps = steps.filter(s => s.status === 'done').length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  const suggestionIcon = (type: string) =>
    type === 'error' ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> :
    type === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> :
    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />;

  const suggestionBg = (type: string) =>
    type === 'error' ? 'bg-red-50 border-red-100' :
    type === 'warning' ? 'bg-amber-50 border-amber-100' :
    'bg-emerald-50 border-emerald-100';

  /* ── Render ── */
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>
            Resume ATS Scanner
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Upload a resume to extract information and calculate ATS compatibility score
          </p>
        </div>
        {(file || result) && (
          <div className="flex items-center gap-2.5">
            {result && (
              <Link
                to="/recruiter/ats-database"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-sm"
              >
                <Database className="w-4 h-4" />
                View in ATS Database
              </Link>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Scan Another
            </button>
          </div>
        )}
      </div>

      {/* ── Upload Zone (idle) ── */}
      {!file && !parsing && !result && (
        <div className="space-y-4">
          {/* JD Toggle */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-green-700" style={{ fontWeight: 500 }}>
                Boost accuracy with a Job Description
              </p>
              <p className="text-xs text-green-500 mt-0.5">
                Paste a JD to get keyword match analysis specific to the role.
              </p>
            </div>
            <button
              onClick={() => setShowJD(!showJD)}
              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
              style={{ fontWeight: 500 }}
            >
              {showJD ? 'Hide JD' : 'Add JD'}
            </button>
          </div>

          {showJD && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 500 }}>
                Job Description (optional)
              </label>
              <textarea
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                rows={4}
                placeholder="Paste the job description here to enable keyword matching..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-green-400 transition-colors resize-none"
              />
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 transition-all ${
              dragOver
                ? 'border-green-400 bg-green-50'
                : 'border-slate-200 bg-white hover:border-green-300 hover:bg-slate-50'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? 'bg-green-100' : 'bg-slate-100'}`}>
              <Upload className={`w-8 h-8 transition-colors ${dragOver ? 'text-green-600' : 'text-slate-400'}`} />
            </div>
            <div className="text-center">
              <p className="text-slate-700" style={{ fontWeight: 600, fontSize: '1rem' }}>
                {dragOver ? 'Drop the resume here' : 'Drag & drop resume to scan'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                or <span className="text-green-600 underline">browse files</span> from your computer
              </p>
            </div>
            <p className="text-slate-400 text-xs">PDF, DOCX (Max 10MB)</p>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFile} className="hidden" />
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: User, label: 'Contact Extraction', color: 'text-green-600 bg-green-50' },
              { icon: Zap, label: 'Skills Detection', color: 'text-violet-600 bg-violet-50' },
              { icon: Target, label: 'ATS Score', color: 'text-amber-600 bg-amber-50' },
              { icon: Lightbulb, label: 'Improvement Tips', color: 'text-emerald-600 bg-emerald-50' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-2.5 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.split(' ')[1]}`}>
                  <Icon className={`w-4 h-4 ${color.split(' ')[0]}`} />
                </div>
                <span className="text-slate-700 text-xs" style={{ fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Parsing Progress ── */}
      {(parsing || (file && !result)) && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* File info bar */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-700 text-sm truncate" style={{ fontWeight: 500 }}>{file?.name}</p>
              <p className="text-slate-400 text-xs">{file ? (file.size / 1024).toFixed(1) + ' KB' : ''}</p>
            </div>
            {parsing && <Loader2 className="w-4 h-4 text-green-500 animate-spin flex-shrink-0" />}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm" style={{ fontWeight: 500 }}>Parsing resume...</span>
              <span className="text-green-600 text-sm" style={{ fontWeight: 600 }}>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  step.status === 'running' ? 'bg-green-50 border border-green-100' :
                  step.status === 'done' ? 'bg-emerald-50 border border-emerald-100' :
                  'bg-slate-50 border border-slate-100'
                }`}
              >
                {step.status === 'running' ? (
                  <Loader2 className="w-4 h-4 text-green-500 animate-spin flex-shrink-0" />
                ) : step.status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
                )}
                <span className={`text-xs ${
                  step.status === 'running' ? 'text-green-700' :
                  step.status === 'done' ? 'text-emerald-700' : 'text-slate-400'
                }`} style={{ fontWeight: step.status !== 'pending' ? 500 : 400 }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-5">
          {/* Score + Meta Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center gap-3">
              <ScoreRing score={result.atsScore} tier={result.fitTier} />
              {result.fitTier && <FitTierBadge tier={result.fitTier} />}
              <div className="flex gap-3 mt-1">
                <div className="text-center">
                  <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>{result.keywords.found.length}</p>
                  <p className="text-slate-400 text-xs">Skills Found</p>
                </div>
                <div className="w-px bg-slate-100" />
                <div className="text-center">
                  <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>{result.keywords.missing.length}</p>
                  <p className="text-slate-400 text-xs">Missing</p>
                </div>
              </div>
            </div>

            {/* Candidate Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {result.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-slate-800" style={{ fontWeight: 700, fontSize: '1rem' }}>{result.name}</p>
                  <p className="text-slate-500 text-xs">{result.summary.slice(0, 80)}…</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { icon: Mail, value: result.email },
                  { icon: Phone, value: result.phone },
                  { icon: MapPin, value: result.location },
                  { icon: LinkIcon, value: result.linkedin },
                ].map(({ icon: Icon, value }) => (
                  <div key={value} className="flex items-center gap-2 text-xs text-slate-600">
                    <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-50">
                {[
                  { icon: FileText, label: `${result.pageCount} page${result.pageCount > 1 ? 's' : ''}` },
                  { icon: BookOpen, label: `${result.wordCount} words` },
                  { icon: Clock, label: result.format },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />{label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Skills Detected', value: result.skills.length, color: 'text-green-600', bg: 'bg-green-50', icon: Zap },
              { label: 'Work Experiences', value: result.experience.length, color: 'text-violet-600', bg: 'bg-violet-50', icon: Briefcase },
              { label: 'Certifications', value: result.certifications.length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Award },
              { label: 'Improvements', value: result.suggestions.filter(s => s.type !== 'success').length, color: 'text-red-500', bg: 'bg-red-50', icon: AlertCircle },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex items-center gap-3">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className={`${color}`} style={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1 }}>{value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {([
                { id: 'overview', label: 'Overview', icon: BarChart2 },
                { id: 'details', label: 'Details', icon: FileSearch },
                { id: 'keywords', label: 'Keywords', icon: Target },
                { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
                { id: 'skills', label: 'Skills Match', icon: Sparkles },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === id
                      ? 'border-green-600 text-green-600 bg-green-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  style={{ fontWeight: activeTab === id ? 600 : 400 }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === 'suggestions' && (
                    <span className="ml-1 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                      {result.suggestions.filter(s => s.type !== 'success').length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              {/* ── Overview Tab ── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div>
                    <h3 className="text-slate-700 text-sm mb-2 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <User className="w-4 h-4 text-slate-400" /> Professional Summary
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-xl px-4 py-3">
                      {result.summary}
                    </p>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-slate-700 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <Zap className="w-4 h-4 text-slate-400" /> Skills Detected
                      <span className="ml-auto text-xs text-slate-400 flex items-center gap-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Expert</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Intermediate</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Beginner</span>
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.skills.map(s => <SkillBadge key={s.name} {...s} />)}
                    </div>
                  </div>

                  {/* AI Weighted Score Breakdown */}
                  <div>
                    <h3 className="text-slate-700 text-sm mb-1 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <Cpu className="w-4 h-4 text-slate-400" /> AI Score Breakdown
                      <span className="ml-auto text-xs text-slate-400 font-normal">Weighted Model</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">Skill Match 50% · Experience 15% · Role Fit 15% · Education 10% · Quality 10%</p>
                    <div className="space-y-2.5">
                      {(() => {
                        const bd = result.scoreBreakdown;
                        const totalKw = result.keywords.found.length + result.keywords.missing.length;
                        const skillPct = bd?.skillMatch ?? (totalKw > 0 ? Math.round((result.keywords.found.length / totalKw) * 100) : 50);
                        const rows = [
                          { label: 'Skill Match (50%)',      score: skillPct,                                   color: 'bg-green-500',   weight: 0.50 },
                          { label: 'Experience (15%)',       score: bd?.experienceRelevance ?? Math.min(100, result.experience.length * 30), color: 'bg-violet-500',  weight: 0.15 },
                          { label: 'Role Alignment (15%)',   score: bd?.roleAlignment       ?? 50,              color: 'bg-blue-500',    weight: 0.15 },
                          { label: 'Education (10%)',        score: bd?.educationRelevance  ?? Math.min(100, result.education.length * 50), color: 'bg-amber-500',   weight: 0.10 },
                          { label: 'Resume Quality (10%)',   score: bd?.resumeQuality       ?? Math.min(100, result.suggestions.filter(s => s.type === 'success').length * 25), color: 'bg-slate-400',   weight: 0.10 },
                        ];
                        return rows;
                      })().map(({ label, score, color }) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-44 flex-shrink-0">{label}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-xs text-slate-600 w-8 text-right" style={{ fontWeight: 600 }}>{score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Details Tab ── */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Experience */}
                  <div>
                    <h3 className="text-slate-700 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <Briefcase className="w-4 h-4 text-slate-400" /> Work Experience
                    </h3>
                    <div className="space-y-4">
                      {result.experience.map((exp, i) => (
                        <div key={i} className="relative pl-5 border-l-2 border-green-100">
                          <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                          <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <p className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>{exp.title}</p>
                                <p className="text-green-600 text-xs mt-0.5" style={{ fontWeight: 500 }}>{exp.company}</p>
                              </div>
                              <span className="text-slate-400 text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                                {exp.duration}
                              </span>
                            </div>
                            <ul className="mt-3 space-y-1.5">
                              {exp.points.map((pt, j) => (
                                <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                                  <ChevronRight className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                  {pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h3 className="text-slate-700 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <GraduationCap className="w-4 h-4 text-slate-400" /> Education
                    </h3>
                    {result.education.map((edu, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-4 flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>{edu.degree}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{edu.institution}</p>
                          {edu.gpa && <p className="text-emerald-600 text-xs mt-1" style={{ fontWeight: 500 }}>GPA: {edu.gpa}</p>}
                        </div>
                        <span className="text-slate-400 text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-md">{edu.year}</span>
                      </div>
                    ))}
                  </div>

                  {/* Certifications */}
                  <div>
                    <h3 className="text-slate-700 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <Award className="w-4 h-4 text-slate-400" /> Certifications
                    </h3>
                    <div className="space-y-2">
                      {result.certifications.map((cert, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-lg">
                          <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span className="text-slate-700 text-sm">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Keywords Tab ── */}
              {activeTab === 'keywords' && (
                <div className="space-y-5">
                  {/* Match rate with quality indicator */}
                  <div className="bg-white border border-slate-100 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-3" style={{ fontWeight: 500 }}>
                      Keyword Match Quality
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.round((result.keywords.found.length / (result.keywords.found.length + result.keywords.missing.length)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-emerald-600 text-sm" style={{ fontWeight: 700 }}>
                        {Math.round((result.keywords.found.length / (result.keywords.found.length + result.keywords.missing.length)) * 100)}%
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      {result.keywords.found.length} of {result.keywords.found.length + result.keywords.missing.length} target keywords matched
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Found Keywords */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <h3 className="text-emerald-700 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                        <CheckCircle2 className="w-4 h-4" />
                        Matched ({result.keywords.found.length})
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.keywords.found.length > 0 ? (
                          result.keywords.found.map(kw => (
                            <div key={kw} className="flex items-center justify-between p-2 bg-white border border-emerald-200 rounded-lg">
                              <span className="text-xs text-emerald-700" style={{ fontWeight: 500 }}>{kw}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full" style={{ fontWeight: 500 }}>Match</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-emerald-600 italic">No keywords matched</p>
                        )}
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <h3 className="text-red-600 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                        <AlertCircle className="w-4 h-4" />
                        Missing ({result.keywords.missing.length})
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.keywords.missing.length > 0 ? (
                          result.keywords.missing.slice(0, 8).map(kw => (
                            <div key={kw} className="flex items-center justify-between p-2 bg-white border border-red-200 rounded-lg">
                              <span className="text-xs text-red-700" style={{ fontWeight: 500 }}>{kw}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full" style={{ fontWeight: 500 }}>Missing</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-red-600 italic">All keywords matched!</p>
                        )}
                        {result.keywords.missing.length > 8 && (
                          <p className="text-xs text-slate-500 italic">+{result.keywords.missing.length - 8} more keywords</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Keyword Insights */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h3 className="text-blue-700 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <Lightbulb className="w-4 h-4" />
                      Insights
                    </h3>
                    <ul className="space-y-2 text-xs text-blue-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>This resume has <strong>{result.keywords.found.length}</strong> matching keywords from the job description</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Missing <strong>{result.keywords.missing.length}</strong> keywords — consider adding these skills if applicable</span>
                      </li>
                      {result.keywords.found.length > 0 && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>Keywords are matched using advanced synonym detection and fuzzy matching</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {jobDesc && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <p className="text-green-700 text-sm" style={{ fontWeight: 500 }}>
                        ✓ Smart analysis enabled — using advanced keyword detection with synonym matching and fuzzy matching
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Suggestions Tab — Tri-Panel ── */}
              {activeTab === 'suggestions' && (
                <div className="space-y-5">
                  {/* Strengths */}
                  <div>
                    <h3 className="text-emerald-700 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <ThumbsUp className="w-4 h-4" /> Strengths
                    </h3>
                    {(result.structuredFeedback?.strengths ?? result.suggestions.filter(s => s.type === 'success')).length > 0 ? (
                      <div className="space-y-2">
                        {(result.structuredFeedback?.strengths ?? result.suggestions.filter(s => s.type === 'success')).map((s, i) => (
                          <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border bg-emerald-50 border-emerald-100">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-700">{s.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No specific strengths identified — add a JD for richer analysis</p>
                    )}
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <h3 className="text-red-600 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <ThumbsDown className="w-4 h-4" /> Weaknesses
                    </h3>
                    {(result.structuredFeedback?.weaknesses ?? result.suggestions.filter(s => s.type === 'error')).length > 0 ? (
                      <div className="space-y-2">
                        {(result.structuredFeedback?.weaknesses ?? result.suggestions.filter(s => s.type === 'error')).map((s, i) => (
                          <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${suggestionBg(s.type)}`}>
                            {suggestionIcon(s.type)}
                            <p className={`text-sm ${s.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>{s.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No critical weaknesses detected</p>
                    )}
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h3 className="text-amber-700 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <Lightbulb className="w-4 h-4" /> Suggestions
                    </h3>
                    {(result.structuredFeedback?.suggestions ?? result.suggestions.filter(s => s.type === 'warning')).length > 0 ? (
                      <div className="space-y-2">
                        {(result.structuredFeedback?.suggestions ?? result.suggestions.filter(s => s.type === 'warning')).map((s, i) => (
                          <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border bg-amber-50 border-amber-100">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-700">{s.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No additional suggestions</p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Skills Match Tab ── */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h3 className="text-blue-700 text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <Sparkles className="w-4 h-4" />
                      Skill Requirement Matcher
                    </h3>
                    <p className="text-blue-700 text-xs mb-4">
                      Enter required skills in any of these formats: "React (expert)", "Node.js - intermediate", "Python*" (asterisk = required)
                    </p>
                    <textarea
                      value={requiredSkillsInput}
                      onChange={(e) => setRequiredSkillsInput(e.target.value)}
                      placeholder={`React (expert)
Node.js (intermediate)
Python (beginner)
Docker*
AWS
TypeScript (expert)`}
                      rows={6}
                      className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 transition-colors resize-none font-mono bg-white"
                    />
                    <button
                      onClick={handleEvaluateSkills}
                      disabled={!requiredSkillsInput.trim()}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      Evaluate Skills Match
                    </button>
                  </div>

                  {skillsMatchResult ? (
                    <div className="bg-white border border-slate-100 rounded-xl p-6">
                      <SkillsMatchDisplay result={skillsMatchResult} showDetails={true} />
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center">
                      <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">
                        Enter required skills above and click "Evaluate Skills Match" to see detailed matching analysis
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <RotateCcw className="w-4 h-4" /> Scan Another
            </button>
            <button
              onClick={() => {
                if (!result) return;
                const text = `ATS Resume Report\n\nName: ${result.name}\nEmail: ${result.email}\nPhone: ${result.phone}\nATS Score: ${result.atsScore}%\n\nSkills: ${result.skills.map(s => s.name).join(', ')}\n\nSuggestions:\n${result.suggestions.map(s => `- [${s.type}] ${s.text}`).join('\n')}`;
                const blob = new Blob([text], { type: 'text/plain' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${result.name.replace(/\s+/g, '_')}_ATS_Report.txt`; a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Send className="w-4 h-4" /> Send Mail
            </button>
          </div>

          {/* Email Modal */}
          {showEmailModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg text-slate-800" style={{ fontWeight: 700 }}>Send Email to {result?.name}</h3>
                  <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Email to display */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 truncate">{result?.email}</span>
                  </div>

                  {/* Template selection */}
                  <div>
                    <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 500 }}>Email Template</label>
                    <select
                      value={emailTemplate}
                      onChange={(e) => {
                        setEmailTemplate(e.target.value);
                        setEmailSubject('');
                        setEmailBody('');
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-400"
                    >
                      <option value="">Select a template...</option>
                      <option value="interview_call_letter">Interview Call Letter (1st Round)</option>
                      <option value="second_round_call_letter">Second Round Call Letter</option>
                      <option value="final_round_call_letter">Final Round Call Letter</option>
                      <option value="selection_mail">Selection / Offer Mail</option>
                      <option value="offer_letter">Initial Job Offer Letter</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 500 }}>Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-400"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 500 }}>Message Body</label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email message body..."
                      rows={6}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-400 resize-none"
                    />
                  </div>

                  {/* Result message */}
                  {emailResult && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${emailResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {emailResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {emailResult.msg}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowEmailModal(false)}
                      disabled={emailSending}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      style={{ fontWeight: 500 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={!emailTemplate || !emailSubject || !emailBody || emailSending}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      style={{ fontWeight: 500 }}
                    >
                      {emailSending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Send Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
