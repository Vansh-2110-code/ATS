const fs = require('fs');
const path = require('path');

const filesToFix = [
  'backend/src/controllers/dashboard.controller.js',
  'backend/src/models/Candidate.js',
  'src/app/pages/admin/AdminDashboard.tsx',
  'src/app/pages/manager/ReportsPage.tsx',
  'src/app/pages/recruiter/CandidateProfilePage.tsx',
  'src/app/pages/recruiter/ResumeListPage.tsx'
];

filesToFix.forEach(relPath => {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Regex to match the conflict marker and capture the INCOMING side
  // <<<<<<< HEAD\n(anything)\n=======\n(incoming)\n>>>>>>> (commit)\n
  const conflictRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>>[^\r\n]*\r?\n?/g;
  
  let matchCount = 0;
  const newContent = content.replace(conflictRegex, (match, headContent, incomingContent) => {
    matchCount++;
    // We choose the INCOMING side (from the 'fix' commit)
    return incomingContent;
  });

  if (matchCount > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Resolved ${matchCount} conflicts in ${relPath}`);
  } else {
    console.log(`No conflicts found in ${relPath}`);
  }
});
