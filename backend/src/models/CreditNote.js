const mongoose = require('mongoose');

const creditNoteCandidateSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  eid: { type: String, required: true },
  name: { type: String, required: true },
  doj: { type: String, required: true },
  exitDate: { type: String },
  duration: { type: Number },
  designation: { type: String, default: '' },
  location: { type: String, default: '' },
  amount: { type: Number, required: true },
}, { _id: false });

const creditNoteSchema = new mongoose.Schema({
  // Core Identification
  creditNoteNumber: { type: String, required: true, unique: true, trim: true },
  noteDate: { type: Date, required: true },

  // Reference to Original Invoice
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },

  // Client Information
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  clientName: { type: String, required: true },
  clientAddress: { type: String },
  clientCity: { type: String },
  clientState: { type: String },
  clientPin: { type: String },
  clientCountry: { type: String },
  clientGST: { type: String },

  // Company/Invoice Details
  gstNumber: { type: String },
  sacCode: { type: String },
  lutArn: { type: String },
  lutApplied: { type: Boolean, default: false },
  locationName: { type: String },

  // Candidate Details (Credited)
  candidates: [creditNoteCandidateSchema],

  // Calculations
  totalAmount: { type: Number, required: true },
  igst: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  amountInWords: { type: String, required: true },

  // Reason for Credit Note
  reason: { type: String, required: true },

  // Tracking
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName: { type: String },
  status: { type: String, enum: ['Draft', 'Generated', 'Approved'], default: 'Generated' },

}, { timestamps: true });

// Index for faster queries
creditNoteSchema.index({ creditNoteNumber: 1 });
creditNoteSchema.index({ invoiceNumber: 1 });
creditNoteSchema.index({ clientName: 1 });
creditNoteSchema.index({ status: 1 });
creditNoteSchema.index({ noteDate: 1 });

module.exports = mongoose.model('CreditNote', creditNoteSchema);
