const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({}, 'name email employeeId role').lean();
  console.log('Current users in DB:', users);
  await mongoose.disconnect();
}
run().catch(console.error);
