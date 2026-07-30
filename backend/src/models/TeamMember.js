const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema(
  {
    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['recruiter'],
      default: 'recruiter',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    removedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure one TL doesn't have duplicate recruiters
TeamMemberSchema.index({ teamLeaderId: 1, memberId: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
