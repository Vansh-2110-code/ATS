const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  candidateName: { type: String, required: true },
  role: { type: String, trim: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiterName: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  mode: { type: String, enum: ['In-Person', 'Video', 'Telephonic'], default: 'In-Person' },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'], default: 'Scheduled' },
  round: { type: String, trim: true },
  location: { type: String, trim: true },
  link: { type: String, trim: true },
  notes: { type: String, trim: true },
}, { timestamps: true });

interviewSchema.index({ date: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ recruiter: 1 });
interviewSchema.index({ candidate: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
