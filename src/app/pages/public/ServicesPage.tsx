import { Link } from 'react-router';
import { ArrowRight, Building2, Users, Briefcase, UserCheck, CheckCircle2, TrendingUp } from 'lucide-react';

const services = [
  {
    icon: Briefcase,
    title: 'Recruitment Services',
    badge: 'Core',
    color: 'blue',
    desc: 'End-to-end recruitment for IT, non-IT, and domain-specific roles. From job order intake to candidate shortlisting, interview coordination, and offer management.',
    features: [
      'Job description optimization',
      'Multi-source candidate sourcing',
      'Screening and shortlisting',
      'Interview scheduling & coordination',
      'Offer letter & documentation support',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Hiring Solutions',
    badge: 'Enterprise',
    color: 'violet',
    desc: 'Scalable, technology-driven hiring solutions for organizations that need to fill multiple roles quickly. Dedicated recruiters, custom pipelines, and SLA-backed delivery.',
    features: [
      'Dedicated recruiter allocation',
      'Custom ATS pipeline setup',
      'Bulk hiring management',
      'SLA-based delivery commitment',
      'Weekly performance reviews',
    ],
  },
  {
    icon: Building2,
    title: 'Corporate Hiring',
    badge: 'B2B',
    color: 'emerald',
    desc: 'Specialized hiring for mid-to-senior level roles across corporate functions. We source passive candidates and manage confidential searches with discretion.',
    features: [
      'C-suite and senior leadership hiring',
      'Confidential search management',
      'Passive candidate engagement',
      'Background verification coordination',
      'Onboarding transition support',
    ],
  },
  {
    icon: UserCheck,
    title: 'Walk-In Hiring',
    badge: 'High Volume',
    color: 'amber',
    desc: 'Managed walk-in drives for high-volume fresher and lateral hiring. Tablet-friendly registration, digital resume capture, and real-time candidate tracking.',
    features: [
      'Drive planning and venue management',
      'Digital registration & resume capture',
      'On-site assessment coordination',
      'Instant status update system',
      'Post-drive analytics report',
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; badge: string; border: string }> = {
  blue: { bg: 'bg-green-50', text: 'text-green-600', badge: 'bg-green-100 text-green-700', border: 'border-green-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', border: 'border-violet-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-100' },
};

const process = [
  { step: '01', title: 'Requirement Gathering', desc: 'We work with your HR team to understand exact needs, culture fit, and timelines.' },
  { step: '02', title: 'Candidate Sourcing', desc: 'Our team sources from multiple channels — job boards, LinkedIn, referrals, and our own database.' },
  { step: '03', title: 'Screening & Shortlisting', desc: 'Rigorous screening based on skills, experience, and role requirements.' },
  { step: '04', title: 'Interview Coordination', desc: 'We schedule, remind, and follow up with candidates so your team can focus on interviewing.' },
  { step: '05', title: 'Offer & Onboarding', desc: 'Post-selection documentation, offer support, and onboarding coordination.' },
  { step: '06', title: 'Post-Placement Support', desc: '90-day replacement guarantee and ongoing relationship management.' },
];

export function ServicesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-800 to-green-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-green-300 text-sm mb-3" style={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Our Services
          </p>
          <h1 className="text-white mb-4" style={{ fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.75rem)' }}>
            Recruitment solutions for every hiring need
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            From startup to enterprise, we offer tailored hiring solutions that fit your timeline, budget, and talent strategy.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {services.map((service, i) => {
              const Icon = service.icon;
              const c = colorMap[service.color];
              return (
                <div
                  key={i}
                  className={`rounded-2xl border ${c.border} bg-white p-8 hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${c.text}`} />
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${c.badge}`} style={{ fontWeight: 600 }}>
                      {service.badge}
                    </span>
                  </div>
                  <h3 className="text-slate-800 mb-3" style={{ fontWeight: 700, fontSize: '1.2rem' }}>{service.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">{service.desc}</p>
                  <div className="space-y-2.5">
                    {service.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 ${c.text} flex-shrink-0`} />
                        <span className="text-slate-600 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-slate-800 mb-3" style={{ fontWeight: 700, fontSize: '1.75rem' }}>How we work</h2>
            <p className="text-slate-500">A clear, repeatable process that delivers results every time.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {process.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="text-green-600 mb-3" style={{ fontWeight: 800, fontSize: '1.5rem' }}>{p.step}</div>
                <h3 className="text-slate-800 mb-2" style={{ fontWeight: 600 }}>{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-slate-800 mb-3" style={{ fontWeight: 700, fontSize: '1.75rem' }}>Industries we serve</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {['Information Technology', 'Banking & Finance', 'Healthcare', 'Manufacturing', 'E-Commerce', 'Logistics', 'Telecom', 'Retail', 'Education', 'Real Estate'].map((ind, i) => (
              <span key={i} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm" style={{ fontWeight: 500 }}>
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-600 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-white mb-4" style={{ fontWeight: 700, fontSize: '1.75rem' }}>Ready to hire better, faster?</h2>
          <p className="text-green-100 mb-8">Let's discuss how White Horse Manpower can support your hiring goals.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/apply"
              className="px-8 py-3 bg-white text-green-600 rounded-xl hover:bg-green-50 transition-colors"
              style={{ fontWeight: 600 }}
            >
              Apply for a Position
              <ArrowRight className="inline ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
