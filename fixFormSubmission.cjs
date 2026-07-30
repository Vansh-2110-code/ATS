const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/src/app/pages/recruiter/AddCandidatePage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: JSON payload for TL Read Only
content = content.replace(
  'joiningSalary:            form.joiningSalary,',
  'joiningSalary:            form.joiningSalary,\n          placementPercentage:      form.placementPercentage,'
);

// Fix 2: FormData payload
content = content.replace(
  "if (form.joiningSalary) fd.append('joiningSalary', form.joiningSalary);",
  "if (form.joiningSalary) fd.append('joiningSalary', form.joiningSalary);\n      if (form.placementPercentage) fd.append('placementPercentage', form.placementPercentage);"
);

fs.writeFileSync(file, content);
console.log('Fixed AddCandidatePage form submission');
