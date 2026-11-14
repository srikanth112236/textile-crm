const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://localhost:27017/ecom');
  const cats = await mongoose.connection.collection('categories').find({}).project({ name: 1, slug: 1, parent: 1, status: 1 }).toArray();
  const products = await mongoose.connection.collection('products').aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]).toArray();
  const counts = Object.fromEntries(products.map((p) => [String(p._id), p.count]));
  console.log(JSON.stringify(cats.map((c) => ({ name: c.name, slug: c.slug, parent: c.parent ? String(c.parent) : null, count: counts[String(c._id)] || 0 })), null, 2));
  await mongoose.disconnect();
})();
