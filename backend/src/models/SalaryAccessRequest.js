const mongoose = require('mongoose');

const SalaryAccessRequestSchema = new mongoose.Schema(
  {
    // Requester (Recruiter)
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Salary reference
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },

    // Request details
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    durationDays: {
      type: Number,
      required: true,
      default: 7,
      min: 1,
      max: 30,
    },

    // Approval workflow
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Expired'],
      default: 'Pending',
    },

    // Manager decision
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    rejectionReason: String,

    // Access management
    approvedAt: Date,
    expiresAt: Date,
    accessRevokedAt: Date,
    accessRevoked: {
      type: Boolean,
      default: false,
    },

    // Audit trail
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
SalaryAccessRequestSchema.index({ recruiterId: 1, month: 1, year: 1 });
SalaryAccessRequestSchema.index({ status: 1 });
SalaryAccessRequestSchema.index({ expiresAt: 1 });

// Method to check if access has expired
SalaryAccessRequestSchema.methods.hasExpired = function () {
  if (this.status !== 'Approved') return false;
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to auto-check and update status if expired
SalaryAccessRequestSchema.methods.checkAndUpdateExpiry = async function () {
  if (this.hasExpired() && this.status === 'Approved') {
    this.status = 'Expired';
    this.accessRevokedAt = new Date();
    this.accessRevoked = true;
    await this.save();
  }
  return this;
};

// Middleware to auto-check expiry before finding
SalaryAccessRequestSchema.query.checkExpiry = async function () {
  const docs = await this.exec();
  if (Array.isArray(docs)) {
    for (const doc of docs) {
      if (doc.hasExpired && typeof doc.checkAndUpdateExpiry === 'function') {
        await doc.checkAndUpdateExpiry();
      }
    }
  }
  return docs;
};

const SalaryAccessRequest = mongoose.model(
  'SalaryAccessRequest',
  SalaryAccessRequestSchema
);

module.exports = SalaryAccessRequest;
