const fs = require('fs');
let file = 'c:/Users/s.anirudh/Downloads/ats-main-20260724T030529Z-1-001/ats-main/backend/src/models/Candidate.js';
let content = fs.readFileSync(file, 'utf8');

const targetPoint = 'candidateSchema.post(\'save\', async function(doc) {';
const hookCode = `
// Auto-calculate revenueGenerated on save
candidateSchema.pre('save', function(next) {
  if (this.joiningSalary && this.placementPercentage) {
    this.revenueGenerated = (parseFloat(this.joiningSalary) || 0) * (parseFloat(this.placementPercentage) || 0) / 100;
  }
  next();
});

// Auto-calculate revenueGenerated on update
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
});

`;

content = content.replace(targetPoint, hookCode + targetPoint);
fs.writeFileSync(file, content);
console.log('Added pre-save hooks to Candidate.js');
