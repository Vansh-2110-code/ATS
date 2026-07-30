const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/backend/src/controllers/dashboard.controller.js';
let content = fs.readFileSync(file, 'utf8');

// Undo the wrong replacement
content = content.replace('res.json({\n        totalRevenue,\n        revenueCandidates: revenueData,', 'res.json({');
content = content.replace(/\s*\/\/ Calculate total revenue and get candidate revenue details[\s\S]*?const totalRevenue = revenueData.reduce[^\n]*\n/g, '');

// Now explicitly find the adminDashboard function and insert the revenue calculation
const adminDashRegex = /(exports\.adminDashboard = async \(req, res, next\) => \{[\s\S]*?)(res\.json\(\{)/;

const calcStr = `
      // Calculate total revenue and get candidate revenue details
      const revenueData = await Candidate.aggregate([
        { $match: { revenueGenerated: { $gt: 0 } } },
        { $project: { _id: 1, name: 1, revenueGenerated: 1, joiningSalary: 1, placementPercentage: 1, dateOfJoining: 1, status: 1 } },
        { $sort: { revenueGenerated: -1 } }
      ]);
      const totalRevenue = revenueData.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);

      `;

content = content.replace(adminDashRegex, (match, p1, p2) => {
  return p1 + calcStr + 'res.json({\n        totalRevenue,\n        revenueCandidates: revenueData,';
});

fs.writeFileSync(file, content);
console.log('Fixed dashboard controller');
