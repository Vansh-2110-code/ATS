const mongoose = require('mongoose');

const ROLES = ['recruiter', 'tl', 'manager', 'admin'];
const DATA_TYPES = ['string', 'email', 'phone', 'number', 'date', 'array', 'boolean', 'enum'];
const TRANSFORM_TYPES = ['trim', 'uppercase', 'lowercase', 'split_by_comma', 'parse_json', 'none'];

const fieldConfigSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ROLES,
    required: true,
    unique: true,
    lowercase: true,
  },

  // Field configurations
  fields: [{
    fieldName: { type: String, required: true },           // 'name', 'email', 'phone', etc.
    displayName: { type: String, required: true },        // 'Candidate Name', 'Email ID'
    dataType: {
      type: String,
      enum: DATA_TYPES,
      default: 'string',
    },

    // Visibility & Access Control
    visibility: {
      hidden: { type: Boolean, default: false },          // Hide from form
      readonly: { type: Boolean, default: false },        // Show but can't edit
      mandatory: { type: Boolean, default: false },       // Must fill before submit
    },

    // Validation Rules
    validation: {
      pattern: String,                                     // Regex pattern
      minLength: Number,
      maxLength: Number,
      allowedValues: [String],                            // For enums
      customRule: String,                                 // Custom validation function name
    },

    // Form Metadata
    helpText: String,                                      // Helper text below field
    placeholder: String,                                   // Input placeholder
    defaultValue: String,                                 // Default value
    category: String,                                     // Field grouping (e.g., 'Personal', 'Education')
  }],

  // Excel Column Mappings
  excelColumnMappings: [{
    excelColumnName: String,                              // "Job Title", "Current Company"
    systemFieldName: String,                              // "positionApplied", "currentCompany"
    dataTransform: {                                      // Data transformation method
      type: String,
      enum: TRANSFORM_TYPES,
      default: 'trim',
    },
    required: { type: Boolean, default: false },
  }],

  // Feature Toggles (per role)
  features: {
    excelImportEnabled: { type: Boolean, default: true },
    resumeParsingEnabled: { type: Boolean, default: true },
    bulkOperationsEnabled: { type: Boolean, default: true },
    duplicateDetectionEnabled: { type: Boolean, default: true },
    advancedFiltersEnabled: { type: Boolean, default: true },
  },

  // Import Presets (saved Excel column mapping combinations)
  importPresets: [{
    name: String,                                         // "Naukri Format", "LinkedIn Format"
    description: String,
    mapping: [{
      excelColumn: String,
      systemField: String,
    }],
    isDefault: { type: Boolean, default: false },
  }],

  // Audit Trail
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedByName: String,
}, { timestamps: true });

// Index for quick lookups
fieldConfigSchema.index({ role: 1 });

// Statics
fieldConfigSchema.statics.ROLES = ROLES;
fieldConfigSchema.statics.DATA_TYPES = DATA_TYPES;
fieldConfigSchema.statics.TRANSFORM_TYPES = TRANSFORM_TYPES;

module.exports = mongoose.model('FieldConfig', fieldConfigSchema);
