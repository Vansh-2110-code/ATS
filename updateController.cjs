const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/backend/src/controllers/candidate.controller.js';
let content = fs.readFileSync(file, 'utf8');

const calcStr = `    if (data.joiningSalary && data.placementPercentage) {
      data.revenueGenerated = (parseFloat(data.joiningSalary) || 0) * (parseFloat(data.placementPercentage) || 0) / 100;
    }`;

content = content.replace('    if (req.file) {', calcStr + '\n\n    if (req.file) {');
fs.writeFileSync(file, content);
console.log('Added revenue calculation');
