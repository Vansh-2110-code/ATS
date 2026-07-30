const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromName: { type: String },
  fromRole: { type: String },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toName: { type: String },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  messageType: {
    type: String,
    enum: ['general', 'interview_call_letter', 'second_round_call_letter', 'final_round_call_letter', 'offer_letter', 'selection_mail'],
    default: 'general',
  },
  folder: { type: String, enum: ['inbox', 'sent', 'interview_letters', 'offer_letters'], default: 'inbox' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  templateData: { type: mongoose.Schema.Types.Mixed }, // stores template variables
}, { timestamps: true });

messageSchema.index({ to: 1, isRead: 1 });
messageSchema.index({ from: 1 });
messageSchema.index({ candidateId: 1 });

module.exports = mongoose.model('Message', messageSchema);
