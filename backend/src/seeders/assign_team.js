require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const TeamMember = require('../models/TeamMember');

async function assignTeam() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  try {
    const tl = await User.findOne({ employeeId: 'TL001' });
    if (!tl) {
      console.error('Error: TL001 (Suresh Menon) not found');
      await mongoose.disconnect();
      return;
    }

    const recruiters = await User.find({ role: 'recruiter' });
    console.log(`Found ${recruiters.length} recruiters.`);

    // Clear existing team member mappings first
    await TeamMember.deleteMany({ teamLeaderId: tl._id });
    console.log(`Cleared existing team assignments for TL ${tl.name}`);

    // Create new mappings
    const mappings = recruiters.map(r => ({
      teamLeaderId: tl._id,
      memberId: r._id,
      role: 'recruiter',
      addedAt: new Date()
    }));

    await TeamMember.create(mappings);
    console.log(`Successfully assigned ${recruiters.length} recruiters to ${tl.name}'s team!`);

  } catch (error) {
    console.error('Error assigning team:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

assignTeam();
