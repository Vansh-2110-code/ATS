const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/src/app/pages/recruiter/AddCandidatePage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("joiningSalary: '',", "joiningSalary: '',\n    placementPercentage: '',");

const strToReplace = `                  <div>
                    <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>Joining Salary (₹)</label>
                    <input type="text" value={form.joiningSalary} onChange={e => set('joiningSalary', e.target.value)}
                      disabled={!canEditInterviewStatus || form.finalInterviewStatus !== 'Selected'}
                      placeholder="e.g. 6,00,000"
                      className={\`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors \${(!canEditInterviewStatus || form.finalInterviewStatus !== 'Selected') ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:border-green-400'}\`} />
                  </div>
                </div>`;

const newStr = `                  <div>
                    <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>Joining Salary (₹)</label>
                    <input type="text" value={form.joiningSalary} onChange={e => set('joiningSalary', e.target.value)}
                      disabled={!canEditInterviewStatus || form.finalInterviewStatus !== 'Selected'}
                      placeholder="e.g. 6,00,000"
                      className={\`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors \${(!canEditInterviewStatus || form.finalInterviewStatus !== 'Selected') ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:border-green-400'}\`} />
                  </div>
                  {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'tl') && (
                    <div>
                      <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>Placement Percentage (%)</label>
                      <input type="number" step="0.01" value={form.placementPercentage || ''} onChange={e => set('placementPercentage', e.target.value)}
                        disabled={!canEditInterviewStatus || form.finalInterviewStatus !== 'Selected'}
                        placeholder="e.g. 8.33"
                        className={\`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors \${(!canEditInterviewStatus || form.finalInterviewStatus !== 'Selected') ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:border-green-400'}\`} />
                    </div>
                  )}
                </div>`;

content = content.replace(strToReplace, newStr);
fs.writeFileSync(file, content);
console.log('Updated AddCandidatePage');
