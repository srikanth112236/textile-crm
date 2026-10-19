import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

// Load environment variables
dotenv.config();

const seedSuperadmin = async () => {
  try {
    await connectDatabase();

    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@example.com';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin123!@#';

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({ email: superadminEmail });

    if (existingSuperadmin) {
      console.log('✅ Superadmin user already exists');
      process.exit(0);
    }

    // Create superadmin user
    const superadmin = new User({
      email: superadminEmail,
      password: superadminPassword, // Will be hashed by pre-save hook
      role: UserRole.SUPERADMIN,
      mfaEnabled: false,
    });

    await superadmin.save();

    console.log('✅ Superadmin user created successfully');
    console.log(`   Email: ${superadminEmail}`);
    console.log(`   Password: ${superadminPassword}`);
    console.log('   ⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding superadmin:', error);
    process.exit(1);
  }
};

seedSuperadmin();

