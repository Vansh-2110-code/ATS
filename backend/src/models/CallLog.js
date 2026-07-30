const mongoose = require('mongoose');

const CALL_OUTCOMES = [
  'Interested', 'Not Interested', 'Call Back', 'No Answer', 'Busy', 'Wrong Number'
];

const callLogSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  candidateName: { type: String, required: true },
  candidatePhone: { type: String, required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiterName: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // seconds
  outcome: { type: String, enum: CALL_OUTCOMES },
  notes: { type: String, trim: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

callLogSchema.index({ candidate: 1, createdAt: -1 });
callLogSchema.index({ recruiter: 1, createdAt: -1 });
callLogSchema.index({ outcome: 1 });
callLogSchema.index({ createdAt: -1 });

callLogSchema.statics.OUTCOMES = CALL_OUTCOMES;

module.exports = mongoose.model('CallLog', callLogSchema);
