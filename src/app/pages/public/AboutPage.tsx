import { CheckCircle2, Target, Eye, Heart, Users, Award } from 'lucide-react';

const TEAM_IMAGE = "https://images.unsplash.com/photo-1769740333462-9a63bfa914bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB0ZWFtJTIwY29sbGFib3JhdGlvbiUyMGVudGVycHJpc2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzcxNzc3MDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080";
const OFFICE_IMAGE = "https://images.unsplash.com/photo-1766371900950-929959f2bb67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBvZmZpY2UlMjBidWlsZGluZyUyMGNvbXBhbnklMjBoZWFkcXVhcnRlcnN8ZW58MXx8fHwxNzcxNzc3MDU3fDA&ixlib=rb-4.1.0&q=80&w=1080";

const values = [
  { icon: Target, title: 'Results Driven', desc: 'We measure everything and optimize for outcomes — faster placements, better fit, higher retention.' },
  { icon: Heart, title: 'Candidate First', desc: 'Every candidate deserves a respectful, efficient, and transparent recruitment experience.' },
  { icon: Users, title: 'Team Powered', desc: 'Our recruiters are our biggest asset. We invest in their tools, training, and growth.' },
  { icon: Award, title: 'Quality Over Quantity', desc: 'We prioritize placing the right person in the right role, not just filling headcount.' },
];

const whyUs = [
  'Dedicated account managers for each client',
  'In-house technology built for recruiters',
  'Real-time tracking from source to placement',
  'Walk-in and online hiring pipelines',
  'Transparent reporting for all stakeholders',
  'Compliance-ready documentation workflow',
];

const teamMembers = [
  { name: 'Arjun Sharma', role: 'CEO & Founder', initials: 'AS' },
  { name: 'Priya Mehta', role: 'Head of Operations', initials: 'PM' },
  { name: 'Rahul Verma', role: 'CTO', initials: 'RV' },
  { name: 'Sneha Patel', role: 'Head of Recruitment', initials: 'SP' },
];

export function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-green-200 text-sm mb-3" style={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            About White Horse Manpower
          </p>
          <h1 className="text-white mb-4" style={{ fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.75rem)' }}>
            We're on a mission to make hiring human again
          </h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto leading-relaxed">
            White Horse Manpower was founded in 2019 to bridge the gap between great candidates and great companies — using technology that works for people, not against them.
          </p>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="text-slate-800 mb-6" style={{ fontWeight: 700, fontSize: '1.75rem' }}>
                Who we are
              </h2>
              <div className="space-y-4 text-slate-500 leading-relaxed">
                <p>
                  White Horse Manpower ATS is a full-service recruitment technology company headquartered in New York. We serve mid-to-large enterprises across IT, BFSI, healthcare, and manufacturing sectors.
                </p>
                <p>
                  Our platform powers over 500 recruitment teams globally, tracking millions of candidates through every stage of the hiring funnel — from resume intake to final offer acceptance.
                </p>
                <p>
                  We believe great recruitment requires great tools. That's why we built White Horse Manpower — an ATS designed by recruiters, for recruiters — with the simplicity teams need and the depth managers demand.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-6">
                {[
                  { n: '7+', l: 'Years Experience' },
                  { n: '500+', l: 'Clients Served' },
                  { n: '50K+', l: 'Placements Made' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="text-green-600" style={{ fontWeight: 800, fontSize: '1.75rem' }}>{s.n}</div>
                    <div className="text-slate-500 text-sm">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src={TEAM_IMAGE} alt="Our Team" className="w-full h-72 object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-600 rounded-2xl p-8 text-white">
              <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="mb-3" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Our Mission</h3>
              <p className="text-green-100 leading-relaxed">
                To empower recruitment teams with intelligent, simple-to-use tools that eliminate friction, accelerate placements, and create value for both companies and candidates — while maintaining complete transparency across the hiring funnel.
              </p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-8 text-white">
              <div className="w-11 h-11 bg-slate-700 rounded-xl flex items-center justify-center mb-5">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="mb-3" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Our Vision</h3>
              <p className="text-slate-300 leading-relaxed">
                To become the operating system of global recruitment — the single platform where every call, every resume, every interview, and every hire is tracked, measured, and continuously improved — making "gut-feel hiring" a thing of the past.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-slate-800 mb-3" style={{ fontWeight: 700, fontSize: '1.75rem' }}>Our core values</h2>
            <p className="text-slate-500">The principles that guide every decision we make.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="text-center p-6">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-slate-800 mb-2" style={{ fontWeight: 600 }}>{v.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg order-2 lg:order-1">
              <img src={OFFICE_IMAGE} alt="Our Office" className="w-full h-72 object-cover" />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-slate-800 mb-6" style={{ fontWeight: 700, fontSize: '1.75rem' }}>
                Why work with us?
              </h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                We're not just another staffing agency. We're a technology-first recruitment partner that gives your team the edge it needs to compete for top talent.
              </p>
              <div className="space-y-3">
                {whyUs.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-slate-800 mb-3" style={{ fontWeight: 700, fontSize: '1.75rem' }}>Leadership team</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((m, i) => (
              <div key={i} className="text-center p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl" style={{ fontWeight: 700 }}>{m.initials}</span>
                </div>
                <h3 className="text-slate-800 mb-1" style={{ fontWeight: 600 }}>{m.name}</h3>
                <p className="text-slate-500 text-sm">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
