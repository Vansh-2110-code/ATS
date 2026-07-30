require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Candidate = require('./models/Candidate');

async function verifyLockout() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for lockout validation.');

  try {
    // 1. Get two active recruiters
    const recruiters = await User.find({ role: 'recruiter', status: 'Active' }).limit(2);
    if (recruiters.length < 2) {
      console.log('Needs at least 2 active recruiters. Please seed DB first.');
      await mongoose.disconnect();
      return;
    }

    const recruiterA = recruiters[0];
    const recruiterB = recruiters[1];
    console.log(`Recruiter A: ${recruiterA.name} (${recruiterA._id})`);
    console.log(`Recruiter B: ${recruiterB.name} (${recruiterB._id})`);

    // 2. Create candidate assigned to Recruiter A (Assigned today - 0 days ago)
    console.log('\n--- Scenario 1: Candidate assigned to Recruiter A today (< 30 days) ---');
    const cand = await Candidate.create({
      name: 'Privacy Lockout Test Candidate',
      phone: '9999988888',
      email: 'privacy.test@email.com',
      source: 'Naukri',
      status: 'Interested',
      assignedRecruiter: recruiterA._id,
      assignedRecruiterName: recruiterA.name,
      ownershipStatus: 'Assigned',
      assignedAt: new Date(),
    });
    console.log(`Created candidate: ${cand.name} assigned to ${recruiterA.name}`);

    // Helpers to simulate backend visibility checks
    function isVisibleInDetails(candidate, user) {
      const isOwner = String(candidate.assignedRecruiter || '') === String(user._id);
      
      const lastActivity = candidate.assignedAt || candidate.createdAt;
      const daysSinceAssignment = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysSinceAssignment >= 30;
      
      const isGeneral = candidate.ownershipStatus === 'General Data';
      const isWalkIn = candidate.source === 'Walk-In';

      return isOwner || isGeneral || isExpired || isWalkIn;
    }

    async function isVisibleInList(candidateId, user) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const query = {
        _id: candidateId,
        $or: [
          { assignedRecruiter: user._id },
          { ownershipStatus: 'General Data' },
          { assignedAt: { $lt: thirtyDaysAgo } }
        ]
      };
      const match = await Candidate.findOne(query);
      return !!match;
    }

    // Verify visibility for Recruiter A
    const visDetailsA = isVisibleInDetails(cand, recruiterA);
    const visListA = await isVisibleInList(cand._id, recruiterA);
    console.log(`Visible to Recruiter A (Owner) - Details: ${visDetailsA} | List: ${visListA}`);
    if (!visDetailsA || !visListA) {
      throw new Error('Lockout failure: Recruiter A (Owner) should be able to see the candidate');
    }

    // Verify lockout for Recruiter B
    const visDetailsB = isVisibleInDetails(cand, recruiterB);
    const visListB = await isVisibleInList(cand._id, recruiterB);
    console.log(`Visible to Recruiter B (Non-Owner) - Details: ${visDetailsB} | List: ${visListB}`);
    if (visDetailsB || visListB) {
      throw new Error('Lockout failure: Recruiter B should be BLOCKED from seeing the candidate');
    }
    console.log('Scenario 1 passed: Candidate is correctly locked to Recruiter A.');

    // 3. Update candidate's assignment to 32 days ago (Expired)
    console.log('\n--- Scenario 2: Candidate assignment is 32 days old (>= 30 days) ---');
    const thirtyTwoDaysAgo = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000);
    cand.assignedAt = thirtyTwoDaysAgo;
    cand.ownershipStatus = 'Expired';
    await cand.save();
    console.log('Updated candidate assignment to 32 days ago.');

    // Verify visibility for Recruiter B now
    const updatedCand = await Candidate.findById(cand._id);
    const visDetailsBExpired = isVisibleInDetails(updatedCand, recruiterB);
    const visListBExpired = await isVisibleInList(cand._id, recruiterB);
    console.log(`Visible to Recruiter B after 30 days - Details: ${visDetailsBExpired} | List: ${visListBExpired}`);
    if (!visDetailsBExpired || !visListBExpired) {
      throw new Error('Lockout failure: Recruiter B should be ALLOWED to see the candidate after 30 days');
    }
    console.log('Scenario 2 passed: Candidate is correctly visible after 30 days.');

    // 4. Cleanup
    console.log('\nCleaning up test candidate...');
    await Candidate.findByIdAndDelete(cand._id);
    console.log('Cleanup completed.');
    console.log('\nLockout validation test passed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

verifyLockout().catch(console.error);
