require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Candidate = require('./models/Candidate');

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI);
  
  const candidates = await Candidate.find({
    resumePath: { $exists: true, $ne: null }
  }).select('name resumePath resumeOriginalName source createdAt');
  
  console.log(`Found ${candidates.length} candidates with resumes:`);
  for (const c of candidates) {
    console.log(`Name: ${c.name}, Source: ${c.source}, ResumePath: ${c.resumePath}, OriginalName: ${c.resumeOriginalName}`);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
