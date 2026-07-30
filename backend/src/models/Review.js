const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewPeriodStart: {
    type: Date,
    required: true,
  },
  reviewPeriodEnd: {
    type: Date,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comments: {
    type: String,
    required: true,
  },
  metrics: {
    targetCalls: { type: Number, default: 0 },
    actualCalls: { type: Number, default: 0 },
    targetInterviews: { type: Number, default: 0 },
    actualInterviews: { type: Number, default: 0 },
    targetPlacements: { type: Number, default: 0 },
    actualPlacements: { type: Number, default: 0 },
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
