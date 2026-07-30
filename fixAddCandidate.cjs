const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/src/app/pages/recruiter/AddCandidatePage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add placementPercentage to setForm when fetching
const setFormRegex = /(joiningSalary:\s*c\.joiningSalary \|\| '',)/;
content = content.replace(setFormRegex, "$1\n          placementPercentage:   c.placementPercentage || '',");

fs.writeFileSync(file, content);
console.log('Fixed AddCandidatePage data loading');
