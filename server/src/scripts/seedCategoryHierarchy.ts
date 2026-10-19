import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { Product } from '../models/Product';

dotenv.config();

// One-time hierarchy + reassignment migration (idempotent, safe to re-run):
// - parents the 7 split categories under their umbrellas
// - moves existing catalog products from umbrella categories into the
//   spec §5 leaf categories by name-keyword rules
// - reports products-per-category; leaves Sweatshirts/Boxers to their samples
async function main() {
  const { connectDatabase } = await import('../config/database');
  await connectDatabase();

  const PARENTS: Record<string, string> = {
    'formal-trousers': 'trousers',
    'casual-trousers': 'trousers',
    'gym-tshirts': 'activewear',
    'gym-vests': 'activewear',
    kurta: 'ethnic-wear',
    'kurta-pajama': 'ethnic-wear',
    'nehru-jackets': 'ethnic-wear',
  };
  for (const [child, parentSlug] of Object.entries(PARENTS)) {
    const parent = await Category.findOne({ slug: parentSlug });
    const kid = await Category.findOne({ slug: child });
    if (parent && kid && String(kid.parent) !== String(parent._id)) {
      kid.parent = parent._id as any;
      await kid.save();
      console.log(`  parent: ${child} -> ${parentSlug}`);
    }
  }

  const bySlug = async (slug: string) => Category.findOne({ slug });
  // The companion seed script can time out (ES/SMTP waits) before the last
  // two categories — ensure them here, idempotently, with one sample each.
  const ENSURE: Array<{ name: string; slug: string; description: string; image: string; sample?: { name: string; sku: string; price: number; compareAtPrice: number; desc: string } }> = [
    {
      name: 'Nehru Jackets', slug: 'nehru-jackets',
      description: 'Structured Nehru waistcoats with metallic buttons.',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
      sample: { name: 'Classic Nehru Waistcoat - Black', sku: 'MTS-NEH-SEED01', price: 1599, compareAtPrice: 2499, desc: 'Structured band-collar waistcoat for weddings.' },
    },
    {
      name: 'Boxers', slug: 'boxers',
      description: 'Breathable cotton boxers and lounge shorts for all-day ease.',
      image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=400&q=80',
      sample: { name: 'Combed Cotton Boxers (Pack of 2) - Assorted', sku: 'MTS-BOX-SEED01', price: 499, compareAtPrice: 799, desc: 'Breathable elastic-waist boxers for daily comfort.' },
    },
  ];
  for (const c of ENSURE) {
    let cat = await Category.findOne({ slug: c.slug });
    if (!cat) {
      cat = await Category.create({ name: c.name, slug: c.slug, description: c.description, image: c.image, status: 'active' });
      console.log(`  + Category: ${c.name}`);
    }
    if (c.sample) {
      const exists = await Product.findOne({ $or: [{ sku: c.sample.sku }, { name: c.sample.name }] });
      if (!exists) {
        await Product.create({
          name: c.sample.name, shortDescription: c.sample.desc,
          description: `${c.sample.desc}\n\nKey Features:\n• Premium fabric\n• Tailored modern fit\n• Easy machine wash`,
          price: c.sample.price, compareAtPrice: c.sample.compareAtPrice, category: cat._id,
          images: [{ url: c.image, altText: c.sample.name }], stock: 30, sku: c.sample.sku,
          status: 'active', hasVariants: true,
          variantAttributes: [{ name: 'Size', displayName: 'Size', type: 'button', options: [{ value: 'S' }, { value: 'M' }, { value: 'L' }, { value: 'XL' }, { value: 'XXL' }], required: true }],
        });
        console.log(`  + Sample: ${c.sample.name}`);
      }
    }
  }
  const cats: Record<string, any> = {};
  for (const s of ['trousers', 'activewear', 'ethnic-wear', 'formal-trousers', 'casual-trousers', 'gym-tshirts', 'gym-vests', 'kurta', 'kurta-pajama', 'nehru-jackets']) {
    cats[s] = await bySlug(s);
  }

  // [sourceSlug, nameRegex, targetSlug] — first match wins within a source
  const RULES: Array<[string, RegExp, string]> = [
    ['trousers', /tailored formal/i, 'formal-trousers'],
    ['trousers', /relaxed|chino/i, 'casual-trousers'],
    ['activewear', /vest|stringer/i, 'gym-vests'],
    ['activewear', /tee|dry-fit|training/i, 'gym-tshirts'],
    ['ethnic-wear', /pajama set/i, 'kurta-pajama'],
    ['ethnic-wear', /nehru/i, 'nehru-jackets'],
    ['ethnic-wear', /kurta/i, 'kurta'],
  ];
  let moved = 0;
  for (const [src, rx, dst] of RULES) {
    if (!cats[src] || !cats[dst]) continue;
    const res = await Product.updateMany(
      { category: cats[src]._id, name: rx },
      { $set: { category: cats[dst]._id } }
    );
    const n = (res as any).modifiedCount ?? 0;
    moved += n;
    console.log(`  move ${src} -> ${dst}: ${n}`);
  }

  const counts = await Product.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', n: { $sum: 1 } } },
  ]);
  for (const c of counts) {
    const cat = await Category.findById(c._id).select('slug name');
    console.log(`  count ${(cat as any)?.slug}: ${c.n}`);
  }
  console.log(`Done. moved=${moved}`);
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
