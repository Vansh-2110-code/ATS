const mongoose = require('mongoose');

const recruiterPortalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('RecruiterPortal', recruiterPortalSchema);
