require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Candidate = require('../models/Candidate');
const CallLog = require('../models/CallLog');
const Interview = require('../models/Interview');
const WalkIn = require('../models/WalkIn');
const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');
const AuditLog = require('../models/AuditLog');
const Permission = require('../models/Permission');
const Invoice = require('../models/Invoice');
const TeamMember = require('../models/TeamMember');

// Attempt to load Employee model dynamically if it exists
let Employee;
try {
  Employee = require('../models/Employee');
} catch (e) {
  // If no separate Employee model, it might be handled by another schema
}

async function initAdmin() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ats_db';
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for production initialization...');

  // 1. Clear all existing data
  const deletePromises = [
    User.deleteMany({}),
    Candidate.deleteMany({}),
    CallLog.deleteMany({}),
    Interview.deleteMany({}),
    WalkIn.deleteMany({}),
    Attendance.deleteMany({}),
    Holiday.deleteMany({}),
    AuditLog.deleteMany({}),
    Permission.deleteMany({}),
    Invoice.deleteMany({}),
    TeamMember.deleteMany({}),
  ];

  if (Employee) {
    deletePromises.push(Employee.deleteMany({}));
  }

  await Promise.all(deletePromises);
  console.log('✅ Cleared all demo database collections successfully.');

  // 2. Seed Default Permissions (Crucial for ATS app functionality)
  await Permission.create([
    { role: 'recruiter', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false, make_calls: true, view_call_history: true, walkin_register: true, view_reports: false, export_reports: false, manage_team: false, correction: false, view_salary: false, view_revenue: false, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'tl', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false, make_calls: true, view_call_history: true, walkin_register: true, view_reports: true, export_reports: false, manage_team: true, correction: true, view_salary: false, view_revenue: false, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'manager', permissions: { view_resumes: true, add_resumes: false, edit_resumes: false, delete_resumes: false, make_calls: false, view_call_history: true, walkin_register: false, view_reports: true, export_reports: true, manage_team: true, correction: false, view_salary: true, view_revenue: true, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'admin', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: true, make_calls: true, view_call_history: true, walkin_register: true, view_reports: true, export_reports: true, manage_team: true, correction: true, view_salary: true, view_revenue: true, manage_users: true, access_control: true, view_logs: true, manage_attendance: true } },
  ]);
  console.log('✅ Seeded default system permissions.');

  // 3. Create the initial production Admin account
  const adminUser = await User.create({
    name: 'System Administrator',
    email: 'admin@whitehorsemanpower.in',
    employeeId: 'EMP001',
    password: 'Password2026!',
    role: 'admin',
    isWFH: false,
    status: 'Active'
  });
  console.log(`✅ Production Admin account created successfully!`);
  console.log('────────────────────────────────────────────────');
  console.log(`Username (Employee ID): ${adminUser.employeeId}`);
  console.log(`Password: Password2026!`);
  console.log('────────────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

initAdmin().catch(err => {
  console.error('Initialization error:', err);
  process.exit(1);
});
