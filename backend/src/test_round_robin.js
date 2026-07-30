require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Candidate = require('./models/Candidate');

// Copy-pasted helper from public.controller.js to test locally
async function getNextRoundRobinRecruiter() {
  try {
    const recruiters = await User.find({ role: 'recruiter', status: 'Active' });
    if (recruiters.length === 0) return null;

    const recruitersWithLastAssignment = await Promise.all(recruiters.map(async (r) => {
      const lastCandidate = await Candidate.findOne({ assignedRecruiter: r._id })
        .sort({ assignedAt: -1 })
        .select('assignedAt');
      return {
        recruiter: r,
        lastAssignedAt: lastCandidate && lastCandidate.assignedAt ? lastCandidate.assignedAt.getTime() : 0
      };
    }));

    recruitersWithLastAssignment.sort((a, b) => a.lastAssignedAt - b.lastAssignedAt);
    return recruitersWithLastAssignment[0].recruiter;
  } catch (err) {
    console.error('Error in getNextRoundRobinRecruiter:', err);
    return null;
  }
}

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for round robin validation.');

  try {
    // 1. Get active recruiters list to verify order
    const recruiters = await User.find({ role: 'recruiter', status: 'Active' });
    if (recruiters.length < 2) {
      console.log('Needs at least 2 active recruiters in DB to validate rotation. Run npm run seed first.');
      await mongoose.disconnect();
      return;
    }

    console.log(`Active recruiters in rotation: ${recruiters.map(r => r.name).join(', ')}`);

    // 2. Perform 3 round robin selections and mock create them
    const createdCandidateIds = [];
    const assignmentSequence = [];

    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Simulating Candidate Registration ${i} ---`);
      const recruiter = await getNextRoundRobinRecruiter();
      console.log(`Selected recruiter for assignment: ${recruiter.name} (ID: ${recruiter._id})`);
      
      const candidate = await Candidate.create({
        name: `RR Test Candidate ${i}`,
        phone: `00000000${i}0`,
        email: `rr.test.${i}@gmail.com`,
        source: 'Company Website',
        appliedViaPublic: true,
        status: 'New',
        assignedRecruiter: recruiter._id,
        assignedRecruiterName: recruiter.name,
        ownershipStatus: 'Assigned',
        assignedAt: new Date(),
      });

      createdCandidateIds.push(candidate._id);
      assignmentSequence.push(recruiter._id.toString());
    }

    console.log('\n--- Assignment Sequence Verification ---');
    console.log('Recruiter IDs assigned:', assignmentSequence);

    // Verify rotation: candidate 1 and candidate 2 should NOT be assigned to the same recruiter (since there are >= 2 recruiters)
    if (assignmentSequence[0] === assignmentSequence[1]) {
      throw new Error('Rotation failed: Candidate 1 and Candidate 2 assigned to the same recruiter');
    }

    // Candidate 3 should rotate further
    if (recruiters.length >= 3 && (assignmentSequence[2] === assignmentSequence[0] || assignmentSequence[2] === assignmentSequence[1])) {
      throw new Error('Rotation failed: Candidate 3 should be assigned to the third recruiter');
    }

    console.log('Sequence rotation verified successfully!');

    // 3. Clean up
    console.log('\nCleaning up test candidates...');
    await Candidate.deleteMany({ _id: { $in: createdCandidateIds } });
    console.log('Cleanup completed.');
    console.log('\nAll round robin tests passed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run().catch(console.error);
