const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/src/app/pages/admin/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("const [adminMetrics, setAdminMetrics] = useState<any>({});", 
"const [adminMetrics, setAdminMetrics] = useState<any>({});\n  const [revenueCandidates, setRevenueCandidates] = useState<any[]>([]);\n  const [revenueSearch, setRevenueSearch] = useState('');\n  const [totalCandidateRevenue, setTotalCandidateRevenue] = useState(0);");

const loadStr = `          setAdminMetrics({ ...m, resumesReceived: m.resumesReceived ?? m.totalResumes ?? '?' });
          setSourceData(adminData.sourceChart || adminData.sourceData || adminData.resumeInflow || []);
          setAlerts((adminData.alerts || []).map((a: any) => ({ ...a, msg: a.msg || a.message || '' })));
          
          if (adminData.revenueCandidates) setRevenueCandidates(adminData.revenueCandidates);
          if (adminData.totalRevenue) setTotalCandidateRevenue(adminData.totalRevenue);
`;
content = content.replace("          setAdminMetrics({ ...m, resumesReceived: m.resumesReceived ?? m.totalResumes ?? '?' });\n          setSourceData(adminData.sourceChart || adminData.sourceData || adminData.resumeInflow || []);\n          setAlerts((adminData.alerts || []).map((a: any) => ({ ...a, msg: a.msg || a.message || '' })));", loadStr);

const metricsStr = `{ label: 'Revenue (This Month)',value: adminMetrics.currentMonthRevenue ? fmt(adminMetrics.currentMonthRevenue) : '₹0', sub: 'Business', icon: DollarSign, color: 'emerald', href: '/revenue' },`;
const newMetricsStr = `{ label: 'Total Candidate Revenue', value: fmt(totalCandidateRevenue), sub: 'From Placements', icon: DollarSign, color: 'emerald', href: '#' },
              { label: 'Revenue (This Month)',value: adminMetrics.currentMonthRevenue ? fmt(adminMetrics.currentMonthRevenue) : '₹0', sub: 'Business', icon: DollarSign, color: 'emerald', href: '/revenue' },`;

content = content.replace(metricsStr, newMetricsStr);

const searchStr = `            {/* Alerts Table */}`;
const newSearchStr = `            {/* Revenue Search Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Candidate Revenue</h3>
                  <p className="text-xs text-slate-500 mt-1">Search for a candidate to view their revenue contribution.</p>
                </div>
                <div className="relative max-w-sm w-full">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="text" placeholder="Search candidate name..." value={revenueSearch} onChange={e => setRevenueSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Candidate Name</th>
                      <th className="px-4 py-3 font-medium">Joining Salary</th>
                      <th className="px-4 py-3 font-medium">Placement %</th>
                      <th className="px-4 py-3 font-medium text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {revenueCandidates.filter(c => c.name.toLowerCase().includes(revenueSearch.toLowerCase())).slice(0, 5).map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-700 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-slate-600">₹{c.joiningSalary}</td>
                        <td className="px-4 py-3 text-slate-600">{c.placementPercentage}%</td>
                        <td className="px-4 py-3 text-emerald-600 font-semibold text-right">₹{c.revenueGenerated?.toLocaleString()}</td>
                      </tr>
                    ))}
                    {revenueCandidates.filter(c => c.name.toLowerCase().includes(revenueSearch.toLowerCase())).length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No revenue data found for this search.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Alerts Table */}`;
content = content.replace(searchStr, newSearchStr);

fs.writeFileSync(file, content);
console.log('Updated AdminDashboard');
