const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/src/app/pages/admin/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Overview card - change href:'#' to a special tab trigger
// The cards use navigate(m.href) - we need to intercept 'Total Candidate Revenue' card
// The overview cards have a handleClick that calls navigate(m.href)
// We'll change the href to a special anchor and handle it in the click handler

// Fix 1: Change href from '#' to 'tab:analytics'
const oldCard = `{ label: 'Total Candidate Revenue', value: fmt(totalCandidateRevenue), sub: 'From Placements', icon: DollarSign, color: 'emerald', href: '#' }`;
const newCard = `{ label: 'Total Candidate Revenue', value: fmt(totalCandidateRevenue), sub: 'From Placements', icon: DollarSign, color: 'emerald', href: 'tab:analytics' }`;

if (content.includes(oldCard)) {
  content = content.replace(oldCard, newCard);
  console.log('Fix 1 (card href): SUCCESS');
} else {
  console.log('Fix 1 FAILED - card not found exactly');
}

// Fix 2: Analytics KPI "Revenue Earned" card - use real totalCandidateRevenue instead of kpis.revenue
const oldRevenue = `{ label: 'Revenue Earned',   value: kpis.revenue ? fmt(kpis.revenue) : '—', sub: 'This month', trend: kpis.revenueTrend || '+0%', up: (kpis.revenueTrend || '').startsWith('+'), icon: DollarSign, color: 'violet',  href: '/revenue' }`;
const newRevenue = `{ label: 'Revenue Earned',   value: totalCandidateRevenue ? fmt(totalCandidateRevenue) : (kpis.revenue ? fmt(kpis.revenue) : '—'), sub: 'From Placements', trend: kpis.revenueTrend || '+0%', up: (kpis.revenueTrend || '').startsWith('+'), icon: DollarSign, color: 'violet',  href: 'tab:analytics' }`;

if (content.includes(oldRevenue)) {
  content = content.replace(oldRevenue, newRevenue);
  console.log('Fix 2 (analytics KPI revenue): SUCCESS');
} else {
  console.log('Fix 2 FAILED - analytics KPI not found exactly');
}

// Fix 3: Handle 'tab:analytics' in overview card's onClick handler
// Find the overview card click handler and add tab navigation support
const oldClick = `} else if (m.href.includes('status=')) {
                  navigate('/admin/jobs');
                } else {
                  navigate(m.href);
                }`;
const newClick = `} else if (m.href.includes('status=')) {
                  navigate('/admin/jobs');
                } else if (m.href.startsWith('tab:')) {
                  setActiveTab(m.href.replace('tab:', '') as any);
                } else {
                  navigate(m.href);
                }`;

if (content.includes(oldClick)) {
  content = content.replace(oldClick, newClick);
  console.log('Fix 3 (tab navigation): SUCCESS');
} else {
  // Also try the analytics tab card click which may be different
  console.log('Fix 3 FAILED - click handler not found exactly');
}

// Fix 4: Analytics tab cards - they use navigate(m.href) directly, need same treatment
// Find the analytics tab map and add tab navigation
const analyticsOldClick = `return (
                <button key={i} onClick={() => navigate(m.href)}
                  className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all w-full">`;
const analyticsNewClick = `return (
                <button key={i} onClick={() => { if (m.href.startsWith('tab:')) { setActiveTab(m.href.replace('tab:', '') as any); } else { navigate(m.href); } }}
                  className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all w-full">`;

if (content.includes(analyticsOldClick)) {
  content = content.replace(analyticsOldClick, analyticsNewClick);
  console.log('Fix 4 (analytics tab click): SUCCESS');
} else {
  console.log('Fix 4 SKIPPED (not found or already fixed)');
}

fs.writeFileSync(file, content);
console.log('All fixes written to file.');
