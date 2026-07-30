const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/ats_db');
  const Candidate = require('./backend/src/models/Candidate');
  const c = await Candidate.findOne({ resumePath: /871b8ede/ });
  console.log(JSON.stringify(c, null, 2));
  process.exit(0);
}
check();
