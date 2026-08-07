import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Phone, Users, Calendar, FileText, TrendingUp, Clock,
  ArrowRight, AlertCircle, CheckCircle2, ScanLine, UserPlus,
  ListChecks, CalendarCheck, ChevronDown, Briefcase, UserCheck,
  X, PhoneMissed, PhoneOff, PhoneCall, ClipboardList,
  UserX, Building2, BadgeCheck, Clipboard, Loader2, Mail, CheckSquare,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getGreeting } from '../../utils/greetingUtils';
import { SlicerFilteredDataView } from '../../components/SlicerFilteredDataView';
import { dedupeCompanies } from '../../utils/companyUtils';
import { CANDIDATE_STATUS_OPTIONS } from '../../utils/candidateStatusUtils';

// ─── Date Filter ────────────────────────────────────────────
type DateRange = 'Day' | 'Week' | 'Quarter' | 'Year' | 'All' | 'Custom';

// ─── Status Cards Icons ───────────────────────────────────────
const STATUS_ICON_MAP: Record<string, any> = {
  'Eligible Candidates': UserCheck,
  'Wrong Number': PhoneOff,
  'Did Not Pick': PhoneMissed,
  'Call Back': PhoneCall,
  'HR Shortlist': ClipboardList,
  'Written Test': FileText,
  'Operations Round': Building2,
  'Selected': BadgeCheck,
  'Documentation': Clipboard,
  'Yet To Join': UserX,
  'Joined': CheckCircle2,
  'New': UserPlus,
  'Contacted': Phone,
  'Interested': CheckCircle2,
  'Interview Scheduled': Calendar,
  'Rejected': X,
};

const STATUS_COLOR_LIST = ['emerald','red','orange','amber','violet','indigo','cyan','teal','sky','pink','green'];

const STATUS_COLOR_MAP: Record<string, { card: string; icon: string; badge: string }> = {
  emerald: { card: 'border-emerald-100 bg-emerald-50/60 hover:bg-emerald-50',     icon: 'bg-emerald-100 text-emerald-600', badge: 'text-emerald-700' },
  red:     { card: 'border-red-100     bg-red-50/60     hover:bg-red-50',          icon: 'bg-red-100     text-red-500',     badge: 'text-red-600' },
  orange:  { card: 'border-orange-100  bg-orange-50/60  hover:bg-orange-50',       icon: 'bg-orange-100  text-orange-600',  badge: 'text-orange-700' },
  amber:   { card: 'border-amber-100   bg-amber-50/60   hover:bg-amber-50',        icon: 'bg-amber-100   text-amber-600',   badge: 'text-amber-700' },
  violet:  { card: 'border-violet-100  bg-violet-50/60  hover:bg-violet-50',       icon: 'bg-violet-100  text-violet-600',  badge: 'text-violet-700' },
  indigo:  { card: 'border-indigo-100  bg-indigo-50/60  hover:bg-indigo-50',       icon: 'bg-indigo-100  text-indigo-600',  badge: 'text-indigo-700' },
  cyan:    { card: 'border-cyan-100    bg-cyan-50/60    hover:bg-cyan-50',         icon: 'bg-cyan-100    text-cyan-600',    badge: 'text-cyan-700' },
  teal:    { card: 'border-teal-100    bg-teal-50/60    hover:bg-teal-50',         icon: 'bg-teal-100    text-teal-600',    badge: 'text-teal-700' },
  sky:     { card: 'border-sky-100     bg-sky-50/60     hover:bg-sky-50',          icon: 'bg-sky-100     text-sky-600',     badge: 'text-sky-700' },
  pink:    { card: 'border-pink-100    bg-pink-50/60    hover:bg-pink-50',         icon: 'bg-pink-100    text-pink-600',    badge: 'text-pink-700' },
  green:   { card: 'border-green-100   bg-green-50/60   hover:bg-green-50',        icon: 'bg-green-100   text-green-600',   badge: 'text-green-700' },
};

// ─── Top Metrics ─────────────────────────────────────────────
const colorMap: Record<string, { card: string; icon: string; badge: string; text: string }> = {
  blue:    { card: 'border-blue-100   bg-blue-50/40',     icon: 'bg-blue-100   text-blue-600',    badge: 'bg-blue-100   text-blue-700',   text: 'text-blue-600' },
  amber:   { card: 'border-amber-100  bg-amber-50/40',    icon: 'bg-amber-100  text-amber-600',   badge: 'bg-amber-100  text-amber-700',  text: 'text-amber-600' },
  violet:  { card: 'border-violet-100 bg-violet-50/40',   icon: 'bg-violet-100 text-violet-600',  badge: 'bg-violet-100 text-violet-700', text: 'text-violet-600' },
  emerald: { card: 'border-emerald-100 bg-emerald-50/40', icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-600' },
  cyan:    { card: 'border-cyan-100    bg-cyan-50/40',    icon: 'bg-cyan-100    text-cyan-600',    badge: 'bg-cyan-100    text-cyan-700',    text: 'text-cyan-600' },
};

const activityColors: Record<string, string> = {
  call:   'bg-green-100 text-green-600',
  status: 'bg-violet-100 text-violet-600',
  resume: 'bg-emerald-100 text-emerald-600',
  walkin: 'bg-amber-100 text-amber-600',
  follow: 'bg-slate-100 text-slate-500',
};

export function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [dateRange, setDateRange] = useState<DateRange>('Day');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [division, setDivision] = useState('BPO');
  const [company, setCompany] = useState('');
  const [customer, setCustomer] = useState('');
  const [recruiter, setRecruiter] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [topJobs, setTopJobs] = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [dashData, setDashData]     = useState<any>(null);
  const [activeSlicer, setActiveSlicer] = useState<string>('All');
  
  const [onboardingStatus, setOnboardingStatus] = useState<{ submitted: boolean; approved: boolean } | null>(null);

  useEffect(() => {
    if (api.getJoiningFormAutoFillData) {
      api.getJoiningFormAutoFillData()
        .then((data: any) => {
          if (data && (data.employeeId || data._id)) {
            setOnboardingStatus({ submitted: true, approved: !!data.isApproved });
          } else {
            setOnboardingStatus({ submitted: false, approved: false });
          }
        })
        .catch(() => {
          setOnboardingStatus({ submitted: false, approved: false });
        });
    }
  }, []);

  const DATE_TABS: DateRange[] = ['Day', 'Week', 'Quarter', 'Year', 'All', 'Custom'];

  useEffect(() => {
    Promise.all([
      (api as any).getCompanyList ? (api as any).getCompanyList() : Promise.resolve([]),
      (api as any).getRecruiters ? (api as any).getRecruiters() : Promise.resolve([]),
      api.getJobs ? api.getJobs({ status: 'Open', limit: '2' }) : Promise.resolve({ jobs: [] })
    ]).then(([compData, recData, jobData]: any) => {
      const rawComps = Array.isArray(compData) ? compData : (compData?.companies || []);
      setCompanies(dedupeCompanies(rawComps));
      setRecruiters(Array.isArray(recData) ? recData : (recData?.users || []));
      setTopJobs(jobData?.jobs || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [dateRange, customFrom, customTo, division, company, customer, recruiter]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { range: dateRange.toLowerCase() };
      if (dateRange === 'Custom' && customFrom) params.from = customFrom;
      if (dateRange === 'Custom' && customTo) params.to = customTo;
      if (division) params.division = division;
      if (company) params.company = company;
      if (customer) params.customer = customer;
      if (recruiter) params.recruiter = recruiter;
      const data = await api.getRecruiterDashboard(params);
      setDashData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_CARDS = CANDIDATE_STATUS_OPTIONS.map((label, i) => ({
    label,
    count: dashData?.pipeline?.[label] || 0,
    color: STATUS_COLOR_LIST[i % STATUS_COLOR_LIST.length],
    icon: STATUS_ICON_MAP[label] || UserCheck,
  }));

  const followUps = dashData?.followUps || [];
  const metrics = {
    todayCalls: dashData?.metrics?.todayCalls ?? dashData?.todayCalls ?? 0,
    followUpsDue: dashData?.metrics?.followUpsDue ?? dashData?.followUpsDue ?? (dashData?.followUps?.length || 0),
    interviewsScheduled: dashData?.metrics?.scheduledInterviews ?? dashData?.interviewsScheduled ?? 0,
    resumeInflow: dashData?.metrics?.totalCandidates ?? dashData?.resumeInflow ?? 0,
    dailyTarget: dashData?.callTarget?.target ?? dashData?.dailyTarget ?? 50,
  };

  // Navigate to resume list with a status filter passed via router state
  const goToStatus = (status: string) => {
    navigate('/recruiter/resumes', { state: { statusFilter: status } });
  };

  // "Today's Calls" click
  const goToTodayCalls = () => {
    navigate('/recruiter/calls/today');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.5rem' }}>
            {getGreeting()}, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/recruiter/resumes"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
            style={{ fontWeight: 500 }}
          >
            View Resumes
          </Link>
          <Link
            to="/recruiter/walkins"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
            style={{ fontWeight: 500 }}
          >
            Register Walk-In
          </Link>
        </div>
      </div>

      {/* Onboarding status banner */}
      {onboardingStatus && (
        <div className="transition-all duration-200">
          {!onboardingStatus.submitted ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">Onboarding Incomplete</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Please submit your comprehensive joining details and upload your records to complete your profile.
                  </p>
                </div>
              </div>
              <Link
                to="/recruiter/joining"
                className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                Complete Onboarding &rarr;
              </Link>
            </div>
          ) : !onboardingStatus.approved ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-blue-800">Onboarding Pending Approval</h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Your joining details have been submitted successfully and are currently pending approval by the administrator.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-800">Onboarding Approved</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Your onboarding profile is approved and locked. You can view your record at any time.
                  </p>
                </div>
              </div>
              <Link
                to="/recruiter/joining"
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                View Record &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Division Tabs ── */}
      <div className="flex gap-2 border-b border-slate-200">
        {['IT', 'BPO', 'Lateral'].map(div => (
          <button
            key={div}
            onClick={() => setDivision(div)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${division === div ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {div}
          </button>
        ))}
      </div>

      {/* ── Date Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 mr-1" style={{ fontWeight: 600 }}>FILTER BY:</span>
          <div className="flex gap-1 flex-wrap">
            {DATE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setDateRange(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${
                  dateRange === tab
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={{ fontWeight: dateRange === tab ? 600 : 500 }}
              >
                {tab}
              </button>
            ))}
          </div>
          {dateRange === 'Custom' && (
            <div className="flex items-center gap-2 ml-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">From</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-green-400 bg-white"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">To</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-green-400 bg-white"
                />
              </div>
              <button
                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                style={{ fontWeight: 600 }}
              >
                Apply
              </button>
              {(customFrom || customTo) && (
                <button
                  onClick={() => { setCustomFrom(''); setCustomTo(''); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {dateRange !== 'Custom' && dateRange !== 'All' && (
            <span className="ml-auto text-xs text-slate-400 hidden sm:block">
              Showing data for: <span style={{ fontWeight: 600 }} className="text-slate-600">{dateRange === 'Day' ? today : `This ${dateRange}`}</span>
            </span>
          )}

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <select
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-green-400 bg-white"
            >
              <option value="">All Companies</option>
              {companies.map(c => <option key={c._id || c.companyName} value={c.companyName}>{c.companyName}</option>)}
            </select>
            {['admin', 'manager', 'tl'].includes(user?.role || '') && (
              <select
                value={recruiter}
                onChange={e => setRecruiter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-green-400 bg-white"
              >
                <option value="">All Recruiters</option>
                {recruiters.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── Key Summary Metrics (Req 16 & 20) ── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      ) : (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Profiles Uploaded Today", value: String(dashData?.metrics?.profilesUploadedToday || 0), change: 'Today', color: 'emerald', icon: UserPlus, slicerKey: 'Today Uploads' },
          { label: 'Open Requirements', value: String(dashData?.metrics?.openRequirements || 0), change: 'Active JRs', color: 'blue', icon: Briefcase, slicerKey: 'Open Requirements' },
          { label: 'Eligible Candidates', value: String(dashData?.metrics?.eligibleCount || 0), change: 'Eligible', color: 'amber', icon: UserCheck, slicerKey: 'Eligible Candidates' },
          { label: 'Final Select', value: String(dashData?.metrics?.finalSelectCount || 0), change: 'L1/Final', color: 'violet', icon: BadgeCheck, slicerKey: '__final_select_group' },
          { label: 'Waiting for Offer', value: String(dashData?.metrics?.waitingForOfferCount || 0), change: 'Offer/YTJ', color: 'cyan', icon: Clock, slicerKey: '__waiting_for_offer_group' },
          { label: 'Joined', value: String(dashData?.metrics?.joinedCount || 0), change: 'Placed', color: 'emerald', icon: CheckCircle2, slicerKey: 'Joined' },
        ].map((m, i) => {
          const Icon = m.icon;
          const c = colorMap[m.color] || colorMap.emerald;
          const isSelected = activeSlicer === m.slicerKey;
          return (
            <button
              key={i}
              onClick={() => setActiveSlicer(isSelected ? 'All' : m.slicerKey)}
              className={`bg-white rounded-xl p-4 border shadow-sm text-left transition-all hover:shadow-md cursor-pointer ${c.card} ${
                isSelected ? 'ring-2 ring-green-600 shadow-md border-green-400' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.icon}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.badge}`}>
                  {m.change}
                </span>
              </div>
              <div className="text-slate-800 font-extrabold text-xl leading-tight">{m.value}</div>
              <div className="text-slate-500 text-xs mt-1 font-medium flex items-center justify-between">
                <span className="truncate">{m.label}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0 ml-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Status Pipeline Cards (11 clickable) ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Candidate Pipeline Status</h2>
            <p className="text-slate-400 text-xs mt-0.5">Click any card to view filtered candidate list</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
            {STATUS_CARDS.reduce((s, c) => s + c.count, 0)} total
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {STATUS_CARDS.map((s, i) => {
            const Icon = s.icon;
            const c = STATUS_COLOR_MAP[s.color];
            const isSelected = activeSlicer === s.label;
            return (
              <div key={i} className="relative">
                <button
                  onClick={() => setActiveSlicer(isSelected ? 'All' : s.label)}
                  className={`w-full flex flex-col items-start p-3.5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${c.card} ${
                    isSelected ? 'ring-2 ring-green-600 shadow-md scale-102 border-green-400' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${c.icon}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={`text-xl mb-0.5 ${c.badge}`} style={{ fontWeight: 800, lineHeight: 1 }}>
                    {s.count}
                  </div>
                  <div className="text-slate-500 text-xs leading-tight">{s.label}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* In-Place Slicer Filtered Data Section for Recruiter Dashboard */}
      <SlicerFilteredDataView
        slicerName={activeSlicer}
        division={division !== 'All' ? division : undefined}
        company={company}
        customer={customer}
        recruiter={recruiter}
        range={dateRange}
        fromDate={customFrom}
        toDate={customTo}
        onClear={() => setActiveSlicer('All')}
        title="Recruiter Pipeline Slicer"
      />

      </>
      )}
    </div>
  );
}
