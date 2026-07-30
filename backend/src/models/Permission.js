const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  role: { type: String, enum: ['recruiter', 'tl', 'manager', 'admin'], required: true, unique: true },
  permissions: {
    view_resumes: { type: Boolean, default: false },
    add_resumes: { type: Boolean, default: false },
    edit_resumes: { type: Boolean, default: false },
    delete_resumes: { type: Boolean, default: false },
    make_calls: { type: Boolean, default: false },
    view_call_history: { type: Boolean, default: false },
    walkin_register: { type: Boolean, default: false },
    view_reports: { type: Boolean, default: false },
    export_reports: { type: Boolean, default: false },
    manage_team: { type: Boolean, default: false },
    correction: { type: Boolean, default: false },
    view_salary: { type: Boolean, default: false },
    view_revenue: { type: Boolean, default: false },
    manage_users: { type: Boolean, default: false },
    access_control: { type: Boolean, default: false },
    view_logs: { type: Boolean, default: false },
    manage_attendance: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
