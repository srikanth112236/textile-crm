const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/textile';
const ATLAS_URI = 'mongodb+srv://mallikarjunasrikanth112236_db_user:w6kL1OHb2QHqaYxg@cluster0.tqkzbxl.mongodb.net/textile?retryWrites=true&w=majority';

async function seedDataToAtlas() {
  console.log('1. Connecting to local MongoDB...');
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('   ✓ Connected to Local MongoDB');

  console.log('2. Connecting to MongoDB Atlas...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log('   ✓ Connected to MongoDB Atlas');

  const collections = await localConn.db.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections locally to migrate.\n`);

  for (const col of collections) {
    const colName = col.name;
    const docs = await localConn.db.collection(colName).find({}).toArray();
    console.log(`[+] Processing collection '${colName}' (${docs.length} documents)...`);
    
    if (docs.length > 0) {
      // Clear target Atlas collection before inserting complete snapshot
      await atlasConn.db.collection(colName).deleteMany({});
      await atlasConn.db.collection(colName).insertMany(docs);
      console.log(`    ✓ Migrated ${docs.length} documents into Atlas '${colName}'`);
    } else {
      console.log(`    - Collection '${colName}' is empty, skipping.`);
    }
  }

  console.log('\n--- MongoDB Atlas Verification ---');
  const atlasCols = await atlasConn.db.listCollections().toArray();
  for (const col of atlasCols) {
    const count = await atlasConn.db.collection(col.name).countDocuments();
    console.log(`  ✓ Atlas '${col.name}': ${count} documents`);
  }

  await localConn.close();
  await atlasConn.close();
  console.log('\n🎉 Complete local data successfully seeded to MongoDB Atlas!');
}

seedDataToAtlas().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
