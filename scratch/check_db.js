const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false }));

  const users = await User.find({});
  console.log('\n--- USERS ---');
  for (const u of users) {
    const candidateCount = await Candidate.countDocuments({ assignedRecruiter: u._id });
    console.log(`ID: ${u._id} | Name: ${u.name} | Role: ${u.role} | EmpID: ${u.employeeId} | Candidate Count: ${candidateCount}`);
  }

  const allCandidates = await Candidate.find({});
  console.log(`\nTotal Candidates: ${allCandidates.length}`);
  console.log('\n--- CANDIDATES SAMPLE ---');
  for (const c of allCandidates.slice(0, 5)) {
    console.log(`Name: ${c.name} | RecruiterID: ${c.assignedRecruiter} | RecruiterName: ${c.assignedRecruiterName} | Ownership: ${c.ownershipStatus}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
