const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/backend/src/controllers/candidate.controller.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /exports\.update = async \(req, res, next\) => \{\s*try \{\s*const data = \{ \.\.\.req\.body \};\s*/;

const replacement = `exports.update = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Calculate revenueGenerated if joiningSalary and placementPercentage are provided
    if (data.joiningSalary && data.placementPercentage) {
      data.revenueGenerated = (parseFloat(data.joiningSalary) || 0) * (parseFloat(data.placementPercentage) || 0) / 100;
    }

`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log('Fixed candidate.controller.js for update');
