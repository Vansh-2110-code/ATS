const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in env');
    process.exit(1);
  }
  
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB database successfully!');
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  console.log('\nWiping collections...');
  for (const col of collections) {
    const name = col.name;
    
    // Skip system indexes/collections
    if (name.startsWith('system.')) continue;
    
    if (name === 'users') {
      const result = await db.collection(name).deleteMany({ employeeId: { $ne: 'EMP001' } });
      console.log(`🧹 Collection [${name}]: Kept Admin 'EMP001', deleted ${result.deletedCount} other users.`);
    } else if (name === 'permissions') {
      await db.collection(name).deleteMany({});
      console.log(`🧹 Collection [${name}]: Cleared and ready to re-seed.`);
    } else {
      const result = await db.collection(name).deleteMany({});
      console.log(`🧹 Collection [${name}]: Wiped all ${result.deletedCount} documents.`);
    }
  }
  
  // Re-seed default permissions
  console.log('\nSeeding default permissions...');
  const Permission = require('../models/Permission');
  await Permission.create([
    { role: 'recruiter', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false, make_calls: true, view_call_history: true, walkin_register: true, view_reports: false, export_reports: false, manage_team: false, correction: false, view_salary: false, view_revenue: false, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'tl', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false, make_calls: true, view_call_history: true, walkin_register: true, view_reports: true, export_reports: false, manage_team: true, correction: true, view_salary: false, view_revenue: false, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'manager', permissions: { view_resumes: true, add_resumes: false, edit_resumes: false, delete_resumes: false, make_calls: false, view_call_history: true, walkin_register: false, view_reports: true, export_reports: true, manage_team: true, correction: false, view_salary: true, view_revenue: true, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'admin', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: true, make_calls: true, view_call_history: true, walkin_register: true, view_reports: true, export_reports: true, manage_team: true, correction: true, view_salary: true, view_revenue: true, manage_users: true, access_control: true, view_logs: true, manage_attendance: true } },
  ]);
  console.log('✅ Seeded default system permissions.');
  
  // Make sure the admin user actually exists
  const User = require('../models/User');
  const adminExists = await User.findOne({ employeeId: 'EMP001' });
  if (!adminExists) {
    console.log('\nAdmin EMP001 not found. Re-creating default Admin user...');
    await User.create({
      name: 'System Administrator',
      email: 'admin@whitehorsemanpower.in',
      employeeId: 'EMP001',
      password: 'Password2026!',
      role: 'admin',
      isWFH: false,
      status: 'Active'
    });
    console.log('✅ Default Admin account created successfully! Password: Password2026!');
  } else {
    console.log('\n✅ Admin account EMP001 is kept safe in the database.');
  }
  
  console.log('\n🎉 DATABASE CLEANUP COMPLETED SUCCESSFULLY!');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
