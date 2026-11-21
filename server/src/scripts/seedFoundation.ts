/**
 * P0 staging dataset — small, deterministic, idempotent.
 *
 * Creates:
 *   - 3 categories: t-shirts, shirts, joggers
 *   - 20 active products (SKUs prefixed FND-)
 *   - 2 customers, 1 admin, 1 superadmin
 *
 * Safe to re-run: existing docs are updated/skipped, never duplicated.
 * It does NOT wipe the database. Use `--reset` (or SEED_RESET=1) to remove
 * only the FND products + seed categories before rebuilding.
 *
 * Usage:
 *   npm run seed:foundation
 *   npm run seed:foundation -- --reset
 *   npm run seed:foundation -- --reset-passwords
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

dotenv.config();

const RESET = process.argv.includes('--reset') || process.env.SEED_RESET === '1';
// Existing staging accounts may have drifted passwords. Only reset them when
// explicitly requested, so re-running the seed never surprises a teammate.
const RESET_PASSWORDS =
  process.argv.includes('--reset-passwords') || process.env.SEED_RESET_PASSWORDS === '1';

const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const CATEGORIES = [
  {
    name: 'T-Shirts',
    slug: 't-shirts',
    description: 'Heavyweight oversized tees, polos and everyday essentials.',
    image: IMG('photo-1521572267360-ee0c2909d518'),
  },
  {
    name: 'Shirts',
    slug: 'shirts',
    description: 'Linen, casual and formal shirts for every occasion.',
    image: IMG('photo-1602810318383-e386cc2a3ccf'),
  },
  {
    name: 'Joggers',
    slug: 'joggers',
    description: 'Cargo joggers, track pants and fleece sweatpants.',
    image: IMG('photo-1516257984-b1b4d707412e'),
  },
];

interface SeedProduct {
  sku: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  fit: string;
  fabric: string;
  pattern: string;
  occasion: string;
  badge?: string;
  images: string[];
}

const PRODUCTS: SeedProduct[] = [
  // T-shirts
  { sku: 'FND-TS-001', name: 'Heavyweight Oversized Tee — Black', category: 't-shirts', price: 899, compareAtPrice: 1299, stock: 42, fit: 'Oversized', fabric: 'Cotton', pattern: 'Solid', occasion: 'Casual', badge: 'bestseller', images: [IMG('photo-1521572267360-ee0c2909d518'), IMG('photo-1503342217505-b0a15ec3261c')] },
  { sku: 'FND-TS-002', name: 'Heavyweight Oversized Tee — White', category: 't-shirts', price: 899, compareAtPrice: 1299, stock: 36, fit: 'Oversized', fabric: 'Cotton', pattern: 'Solid', occasion: 'Casual', badge: 'bestseller', images: [IMG('photo-1521572267360-ee0c2909d518'), IMG('photo-1503342217505-b0a15ec3261c')] },
  { sku: 'FND-TS-003', name: 'Heavyweight Oversized Tee — Olive', category: 't-shirts', price: 899, compareAtPrice: 1299, stock: 28, fit: 'Oversized', fabric: 'Cotton', pattern: 'Solid', occasion: 'Casual', images: [IMG('photo-1521572267360-ee0c2909d518'), IMG('photo-1503342217505-b0a15ec3261c')] },
  { sku: 'FND-TS-004', name: 'Essential Solid Crew Neck — Navy', category: 't-shirts', price: 649, compareAtPrice: 899, stock: 54, fit: 'Regular Fit', fabric: 'Cotton', pattern: 'Solid', occasion: 'Casual', images: [IMG('photo-1521572267360-ee0c2909d518'), IMG('photo-1503342217505-b0a15ec3261c')] },
  { sku: 'FND-TS-005', name: 'Classic Pique Polo — White', category: 't-shirts', price: 799, compareAtPrice: 1099, stock: 31, fit: 'Regular Fit', fabric: 'Cotton Blend', pattern: 'Solid', occasion: 'Casual', images: [IMG('photo-1521572267360-ee0c2909d518'), IMG('photo-1503342217505-b0a15ec3261c')] },
  { sku: 'FND-TS-006', name: 'Acid Wash Graphic Tee — Sand', category: 't-shirts', price: 849, compareAtPrice: 1199, stock: 22, fit: 'Oversized', fabric: 'Cotton', pattern: 'Graphic', occasion: 'Casual', badge: 'new', images: [IMG('photo-1521572267360-ee0c2909d518'), IMG('photo-1503342217505-b0a15ec3261c')] },
  { sku: 'FND-TS-007', name: 'Korean Boxy Fit Tee — Sage', category: 't-shirts', price: 749, compareAtPrice: 999, stock: 26, fit: 'Oversized', fabric: 'Cotton', pattern: 'Solid', occasion: 'Casual', images: [IMG('photo-1521572267360-ee0c2909d518'), IMG('photo-1503342217505-b0a15ec3261c')] },
  { sku: 'FND-TS-008', name: 'Striped Breton Tee — Navy', category: 't-shirts', price: 699, compareAtPrice: 949, stock: 19, fit: 'Regular Fit', fabric: 'Cotton', pattern: 'Striped', occasion: 'Casual', images: [IMG('photo-1521572267360-ee0c2909d518'), IMG('photo-1503342217505-b0a15ec3261c')] },

  // Shirts
  { sku: 'FND-SH-001', name: 'Pure Linen Mandarin Shirt — White', category: 'shirts', price: 1199, compareAtPrice: 1799, stock: 34, fit: 'Regular Fit', fabric: 'Linen', pattern: 'Solid', occasion: 'Casual', badge: 'bestseller', images: [IMG('photo-1602810318383-e386cc2a3ccf'), IMG('photo-1596755094514-f87e34085b2c')] },
  { sku: 'FND-SH-002', name: 'Pure Linen Mandarin Shirt — Sky Blue', category: 'shirts', price: 1199, compareAtPrice: 1799, stock: 27, fit: 'Regular Fit', fabric: 'Linen', pattern: 'Solid', occasion: 'Casual', images: [IMG('photo-1602810318383-e386cc2a3ccf'), IMG('photo-1596755094514-f87e34085b2c')] },
  { sku: 'FND-SH-003', name: 'Oxford Formal Cotton Shirt — White', category: 'shirts', price: 1099, compareAtPrice: 1599, stock: 40, fit: 'Slim Fit', fabric: 'Cotton', pattern: 'Solid', occasion: 'Formal', images: [IMG('photo-1602810318383-e386cc2a3ccf'), IMG('photo-1596755094514-f87e34085b2c')] },
  { sku: 'FND-SH-004', name: 'Abstract Printed Resort Shirt — Multi', category: 'shirts', price: 999, compareAtPrice: 1499, stock: 18, fit: 'Relaxed', fabric: 'Cotton', pattern: 'Printed', occasion: 'Party', badge: 'new', images: [IMG('photo-1602810318383-e386cc2a3ccf'), IMG('photo-1596755094514-f87e34085b2c')] },
  { sku: 'FND-SH-005', name: 'Cuban Collar Resort Shirt — Sage', category: 'shirts', price: 1099, compareAtPrice: 1649, stock: 23, fit: 'Relaxed', fabric: 'Linen Blend', pattern: 'Solid', occasion: 'Casual', images: [IMG('photo-1602810318383-e386cc2a3ccf'), IMG('photo-1596755094514-f87e34085b2c')] },
  { sku: 'FND-SH-006', name: 'Slim Fit Stretch Formal Shirt — Grey', category: 'shirts', price: 1199, compareAtPrice: 1699, stock: 29, fit: 'Slim Fit', fabric: 'Cotton', pattern: 'Solid', occasion: 'Formal', images: [IMG('photo-1602810318383-e386cc2a3ccf'), IMG('photo-1596755094514-f87e34085b2c')] },

  // Joggers
  { sku: 'FND-JG-001', name: 'Multi-Pocket Cargo Joggers — Black', category: 'joggers', price: 1299, compareAtPrice: 1899, stock: 32, fit: 'Tapered', fabric: 'Cotton Fleece', pattern: 'Solid', occasion: 'Casual', badge: 'bestseller', images: [IMG('photo-1516257984-b1b4d707412e'), IMG('photo-1552374196-1ab2a1c593e8')] },
  { sku: 'FND-JG-002', name: 'Multi-Pocket Cargo Joggers — Sand', category: 'joggers', price: 1299, compareAtPrice: 1899, stock: 24, fit: 'Tapered', fabric: 'Cotton Fleece', pattern: 'Solid', occasion: 'Casual', images: [IMG('photo-1516257984-b1b4d707412e'), IMG('photo-1552374196-1ab2a1c593e8')] },
  { sku: 'FND-JG-003', name: 'Streetwear Tapered Joggers — Grey', category: 'joggers', price: 1099, compareAtPrice: 1599, stock: 37, fit: 'Tapered', fabric: 'Cotton Fleece', pattern: 'Solid', occasion: 'Casual', images: [IMG('photo-1516257984-b1b4d707412e'), IMG('photo-1552374196-1ab2a1c593e8')] },
  { sku: 'FND-JG-004', name: 'Athletic Tech Track Pants — Navy', category: 'joggers', price: 999, compareAtPrice: 1499, stock: 45, fit: 'Tapered', fabric: 'Poly Blend', pattern: 'Solid', occasion: 'Sports', images: [IMG('photo-1516257984-b1b4d707412e'), IMG('photo-1552374196-1ab2a1c593e8')] },
  { sku: 'FND-JG-005', name: 'Fleece Lined Sweatpants — Charcoal', category: 'joggers', price: 899, compareAtPrice: 1299, stock: 21, fit: 'Relaxed', fabric: 'Cotton Fleece', pattern: 'Solid', occasion: 'Travel', images: [IMG('photo-1516257984-b1b4d707412e'), IMG('photo-1552374196-1ab2a1c593e8')] },
  { sku: 'FND-JG-006', name: 'Utility Cargo Joggers — Olive', category: 'joggers', price: 1399, compareAtPrice: 1999, stock: 16, fit: 'Relaxed', fabric: 'Cotton', pattern: 'Solid', occasion: 'Casual', badge: 'limited', images: [IMG('photo-1516257984-b1b4d707412e'), IMG('photo-1552374196-1ab2a1c593e8')] },
];

interface SeedAccount {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
  };
}

const ACCOUNTS: SeedAccount[] = [
  {
    email: 'admin@ecom.com',
    password: 'Admin123!@#',
    role: UserRole.SUPERADMIN,
    name: 'Store Admin',
    phone: '+919876543210',
  },
  {
    email: 'store.admin@mentoos.in',
    password: 'Admin123!@#',
    role: UserRole.ADMIN,
    name: 'Catalog Manager',
    phone: '+919876543211',
  },
  {
    email: 'test.user@mentoos.in',
    password: 'Test@1234',
    role: UserRole.USER,
    name: 'Test Customer',
    phone: '+919876543212',
    address: {
      street: '42, 100 Feet Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      zip: '560001',
      country: 'India',
      isDefault: true,
    },
  },
  {
    email: 'customer2@mentoos.in',
    password: 'Customer@123',
    role: UserRole.USER,
    name: 'Second Customer',
    phone: '+919876543213',
    address: {
      street: '18, MG Road',
      city: 'Pune',
      state: 'Maharashtra',
      zip: '411001',
      country: 'India',
      isDefault: true,
    },
  },
];

async function upsertCategories() {
  const map = new Map<string, mongoose.Types.ObjectId>();

  for (const data of CATEGORIES) {
    let category = await Category.findOne({ slug: data.slug });
    if (!category) {
      category = await Category.create({ ...data, status: 'active' });
      console.log(`  + category ${data.slug}`);
    } else {
      category.name = data.name;
      category.description = data.description;
      category.image = data.image;
      category.status = 'active';
      await category.save();
    }
    map.set(data.slug, category._id as mongoose.Types.ObjectId);
  }

  return map;
}

async function upsertAccounts() {
  const map = new Map<string, mongoose.Types.ObjectId>();

  for (const data of ACCOUNTS) {
    let user = await User.findOne({ email: data.email });

    if (!user) {
      user = new User({
        email: data.email,
        password: data.password,
        role: data.role,
        name: data.name,
        phone: data.phone,
        addresses: data.address ? [data.address] : [],
        mfaEnabled: false,
      });
      await user.save();
      console.log(`  + user ${data.email} (${data.role})`);
    } else {
      let changed = false;
      if (user.role !== data.role) { user.role = data.role; changed = true; }
      if (!user.name) { user.name = data.name; changed = true; }
      if (!user.phone) { user.phone = data.phone; changed = true; }
      if (data.address && (!user.addresses || user.addresses.length === 0)) {
        user.addresses = [data.address];
        changed = true;
      }
      if (RESET_PASSWORDS) {
        user.password = data.password;
        changed = true;
      }
      if (changed) await user.save();
    }

    map.set(data.email, user._id as mongoose.Types.ObjectId);
  }

  return map;
}

async function upsertProducts(categories: Map<string, mongoose.Types.ObjectId>) {
  const created: mongoose.Types.ObjectId[] = [];

  for (const data of PRODUCTS) {
    const existing = await Product.findOne({ sku: data.sku });
    if (existing) {
      // Keep staging stock fresh without touching admin edits to copy/media.
      if (existing.stock !== data.stock) {
        existing.stock = data.stock;
        await existing.save();
      }
      created.push(existing._id as mongoose.Types.ObjectId);
      continue;
    }

    const product = new Product({
      name: data.name,
      sku: data.sku,
      category: categories.get(data.category),
      description: `${data.name}. Part of the P0 staging catalogue for storefront, filter and cart smoke tests.`,
      shortDescription: `${data.fit} fit, ${data.fabric.toLowerCase()} fabric.`,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      stock: data.stock,
      lowStockThreshold: 5,
      status: 'active',
      images: data.images.map((url, index) => ({
        url,
        altText: data.name,
        position: index,
        isDefault: index === 0,
      })),
      fit: data.fit,
      fabric: data.fabric,
      pattern: data.pattern,
      occasion: data.occasion,
      badges: data.badge ? [data.badge] : [],
      features: ['Breathable fabric', 'Everyday comfort', 'Designed in India'],
      shipping: {
        weight: 450,
        weightUnit: 'g',
        length: 30,
        width: 25,
        height: 4,
        dimensionUnit: 'cm',
        requiresShipping: true,
        freeShipping: false,
      },
      visibility: { visibility: 'visible', featured: false },
    });

    await product.save();
    created.push(product._id as mongoose.Types.ObjectId);
  }

  return created;
}

async function main() {
  await connectDatabase();

  console.log(`\nP0 foundation seed${RESET ? ' (reset)' : ''}`);

  if (RESET) {
    const productResult = await Product.deleteMany({ sku: /^FND-/ });
    const categoryResult = await Category.deleteMany({ slug: { $in: CATEGORIES.map((c) => c.slug) } });
    console.log(`  - removed ${productResult.deletedCount} FND products, ${categoryResult.deletedCount} seed categories`);
  }

  const categories = await upsertCategories();
  const accounts = await upsertAccounts();
  const productIds = await upsertProducts(categories);

  // Give a brand-new primary customer a wishlist so account surfaces have
  // real data. Never overwrite an existing staging wishlist.
  const primary = await User.findOne({ email: 'test.user@mentoos.in' });
  if (primary && (!primary.wishlist || primary.wishlist.length === 0)) {
    primary.wishlist = productIds.slice(0, 4);
    await primary.save();
  }

  console.log(`\nDone.
  Categories : ${categories.size}
  Products   : ${productIds.length}
  Accounts   : ${accounts.size} (2 customers, 1 admin, 1 superadmin)

  Sign in:
    superadmin  admin@ecom.com / Admin123!@#
    admin       store.admin@mentoos.in / Admin123!@#
    customer    test.user@mentoos.in / Test@1234
    customer 2  customer2@mentoos.in / Customer@123`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Foundation seed failed:', error);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
