const mongoose = require('mongoose');

const recruitmentAnalyticsSchema = new mongoose.Schema({
  period: { type: String, required: true }, // e.g. "2026-03"
  periodType: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },

  // KPI Metrics
  timeToFill: { type: Number }, // days
  offerAcceptanceRate: { type: Number }, // percentage
  joinRatio: { type: Number }, // percentage

  // Per recruiter metrics
  recruiterMetrics: [{
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recruiterName: String,
    candidatesScreened: { type: Number, default: 0 },
    candidatesSelected: { type: Number, default: 0 },
    offersReleased: { type: Number, default: 0 },
    offersAccepted: { type: Number, default: 0 },
    candidatesJoined: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    revenuePlaced: { type: Number, default: 0 },
  }],

  // Source performance
  sourceMetrics: [{
    source: String,
    totalCandidates: { type: Number, default: 0 },
    hires: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  }],

  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('RecruitmentAnalytics', recruitmentAnalyticsSchema);
