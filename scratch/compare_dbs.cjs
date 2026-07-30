const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;

const vanshUri = 'mongodb+srv://vansh_db_user:VC2vcyqPHljmBqwx@cluster0.k8jlliz.mongodb.net/?appName=Cluster0';
const naveenUri = 'mongodb+srv://naveenecerljit_db_user:Navi2026mys@cluster0.trxc9r6.mongodb.net/ats_db?appName=Cluster0';

async function analyzeDb(uri, label) {
  console.log(`Connecting to ${label}...`);
  const client = new MongoClient(uri);
  await client.connect();
  
  // List all databases to find the correct one
  const adminDb = client.db().admin();
  const dbs = await adminDb.listDatabases();
  
  // Choose the database (prefer 'ats_db' or 'test' or whatever exists)
  let targetDbName = 'test';
  const dbNames = dbs.databases.map(d => d.name);
  console.log(`Available databases in ${label}: ${dbNames.join(', ')}`);
  
  if (dbNames.includes('ats_db')) {
    targetDbName = 'ats_db';
  } else if (dbNames.includes('ats')) {
    targetDbName = 'ats';
  } else {
    // Fallback to first non-system database
    const nonSystem = dbNames.find(name => !['admin', 'local', 'config'].includes(name));
    if (nonSystem) targetDbName = nonSystem;
  }
  
  const db = client.db(targetDbName);
  console.log(`Using database: ${db.databaseName}`);
  
  const collections = await db.listCollections().toArray();
  const result = {};
  
  for (const col of collections) {
    const name = col.name;
    // Get sample documents to extract schema keys
    const docs = await db.collection(name).find().limit(50).toArray();
    const fields = new Set();
    docs.forEach(doc => {
      Object.keys(doc).forEach(k => fields.add(k));
    });
    result[name] = {
      count: await db.collection(name).countDocuments(),
      fields: Array.from(fields)
    };
  }
  
  await client.close();
  return result;
}

async function run() {
  try {
    const vanshData = await analyzeDb(vanshUri, 'Vansh (Other Developer) DB');
    const naveenData = await analyzeDb(naveenUri, 'Naveen (Live Production) DB');

    console.log('\n=======================================');
    console.log('      DATABASE STRUCTURE COMPARISON     ');
    console.log('=======================================');
    
    const allColNames = new Set([...Object.keys(vanshData), ...Object.keys(naveenData)]);
    
    for (const colName of allColNames) {
      console.log(`\nCollection: [${colName}]`);
      const v = vanshData[colName];
      const n = naveenData[colName];
      
      if (!v) {
        console.log(`  - ❌ Exists in Naveen's DB, but is MISSING in Vansh's DB`);
        continue;
      }
      if (!n) {
        console.log(`  - 🆕 Exists in Vansh's DB, but is MISSING in Naveen's DB (Needs creation)`);
        continue;
      }
      
      console.log(`  - Documents count -> Vansh: ${v.count} | Naveen (Live): ${n.count}`);
      
      const newFields = v.fields.filter(f => !n.fields.includes(f));
      const removedFields = n.fields.filter(f => !v.fields.includes(f));
      
      if (newFields.length > 0) {
        console.log(`  - 🆕 NEW fields added in Vansh's DB: ${newFields.join(', ')}`);
      } else {
        console.log(`  - No new fields added`);
      }
      
      if (removedFields.length > 0) {
        console.log(`  - ⚠️ Old fields in Naveen's DB not present in Vansh's: ${removedFields.join(', ')}`);
      }
    }
  } catch (err) {
    console.error('Error during database comparison:', err);
  }
}

run();
