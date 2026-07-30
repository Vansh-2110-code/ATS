const FieldConfig = require('../models/FieldConfig');
const { createLog } = require('../utils/auditLogger');

// Default field configurations per role
const DEFAULT_FIELD_CONFIGS = {
  recruiter: {
    fields: [
      { fieldName: 'name', displayName: 'Candidate Name', dataType: 'string', visibility: { hidden: false, readonly: false, mandatory: true }, validation: { minLength: 2, maxLength: 100 }, helpText: 'Full name of the candidate', placeholder: 'Enter candidate name', category: 'Personal' },
      { fieldName: 'email', displayName: 'Email Address', dataType: 'email', visibility: { hidden: false, readonly: false, mandatory: false }, validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }, helpText: 'Valid email address', placeholder: 'candidate@email.com', category: 'Personal' },
      { fieldName: 'phone', displayName: 'Contact Number', dataType: 'phone', visibility: { hidden: false, readonly: false, mandatory: true }, validation: { pattern: '^\\d{10}$', minLength: 10, maxLength: 10 }, helpText: '10-digit mobile number', placeholder: '10-digit number', category: 'Personal' },
      { fieldName: 'altPhone', displayName: 'Alternate Phone', dataType: 'phone', visibility: { hidden: false, readonly: false, mandatory: false }, validation: { pattern: '^\\d{10}$' }, category: 'Personal' },
      { fieldName: 'currentLocation', displayName: 'Current Location', dataType: 'string', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Location' },
      { fieldName: 'preferredLocation', displayName: 'Preferred Location', dataType: 'string', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Location' },
      { fieldName: 'experience', displayName: 'Total Experience (Years)', dataType: 'string', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Experience' },
      { fieldName: 'currentCompany', displayName: 'Current Company', dataType: 'string', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Experience' },
      { fieldName: 'qualification', displayName: 'Qualification', dataType: 'string', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Education' },
      { fieldName: 'gender', displayName: 'Gender', dataType: 'enum', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Personal' },
      { fieldName: 'skills', displayName: 'Skills', dataType: 'array', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Experience' },
      { fieldName: 'resume', displayName: 'Resume', dataType: 'string', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Documents' },
    ],
    excelColumnMappings: [
      { excelColumnName: 'Name', systemFieldName: 'name', dataTransform: 'trim', required: true },
      { excelColumnName: 'Email', systemFieldName: 'email', dataTransform: 'trim', required: false },
      { excelColumnName: 'Phone', systemFieldName: 'phone', dataTransform: 'trim', required: true },
      { excelColumnName: 'Location', systemFieldName: 'currentLocation', dataTransform: 'trim', required: false },
      { excelColumnName: 'Skills', systemFieldName: 'skills', dataTransform: 'split_by_comma', required: false },
    ],
    features: {
      excelImportEnabled: true,
      resumeParsingEnabled: true,
      bulkOperationsEnabled: true,
      duplicateDetectionEnabled: true,
      advancedFiltersEnabled: true,
    },
  },
  tl: {
    fields: [
      { fieldName: 'name', displayName: 'Candidate Name', dataType: 'string', visibility: { hidden: false, readonly: false, mandatory: true }, validation: { minLength: 2, maxLength: 100 }, category: 'Personal' },
      { fieldName: 'email', displayName: 'Email Address', dataType: 'email', visibility: { hidden: false, readonly: false, mandatory: false }, validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }, category: 'Personal' },
      { fieldName: 'phone', displayName: 'Contact Number', dataType: 'phone', visibility: { hidden: false, readonly: true, mandatory: true }, validation: { pattern: '^\\d{10}$' }, category: 'Personal' },
      { fieldName: 'secondCallStatus', displayName: 'Second Call Status', dataType: 'enum', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'CallStatus' },
      { fieldName: 'finalInterviewStatus', displayName: 'Final Interview Status', dataType: 'enum', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Interview' },
    ],
    features: {
      excelImportEnabled: true,
      resumeParsingEnabled: true,
      bulkOperationsEnabled: false,
      duplicateDetectionEnabled: true,
      advancedFiltersEnabled: true,
    },
  },
  manager: {
    fields: [
      { fieldName: 'name', displayName: 'Candidate Name', dataType: 'string', visibility: { hidden: false, readonly: true, mandatory: false }, category: 'Personal' },
      { fieldName: 'phone', displayName: 'Contact Number', dataType: 'phone', visibility: { hidden: false, readonly: true, mandatory: false }, category: 'Personal' },
      { fieldName: 'email', displayName: 'Email Address', dataType: 'email', visibility: { hidden: false, readonly: true, mandatory: false }, category: 'Personal' },
    ],
    features: {
      excelImportEnabled: false,
      resumeParsingEnabled: false,
      bulkOperationsEnabled: false,
      duplicateDetectionEnabled: true,
      advancedFiltersEnabled: true,
    },
  },
  admin: {
    fields: [
      { fieldName: 'name', displayName: 'Candidate Name', dataType: 'string', visibility: { hidden: false, readonly: false, mandatory: true }, category: 'Personal' },
      { fieldName: 'email', displayName: 'Email Address', dataType: 'email', visibility: { hidden: false, readonly: false, mandatory: false }, category: 'Personal' },
      { fieldName: 'phone', displayName: 'Contact Number', dataType: 'phone', visibility: { hidden: false, readonly: false, mandatory: true }, category: 'Personal' },
    ],
    features: {
      excelImportEnabled: true,
      resumeParsingEnabled: true,
      bulkOperationsEnabled: true,
      duplicateDetectionEnabled: true,
      advancedFiltersEnabled: true,
    },
  },
};

// GET /api/admin/field-config/:role
exports.getConfig = async (req, res, next) => {
  try {
    const { role } = req.params;

    if (!['recruiter', 'tl', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    let config = await FieldConfig.findOne({ role });

    // Return default if not configured yet
    if (!config) {
      config = DEFAULT_FIELD_CONFIGS[role];
      return res.json({ message: 'Using default configuration', ...config, isDefault: true });
    }

    res.json(config);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/field-config/:role
exports.updateConfig = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { fields, excelColumnMappings, features } = req.body;

    if (!['recruiter', 'tl', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const config = await FieldConfig.findOneAndUpdate(
      { role },
      {
        fields: fields || [],
        excelColumnMappings: excelColumnMappings || [],
        features: features || {},
        updatedBy: req.user._id,
        updatedByName: req.user.name,
      },
      { new: true, upsert: true }
    );

    await createLog({
      type: 'edit',
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: `Updated field configuration for role: ${role}`,
      ip: req.ip,
    });

    res.json({ message: 'Configuration updated successfully', config });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/field-config/presets/list
exports.getPresets = async (req, res, next) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({ message: 'Role parameter is required' });
    }

    const config = await FieldConfig.findOne({ role });

    if (!config) {
      return res.json({ presets: [] });
    }

    res.json({ presets: config.importPresets || [] });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/field-config/presets
exports.savePreset = async (req, res, next) => {
  try {
    const { role, name, description, mapping } = req.body;

    if (!role || !name || !mapping) {
      return res.status(400).json({ message: 'role, name, and mapping are required' });
    }

    const config = await FieldConfig.findOneAndUpdate(
      { role },
      {
        $push: {
          importPresets: {
            _id: new (require('mongoose').Types.ObjectId)(),
            name,
            description,
            mapping,
            isDefault: false,
          },
        },
      },
      { new: true, upsert: true }
    );

    await createLog({
      type: 'create',
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: `Created import preset: ${name}`,
      ip: req.ip,
    });

    res.json({ message: 'Preset saved successfully', presets: config.importPresets });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/field-config/presets/:presetId
exports.deletePreset = async (req, res, next) => {
  try {
    const { role } = req.query;
    const { presetId } = req.params;

    if (!role) {
      return res.status(400).json({ message: 'Role parameter is required' });
    }

    const config = await FieldConfig.findOneAndUpdate(
      { role },
      { $pull: { importPresets: { _id: presetId } } },
      { new: true }
    );

    await createLog({
      type: 'delete',
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: 'Deleted import preset',
      ip: req.ip,
    });

    res.json({ message: 'Preset deleted successfully', presets: config.importPresets });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/field-config/reset
exports.resetToDefaults = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'role is required' });
    }

    if (!['recruiter', 'tl', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const defaultConfig = DEFAULT_FIELD_CONFIGS[role];
    const config = await FieldConfig.findOneAndUpdate(
      { role },
      {
        ...defaultConfig,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
      },
      { new: true, upsert: true }
    );

    await createLog({
      type: 'edit',
      user: req.user._id,
      userName: req.user.name,
      role: req.user.role,
      action: `Reset field configuration for role: ${role} to defaults`,
      ip: req.ip,
    });

    res.json({ message: `Configuration reset to defaults for role: ${role}`, config });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/field-config/all
exports.getAllConfigs = async (req, res, next) => {
  try {
    const configs = await FieldConfig.find();

    if (configs.length === 0) {
      // Return all defaults
      const defaults = Object.entries(DEFAULT_FIELD_CONFIGS).map(([role, config]) => ({
        role,
        ...config,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      return res.json({ message: 'Using default configurations', configs: defaults, isDefault: true });
    }

    res.json({ configs });
  } catch (err) {
    next(err);
  }
};
