const mongoose = require('mongoose');

const businessDevelopmentSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  executiveName: {
    type: String,
    default: '',
    trim: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  contactPerson: {
    type: String,
    default: '',
    trim: true,
  },
  designation: {
    type: String,
    default: '',
    trim: true,
  },
  mobileNo: {
    type: String,
    default: '',
    trim: true,
  },
  emailId: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
  },
  city: {
    type: String,
    default: '',
    trim: true,
  },
  industry: {
    type: String,
    default: '',
    trim: true,
  },
  source: {
    type: String,
    default: 'LinkedIn',
    enum: ['LinkedIn', 'Naukri', 'Reference', 'Website', 'Other'],
  },
  serviceOffered: {
    type: String,
    default: 'Permanent Recruitment',
    enum: [
      'Permanent Recruitment',
      'Contract Staffing',
      'Executive Search',
      'Healthcare Recruitment',
      'IT Recruitment',
      'Non IT Recruitment',
      'RPO',
      'NEXORA ATS',
      'HRMS',
      'Payroll',
      'Attendance',
      'Multiple Services',
    ],
  },
  callStatus: {
    type: String,
    default: 'Connected',
    enum: [
      'Connected',
      'No Answer',
      'Switched Off',
      'Busy',
      'Wrong Number',
      'Call Back Later',
      'Meeting Fixed',
      'Proposal Sent',
      'Not Interested',
      'Converted',
      'Existing Client',
    ],
  },
  interested: {
    type: String,
    default: 'No',
    enum: ['Yes', 'No'],
  },
  requirement: {
    type: String,
    default: '',
    trim: true,
  },
  noOfPositions: {
    type: Number,
    default: 0,
  },
  followUpDate: {
    type: Date,
    default: null,
  },
  meetingFixed: {
    type: String,
    default: 'No',
    enum: ['Yes', 'No'],
  },
  proposalSent: {
    type: String,
    default: 'No',
    enum: ['Yes', 'No', 'Pending'],
  },
  agreementSent: {
    type: String,
    default: 'No',
    enum: ['Yes', 'No', 'Pending'],
  },
  clientStatus: {
    type: String,
    default: 'Cold',
    enum: ['Cold', 'Warm', 'Hot', 'Converted'],
  },
  ctc: {
    type: Number,
    default: 0,
  },
  placementPercentage: {
    type: Number,
    default: 8.33,
  },
  expectedRevenue: {
    type: Number,
    default: 0,
  },
  remarks: {
    type: String,
    default: '',
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true });

businessDevelopmentSchema.index({ companyName: 1 });
businessDevelopmentSchema.index({ executiveName: 1 });
businessDevelopmentSchema.index({ clientStatus: 1 });
businessDevelopmentSchema.index({ callStatus: 1 });
businessDevelopmentSchema.index({ date: -1 });

module.exports = mongoose.model('BusinessDevelopment', businessDevelopmentSchema);
