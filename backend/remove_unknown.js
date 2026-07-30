require('dotenv').config();
const mongoose = require('mongoose');

const Candidate = require('./src/models/Candidate'); // Update path if needed

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const result = await Candidate.deleteMany({
      name: 'Unknown Candidate',
      importedFrom: 'Excel'
    });

    console.log(`Deleted ${result.deletedCount} unknown candidates imported from Excel.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

run();
