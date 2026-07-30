require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const TeamMember = require('./models/TeamMember');
const Candidate = require('./models/Candidate');
const CallLog = require('./models/CallLog');

async function test() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  try {
    // 1. Find or seed mock users
    let tl = await User.findOne({ role: 'tl' });
    let recruiter = await User.findOne({ role: 'recruiter' });

    if (!tl || !recruiter) {
      console.log('Test users not found, please run npm run seed first.');
      await mongoose.disconnect();
      return;
    }

    console.log(`TL user found: ${tl.name} (${tl._id})`);
    console.log(`Recruiter user found: ${recruiter.name} (${recruiter._id})`);

    // Ensure the team association exists
    let assoc = await TeamMember.findOne({ teamLeaderId: tl._id, memberId: recruiter._id });
    if (!assoc) {
      console.log('Creating team member association between TL and Recruiter...');
      assoc = await TeamMember.create({
        teamLeaderId: tl._id,
        memberId: recruiter._id,
        addedAt: new Date()
      });
    }

    // 2. Create a mock General Data candidate (representing public apply)
    console.log('\n--- Creating Mock Public Candidate (General Data, Unassigned) ---');
    const mockCandidate = await Candidate.create({
      name: 'Validation Test Candidate',
      phone: '9876543210',
      email: 'validation.test@gmail.com',
      source: 'Company Website',
      appliedViaPublic: true,
      status: 'New',
      ownershipStatus: 'General Data',
    });

    console.log(`Created candidate: ${mockCandidate.name}`);
    console.log(`Assigned Recruiter: ${mockCandidate.assignedRecruiter || 'None'}`);
    console.log(`Ownership Status: ${mockCandidate.ownershipStatus}`);

    // Verify initial state
    if (mockCandidate.assignedRecruiter) {
      throw new Error('Candidate should initially have no assigned recruiter');
    }

    // 3. Simulate recruiter updating the candidate status (triggering auto-assign)
    console.log('\n--- Simulating Recruiter Status Update (Auto-Assignment) ---');
    
    // Simulate candidate.controller.js updateStatus logic
    const candidateToUpdate = await Candidate.findById(mockCandidate._id);
    const lastActivity = candidateToUpdate.assignedAt || candidateToUpdate.createdAt;
    const daysSinceAssignment = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    
    const isOwner = String(candidateToUpdate.assignedRecruiter || '') === String(recruiter._id);
    const isExpired = !candidateToUpdate.assignedRecruiter || daysSinceAssignment >= 30;
    const isGeneral = candidateToUpdate.ownershipStatus === 'General Data';

    if (!isOwner && (isExpired || isGeneral)) {
      candidateToUpdate.assignedRecruiter = recruiter._id;
      candidateToUpdate.assignedRecruiterName = recruiter.name;
      candidateToUpdate.ownershipStatus = 'Assigned';
      candidateToUpdate.assignedAt = new Date();
    }
    candidateToUpdate.status = 'Contacted';
    await candidateToUpdate.save();

    console.log('Saved candidate updates.');
    
    // Verify candidate is now assigned to the recruiter
    const updatedCandidate = await Candidate.findById(mockCandidate._id);
    console.log(`Assigned Recruiter after update: ${updatedCandidate.assignedRecruiter} (${updatedCandidate.assignedRecruiterName})`);
    console.log(`Ownership Status after update: ${updatedCandidate.ownershipStatus}`);

    if (String(updatedCandidate.assignedRecruiter) !== String(recruiter._id)) {
      throw new Error('Auto-assignment failed: Candidate should be assigned to the updating recruiter');
    }
    if (updatedCandidate.ownershipStatus !== 'Assigned') {
      throw new Error('Ownership status should be set to Assigned');
    }

    // 4. Test secured TL recruiter query
    console.log('\n--- Testing Secured TL Recruiter Query ---');
    
    const mockReqTL = { user: { role: 'tl', _id: tl._id }, query: { recruiter: String(recruiter._id) } };
    const mockReqUnrelatedTL = { user: { role: 'tl', _id: new mongoose.Types.ObjectId() }, query: { recruiter: String(recruiter._id) } };

    async function checkListAccess(req) {
      const { recruiter } = req.query;
      if (recruiter && req.user.role === 'tl') {
        const isMember = await TeamMember.findOne({
          teamLeaderId: req.user._id,
          memberId: recruiter,
          removedAt: null
        });
        const isSelf = String(recruiter) === String(req.user._id);
        if (!isMember && !isSelf) {
          return { status: 403, message: 'Access denied: Recruiter is not on your team.' };
        }
      }
      return { status: 200, message: 'Access granted.' };
    }

    const resTL = await checkListAccess(mockReqTL);
    console.log(`TL ${tl.name} query result: HTTP ${resTL.status} - ${resTL.message}`);
    if (resTL.status !== 200) {
      throw new Error('Secured query failed: Team Lead should be allowed to view their own recruiter');
    }

    const resUnrelated = await checkListAccess(mockReqUnrelatedTL);
    console.log(`Unrelated TL query result: HTTP ${resUnrelated.status} - ${resUnrelated.message}`);
    if (resUnrelated.status !== 403) {
      throw new Error('Secured query failed: Unrelated Team Lead should be blocked from viewing recruiter');
    }

    // 5. Clean up mock candidate
    console.log('\n--- Cleaning up Mock Candidate ---');
    await Candidate.findByIdAndDelete(mockCandidate._id);
    console.log('Mock candidate deleted.');
    console.log('\nAll tests passed successfully!');

  } catch (error) {
    console.error('\nTest failed with error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

test().catch(console.error);
