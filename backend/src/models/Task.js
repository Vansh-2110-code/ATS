const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  // Support multiple assignees
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedToNames: [{ type: String }], // Array of names for denormalization
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedByName: { type: String, required: true },
  dueDate: { type: Date },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], default: 'Pending' },
  notes: { type: String, default: '' },
  completedAt: { type: Date },
  // Task category (predefined or custom)
  taskCategory: { type: String, default: 'General' },
  // Candidate-linked task (TL tagging a recruiter for a specific candidate)
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  candidateName: { type: String, default: '' },
  // Job-linked task
  jrNumbers: [{ type: String }],
  jrNames: [{ type: String }],
  // Linked entity tracking for redirection
  entityType: { type: String, enum: ['candidate', 'job', 'general'], default: 'general' },
  entityId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Update indexes for multiple assignees
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
