const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  actual: { type: Number, default: 0 },
  target: { type: Number, default: 0 },
  recruiterContributions: [{
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recruiterName: { type: String },
    amount: { type: Number, default: 0 },
    hires: { type: Number, default: 0 },
  }],
}, { timestamps: true });

revenueSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Revenue', revenueSchema);
