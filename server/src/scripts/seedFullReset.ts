/* FULL RESET SEED â€” wipes the ecom database and rebuilds a complete,
   document-based demo dataset: 17 categories, 150 products, 10 users,
   11 orders (all lifecycle stages), payments incl. Razorpay test refs,
   Shiprocket test tracking, reviews, coupons, alerts, UGC, Shop-the-Look.
   Run ONCE: ELASTICSEARCH_ENABLED=false npx tsx src/scripts/seedFullReset.ts */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS: Record<string, string> = {
  'Jet Black': '#0a0a0a', Black: '#0a0a0a', White: '#ffffff', 'Crisp White': '#ffffff',
  'Pristine White': '#ffffff', Maroon: '#800020', 'Royal Maroon': '#800020', Navy: '#1B2A4A',
  'Royal Navy': '#1B2A4A', 'Olive Green': '#6B7F3E', Olive: '#6B7F3E', 'Sky Blue': '#87CEEB',
  'Sage Green': '#9CAF88', Sage: '#9CAF88', 'Sand Beige': '#E1D4C0', Beige: '#E1D4C0',
  'Charcoal Grey': '#36454F', Charcoal: '#36454F', Grey: '#808080', 'Steel Grey': '#71797E',
  'Royal Blue': '#2743a0', Blue: '#2743a0', Khaki: '#C3B091', Mustard: '#E1AD01',
  Stone: '#8A7F72', Cream: '#FFFDD0', Ivory: '#FFFFF0', Emerald: '#046A38',
  Wine: '#722F37', Teal: '#008080', Indigo: '#3F3F74', 'Light Blue': '#ADD8E6',
  'Light Wash': '#A9CCE3', Tan: '#D2B48C', Brown: '#8B5A2B', Mint: '#B2F0D2',
  Peach: '#FFDAB9', Multi: '#C9A227', Red: '#C0392B', Pink: '#F4C2C2',
  Assorted: '#808080', Sand: '#E1D4C0', 'Dark Navy': '#0F1B3D', Pastel: '#BFE3F0',
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

interface Stem { n: string; p: number; mrp: number; c: string; }
interface CatDef {
  slug: string; name: string; desc: string; img: string; parent?: string;
  fit: string[]; fabric: string[]; pattern: string[]; occasion: string[];
  stems: Stem[];
}

const CATS: CatDef[] = [
  { slug: 't-shirts', name: 'T-Shirts', desc: 'Heavyweight oversized, polo, crew neck & graphic streetwear tees.', img: U('photo-1521572267360-ee0c2909d518'),
    fit: ['Oversized', 'Regular Fit', 'Slim Fit'], fabric: ['Cotton', 'Cotton Blend'], pattern: ['Solid', 'Graphic', 'Striped'], occasion: ['Casual', 'Sports'],
    stems: [
      { n: 'Heavyweight Oversized Tee', p: 899, mrp: 1299, c: 'Jet Black' }, { n: 'Heavyweight Oversized Tee', p: 899, mrp: 1299, c: 'Crisp White' },
      { n: 'Heavyweight Oversized Tee', p: 899, mrp: 1299, c: 'Olive Green' }, { n: 'Essential Solid Crew Neck', p: 649, mrp: 899, c: 'Maroon' },
      { n: 'Essential Solid Crew Neck', p: 649, mrp: 899, c: 'Navy' }, { n: 'Essential Solid Crew Neck', p: 649, mrp: 899, c: 'Steel Grey' },
      { n: 'Classic Pique Polo Shirt', p: 799, mrp: 1099, c: 'Royal Navy' }, { n: 'Classic Pique Polo Shirt', p: 799, mrp: 1099, c: 'White' },
      { n: 'Classic Pique Polo Shirt', p: 799, mrp: 1099, c: 'Black' }, { n: 'Korean Boxy Fit Tee', p: 749, mrp: 999, c: 'Crisp White' },
      { n: 'Korean Boxy Fit Tee', p: 749, mrp: 999, c: 'Sage' }, { n: 'Acid Wash Graphic Tee', p: 849, mrp: 1199, c: 'Olive Green' },
      { n: 'Acid Wash Graphic Tee', p: 849, mrp: 1199, c: 'Black' }, { n: 'Striped Breton Tee', p: 699, mrp: 949, c: 'Navy' },
    ] },
  { slug: 'shirts', name: 'Shirts', desc: 'Pure linen, printed casuals, formal dress shirts & mandarin collars.', img: U('photo-1602810318383-e386cc2a3ccf'),
    fit: ['Slim Fit', 'Regular Fit'], fabric: ['Linen', 'Cotton'], pattern: ['Solid', 'Striped', 'Checked', 'Printed'], occasion: ['Formal', 'Casual', 'Party'],
    stems: [
      { n: 'Pure Linen Mandarin Shirt', p: 1199, mrp: 1799, c: 'White' }, { n: 'Pure Linen Mandarin Shirt', p: 1199, mrp: 1799, c: 'Beige' },
      { n: 'Pure Linen Mandarin Shirt', p: 1249, mrp: 1849, c: 'Sky Blue' }, { n: 'Oxford Formal Cotton Shirt', p: 1099, mrp: 1599, c: 'Sky Blue' },
      { n: 'Oxford Formal Cotton Shirt', p: 1099, mrp: 1599, c: 'White' }, { n: 'Oxford Formal Cotton Shirt', p: 1149, mrp: 1649, c: 'Pink' },
      { n: 'Abstract Floral Printed Casual Shirt', p: 999, mrp: 1499, c: 'Multi' }, { n: 'Abstract Floral Printed Casual Shirt', p: 1049, mrp: 1549, c: 'Navy' },
      { n: 'Cuban Collar Resort Shirt', p: 1099, mrp: 1649, c: 'Sage Green' }, { n: 'Cuban Collar Resort Shirt', p: 1099, mrp: 1649, c: 'Black' },
      { n: 'Cuban Collar Resort Shirt', p: 1149, mrp: 1699, c: 'Mustard' }, { n: 'Slim Fit Stretch Formal Shirt', p: 1199, mrp: 1699, c: 'White' },
      { n: 'Slim Fit Stretch Formal Shirt', p: 1199, mrp: 1699, c: 'Light Blue' }, { n: 'Slim Fit Stretch Formal Shirt', p: 1249, mrp: 1749, c: 'Grey' },
    ] },
  { slug: 'trousers', name: 'Trousers', desc: 'Formal tailored trousers & casual cotton pants â€” pick a fit below.', img: U('photo-1479064555552-3ef4979f8908'), fit: [], fabric: [], pattern: [], occasion: [], stems: [] },
  { slug: 'formal-trousers', name: 'Formal Trousers', desc: 'Flat-front crease-resistant tailored trousers for executive wear.', img: U('photo-1479064555552-3ef4979f8908'), parent: 'trousers',
    fit: ['Slim Fit', 'Tailored'], fabric: ['Poly-Viscose', 'Cotton'], pattern: ['Solid'], occasion: ['Formal'],
    stems: [
      { n: 'Tailored Formal Trousers', p: 1299, mrp: 1899, c: 'Charcoal Grey' }, { n: 'Tailored Formal Trousers', p: 1299, mrp: 1899, c: 'Black' },
      { n: 'Tailored Formal Trousers', p: 1349, mrp: 1949, c: 'Navy' }, { n: 'Tailored Formal Trousers', p: 1349, mrp: 1949, c: 'Grey' },
      { n: 'Pleated Wide-Leg Trousers', p: 1399, mrp: 1999, c: 'Grey' }, { n: 'Pleated Wide-Leg Trousers', p: 1399, mrp: 1999, c: 'Beige' },
      { n: 'Executive Flat-Front Trousers', p: 1499, mrp: 2299, c: 'Black' }, { n: 'Executive Flat-Front Trousers', p: 1499, mrp: 2299, c: 'Navy' },
      { n: 'Korean Pleated Trousers', p: 1499, mrp: 2199, c: 'Black' }, { n: 'Korean Pleated Trousers', p: 1499, mrp: 2199, c: 'Cream' },
    ] },
  { slug: 'casual-trousers', name: 'Casual Trousers', desc: 'Relaxed chinos and casual cotton pants for everyday comfort.', img: U('photo-1624378439575-d8705ad7ae80'), parent: 'trousers',
    fit: ['Relaxed Fit', 'Slim Fit'], fabric: ['Cotton', 'Linen Blend'], pattern: ['Solid'], occasion: ['Casual', 'Travel'],
    stems: [
      { n: 'Relaxed Fit Cotton Trousers', p: 1199, mrp: 1699, c: 'Olive' }, { n: 'Relaxed Fit Cotton Trousers', p: 1199, mrp: 1699, c: 'Khaki' },
      { n: 'Relaxed Fit Cotton Trousers', p: 1249, mrp: 1749, c: 'Beige' }, { n: 'Stretch Cotton Slim Fit Chinos', p: 1299, mrp: 1899, c: 'Khaki' },
      { n: 'Stretch Cotton Slim Fit Chinos', p: 1299, mrp: 1899, c: 'Navy' }, { n: 'Stretch Cotton Slim Fit Chinos', p: 1349, mrp: 1949, c: 'Stone' },
      { n: 'Utility Cargo Pants', p: 1399, mrp: 1999, c: 'Sand' }, { n: 'Utility Cargo Pants', p: 1399, mrp: 1999, c: 'Olive' },
      { n: 'Linen Drawstring Trousers', p: 1299, mrp: 1899, c: 'Beige' }, { n: 'Linen Drawstring Trousers', p: 1299, mrp: 1899, c: 'White' },
    ] },
  { slug: 'joggers', name: 'Joggers', desc: 'Multi-pocket utility cargo joggers, tapered track pants & sweatpants.', img: U('photo-1516257984-b1b4d707412e'),
    fit: ['Tapered', 'Relaxed Fit'], fabric: ['Cotton Fleece', 'Poly Blend'], pattern: ['Solid'], occasion: ['Casual', 'Sports'],
    stems: [
      { n: 'Multi-Pocket Tactical Cargo Joggers', p: 1299, mrp: 1899, c: 'Sand Beige' }, { n: 'Multi-Pocket Tactical Cargo Joggers', p: 1299, mrp: 1899, c: 'Black' },
      { n: 'Multi-Pocket Tactical Cargo Joggers', p: 1349, mrp: 1949, c: 'Olive' }, { n: 'Streetwear Tapered Joggers', p: 1099, mrp: 1599, c: 'Jet Black' },
      { n: 'Streetwear Tapered Joggers', p: 1099, mrp: 1599, c: 'Grey' }, { n: 'Streetwear Tapered Joggers', p: 1149, mrp: 1649, c: 'Navy' },
      { n: 'Athletic Tech Track Pants', p: 999, mrp: 1499, c: 'Dark Navy' }, { n: 'Athletic Tech Track Pants', p: 999, mrp: 1499, c: 'Black' },
      { n: 'Athletic Tech Track Pants', p: 1049, mrp: 1549, c: 'Maroon' }, { n: 'Fleece Lined Sweatpants', p: 899, mrp: 1299, c: 'Grey' },
      { n: 'Fleece Lined Sweatpants', p: 899, mrp: 1299, c: 'Charcoal' }, { n: 'Fleece Lined Sweatpants', p: 949, mrp: 1349, c: 'Olive' },
    ] },
  { slug: 'shorts', name: 'Shorts', desc: 'Casual cotton shorts, lounge shorts & active training shorts.', img: U('photo-1591195853828-11db59a44f6b'),
    fit: ['Regular Fit'], fabric: ['Cotton'], pattern: ['Solid', 'Striped'], occasion: ['Casual', 'Sports'],
    stems: [
      { n: 'Casual Cotton Chino Shorts', p: 699, mrp: 999, c: 'Beige' }, { n: 'Casual Cotton Chino Shorts', p: 699, mrp: 999, c: 'Khaki' },
      { n: 'Casual Cotton Chino Shorts', p: 749, mrp: 1049, c: 'Navy' }, { n: 'Casual Cotton Chino Shorts', p: 749, mrp: 1049, c: 'Olive' },
      { n: 'Active Training Shorts', p: 599, mrp: 899, c: 'Black' }, { n: 'Active Training Shorts', p: 599, mrp: 899, c: 'Grey' },
      { n: 'Active Training Shorts', p: 649, mrp: 949, c: 'Navy' }, { n: 'Classic Denim Shorts', p: 799, mrp: 1149, c: 'Indigo' },
      { n: 'Classic Denim Shorts', p: 849, mrp: 1199, c: 'Light Wash' }, { n: 'Linen Drawstring Shorts', p: 749, mrp: 1049, c: 'White' },
    ] },
  { slug: 'activewear', name: 'Activewear', desc: 'Gym tees, vests & performance wear â€” pick your training gear below.', img: U('photo-1517838277536-f5f99be501cd'), fit: [], fabric: [], pattern: [], occasion: [], stems: [] },
  { slug: 'gym-tshirts', name: 'Gym T-Shirts', desc: 'Dry-fit performance training tees that wick sweat instantly.', img: U('photo-1581009146145-b5ef050c2e1e'), parent: 'activewear',
    fit: ['Muscle Fit', 'Regular Fit'], fabric: ['Dry-Fit Polyester'], pattern: ['Solid'], occasion: ['Sports'],
    stems: [
      { n: 'Dry-Fit Performance Training Tee', p: 649, mrp: 999, c: 'Steel Grey' }, { n: 'Dry-Fit Performance Training Tee', p: 649, mrp: 999, c: 'Black' },
      { n: 'Dry-Fit Performance Training Tee', p: 699, mrp: 1049, c: 'Navy' }, { n: 'Dry-Fit Performance Training Tee', p: 699, mrp: 1049, c: 'Red' },
      { n: 'Honeycomb Mesh Panel Training Tee', p: 699, mrp: 1049, c: 'Black' }, { n: 'Honeycomb Mesh Panel Training Tee', p: 749, mrp: 1099, c: 'Royal Blue' },
      { n: 'Compression Fit Baselayer Tee', p: 749, mrp: 1099, c: 'Black' }, { n: 'Compression Fit Baselayer Tee', p: 749, mrp: 1099, c: 'Grey' },
      { n: 'Compression Fit Baselayer Tee', p: 799, mrp: 1149, c: 'Olive' },
    ] },
  { slug: 'gym-vests', name: 'Gym Vests', desc: 'Muscle-fit stringer vests with deep drop armholes for workouts.', img: U('photo-1517838277536-f5f99be501cd'), parent: 'activewear',
    fit: ['Muscle Fit'], fabric: ['Dry-Fit Polyester', 'Cotton'], pattern: ['Solid'], occasion: ['Sports'],
    stems: [
      { n: 'Pro-Gym Muscle Fit Stringer Vest', p: 499, mrp: 799, c: 'Black' }, { n: 'Pro-Gym Muscle Fit Stringer Vest', p: 499, mrp: 799, c: 'Grey' },
      { n: 'Pro-Gym Muscle Fit Stringer Vest', p: 549, mrp: 849, c: 'White' }, { n: 'Pro-Gym Muscle Fit Stringer Vest', p: 549, mrp: 849, c: 'Olive' },
      { n: 'Racerback Training Tank', p: 549, mrp: 849, c: 'Navy' }, { n: 'Racerback Training Tank', p: 549, mrp: 849, c: 'Maroon' },
      { n: 'Hooded Sleeveless Gym Vest', p: 799, mrp: 1199, c: 'Black' }, { n: 'Hooded Sleeveless Gym Vest', p: 799, mrp: 1199, c: 'Grey' },
    ] },
  { slug: 'sweatshirts', name: 'Sweatshirts', desc: 'Heavy fleece crew-neck sweatshirts for cool evenings.', img: U('photo-1556821840-3a63f95609a7'),
    fit: ['Oversized', 'Regular Fit'], fabric: ['Fleece Cotton'], pattern: ['Solid'], occasion: ['Casual', 'Travel'],
    stems: [
      { n: 'Heavy Fleece Crew Sweatshirt', p: 1099, mrp: 1699, c: 'Olive' }, { n: 'Heavy Fleece Crew Sweatshirt', p: 1099, mrp: 1699, c: 'Grey' },
      { n: 'Heavy Fleece Crew Sweatshirt', p: 1149, mrp: 1749, c: 'Black' }, { n: 'Heavy Fleece Crew Sweatshirt', p: 1149, mrp: 1749, c: 'Navy' },
      { n: 'Classic Hooded Sweatshirt', p: 1299, mrp: 1999, c: 'Black' }, { n: 'Classic Hooded Sweatshirt', p: 1299, mrp: 1999, c: 'Charcoal' },
      { n: 'Classic Hooded Sweatshirt', p: 1349, mrp: 2049, c: 'Maroon' }, { n: 'Oversized Drop-Shoulder Sweatshirt', p: 1199, mrp: 1799, c: 'Cream' },
      { n: 'Oversized Drop-Shoulder Sweatshirt', p: 1199, mrp: 1799, c: 'Sage' }, { n: 'Colorblock Panel Sweatshirt', p: 1249, mrp: 1849, c: 'Navy' },
    ] },
  { slug: 'jackets', name: 'Jackets', desc: 'Streetwear denim jackets, bomber jackets & padded waistcoats.', img: U('photo-1551028719-00167b16eac5'),
    fit: ['Regular Fit'], fabric: ['Denim', 'Cotton Twill', 'Nylon'], pattern: ['Solid', 'Washed'], occasion: ['Casual', 'Party'],
    stems: [
      { n: 'Vintage Washed Denim Jacket', p: 1799, mrp: 2799, c: 'Indigo' }, { n: 'Vintage Washed Denim Jacket', p: 1799, mrp: 2799, c: 'Black' },
      { n: 'Vintage Washed Denim Jacket', p: 1899, mrp: 2899, c: 'Light Wash' }, { n: 'MA-1 Bomber Jacket', p: 1999, mrp: 2999, c: 'Olive' },
      { n: 'MA-1 Bomber Jacket', p: 1999, mrp: 2999, c: 'Black' }, { n: 'Classic Trucker Jacket', p: 1899, mrp: 2899, c: 'Tan' },
      { n: 'Classic Trucker Jacket', p: 1949, mrp: 2949, c: 'Brown' }, { n: 'Lightweight Windcheater', p: 1499, mrp: 2299, c: 'Navy' },
      { n: 'Lightweight Windcheater', p: 1499, mrp: 2299, c: 'Grey' }, { n: 'Lightweight Windcheater', p: 1549, mrp: 2349, c: 'Black' },
    ] },
  { slug: 'ethnic-wear', name: 'Ethnic Wear', desc: 'Handcrafted kurtas, kurta pajama sets & designer Nehru waistcoats.', img: U('photo-1617137968427-85924c800a22'), fit: [], fabric: [], pattern: [], occasion: [], stems: [] },
  { slug: 'kurta', name: 'Kurta', desc: 'Short linen kurtas with band collars for festive days.', img: U('photo-1617137968427-85924c800a22'), parent: 'ethnic-wear',
    fit: ['Regular Fit'], fabric: ['Linen', 'Cotton'], pattern: ['Solid', 'Textured'], occasion: ['Festive', 'Casual'],
    stems: [
      { n: 'Linen Short Kurta', p: 1299, mrp: 1999, c: 'Pristine White' }, { n: 'Linen Short Kurta', p: 1299, mrp: 1999, c: 'Mustard' },
      { n: 'Linen Short Kurta', p: 1349, mrp: 2049, c: 'Mint' }, { n: 'Linen Short Kurta', p: 1349, mrp: 2049, c: 'Peach' },
      { n: 'Handloom Cotton Kurta', p: 1499, mrp: 2299, c: 'Beige' }, { n: 'Handloom Cotton Kurta', p: 1499, mrp: 2299, c: 'Maroon' },
      { n: 'Chikankari Embroidered Kurta', p: 1599, mrp: 2499, c: 'White' }, { n: 'Chikankari Embroidered Kurta', p: 1599, mrp: 2499, c: 'Pastel' },
      { n: 'Indigo Printed Kurta', p: 1399, mrp: 2099, c: 'Indigo' }, { n: 'Indigo Printed Kurta', p: 1449, mrp: 2149, c: 'Olive' },
    ] },
  { slug: 'kurta-pajama', name: 'Kurta Pajama', desc: 'Festive kurta pajama sets in cotton-silk blends.', img: U('photo-1507679799987-c73779587ccf'), parent: 'ethnic-wear',
    fit: ['Regular Fit'], fabric: ['Cotton Silk'], pattern: ['Solid', 'Jacquard'], occasion: ['Festive'],
    stems: [
      { n: 'Designer Kurta Pajama Set', p: 1999, mrp: 3299, c: 'Royal Blue' }, { n: 'Designer Kurta Pajama Set', p: 1999, mrp: 3299, c: 'Cream' },
      { n: 'Designer Kurta Pajama Set', p: 2099, mrp: 3399, c: 'Maroon' }, { n: 'Designer Kurta Pajama Set', p: 2099, mrp: 3399, c: 'Emerald' },
      { n: 'Designer Kurta Pajama Set', p: 2199, mrp: 3499, c: 'Ivory' }, { n: 'Designer Kurta Pajama Set', p: 2199, mrp: 3499, c: 'Black' },
      { n: 'Designer Kurta Pajama Set', p: 2299, mrp: 3599, c: 'Wine' }, { n: 'Designer Kurta Pajama Set', p: 2299, mrp: 3599, c: 'Teal' },
      { n: 'Designer Kurta Pajama Set', p: 2399, mrp: 3699, c: 'Beige' },
    ] },
  { slug: 'nehru-jackets', name: 'Nehru Jackets', desc: 'Structured Nehru waistcoats with metallic buttons.', img: U('photo-1594938298603-c8148c4dae35'), parent: 'ethnic-wear',
    fit: ['Slim Fit'], fabric: ['Jacquard', 'Silk Blend'], pattern: ['Jacquard', 'Solid'], occasion: ['Festive', 'Party'],
    stems: [
      { n: 'Woven Jacquard Nehru Jacket', p: 1599, mrp: 2499, c: 'Black' }, { n: 'Woven Jacquard Nehru Jacket', p: 1599, mrp: 2499, c: 'Maroon' },
      { n: 'Woven Jacquard Nehru Jacket', p: 1699, mrp: 2599, c: 'Navy' }, { n: 'Woven Jacquard Nehru Jacket', p: 1699, mrp: 2599, c: 'Cream' },
      { n: 'Classic Nehru Waistcoat', p: 1599, mrp: 2499, c: 'Olive' }, { n: 'Classic Nehru Waistcoat', p: 1599, mrp: 2499, c: 'Wine' },
      { n: 'Classic Nehru Waistcoat', p: 1699, mrp: 2599, c: 'Grey' }, { n: 'Classic Nehru Waistcoat', p: 1699, mrp: 2599, c: 'Royal Blue' },
    ] },
  { slug: 'boxers', name: 'Boxers', desc: 'Breathable cotton boxers and lounge shorts for all-day ease.', img: U('photo-1591195853828-11db59a44f6b'),
    fit: ['Regular Fit'], fabric: ['Combed Cotton', 'Modal'], pattern: ['Solid', 'Striped', 'Checked'], occasion: ['Casual'],
    stems: [
      { n: 'Combed Cotton Boxers Pack of 2', p: 499, mrp: 799, c: 'Assorted' }, { n: 'Combed Cotton Boxers Pack of 2', p: 499, mrp: 799, c: 'Black' },
      { n: 'Combed Cotton Boxers Pack of 2', p: 549, mrp: 849, c: 'Navy' }, { n: 'Combed Cotton Boxers Pack of 2', p: 549, mrp: 849, c: 'Grey' },
      { n: 'Striped Elastic Boxers', p: 549, mrp: 849, c: 'Navy' }, { n: 'Striped Elastic Boxers', p: 549, mrp: 849, c: 'Grey' },
      { n: 'Relaxed Lounge Shorts', p: 599, mrp: 899, c: 'Olive' }, { n: 'Relaxed Lounge Shorts', p: 599, mrp: 899, c: 'Charcoal' },
      { n: 'Relaxed Lounge Shorts', p: 649, mrp: 949, c: 'Beige' }, { n: 'Relaxed Lounge Shorts', p: 649, mrp: 949, c: 'Indigo' },
      { n: 'Modal Stretch Trunks', p: 549, mrp: 849, c: 'Black' }, { n: 'Modal Stretch Trunks', p: 549, mrp: 849, c: 'Navy' },
      { n: 'Modal Stretch Trunks', p: 599, mrp: 899, c: 'Grey' }, { n: 'Modal Stretch Trunks', p: 599, mrp: 899, c: 'Maroon' },
      { n: 'Bamboo Fibre Boxers', p: 649, mrp: 949, c: 'Sage' }, { n: 'Bamboo Fibre Boxers', p: 649, mrp: 949, c: 'Sand' },
    ] },
];

const REVIEWERS = ['Aarav S.', 'Rohan M.', 'Vikram R.', 'Arjun N.', 'Kabir S.', 'Aditya P.', 'Ishaan V.', 'Nikhil J.', 'Sahil K.', 'Manav T.'];
const REVIEW_TEXTS = [
  'Perfect fit and premium fabric. True to size, highly recommended.',
  'Great quality for the price. Delivery was quick and packaging was neat.',
  'Loved the finish and stitching. Fits exactly as per the size guide.',
  'Very comfortable, wore it all day. Will definitely order again.',
  'Good product, colour matches the photos. Slightly slim â€” check the guide.',
  'Excellent value. Fabric feels durable after two washes.',
];
const BADGE_ROTATE = ['bestseller', 'trending', 'new', 'limited', '', '', 'bestseller', 'trending', '', 'new'];

async function main() {
  const { connectDatabase } = await import('../config/database');
  const { Category } = await import('../models/Category');
  const { Product } = await import('../models/Product');
  const { User } = await import('../models/User');
  const { Order } = await import('../models/Order');
  const { Payment } = await import('../models/Payment');
  const { Discount } = await import('../models/Discount');
  const { Cart } = await import('../models/Cart');
  const { BackInStock } = await import('../models/BackInStock');
  const { PriceAlert } = await import('../models/PriceAlert');
  const { UgcItem } = await import('../models/UgcItem');
  const { ShopLook } = await import('../models/ShopLook');
  const { Settings, DEFAULT_SETTINGS } = await import('../models/Settings');

  await connectDatabase();
  console.log('WIPE: dropping databaseâ€¦');
  await mongoose.connection.dropDatabase();
  console.log('WIPE: done.');

  // ---------- Categories ----------
  const catIds: Record<string, any> = {};
  for (const c of CATS) {
    const doc = await Category.create({ name: c.name, slug: c.slug, description: c.desc, image: c.img, status: 'active' });
    catIds[c.slug] = doc._id;
  }
  for (const c of CATS) {
    if (c.parent) await Category.findByIdAndUpdate(catIds[c.slug], { parent: catIds[c.parent] });
  }
  console.log(`Categories: ${CATS.length}`);

  // ---------- Products (150) ----------
  const PREFIX: Record<string, string> = { 't-shirts': 'TSH', shirts: 'SHI', 'formal-trousers': 'FTR', 'casual-trousers': 'CTR', joggers: 'JOG', shorts: 'SHO', 'gym-tshirts': 'GTS', 'gym-vests': 'GVE', sweatshirts: 'SWT', jackets: 'JAC', kurta: 'KUR', 'kurta-pajama': 'KPA', 'nehru-jackets': 'NHJ', boxers: 'BOX' };
  const IMG2: Record<string, string> = {
    't-shirts': U('photo-1503342217505-b0a15ec3261c'), shirts: U('photo-1521572267360-ee0c2909d518'),
    'formal-trousers': U('photo-1594938298603-c8148c4dae35'), 'casual-trousers': U('photo-1541099649105-f69ad21f3246'),
    joggers: U('photo-1552374196-1ab2a1c593e8'), shorts: U('photo-1441986300917-64674bd600d8'),
    'gym-tshirts': U('photo-1517838277536-f5f99be501cd'), 'gym-vests': U('photo-1517838277536-f5f99be501cd'),
    sweatshirts: U('photo-1521572267360-ee0c2909d518'), jackets: U('photo-1507679799987-c73779587ccf'),
    kurta: U('photo-1507679799987-c73779587ccf'), 'kurta-pajama': U('photo-1617137968427-85924c800a22'),
    'nehru-jackets': U('photo-1507679799987-c73779587ccf'), boxers: U('photo-1591195853828-11db59a44f6b'),
  };
  const docs: any[] = [];
  const prodBySku: Record<string, any> = {};
  let seq = 0;
  const dayMs = 86400000;
  const now = Date.now();
  for (const cat of CATS) {
    if (cat.stems.length === 0) continue;
    cat.stems.forEach((s, si) => {
      seq += 1;
      const sku = `MTS-${PREFIX[cat.slug]}-${String(seq).padStart(3, '0')}`;
      const colorCode = COLORS[s.c] || '#808080';
      const fit = cat.fit[si % cat.fit.length];
      const fabric = cat.fabric[si % cat.fabric.length];
      const pattern = cat.pattern[si % cat.pattern.length];
      const occasion = cat.occasion[si % cat.occasion.length];
      const name = `${s.n} - ${s.c}`;
      // stock rotation: mostly XXL sold out; every 5th fully stocked
      const spread = seq % 5 === 0 ? [14, 22, 28, 12, 8] : [10 + (seq % 7), 20 + (seq % 9), 26 + (seq % 6), 6 + (seq % 5), 0];
      const variantSKUs = SIZES.map((sz, i) => ({
        sku: `${sku}-${sz}`, attributes: { Size: sz, Color: s.c }, price: s.p,
        compareAtPrice: s.mrp, stock: spread[i], lowStockThreshold: 5, isEnabled: true,
      }));
      const stock = spread.reduce((a, b) => a + b, 0);
      // ratings: every 6th product is unrated (new), else 2 approved reviews
      const rated = seq % 6 !== 0;
      const r1 = 4 + ((seq * 7) % 20) / 20; // 4.0â€“4.95
      const r2 = 4 + ((seq * 13) % 20) / 20;
      const reviews = rated ? [
        { userId: new mongoose.Types.ObjectId(), userName: REVIEWERS[seq % REVIEWERS.length], rating: Math.round(r1 * 2) / 2, comment: REVIEW_TEXTS[seq % REVIEW_TEXTS.length], verifiedPurchase: seq % 3 !== 0, helpfulCount: seq % 9, moderationStatus: 'approved' },
        { userId: new mongoose.Types.ObjectId(), userName: REVIEWERS[(seq + 3) % REVIEWERS.length], rating: Math.round(r2 * 2) / 2, comment: REVIEW_TEXTS[(seq + 2) % REVIEW_TEXTS.length], verifiedPurchase: true, helpfulCount: (seq + 4) % 7, moderationStatus: 'approved' },
      ] : [];
      const avg = rated ? Math.round(((reviews[0].rating + reviews[1].rating) / 2) * 10) / 10 : 0;
      const badge = BADGE_ROTATE[seq % BADGE_ROTATE.length];
      const isNewArrival = seq % 10 <= 1; // ~15 newest
      docs.push({
        name, slug: slugify(name) + `-${seq}`, description: `${s.n} in ${s.c}. Premium ${fabric.toLowerCase()} with a ${fit.toLowerCase()} cut, made for all-day comfort.\n\nKey Features:\nâ€¢ Premium ${fabric.toLowerCase()} fabric\nâ€¢ ${fit} â€” true to size\nâ€¢ Pre-shrunk & bio-washed\nâ€¢ Easy machine wash`,
        shortDescription: `${s.n} in ${s.c} â€” ${fit}, ${fabric}.`,
        category: catIds[cat.slug], price: s.p, compareAtPrice: s.mrp, stock, sku, status: 'active',
        images: [{ url: cat.img, altText: name }, { url: IMG2[cat.slug], altText: `${name} alternate view` }],
        hasVariants: true,
        variantAttributes: [
          { name: 'Size', displayName: 'Size', type: 'button', options: SIZES.map((v) => ({ value: v })), required: true },
          { name: 'Color', displayName: 'Color', type: 'color', options: [{ value: s.c, colorCode }], required: false },
        ],
        variantSKUs, averageRating: avg, totalReviews: rated ? 2 + (seq % 40) : 0,
        reviews, badges: badge ? [badge] : [], fit, fabric, pattern, occasion,
        washCare: 'Machine wash cold with like colours. Do not bleach. Tumble dry low. Warm iron if needed.',
        lowStockThreshold: 5, condition: 'new', tags: [],
        createdAt: new Date(now - (isNewArrival ? (seq % 9) * dayMs : (20 + ((seq * 11) % 100)) * dayMs)),
      });
      prodBySku[sku] = docs[docs.length - 1];
    });
  }
  // totalReviews counts realistically while embedded sample reviews stay 2
  await Product.insertMany(docs);
  console.log(`Products: ${docs.length}`);
  const P = async (sku: string) => Product.findOne({ sku }).lean();

  // ---------- Users ----------
  const mkUser = async (u: any) => { const d = new User(u); await d.save(); return d; };
  await mkUser({ name: 'Store Admin', email: 'admin@ecom.com', password: 'Admin123!@#', role: 'superadmin', phone: '+919876543210' });
  await mkUser({ name: 'Catalog Manager', email: 'store.admin@mentoos.in', password: 'Admin123!@#', role: 'admin', phone: '+919876543211' });
  const testUser = await mkUser({
    name: 'Test Mark', email: 'test.user@mentoos.in', password: 'Test@1234', role: 'user',
    phone: '+919876543212', loyaltyPoints: 500,
    loyaltyPointsHistory: [{ points: 500, reason: 'Seeded test balance' }],
    addresses: [{ street: '42, 100 Feet Road', city: 'Bengaluru', state: 'Karnataka', zip: '560001', country: 'India', isDefault: true }],
  });
  const custDefs = [
    ['Aarav Sharma', 'aarav.sharma@gmail.com', '+919811022334', 'Delhi', '110001'],
    ['Rohan Mehta', 'rohan.mehta@gmail.com', '9890144556', 'Mumbai', '400001'],
    ['Vikram Reddy', 'vikram.reddy@gmail.com', '9848066778', 'Hyderabad', '500001'],
    ['Arjun Nair', 'arjun.nair@gmail.com', '9847088990', 'Chennai', '600001'],
    ['Kabir Singh Bedi', 'kabir.singh@gmail.com', '9814011223', 'Jaipur', '302001'],
    ['Aditya Patel', 'aditya.patel@gmail.com', '9898033445', 'Ahmedabad', '380001'],
    ['Ishaan Verma', 'ishaan.verma@gmail.com', '9830055667', 'Pune', '411001'],
  ];
  const custs: any[] = [];
  for (const [nm, em, ph, city, zip] of custDefs) {
    custs.push(await mkUser({
      name: nm, email: em, password: 'Customer@123', role: 'user', phone: ph.startsWith('+') ? ph : '+91' + ph,
      addresses: [{ street: '12 Main Street', city, state: 'Karnataka', zip, country: 'India', isDefault: true }],
    }));
  }
  console.log('Users: 10 (1 superadmin, 1 admin, 8 customers)');

  // ---------- Test-user wishlist + cart + alerts ----------
  const pick = async (skus: string[]) => Promise.all(skus.map((s) => P(s)));
  const wSkus = ['MTS-TSH-001', 'MTS-SHI-015', 'MTS-JOG-049'];
  const wProds = await pick(wSkus);
  testUser.wishlist = wProds.filter(Boolean).map((p: any) => p._id);
  await testUser.save();
  const cartProds = await pick(['MTS-TSH-002', 'MTS-BOX-135']);
  await Cart.create({
    userId: testUser._id,
    items: cartProds.filter(Boolean).map((p: any, i: number) => ({
      productId: p._id, quantity: i + 1, variations: [{ name: 'Size', value: 'M' }], price: p.price,
    })),
  });
  const oosSize = await Product.findOne({ 'variantSKUs.sku': 'MTS-KUR-109-XXL' }).lean();
  await BackInStock.create({ productId: oosSize?._id, productName: 'Linen Short Kurta - Pristine White', size: 'XXL', contact: '+919876543212', contactType: 'phone', whatsappConsent: true, userId: testUser._id });
  const paProd: any = await P('MTS-SHI-015');
  await PriceAlert.create({ productId: paProd._id, productName: paProd.name, targetPrice: paProd.price - 200, contact: 'test.user@mentoos.in', contactType: 'email', userId: testUser._id });
  console.log('Test-user extras: wishlist/cart/stock-alert/price-alert seeded');

  // ---------- Discounts ----------
  const future = new Date(now + 90 * dayMs);
  await Discount.create({ code: 'WELCOME10', type: 'percentage', value: 10, maxDiscount: 500, expiry: future, isActive: true, description: '10% off first order' });
  await Discount.create({ code: 'FLAT200', type: 'fixed', value: 200, minPurchase: 1499, expiry: future, isActive: true, description: 'Rs 200 off above Rs 1499' });
  await Discount.create({ code: 'MENTOOS15', type: 'percentage', value: 15, minPurchase: 999, firstOrderOnly: true, expiry: future, isActive: true, description: 'Flat 15% off on first order, min Rs 999' });
  await Discount.create({ code: 'BUY2GET10', type: 'percentage', value: 10, minItems: 2, maxDiscount: 500, expiry: future, isActive: true, description: 'Combo 10% off any 2+ products' });
  const ethCats = await Category.find({ slug: { $in: ['ethnic-wear', 'kurta', 'kurta-pajama', 'nehru-jackets'] } }).select('_id');
  await Discount.create({ code: 'FESTIVE20', type: 'percentage', value: 20, minPurchase: 1999, applicableCategories: ethCats.map((c: any) => c._id), expiry: future, isActive: true, description: 'Flat 20% off ethnic wear and kurtas, min Rs 1999' });
  await Discount.create({ code: 'FREESHIP', type: 'fixed', value: 0, freeShipping: true, expiry: future, isActive: true, description: 'Free express shipping, no minimum' });
  console.log('Discounts: WELCOME10, FLAT200, MENTOOS15, BUY2GET10, FESTIVE20, FREESHIP');

  // ---------- Settings ----------
  await Settings.findOneAndUpdate({ key: 'global' }, { $setOnInsert: { ...(DEFAULT_SETTINGS as object) } }, { upsert: true });
  console.log('Settings: ensured');

  // ---------- Orders (11, all lifecycle stages) ----------
  const ADDRS = ['Bengaluru|560001', 'Delhi|110001', 'Mumbai|400001', 'Hyderabad|500001', 'Chennai|600001', 'Jaipur|302001', 'Ahmedabad|380001', 'Pune|411001', 'Bengaluru|560001', 'Bengaluru|560001', 'Mumbai|400001'];
  let addrIdx = 0;
  const nextAddr = () => { const parts = ADDRS[addrIdx++].split('|'); return { street: '12 Main Street', city: parts[0], state: 'Karnataka', zip: parts[1], country: 'India' }; };
  const itemOf = async (sku: string, qty: number, size = 'M') => {
    const p: any = await P(sku);
    return { productId: p._id, quantity: qty, variations: [{ name: 'Size', value: size }], price: p.price, subtotal: p.price * qty };
  };
  const mkOrder = async (o: any) => Order.create(o);
  const mkPay = async (p: any) => Payment.create(p);
  const t = (sku: string, qty: number) => itemOf(sku, qty);
  const o1items = [await t('MTS-TSH-001', 1), await t('MTS-CTR-039', 1)];
  const o1total = o1items.reduce((a, i) => a + i.subtotal, 0) + 49;
  const o1 = await mkOrder({
    userId: testUser._id, orderNumber: 'ORD-TEST-001', items: o1items, total: o1total, subtotal: o1total - 49,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'pending', paymentStatus: 'pending',
    paymentMethod: 'cod', codAdvancePaid: 99, codBalance: o1total - 99, razorpayPaymentId: 'pay_TESTCODADV001',
    source: 'web', timeline: [{ event: 'Order created', description: 'COD order with online advance', type: 'system' }],
  });
  await mkPay({ userId: testUser._id, orderId: o1._id, orderNumber: 'ORD-TEST-001', razorpayOrderId: 'order_TESTCOD1', razorpayPaymentId: 'pay_TESTCODADV001', amount: 99, amountPaise: 9900, method: 'upi', purpose: 'cod_advance', status: 'captured' });

  const o2items = [await t('MTS-SHI-015', 1)];
  const o2 = await mkOrder({
    userId: custs[0]._id, orderNumber: 'ORD-TEST-002', items: o2items, total: o2items[0].subtotal + 49, subtotal: o2items[0].subtotal,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'processing', paymentStatus: 'confirmed',
    paymentMethod: 'razorpay', razorpayOrderId: 'order_TEST002', razorpayPaymentId: 'pay_TEST002',
    source: 'web', timeline: [{ event: 'Payment confirmed', description: 'Razorpay payment captured', type: 'payment' }],
  });
  await mkPay({ userId: custs[0]._id, orderId: o2._id, orderNumber: 'ORD-TEST-002', razorpayOrderId: 'order_TEST002', razorpayPaymentId: 'pay_TEST002', amount: o2.total, amountPaise: o2.total * 100, method: 'upi', purpose: 'full', status: 'captured' });

  await mkOrder({
    userId: custs[1]._id, orderNumber: 'ORD-TEST-003', items: [await t('MTS-JOG-049', 1)], total: 1348, subtotal: 1299,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'packed', paymentStatus: 'confirmed',
    paymentMethod: 'razorpay', razorpayPaymentId: 'pay_TEST003', source: 'web',
    timeline: [{ event: 'Order packed', description: 'Packed at warehouse', type: 'fulfillment' }],
  });
  await mkOrder({
    userId: custs[2]._id, orderNumber: 'ORD-TEST-004', items: [await t('MTS-KPA-121', 1)], total: 2048, subtotal: 1999,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'shipped', paymentStatus: 'confirmed',
    paymentMethod: 'razorpay', razorpayPaymentId: 'pay_TEST004',
    trackingNumber: 'SRTPTEST0001', trackingUrl: 'https://shiprocket.co/tracking/SRTPTEST0001',
    shiprocketOrderId: 'SRTEST01', shiprocketShipmentId: 'SRSHIP01', shiprocketAWB: 'SRTPTEST0001',
    shiprocketCourier: 'Delhivery', shiprocketStatus: 'In Transit',
    estimatedDelivery: new Date(now + 3 * dayMs), source: 'web',
    timeline: [{ event: 'Order shipped', description: 'Handed to Delhivery, AWB SRTPTEST0001', type: 'fulfillment' }],
  });
  await mkOrder({
    userId: custs[3]._id, orderNumber: 'ORD-TEST-005', items: [await t('MTS-KUR-111', 1)], total: 1348, subtotal: 1299,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'out_for_delivery', paymentStatus: 'confirmed',
    paymentMethod: 'cod', trackingNumber: 'SRTPTEST0002', shiprocketAWB: 'SRTPTEST0002', shiprocketCourier: 'XpressBees',
    shiprocketStatus: 'Out for delivery', estimatedDelivery: new Date(now + dayMs), source: 'web',
    timeline: [{ event: 'Out for delivery', description: 'Courier is nearby', type: 'fulfillment' }],
  });
  const o6items = [await t('MTS-TSH-003', 2)];
  const o6 = await mkOrder({
    userId: custs[4]._id, orderNumber: 'ORD-TEST-006', items: o6items, total: o6items[0].subtotal + 0, subtotal: o6items[0].subtotal,
    shippingCost: 0, shippingAddress: nextAddr(), status: 'delivered', paymentStatus: 'confirmed',
    paymentMethod: 'razorpay', razorpayPaymentId: 'pay_TEST006', deliveredAt: new Date(now - 5 * dayMs), source: 'web',
    timeline: [{ event: 'Order delivered', description: 'Delivered to customer', type: 'fulfillment' }],
  });
  await mkPay({ userId: custs[4]._id, orderId: o6._id, orderNumber: 'ORD-TEST-006', razorpayOrderId: 'order_TEST006', razorpayPaymentId: 'pay_TEST006', amount: o6.total, amountPaise: o6.total * 100, method: 'card', purpose: 'full', status: 'captured' });
  await mkOrder({
    userId: custs[5]._id, orderNumber: 'ORD-TEST-007', items: [await t('MTS-NHJ-130', 1)], total: 1648, subtotal: 1599,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'delivered', paymentStatus: 'confirmed',
    paymentMethod: 'upi', deliveredAt: new Date(now - 9 * dayMs), source: 'web',
    timeline: [{ event: 'Order delivered', description: 'Delivered to customer', type: 'fulfillment' }],
  });
  await mkOrder({
    userId: custs[6]._id, orderNumber: 'ORD-TEST-008', items: [await t('MTS-BOX-135', 1)], total: 548, subtotal: 499,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'cancelled', paymentStatus: 'pending',
    paymentMethod: 'cod', source: 'web', cancelledReason: 'Customer changed size preference',
    timeline: [{ event: 'Order cancelled', description: 'Cancelled by customer', type: 'status_change' }],
  });
  const o9 = await mkOrder({
    userId: testUser._id, orderNumber: 'ORD-TEST-009', items: [await t('MTS-SWT-088', 1)], total: 1148, subtotal: 1099,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'refunded', paymentStatus: 'refunded',
    paymentMethod: 'razorpay', razorpayPaymentId: 'pay_TEST009', refundAmount: 1148, refundNotes: 'Size exchange converted to refund (test)',
    source: 'web', timeline: [{ event: 'Order refunded', description: 'Refunded via Razorpay test', type: 'payment' }],
  });
  await mkPay({ userId: testUser._id, orderId: o9._id, orderNumber: 'ORD-TEST-009', razorpayOrderId: 'order_TEST009', razorpayPaymentId: 'pay_TEST009', amount: 1148, amountPaise: 114800, method: 'card', purpose: 'full', status: 'refunded', refundId: 'rfnd_TEST009', refundAmount: 1148 });
  await mkOrder({
    userId: testUser._id, orderNumber: 'ORD-TEST-010', items: [await t('MTS-GVE-080', 1)], total: 548, subtotal: 499,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'pending', paymentStatus: 'pending',
    paymentMethod: 'cod', codAdvancePaid: 0, codBalance: 548, source: 'web',
    timeline: [{ event: 'Order created', description: 'Pure COD order', type: 'system' }],
  });
  await mkOrder({
    userId: custs[1]._id, orderNumber: 'ORD-TEST-011', items: [await t('MTS-FTR-029', 1)], total: 1348, subtotal: 1299,
    shippingCost: 49, shippingAddress: nextAddr(), status: 'delivered', paymentStatus: 'confirmed',
    paymentMethod: 'razorpay', razorpayPaymentId: 'pay_TEST011', deliveredAt: new Date(now - 12 * dayMs), source: 'web',
    timeline: [{ event: 'Order delivered', description: 'Delivered to customer', type: 'fulfillment' }],
  });
  console.log('Orders: 11 (pendingÃ—2, processing, packed, shipped, out_for_delivery, deliveredÃ—3, cancelled, refunded)');

  // ---------- Reviews on delivered products ----------
  const rev = async (sku: string, u: any, rating: number, comment: string) => {
    const p: any = await P(sku);
    await Product.updateOne({ _id: p._id }, {
      $push: { reviews: { userId: u._id, userName: u.name, rating, comment, verifiedPurchase: true, moderationStatus: 'approved' } },
    });
  };
  await rev('MTS-TSH-003', custs[4], 5, 'Fits perfectly, fabric feels premium. My second order.');
  await rev('MTS-NHJ-130', custs[5], 5, 'Wore it to a wedding â€” got so many compliments. Great finish.');
  await rev('MTS-FTR-029', custs[1], 4, 'Sharp formal look, slight stretch would be nice. Overall happy.');
  // recompute averages for touched products
  for (const sku of ['MTS-TSH-003', 'MTS-NHJ-130', 'MTS-FTR-029']) {
    const p: any = await P(sku);
    const appr = (p.reviews || []).filter((r: any) => r.moderationStatus === 'approved');
    const avg = appr.length ? Math.round((appr.reduce((a: number, r: any) => a + r.rating, 0) / appr.length) * 10) / 10 : 0;
    await Product.updateOne({ sku }, { $set: { averageRating: avg, totalReviews: appr.length } });
  }
  console.log('Reviews: 3 approved on delivered products');

  // ---------- Shop the Look + UGC ----------
  const lookProds = await Promise.all(['MTS-TSH-001', 'MTS-CTR-039', 'MTS-SHI-015'].map((s) => P(s)));
  await ShopLook.create({
    title: 'Weekend Casual Uniform', description: 'Black oversized tee with olive relaxed trousers â€” easy off-duty uniform.',
    imageUrl: U('photo-1552374196-1ab2a1c593e8'), productIds: lookProds.filter(Boolean).map((p: any) => p._id), isActive: true, position: 0,
  });
  const festProds = await Promise.all(['MTS-KUR-109', 'MTS-NHJ-130', 'MTS-KPA-119'].map((s) => P(s)));
  await ShopLook.create({
    title: 'Festive Regal Set', description: 'White short kurta layered with a maroon Nehru jacket over a royal blue set.',
    imageUrl: U('photo-1617137968427-85924c800a22'), productIds: festProds.filter(Boolean).map((p: any) => p._id), isActive: true, position: 1,
  });
  const ugcProds = await Promise.all(['MTS-TSH-001', 'MTS-JOG-049', 'MTS-KUR-109', 'MTS-GVE-080', 'MTS-SHI-015'].map((s) => P(s)));
  const ugcDefs = [
    { customerName: 'Aarav S.', caption: 'Gym day in my black oversized tee ðŸ’ª', img: U('photo-1521572267360-ee0c2909d518') },
    { customerName: 'Rohan M.', caption: 'Cargo joggers are so comfortable for travel', img: U('photo-1516257984-b1b4d707412e') },
    { customerName: 'Vikram R.', caption: 'Diwali ready in linen kurta', img: U('photo-1617137968427-85924c800a22') },
    { customerName: 'Kabir S.', caption: 'Morning workout stringer fit check', img: U('photo-1517838277536-f5f99be501cd') },
    { customerName: 'Aditya P.', caption: 'Crisp white shirt for office days', img: U('photo-1602810318383-e386cc2a3ccf') },
  ];
  for (let i = 0; i < ugcDefs.length; i++) {
    await UgcItem.create({
      source: 'customer', mediaType: 'image', mediaUrl: ugcDefs[i].img, thumbnailUrl: ugcDefs[i].img,
      customerName: ugcDefs[i].customerName, caption: ugcDefs[i].caption, likes: 20 + i * 13,
      productId: ugcProds[i]?._id, featured: i < 2, isActive: true,
    });
  }
  console.log('ShopTheLook: 2, UGC: 5 (2 featured)');

  console.log('SEED COMPLETE: 150 products target check below');
  const total = await Product.countDocuments({});
  console.log(`Products in DB: ${total}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error('SEED FAILED:', e);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
