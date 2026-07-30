require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const TeamMember = require('./models/TeamMember');

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for joining visibility validation.');

  try {
    // Get Recruiter A, Recruiter B, and TL
    const recruiterA = await User.findOne({ email: 'rahul@whm.com' });
    const recruiterB = await User.findOne({ email: 'priya@whm.com' });
    const tl = await User.findOne({ email: 'suresh@whm.com' }); // TL

    if (!recruiterA || !recruiterB || !tl) {
      console.log('Missing seeded users. Run seeds first.');
      return;
    }

    console.log(`Recruiter A: ${recruiterA.name} (${recruiterA._id})`);
    console.log(`Recruiter B: ${recruiterB.name} (${recruiterB._id})`);
    console.log(`Team Lead: ${tl.name} (${tl._id})`);

    // Create a mock Employee joining record created by Recruiter A
    const empRecord = await Employee.create({
      employeeId: 'TEST-EMP-999',
      fullName: 'Test Joining Visibility Candidate',
      email: 'vis.test@gmail.com',
      phone: '9876543210',
      role: 'Recruiter',
      joiningDate: new Date(),
      createdBy: recruiterA._id
    });

    console.log(`Created mock employee joining record: ${empRecord.fullName} (CreatedBy: Recruiter A)`);

    // Let's simulate list query for Recruiter A (Owner)
    const listRecruiterA = await Employee.find({ createdBy: recruiterA._id });
    const hasRecordA = listRecruiterA.some(e => e._id.toString() === empRecord._id.toString());
    console.log(`Visible to Recruiter A (Owner) in list: ${hasRecordA}`);

    // Let's simulate list query for Recruiter B (Non-owner)
    const listRecruiterB = await Employee.find({ createdBy: recruiterB._id });
    const hasRecordB = listRecruiterB.some(e => e._id.toString() === empRecord._id.toString());
    console.log(`Visible to Recruiter B (Non-Owner) in list: ${hasRecordB}`);

    // Let's simulate list query for TL
    // Check if Recruiter A is on TL's team
    const isMember = await TeamMember.findOne({
      teamLeaderId: tl._id,
      memberId: recruiterA._id,
      removedAt: null
    });
    console.log(`Is Recruiter A on TL's team? ${!!isMember}`);

    const teamMembers = await TeamMember.find({
      teamLeaderId: tl._id,
      removedAt: null,
    }).select('memberId');
    const memberIds = teamMembers.map(t => t.memberId);
    memberIds.push(tl._id);

    const listTL = await Employee.find({ createdBy: { $in: memberIds } });
    const hasRecordTL = listTL.some(e => e._id.toString() === empRecord._id.toString());
    console.log(`Visible to Team Lead in list: ${hasRecordTL}`);

    // Clean up
    console.log('Cleaning up mock employee record...');
    await Employee.deleteOne({ _id: empRecord._id });
    console.log('Cleanup completed.');

    if (hasRecordA === true && hasRecordB === false && hasRecordTL === !!isMember) {
      console.log('Joining visibility test passed successfully!');
    } else {
      console.log('Test failed: unexpected visibility configuration');
    }

  } catch (err) {
    console.error('Validation test failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run().catch(console.error);
