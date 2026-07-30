const mongoose = require('mongoose');

const invoiceCandidateSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  eid: { type: String },
  name: { type: String },
  doj: { type: String },
  designation: { type: String },
  location: { type: String },
  amount: { type: Number },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  // ── Simple / Legacy fields (used by Revenue Entry) ──────────────
  client: { type: String, trim: true },
  amount: { type: Number },
  dueDate: { type: Date },
  paidDate: { type: Date },
  candidateRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  recruiterRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, trim: true },

  // ── Rich Invoice fields (used by Create Invoice Page) ───────────
  invoiceNumber: { type: String, trim: true },
  invoiceDate: { type: String, trim: true },

  // Client details
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  clientName: { type: String, trim: true },
  clientAddress: { type: String, trim: true },
  clientCity: { type: String, trim: true },
  clientState: { type: String, trim: true },
  clientPin: { type: String, trim: true },
  clientCountry: { type: String, trim: true },
  clientGST: { type: String, trim: true },

  // Billing info
  gstNumber: { type: String, trim: true },
  sacCode: { type: String, trim: true },
  lutArn: { type: String, trim: true },
  lutExpiry: { type: Date },
  lutApplied: { type: Boolean, default: false },
  locationName: { type: String, trim: true },
  panNumber: { type: String, trim: true },
  requesterName: { type: String, trim: true },

  // Candidates billed
  candidates: [invoiceCandidateSchema],

  // Totals
  totalAmount: { type: Number },
  taxType: { type: String, enum: ['IGST@18', 'SGST@9', 'CGST@9', 'CGST@9_SGST@9'], default: 'IGST@18' },
  igst: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  grandTotal: { type: Number },
  amountInWords: { type: String },

  status: { type: String, enum: ['Draft', 'Paid', 'Pending', 'Overdue', 'Due Soon'], default: 'Pending' },
}, { timestamps: true });

invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
