const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const WALKIN_STATUSES = ['Waiting', 'In Review', 'Interviewed', 'Selected', 'Rejected'];

const walkInSchema = new mongoose.Schema({
  // Authentication fields (for self-registration)
  password: {
    type: String,
    minlength: 8,
  },
  referenceId: {
    type: String,
    unique: true,
  },
  isAuthEnabled: {
    type: Boolean,
    default: false, // Set to true when user signs up via web form
  },

  // Token for walk-in self-registration
  token: { type: String, unique: true, sparse: true },

  // Core identity
  name:        { type: String, required: true, trim: true },
  phone:       { type: String, required: true, trim: true },
  email:       { type: String, trim: true, lowercase: true },
  alternatePhone: { type: String, trim: true },
  gender:      { type: String, trim: true },
  dateOfBirth: { type: Date },

  // Recruiter / session info
  interviewCaller: { type: String, trim: true },   // Which recruiter called them in
  recruiterEmail:  { type: String, trim: true },
  interviewType:   { type: String, trim: true },
  source:          { type: String, trim: true },   // jobOpeningSource

  // Professional details
  experience:       { type: String, trim: true },
  experienceYears:  { type: String, trim: true },
  currentComp:      { type: String, trim: true }, // legacy field
  currentCompany:   { type: String, trim: true },
  currentRole:      { type: String, trim: true },
  currentCTC:       { type: String, trim: true },
  expectedCTC:      { type: String, trim: true },
  noticePeriod:     { type: String, trim: true },
  joiningAvailability: { type: String, trim: true },
  skills:           [{ type: String, trim: true }],

  // Education
  qualification:    { type: String, trim: true },
  university:       { type: String, trim: true },
  yearOfGraduation: { type: String, trim: true },

  // Current location
  currentRegion:      { type: String, trim: true },
  currentState:       { type: String, trim: true },
  currentCity:        { type: String, trim: true },
  currentSubLocation: { type: String, trim: true },

  // Preferred location
  preferredRegion: { type: String, trim: true },
  preferredState:  { type: String, trim: true },
  preferredCity:   { type: String, trim: true },

  // Resume
  resumePath:      { type: String },
  resumeOriginalName: { type: String },
  resumeUploaded:  { type: Boolean, default: false },
  additionalInfo:  { type: String, trim: true },

  // Workflow
  status:           { type: String, enum: WALKIN_STATUSES, default: 'Waiting' },
  assignedTo:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToName:   { type: String },
  candidate:        { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },

  // Audit
  registeredByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // walkin login user
  registeredAt:     { type: Date, default: Date.now },
}, { timestamps: true });

// Index for faster queries
walkInSchema.index({ status: 1 });
walkInSchema.index({ registeredAt: -1 });
walkInSchema.index({ phone: 1 });
walkInSchema.index({ email: 1 });
walkInSchema.index({ referenceId: 1 });

// Hash password before saving
walkInSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
walkInSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

// Method to generate unique reference ID
walkInSchema.statics.generateReferenceId = async function () {
  let referenceId;
  let exists = true;

  while (exists) {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, '0');
    referenceId = `WHM/WI/${year}/${randomNum}`;
    exists = await this.findOne({ referenceId });
  }

  return referenceId;
};

walkInSchema.statics.STATUSES = WALKIN_STATUSES;

module.exports = mongoose.model('WalkIn', walkInSchema);
