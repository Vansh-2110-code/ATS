require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Candidate = require('./models/Candidate');
const candidateController = require('./controllers/candidate.controller');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const recruiter = await User.findOne({ employeeId: 'REC001' });
  if (!recruiter) {
    console.error('REC001 not found');
    process.exit(1);
  }

  // Simulate req.user
  const req = {
    user: recruiter,
    query: { limit: '1000' }
  };

  // Mock res
  const res = {
    json: (data) => {
      console.log('\nCandidates returned by controller:');
      console.log(`Count: ${data.candidates.length}`);
      data.candidates.forEach(c => {
        console.log(`Name: ${c.name} | Recruiter: ${c.assignedRecruiterName} | Status: ${c.status} | Source: ${c.source} | Ownership: ${c.ownershipStatus}`);
      });
    }
  };

  const next = (err) => {
    if (err) console.error('Controller Error:', err);
  };

  await candidateController.list(req, res, next);

  await mongoose.disconnect();
}

run().catch(console.error);
