const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/backend/src/controllers/candidate.controller.js';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /\/\/ Calculate revenueGenerated if joiningSalary and placementPercentage are provided\s*if \(data\.joiningSalary && data\.placementPercentage\) \{\s*data\.revenueGenerated = \(parseFloat\(data\.joiningSalary\) \|\| 0\) \* \(parseFloat\(data\.placementPercentage\) \|\| 0\) \/ 100;\s*\}/g;

const regex2 = /\/\/ Handle file upload\s*if \(data\.joiningSalary && data\.placementPercentage\) \{\s*data\.revenueGenerated = \(parseFloat\(data\.joiningSalary\) \|\| 0\) \* \(parseFloat\(data\.placementPercentage\) \|\| 0\) \/ 100;\s*\}/g;

content = content.replace(regex1, '');
content = content.replace(regex2, '// Handle file upload');

fs.writeFileSync(file, content);
console.log('Cleaned up candidate.controller.js');
