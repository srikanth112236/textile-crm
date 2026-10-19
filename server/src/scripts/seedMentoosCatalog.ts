import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Review } from '../models/Product'; // embedded or separate if schema defined

dotenv.config();

const MENTOOS_CATEGORIES = [
  {
    name: 'T-Shirts',
    slug: 't-shirts',
    description: 'Heavyweight oversized, polo, crew neck & graphic streetwear tees.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Shirts',
    slug: 'shirts',
    description: 'Pure linen, printed casuals, formal dress shirts & mandarin collars.',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Trousers',
    slug: 'trousers',
    description: 'Slim fit chinos, formal tailored trousers & casual cotton pants.',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Joggers',
    slug: 'joggers',
    description: 'Multi-pocket utility cargo joggers, tapered track pants & sweatpants.',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Activewear',
    slug: 'activewear',
    description: 'Muscle fit gym vests, stretch performance tees & workout shorts.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ethnic Wear',
    slug: 'ethnic-wear',
    description: 'Handcrafted short linen kurtas, kurta pajama sets & designer Nehru waistcoats.',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Shorts',
    slug: 'shorts',
    description: 'Casual cotton shorts, lounge shorts & active training shorts.',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Jackets',
    slug: 'jackets',
    description: 'Streetwear denim jackets, bomber jackets & padded waistcoats.',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
  },
];

// Curated Fashion Image Pools for each Category
const FASHION_IMAGES: Record<string, string[]> = {
  't-shirts': [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
  ],
  'shirts': [
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80',
  ],
  'trousers': [
    'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
  ],
  'joggers': [
    'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
  ],
  'activewear': [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
  ],
  'ethnic-wear': [
    'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  ],
  'shorts': [
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80',
  ],
  'jackets': [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
  ],
};

const PRODUCT_TEMPLATES = [
  // T-Shirts
  { categorySlug: 't-shirts', name: 'Heavyweight Oversized Tee - Jet Black', price: 799, compareAtPrice: 1299, desc: '240 GSM combed cotton featuring a dropped-shoulder street fit.' },
  { categorySlug: 't-shirts', name: 'Korean Boxy Fit Tee - Crisp White', price: 699, compareAtPrice: 999, desc: 'Relaxed boxy silhouette crafted from breathable bio-washed cotton.' },
  { categorySlug: 't-shirts', name: 'Classic Pique Polo Shirt - Royal Navy', price: 899, compareAtPrice: 1499, desc: 'Textured pique knit cotton polo with ribbed collar and cuff detailing.' },
  { categorySlug: 't-shirts', name: 'Acid Wash Graphic Tee - Olive Green', price: 749, compareAtPrice: 1199, desc: 'Vintage acid-washed finish featuring minimalist chest typography.' },
  { categorySlug: 't-shirts', name: 'Essential Solid Crew Neck - Maroon', price: 599, compareAtPrice: 899, desc: 'Everyday crew neck t-shirt crafted from 100% soft ring-spun cotton.' },

  // Shirts
  { categorySlug: 'shirts', name: 'Pure Linen Mandarin Short Shirt - White', price: 1299, compareAtPrice: 1999, desc: '100% pure linen shirt with mandarin band collar for summer styling.' },
  { categorySlug: 'shirts', name: 'Abstract Floral Printed Casual Shirt', price: 999, compareAtPrice: 1599, desc: 'Soft viscose rayon Cuban collar shirt with vibrant all-over print.' },
  { categorySlug: 'shirts', name: 'Oxford Formal Cotton Shirt - Sky Blue', price: 1199, compareAtPrice: 1799, desc: 'Wrinkle-resistant 100% Oxford weave cotton shirt for boardroom sharp look.' },
  { categorySlug: 'shirts', name: 'Cuban Collar Resort Shirt - Sage Green', price: 899, compareAtPrice: 1399, desc: 'Relaxed camp collar short-sleeve shirt perfect for holiday leisure.' },

  // Trousers
  { categorySlug: 'trousers', name: 'Stretch Cotton Slim Fit Chinos - Khaki', price: 1399, compareAtPrice: 2199, desc: '4-way stretch twill chinos with tailored waist and tapered leg.' },
  { categorySlug: 'trousers', name: 'Tailored Formal Trousers - Charcoal Grey', price: 1499, compareAtPrice: 2299, desc: 'Flat-front crease-resistant trousers designed for executive wear.' },
  { categorySlug: 'trousers', name: 'Relaxed Fit Cotton Trousers - Olive', price: 1299, compareAtPrice: 1899, desc: 'Breathable casual trousers with subtle pleating and elasticated sides.' },

  // Joggers
  { categorySlug: 'joggers', name: 'Multi-Pocket Tactical Cargo Joggers - Sand Beige', price: 1299, compareAtPrice: 1999, desc: '6-pocket utility cargo joggers with cuffed ankles and drawstring waist.' },
  { categorySlug: 'joggers', name: 'Streetwear Tapered Joggers - Jet Black', price: 1099, compareAtPrice: 1699, desc: 'Heavy fleece cotton sweatpants engineered for daily comfort.' },
  { categorySlug: 'joggers', name: 'Athletic Tech Track Pants - Dark Navy', price: 999, compareAtPrice: 1499, desc: 'Moisture-wicking track pants with zippered side pockets.' },

  // Activewear
  { categorySlug: 'activewear', name: 'Pro-Gym Muscle Fit Stringer Vest - Black', price: 499, compareAtPrice: 799, desc: 'Deep drop armhole tank top engineered for intense workout movement.' },
  { categorySlug: 'activewear', name: 'Dry-Fit Performance Training Tee - Steel Grey', price: 649, compareAtPrice: 999, desc: 'Breathable honeycomb mesh fabric that wicks sweat instantly.' },

  // Ethnic Wear
  { categorySlug: 'ethnic-wear', name: 'Linen Short Kurta - Pristine White', price: 1399, compareAtPrice: 2199, desc: 'Traditional short kurta with handcrafted wooden buttons and band collar.' },
  { categorySlug: 'ethnic-wear', name: 'Woven Jacquard Nehru Jacket - Royal Maroon', price: 1699, compareAtPrice: 2699, desc: 'Structured waistcoat with metallic buttons and inner satin lining.' },
  { categorySlug: 'ethnic-wear', name: 'Designer Kurta Pajama Set - Royal Blue', price: 1999, compareAtPrice: 3299, desc: 'Festive cotton-silk blended long kurta set with matching churidar.' },

  // Shorts
  { categorySlug: 'shorts', name: 'Casual Cotton Chino Shorts - Beige', price: 799, compareAtPrice: 1199, desc: 'Above-the-knee stretch chino shorts with 4 pockets.' },

  // Jackets
  { categorySlug: 'jackets', name: 'Vintage Washed Denim Jacket - Indigo', price: 1899, compareAtPrice: 2999, desc: '14 oz heavy denim jacket with dual chest pockets and button closure.' },
];

async function seedMentoosCatalog() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDatabase();

    console.log('🗑️ Clearing existing dummy product & category collection...');
    await Product.deleteMany({});
    await Category.deleteMany({});

    console.log('📦 Seeding official Mentoos Categories...');
    const createdCategoryMap: Record<string, any> = {};

    for (const catData of MENTOOS_CATEGORIES) {
      const category = new Category({
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        image: catData.image,
        status: 'active',
      });
      await category.save();
      createdCategoryMap[catData.slug] = category;
      console.log(`   ✅ Category: ${catData.name}`);
    }

    console.log('🛍️ Generating 150 Mentoos Fashion Products...');
    const productsToInsert: any[] = [];
    let skuCounter = 100;

    for (let i = 0; i < 150; i++) {
      const template = PRODUCT_TEMPLATES[i % PRODUCT_TEMPLATES.length];
      const categoryObj = createdCategoryMap[template.categorySlug];
      const imagePool = FASHION_IMAGES[template.categorySlug] || FASHION_IMAGES['t-shirts'];
      
      const primaryImage = imagePool[i % imagePool.length];
      const secondaryImage = imagePool[(i + 1) % imagePool.length];
      skuCounter++;

      const isBestseller = i % 3 === 0;
      const rating = 4.2 + (i % 8) * 0.1;
      const reviewCount = 24 + (i * 7) % 180;
      const variationName = `${template.name} ${i > 15 ? `(V-${i})` : ''}`;

      productsToInsert.push({
        name: variationName,
        slug: `${template.categorySlug}-${skuCounter}-${i}`,
        shortDescription: template.desc,
        description: `${template.desc}\n\nKey Features:\n• Premium combed cotton fabric\n• Pre-shrunk & bio-washed\n• Tailored modern fit engineered for Indian bodies\n• Easy machine wash`,
        price: template.price + (i % 5) * 50,
        compareAtPrice: template.compareAtPrice + (i % 5) * 50,
        category: categoryObj._id,
        images: [
          { url: primaryImage, altText: `${variationName} Front` },
          { url: secondaryImage, altText: `${variationName} Back` },
        ],
        stock: 25 + (i % 40),
        sku: `MTS-${template.categorySlug.substring(0, 3).toUpperCase()}-${skuCounter}`,
        status: 'active',
        averageRating: Math.min(5.0, Number(rating.toFixed(1))),
        totalReviews: reviewCount,
        hasVariants: true,
        variantAttributes: [
          {
            name: 'size',
            displayName: 'Size',
            type: 'button',
            options: [
              { value: 'S', label: 'S' },
              { value: 'M', label: 'M' },
              { value: 'L', label: 'L' },
              { value: 'XL', label: 'XL' },
              { value: 'XXL', label: 'XXL' },
            ],
            required: true,
          },
        ],
      });
    }

    await Product.insertMany(productsToInsert);

    console.log(`\n🎉 Successfully seeded 150 authentic Mentoos products across 8 categories!`);
    console.log(`   - Total Products: 150`);
    console.log(`   - Total Categories: 8`);
    console.log(`   - Status: Active & Synced`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Mentoos catalog:', error);
    process.exit(1);
  }
}

seedMentoosCatalog();
