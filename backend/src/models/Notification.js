const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['call', 'interview', 'walkin', 'resume', 'candidate', 'system', 'alert', 'info'];

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientRole: { type: String, required: true }, // Denormalized for fast filtering (admin, manager, tl, recruiter, spoc)
  type: { type: String, enum: NOTIFICATION_TYPES, default: 'info' },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  entityId: { type: mongoose.Schema.Types.ObjectId }, // E.g., Candidate ID, Interview ID
  entityType: { type: String, trim: true }, // 'Candidate', 'Interview', etc.
  navigateTo: { type: String, trim: true }, // Frontend path, e.g., '/recruiter/candidates/123'
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });

// TTL Index: Auto-delete notifications after 30 days (2592000 seconds)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', notificationSchema);
