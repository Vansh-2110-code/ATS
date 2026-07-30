const mongoose = require('mongoose');

const LOG_TYPES = ['call', 'status', 'login', 'edit', 'delete', 'system', 'logout', 'create', 'document', 'reassign'];

const auditLogSchema = new mongoose.Schema({
  type: { type: String, enum: LOG_TYPES, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  role: { type: String },
  action: { type: String, required: true },
  target: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

auditLogSchema.index({ type: 1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 'text', target: 'text', userName: 'text' });

auditLogSchema.statics.LOG_TYPES = LOG_TYPES;

module.exports = mongoose.model('AuditLog', auditLogSchema);
