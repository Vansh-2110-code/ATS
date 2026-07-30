const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/backend/src/controllers/dashboard.controller.js';
let content = fs.readFileSync(file, 'utf8');

const calcStr = `      // Calculate total revenue and get candidate revenue details
      const revenueData = await Candidate.aggregate([
        { $match: { revenueGenerated: { $gt: 0 } } },
        { $project: { _id: 1, name: 1, revenueGenerated: 1, joiningSalary: 1, placementPercentage: 1, dateOfJoining: 1, status: 1 } },
        { $sort: { revenueGenerated: -1 } }
      ]);
      const totalRevenue = revenueData.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
`;

content = content.replace('      // Active users today', calcStr + '\n      // Active users today');
content = content.replace('res.json({', 'res.json({\n        totalRevenue,\n        revenueCandidates: revenueData,');
fs.writeFileSync(file, content);
console.log('Added totalRevenue and candidates data to admin dashboard');
