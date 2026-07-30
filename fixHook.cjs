const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/backend/src/models/Candidate.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the findOneAndUpdate hook with a more robust version
const oldHook = `// Auto-calculate revenueGenerated on update
candidateSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update && update.$set) {
    if (update.$set.joiningSalary && update.$set.placementPercentage) {
      update.$set.revenueGenerated = (parseFloat(update.$set.joiningSalary) || 0) * (parseFloat(update.$set.placementPercentage) || 0) / 100;
    }
  } else if (update && update.joiningSalary && update.placementPercentage) {
    update.revenueGenerated = (parseFloat(update.joiningSalary) || 0) * (parseFloat(update.placementPercentage) || 0) / 100;
  }
  next();
});`;

const newHook = `// Auto-calculate revenueGenerated on update (handles both $set and plain object updates)
candidateSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  // Mongoose wraps plain objects in $set by default
  const setObj = (update && update.$set) ? update.$set : update;
  if (setObj && setObj.joiningSalary && setObj.placementPercentage) {
    const salary = parseFloat(setObj.joiningSalary) || 0;
    const pct = parseFloat(setObj.placementPercentage) || 0;
    const revenue = salary * pct / 100;
    if (update.$set) {
      update.$set.revenueGenerated = revenue;
    } else {
      update.revenueGenerated = revenue;
    }
  }
  next();
});`;

if (content.includes(oldHook)) {
  content = content.replace(oldHook, newHook);
  fs.writeFileSync(file, content);
  console.log('SUCCESS: findOneAndUpdate hook strengthened');
} else {
  console.log('Hook not found literally, trying partial match...');
  const idx = content.indexOf('Auto-calculate revenueGenerated on update');
  console.log('Context:', content.substring(idx, idx + 500));
}
