import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Category } from '../models/Category';
import { Product } from '../models/Product';

dotenv.config();

// Additive, idempotent: upserts missing Mentoos categories + sample products.
// Never deletes anything (unlike seedMentoosCatalog which wipes).
const MISSING_CATEGORIES = [
  {
    name: 'Formal Trousers',
    slug: 'formal-trousers',
    description: 'Flat-front crease-resistant tailored trousers for executive wear.',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Casual Trousers',
    slug: 'casual-trousers',
    description: 'Relaxed chinos and casual cotton pants for everyday comfort.',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Gym T-Shirts',
    slug: 'gym-tshirts',
    description: 'Dry-fit performance training tees that wick sweat instantly.',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Gym Vests',
    slug: 'gym-vests',
    description: 'Muscle-fit stringer vests with deep drop armholes for workouts.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sweatshirts',
    slug: 'sweatshirts',
    description: 'Heavy fleece crew-neck sweatshirts for cool evenings.',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kurta',
    slug: 'kurta',
    description: 'Short linen kurtas with band collars for festive days.',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kurta Pajama',
    slug: 'kurta-pajama',
    description: 'Festive kurta pajama sets in cotton-silk blends.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Nehru Jackets',
    slug: 'nehru-jackets',
    description: 'Structured Nehru waistcoats with metallic buttons.',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Boxers',
    slug: 'boxers',
    description: 'Breathable cotton boxers and lounge shorts for all-day ease.',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
  },
];

const SAMPLE_PRODUCTS: Record<string, Array<{ name: string; price: number; compareAtPrice: number; desc: string; image: string }>> = {
  'formal-trousers': [
    { name: 'Executive Flat-Front Formal Trousers - Black', price: 1499, compareAtPrice: 2299, desc: 'Crease-resistant tailored trousers for boardroom wear.', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&q=80' },
    { name: 'Slim Fit Formal Trousers - Navy', price: 1399, compareAtPrice: 2099, desc: 'Sharp slim-fit formals with stretch waist comfort.', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80' },
  ],
  'casual-trousers': [
    { name: 'Everyday Stretch Casual Trousers - Stone', price: 1299, compareAtPrice: 1899, desc: 'Relaxed casual trousers with elasticated sides.', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80' },
  ],
  'gym-tshirts': [
    { name: 'Dry-Fit Gym Training Tee - Red', price: 649, compareAtPrice: 999, desc: 'Honeycomb mesh training tee that wicks sweat instantly.', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80' },
  ],
  'gym-vests': [
    { name: 'Muscle Fit Gym Stringer Vest - Grey', price: 499, compareAtPrice: 799, desc: 'Deep drop armhole vest for full workout movement.', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' },
  ],
  sweatshirts: [
    { name: 'Heavy Fleece Crew Sweatshirt - Olive', price: 1099, compareAtPrice: 1699, desc: 'Brushed fleece crewneck for cool-weather layering.', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80' },
  ],
  kurta: [
    { name: 'Handloom Short Kurta - Mustard', price: 1299, compareAtPrice: 1999, desc: 'Handloom short kurta with wooden buttons.', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80' },
  ],
  'kurta-pajama': [
    { name: 'Festive Kurta Pajama Set - Cream', price: 1999, compareAtPrice: 3299, desc: 'Cotton-silk kurta with matching churidar pajama.', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80' },
  ],
  'nehru-jackets': [
    { name: 'Classic Nehru Waistcoat - Black', price: 1599, compareAtPrice: 2499, desc: 'Structured band-collar waistcoat for weddings.', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80' },
  ],
  boxers: [
    { name: 'Combed Cotton Boxers (Pack of 2) - Assorted', price: 499, compareAtPrice: 799, desc: 'Breathable elastic-waist boxers for daily comfort.', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80' },
  ],
};

const SIZE_ATTR = {
  name: 'Size',
  displayName: 'Size',
  type: 'button',
  options: [{ value: 'S' }, { value: 'M' }, { value: 'L' }, { value: 'XL' }, { value: 'XXL' }],
  required: true,
};

async function main() {
  await connectDatabase();
  let catsAdded = 0;
  let prodsAdded = 0;
  for (const c of MISSING_CATEGORIES) {
    let cat = await Category.findOne({ slug: c.slug });
    if (!cat) {
      cat = await Category.create({ ...c, status: 'active' });
      catsAdded += 1;
      console.log(`  + Category: ${c.name}`);
    }
    const samples = SAMPLE_PRODUCTS[c.slug] || [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const sku = `MTS-${c.slug.substring(0, 3).toUpperCase()}-9${catsAdded}${i}${Date.now() % 100}`;
      const exists = await Product.findOne({ sku });
      if (exists) continue;
      await Product.create({
        name: s.name,
        shortDescription: s.desc,
        description: `${s.desc}\n\nKey Features:\n• Premium fabric\n• Tailored modern fit\n• Easy machine wash`,
        price: s.price,
        compareAtPrice: s.compareAtPrice,
        category: cat._id,
        images: [{ url: s.image, altText: s.name }],
        stock: 30,
        sku,
        status: 'active',
        hasVariants: true,
        variantAttributes: [SIZE_ATTR],
        shipping: { weight: 500, weightUnit: 'g', length: 30, width: 25, height: 3, requiresShipping: true },
      });
      prodsAdded += 1;
    }
  }
  console.log(`Done. Categories added: ${catsAdded}, products added: ${prodsAdded}.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch { /* ignore */ }
  process.exit(1);
});
