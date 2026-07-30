const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB...');

  // Reset password for EMP008 (admin)
  const newPassword = 'Admin@123';
  const hashed = await bcrypt.hash(newPassword, 12);

  const result = await User.updateOne(
    { employeeId: 'EMP008' },
    { $set: { password: hashed } }
  );
  console.log('EMP008 updated:', result.modifiedCount, 'document(s)');

  // Also reset EMP001 (recruiter)
  const result2 = await User.updateOne(
    { employeeId: 'EMP001' },
    { $set: { password: hashed } }
  );
  console.log('EMP001 updated:', result2.modifiedCount, 'document(s)');

  // Also reset EMP006 (TL)
  const result3 = await User.updateOne(
    { employeeId: 'EMP006' },
    { $set: { password: hashed } }
  );
  console.log('EMP006 updated:', result3.modifiedCount, 'document(s)');

  // Also reset EMP007 (Manager)
  const result4 = await User.updateOne(
    { employeeId: 'EMP007' },
    { $set: { password: hashed } }
  );
  console.log('EMP007 updated:', result4.modifiedCount, 'document(s)');

  console.log('\n✅ All passwords reset to: Admin@123');
  await mongoose.disconnect();
}

run().catch(console.error);
