/**
 * Copy the complete local `ecom` database to a target MongoDB (Atlas).
 *
 * Usage (run from server/):
 *   SRC_URI="mongodb://localhost:27017/ecom" \
 *   DST_URI="mongodb+srv://user:pass@cluster.xxx.mongodb.net/ecom?retryWrites=true&w=majority" \
 *   node scripts/copyLocalToAtlas.js
 *
 * - Copies every collection, in batches, preserving _id / ObjectId / dates.
 * - Recreates indexes (unique slugs/emails, TTLs, etc.) on the target.
 * - Drops each target collection first so the result is an exact mirror.
 *   Pass KEEP_TARGET=1 to append instead of replacing.
 *
 * Never hardcode credentials here — pass DST_URI via the environment.
 */
const { MongoClient } = require('mongodb');

const SRC_URI =
  process.env.SRC_URI || 'mongodb://localhost:27017/ecom';
const DST_URI = process.env.DST_URI;
const BATCH = 500;

if (!DST_URI) {
  console.error('Set DST_URI to the target connection string (must include the db name).');
  process.exit(1);
}

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

async function main() {
  const src = new MongoClient(SRC_URI, { serverSelectionTimeoutMS: 10000 });
  const dst = new MongoClient(DST_URI, { serverSelectionTimeoutMS: 20000 });
  await src.connect();
  await dst.connect();
  console.log('Connected:', await src.db().databaseName, '->', await dst.db().databaseName);

  const collections = await src.db().listCollections().toArray();

  for (const info of collections) {
    const name = info.name;
    const source = src.db().collection(name);
    const target = dst.db().collection(name);

    const total = await source.countDocuments();
    if (total === 0) {
      console.log(`${name}: empty locally — skipped`);
      continue;
    }

    if (!process.env.KEEP_TARGET) {
      try { await dst.db().dropCollection(name); } catch { /* ignore */ }
    }

    // Copy documents in batches.
    let inserted = 0;
    const cursor = source.find({});
    let batch = [];
    while (await cursor.hasNext()) {
      batch.push(await cursor.next());
      if (batch.length >= BATCH) {
        const r = await target.insertMany(batch, { ordered: false });
        inserted += r.insertedCount;
        batch = [];
      }
    }
    if (batch.length) {
      const r = await target.insertMany(batch, { ordered: false });
      inserted += r.insertedCount;
    }

    // Recreate indexes from the source (skipping _id_).
    const indexes = await source.indexes();
    let created = [];
    for (const idx of indexes) {
      if (idx.name === '_id_') continue;
      const { key, v, ns, background, ...opts } = idx;
      try {
        await target.createIndex(key, { ...opts, name: idx.name });
        created.push(idx.name);
      } catch (e) {
        console.warn(`${name}: index "${idx.name}" failed: ${e.message}`);
      }
    }

    const finalCount = await target.countDocuments({});
    console.log(
      `${name}: copied ${finalCount}/${total} docs, indexes: [${created.join(', ') || 'none'}]`
    );
  }

  await src.close();
  await dst.close();
  console.log('✅ Copy complete');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Copy failed:', e.message);
  process.exit(1);
});
