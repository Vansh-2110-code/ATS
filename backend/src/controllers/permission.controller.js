const Permission = require('../models/Permission');
const { createLog } = require('../utils/auditLogger');

// GET /api/permissions
exports.getAll = async (req, res, next) => {
  try {
    let permissions = await Permission.find();
    
    // Seed defaults if none exist
    if (permissions.length === 0) {
      const defaults = [
        {
          role: 'recruiter',
          permissions: {
            view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false,
            make_calls: true, view_call_history: true, walkin_register: true,
            view_reports: false, export_reports: false, manage_team: false, correction: false,
            view_salary: false, view_revenue: false, manage_users: false,
            access_control: false, view_logs: false, manage_attendance: false,
          },
        },
        {
          role: 'tl',
          permissions: {
            view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false,
            make_calls: true, view_call_history: true, walkin_register: true,
            view_reports: true, export_reports: false, manage_team: true, correction: true,
            view_salary: false, view_revenue: false, manage_users: false,
            access_control: false, view_logs: false, manage_attendance: false,
          },
        },
        {
          role: 'manager',
          permissions: {
            view_resumes: true, add_resumes: false, edit_resumes: false, delete_resumes: false,
            make_calls: false, view_call_history: true, walkin_register: false,
            view_reports: true, export_reports: true, manage_team: true, correction: false,
            view_salary: true, view_revenue: true, manage_users: false,
            access_control: false, view_logs: false, manage_attendance: false,
          },
        },
        {
          role: 'admin',
          permissions: {
            view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: true,
            make_calls: true, view_call_history: true, walkin_register: true,
            view_reports: true, export_reports: true, manage_team: true, correction: true,
            view_salary: true, view_revenue: true, manage_users: true,
            access_control: true, view_logs: true, manage_attendance: true,
          },
        },
      ];
      permissions = await Permission.insertMany(defaults);
    }

    res.json(permissions);
  } catch (err) {
    next(err);
  }
};

// PUT /api/permissions
exports.update = async (req, res, next) => {
  try {
    const { permissions } = req.body; // Array of { role, permissions: {...} }
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ message: 'permissions must be a non-empty array' });
    }
    
    const results = [];
    for (const perm of permissions) {
      const updated = await Permission.findOneAndUpdate(
        { role: perm.role },
        { permissions: perm.permissions },
        { new: true, upsert: true }
      );
      results.push(updated);
    }

    await createLog({
      type: 'edit', user: req.user._id, userName: req.user.name,
      role: req.user.role, action: 'Updated permission matrix',
      ip: req.ip,
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
};
