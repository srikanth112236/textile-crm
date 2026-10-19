import { connectDatabase } from '../config/database';
import { Permission } from '../models/Permission';

const defaultPermissions = [
  // Products
  { name: 'products.create', resource: 'products', action: 'create', description: 'Create products' },
  { name: 'products.read', resource: 'products', action: 'read', description: 'View products' },
  { name: 'products.update', resource: 'products', action: 'update', description: 'Update products' },
  { name: 'products.delete', resource: 'products', action: 'delete', description: 'Delete products' },
  { name: 'products.manage', resource: 'products', action: 'manage', description: 'Full product management' },
  
  // Orders
  { name: 'orders.create', resource: 'orders', action: 'create', description: 'Create orders' },
  { name: 'orders.read', resource: 'orders', action: 'read', description: 'View orders' },
  { name: 'orders.update', resource: 'orders', action: 'update', description: 'Update orders' },
  { name: 'orders.delete', resource: 'orders', action: 'delete', description: 'Delete orders' },
  { name: 'orders.manage', resource: 'orders', action: 'manage', description: 'Full order management' },
  
  // Users
  { name: 'users.create', resource: 'users', action: 'create', description: 'Create users' },
  { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
  { name: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
  { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { name: 'users.manage', resource: 'users', action: 'manage', description: 'Full user management' },
  
  // Categories
  { name: 'categories.create', resource: 'categories', action: 'create', description: 'Create categories' },
  { name: 'categories.read', resource: 'categories', action: 'read', description: 'View categories' },
  { name: 'categories.update', resource: 'categories', action: 'update', description: 'Update categories' },
  { name: 'categories.delete', resource: 'categories', action: 'delete', description: 'Delete categories' },
  { name: 'categories.manage', resource: 'categories', action: 'manage', description: 'Full category management' },
  
  // Discounts
  { name: 'discounts.create', resource: 'discounts', action: 'create', description: 'Create discounts' },
  { name: 'discounts.read', resource: 'discounts', action: 'read', description: 'View discounts' },
  { name: 'discounts.update', resource: 'discounts', action: 'update', description: 'Update discounts' },
  { name: 'discounts.delete', resource: 'discounts', action: 'delete', description: 'Delete discounts' },
  { name: 'discounts.manage', resource: 'discounts', action: 'manage', description: 'Full discount management' },
  
  // Loyalty
  { name: 'loyalty.read', resource: 'loyalty', action: 'read', description: 'View loyalty points' },
  { name: 'loyalty.manage', resource: 'loyalty', action: 'manage', description: 'Manage loyalty points' },
  
  // Analytics
  { name: 'analytics.read', resource: 'analytics', action: 'read', description: 'View analytics' },
  
  // Settings
  { name: 'settings.read', resource: 'settings', action: 'read', description: 'View settings' },
  { name: 'settings.update', resource: 'settings', action: 'update', description: 'Update settings' },
  { name: 'settings.manage', resource: 'settings', action: 'manage', description: 'Full settings management' },
];

async function seedPermissions() {
  try {
    await connectDatabase();
    console.log('Connected to database');

    let created = 0;
    let skipped = 0;

    for (const perm of defaultPermissions) {
      try {
        await Permission.create(perm);
        created++;
        console.log(`✓ Created permission: ${perm.name}`);
      } catch (error: any) {
        if (error.code === 11000) {
          skipped++;
          console.log(`- Skipped existing permission: ${perm.name}`);
        } else {
          console.error(`✗ Error creating permission ${perm.name}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Permissions seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${defaultPermissions.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding permissions:', error);
    process.exit(1);
  }
}

seedPermissions();

