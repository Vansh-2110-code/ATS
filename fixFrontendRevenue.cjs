const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/src/app/pages/admin/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = "setAlerts((adminData.alerts || []).map((a: any) => ({ ...a, msg: a.msg || a.message || '' })));";
const replacement = "setAlerts((adminData.alerts || []).map((a: any) => ({ ...a, msg: a.msg || a.message || '' })));\n          setRevenueCandidates(adminData.revenueCandidates || []);\n          setTotalCandidateRevenue(adminData.totalRevenue || 0);";

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('SUCCESS: Revenue state setters added to useEffect');
} else {
  // Find where setAlerts is called
  const idx = content.indexOf('setAlerts(');
  console.log('setAlerts context:');
  console.log(content.substring(idx - 20, idx + 200));
}
