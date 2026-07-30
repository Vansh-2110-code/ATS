const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;
console.log('Connecting to URI:', uri.replace(/:([^:@]+)@/, ':****@'));

mongoose.set('debug', true);

mongoose.connect(uri)
  .then(() => {
    console.log('Connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed with error:', err);
    process.exit(1);
  });
