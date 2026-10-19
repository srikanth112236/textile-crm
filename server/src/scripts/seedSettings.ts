import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Settings, DEFAULT_SETTINGS } from '../models/Settings';

dotenv.config();

async function main() {
  await connectDatabase();
  const existing = await Settings.findOne({ key: 'global' });
  if (existing) {
    console.log('Settings already exist, skipping seed.');
    console.log(JSON.stringify({ freeShip: existing.shipping.freeShippingThreshold, codDefault: existing.codConfirmation.defaultAmount }));
  } else {
    await Settings.create({ ...(DEFAULT_SETTINGS as object) });
    console.log('Seeded default global settings: freeShip=999, COD default=99, slabs 49/99/149.');
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
