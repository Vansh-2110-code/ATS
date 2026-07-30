import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight, CheckCircle2, Users, BarChart3, Phone,
  Star, Shield, TrendingUp, Clock, Search
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import logoImg from '../../../assets/Logo.png';

const PLACEMENT_DATA = {
  Weekly: {
    total: '42',
    growth: '↑ 18% vs last week',
    chartData: [
      { name: 'Mon', hires: 5 },
      { name: 'Tue', hires: 8 },
      { name: 'Wed', hires: 6 },
      { name: 'Thu', hires: 9 },
      { name: 'Fri', hires: 11 },
      { name: 'Sat', hires: 3 },
    ],
    feed: [
      { name: 'Rohan M.', company: 'Infosys', time: '10 mins ago' },
      { name: 'Neha K.', company: 'Wipro', time: '1 hr ago' },
      { name: 'Vikram D.', company: 'TCS', time: '4 hrs ago' },
    ]
  },
  Monthly: {
    total: '185',
    growth: '↑ 24% vs last month',
    chartData: [
      { name: 'W1', hires: 35 },
      { name: 'W2', hires: 48 },
      { name: 'W3', hires: 52 },
      { name: 'W4', hires: 50 },
    ],
    feed: [
      { name: 'Priya S.', company: 'Cognizant', time: 'Just now' },
      { name: 'Rohan M.', company: 'Infosys', time: '10 mins ago' },
      { name: 'Amit G.', company: 'Capgemini', time: '30 mins ago' },
      { name: 'Neha K.', company: 'Wipro', time: '1 hr ago' },
    ]
  },
  Yearly: {
    total: '2,140',
    growth: '↑ 32% vs last year',
    chartData: [
      { name: 'Q1', hires: 450 },
      { name: 'Q2', hires: 520 },
      { name: 'Q3', hires: 590 },
      { name: 'Q4', hires: 580 },
    ],
    feed: [
      { name: 'Priya S.', company: 'Cognizant', time: 'Just now' },
      { name: 'Rohan M.', company: 'Infosys', time: '10 mins ago' },
      { name: 'Sanjay P.', company: 'Accenture', time: '1 day ago' },
      { name: 'Anita V.', company: 'HCL', time: '2 days ago' },
    ]
  }
};

const features = [
  { icon: Search, title: 'Smart Resume Search', desc: 'Filter by skills, experience, source, and status instantly.' },
  { icon: Phone, title: 'In-App Calling', desc: 'Call candidates directly from the dashboard. Every call is logged automatically.' },
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track recruiter performance, conversion rates, and revenue in real time.' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Recruiters, TLs, Managers, and Admins each see only what they need.' },
  { icon: Clock, title: 'Attendance Tracking', desc: 'Monitor login/logout times, WFH flags, and daily attendance.' },
  { icon: TrendingUp, title: 'Revenue Dashboard', desc: 'See hiring revenue, invoices, and recruiter contributions at a glance.' },
];

const stats = [
  { value: '10,000+', label: 'Candidates Tracked' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '3x', label: 'Faster Hiring' },
  { value: '500+', label: 'Companies Served' },
];

const clients = ['Infosys', 'Wipro', 'TCS', 'Accenture', 'HCL', 'Cognizant', 'Tech Mahindra', 'Capgemini'];

const benefits = [
  'One platform for all recruitment workflows',
  'Automated call logging and follow-up tracking',
  'Walk-in and online candidate pipelines',
  'Manager-level insights with charts and reports',
  'Admin-controlled permissions and logs',
  'Salary and revenue modules built-in',
];

export function LandingPage() {
  const [placementTab, setPlacementTab] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Monthly');

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full filter blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-600 rounded-full filter blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/30 rounded-full px-3 py-1.5 mb-6">
                <div className="bg-white p-0.5 rounded-full flex items-center justify-center">
                  <img src={logoImg} alt="Logo" className="h-4 w-4 object-contain rounded-full" />
                </div>
                <span className="text-green-300 text-xs" style={{ fontWeight: 500 }}>Enterprise Recruitment Platform</span>
              </div>
              <h1 className="text-white mb-5" style={{ fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: '1.15' }}>
                Hire Faster.{' '}
                <span className="text-green-400">Track Everything.</span>{' '}
                One System.
              </h1>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-lg">
                White Horse Manpower ATS gives your recruitment team everything they need — from candidate tracking and in-app calling to performance analytics and automated reporting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/apply"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  Apply for a Job
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Explore Services
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                {benefits.slice(0, 3).map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-slate-700/50 flex flex-col gap-5 min-h-[420px]">
                {/* Logo and Header */}
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                      <img src={logoImg} alt="White Horse Manpower" className="h-10 w-auto object-contain" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm leading-tight">White Horse Manpower</h4>
                      <span className="text-xs text-green-400 font-medium">Placement Live Dashboard</span>
                    </div>
                  </div>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>

                {/* Placement Stats Filter / Tabs */}
                <div className="flex items-center justify-between flex-shrink-0">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Placement Analytics</span>
                  <div className="flex gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/30">
                    {(['Weekly', 'Monthly', 'Yearly'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setPlacementTab(tab)}
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all ${
                          placementTab === tab ? 'bg-green-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Metric & Graph */}
                <div className="grid grid-cols-3 gap-4 bg-slate-850 p-4 rounded-xl border border-slate-700/20 flex-shrink-0">
                  <div className="col-span-1 flex flex-col justify-center">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Hires</p>
                    <h3 className="text-white text-2xl font-extrabold tracking-tight mt-1">
                      {PLACEMENT_DATA[placementTab].total}
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-400 mt-2 flex items-center gap-1">
                      {PLACEMENT_DATA[placementTab].growth}
                    </span>
                  </div>
                  <div className="col-span-2 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={PLACEMENT_DATA[placementTab].chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 600, fontSize: '10px' }}
                          itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}
                        />
                        <Area type="monotone" dataKey="hires" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorPlacements)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Live Placements Feed */}
                <div className="flex-1 overflow-hidden flex flex-col gap-2 min-h-0">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex-shrink-0">Live Placement Feed</p>
                  <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                    {PLACEMENT_DATA[placementTab].feed.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-700/20 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-slate-300 font-semibold">{item.name}</span>
                          <span className="text-slate-500 font-medium">placed at</span>
                          <span className="text-green-400 font-bold">{item.company}</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-white mb-1" style={{ fontWeight: 800, fontSize: '2rem' }}>{stat.value}</div>
                <div className="text-green-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-slate-800 mb-3" style={{ fontWeight: 700, fontSize: '2rem' }}>
              Everything your team needs
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              From resume intake to placement, White Horse Manpower covers every step of the recruitment lifecycle.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-slate-800 mb-2" style={{ fontWeight: 600 }}>{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-slate-800 mb-4" style={{ fontWeight: 700, fontSize: '2rem' }}>
                Built for recruiting teams that move fast
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Whether you're managing 5 recruiters or 50, White Horse Manpower scales with your team and keeps everything organized — from first contact to final offer.
              </p>
              <div className="space-y-3">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-slate-600 text-sm">{b}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-green-600 text-sm hover:text-green-700"
                  style={{ fontWeight: 500 }}
                >
                  Learn more about us
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-slate-100 rounded-2xl p-8">
              <div className="space-y-4">
                {[
                  { role: 'Recruiter', action: 'Viewed candidate Priya S. • Just now', color: 'bg-emerald-100 text-emerald-700' },
                  { role: 'Team Lead', action: 'Corrected resume source for 3 candidates', color: 'bg-violet-100 text-violet-700' },
                  { role: 'Manager', action: 'Exported monthly performance report', color: 'bg-amber-100 text-amber-700' },
                  { role: 'Admin', action: 'Updated access permissions for TL team', color: 'bg-red-100 text-red-700' },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${item.color}`} style={{ fontWeight: 600 }}>
                      {item.role}
                    </span>
                    <p className="text-slate-600 text-sm">{item.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-400 text-sm mb-10" style={{ fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Trusted by leading companies
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {clients.map((client, i) => (
              <span key={i} className="text-slate-400 text-base" style={{ fontWeight: 700 }}>
                {client}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-green-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-white mb-4" style={{ fontWeight: 700, fontSize: '2rem' }}>
            Ready to transform your hiring process?
          </h2>
          <p className="text-green-100 mb-8">
            Join hundreds of recruitment companies already using White Horse Manpower ATS to hire smarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/apply"
              className="px-8 py-3 bg-white text-green-600 rounded-xl hover:bg-green-50 transition-colors"
              style={{ fontWeight: 600 }}
            >
              Apply for a Position
            </Link>
            <Link
              to="/services"
              className="px-8 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-colors border border-green-500"
              style={{ fontWeight: 500 }}
            >
              View Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
