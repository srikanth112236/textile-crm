import dotenv from 'dotenv';
dotenv.config();
async function main() {
  const { connectDatabase } = await import('../config/database');
  await connectDatabase();
  const { Settings } = await import('../models/Settings');
  const r: any = await Settings.updateMany({}, { $unset: { 'payments.razorpayKeyId': 1 } });
  console.log(`PURGED razorpayKeyId modified=${r.modifiedCount}`);
  const mongoose = (await import('mongoose')).default;
  await mongoose.disconnect();
  process.exit(0);
}
main().catch(async (e) => { console.error(e); process.exit(1); });
