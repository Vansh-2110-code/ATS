const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/src/app/pages/recruiter/AddCandidatePage.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div>\s*<label[^>]*>Joining Salary \([^)]*\)<\/label>[\s\S]*?<\/div>/;

if (regex.test(content)) {
  const replacement = `$&
                  {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'tl') && (
                    <div>
                      <label className="block text-sm text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>Placement Percentage (%)</label>
                      <input type="number" step="0.01" value={form.placementPercentage || ''} onChange={e => set('placementPercentage', e.target.value)}
                        disabled={!canEditInterviewStatus || form.finalInterviewStatus !== 'Selected'}
                        placeholder="e.g. 8.33"
                        className={\`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors \${(!canEditInterviewStatus || form.finalInterviewStatus !== 'Selected') ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:border-green-400'}\`} />
                    </div>
                  )}`;
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Success');
} else {
  console.log('Regex did not match');
}
