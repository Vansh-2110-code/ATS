require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('./models/Candidate');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    const candidates = await Candidate.find({}).limit(3);
    for (let c of candidates) {
      c.status = 'Rejected';
      await c.save();
      console.log('Rejected candidate:', c.name);
    }
    console.log('Done');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
