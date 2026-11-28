/**
 * Shared catalogue content for the five alternative demo storefronts.
 *
 * The five demos intentionally look nothing alike, but they all sell the same
 * catalogue — so the copy, prices and photography live here once and each page
 * renders them through its own design language.
 */

export type DemoProduct = {
  id: string;
  name: string;
  price: string;
  mrp?: string;
  tag: string;
  colour: string;
  img: string;
  rating: number;
  reviews: number;
};

export type DemoCategory = { name: string; count: string; img: string };
export type DemoLook = { title: string; note: string; img: string; pieces: string[] };
export type DemoReview = { name: string; city: string; text: string; rating: number };
export type DemoUgc = { handle: string; caption: string; img: string; views: string };
export type DemoSocial = { img: string; likes: string; caption: string };
export type DemoOffer = { code: string; headline: string; detail: string; rule: string };
export type DemoTrust = { title: string; body: string };

const IMG = {
  teeWhite: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85',
  teeBoxy: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=85',
  teeBlack: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=85',
  teeGrey: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85',
  shirtLinen: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85',
  shirtFlax: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=900&q=85',
  shirtCamp: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85',
  shirtSand: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=900&q=85',
  trouserPleat: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85',
  trouserWide: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=85',
  jacketWool: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85',
  jacketSoft: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=85',
  modelA: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=1200&q=85',
  modelB: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85',
  modelC: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1200&q=85',
  modelD: 'https://images.unsplash.com/photo-1467043237213-65f2da53396f?auto=format&fit=crop&w=1200&q=85',
  store: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85',
  rail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85',
  rack: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=85',
} as const;

export const HERO_IMAGE = IMG.modelA;
export const HERO_IMAGE_ALT = IMG.rail;
export const HERO_IMAGE_DARK = IMG.modelC;

export const CATEGORIES: DemoCategory[] = [
  { name: 'Heavyweight Tees', count: '28 pieces', img: IMG.teeBoxy },
  { name: 'Linen Shirts', count: '22 pieces', img: IMG.shirtLinen },
  { name: 'Pleated Trousers', count: '19 pieces', img: IMG.trouserPleat },
  { name: 'Outerwear', count: '11 pieces', img: IMG.jacketWool },
  { name: 'Resort', count: '16 pieces', img: IMG.shirtFlax },
  { name: 'Festive', count: '9 pieces', img: IMG.jacketSoft },
];

export const NEW_ARRIVALS: DemoProduct[] = [
  { id: 'p-01', name: 'Boxy Heavyweight Tee', price: '₹899', mrp: '₹1,199', tag: 'New', colour: 'Bone', img: IMG.teeWhite, rating: 4.7, reviews: 128 },
  { id: 'p-02', name: 'Relaxed Cuban Linen', price: '₹1,399', tag: 'Pure flax', colour: 'Sand', img: IMG.shirtLinen, rating: 4.8, reviews: 96 },
  { id: 'p-03', name: 'Pleated Wide Trouser', price: '₹1,799', mrp: '₹2,199', tag: 'Drop 04', colour: 'Olive', img: IMG.trouserPleat, rating: 4.6, reviews: 74 },
  { id: 'p-04', name: 'Unstructured Wool Jacket', price: '₹4,200', tag: 'Atelier', colour: 'Charcoal', img: IMG.jacketWool, rating: 4.9, reviews: 41 },
];

export const TRENDING: DemoProduct[] = [
  { id: 'p-05', name: 'Camp Collar Shirt', price: '₹1,499', tag: 'Trending', colour: 'Clay', img: IMG.shirtCamp, rating: 4.7, reviews: 212 },
  { id: 'p-06', name: 'Night Cotton Tee', price: '₹949', tag: 'Restocked', colour: 'Ink', img: IMG.teeBlack, rating: 4.5, reviews: 189 },
  { id: 'p-07', name: 'Gurkha Trouser', price: '₹1,899', tag: 'Low stock', colour: 'Stone', img: IMG.trouserWide, rating: 4.8, reviews: 143 },
  { id: 'p-08', name: 'Soft Shoulder Blazer', price: '₹4,600', tag: 'Editor pick', colour: 'Bark', img: IMG.jacketSoft, rating: 4.9, reviews: 58 },
];

export const BEST_SELLERS: DemoProduct[] = [
  { id: 'p-09', name: 'Everyday Boxy Tee', price: '₹899', tag: 'No. 1', colour: 'White', img: IMG.teeGrey, rating: 4.8, reviews: 640 },
  { id: 'p-10', name: 'Belgian Flax Shirt', price: '₹1,449', tag: 'No. 2', colour: 'Ecru', img: IMG.shirtFlax, rating: 4.8, reviews: 512 },
  { id: 'p-11', name: 'Tapered Pleat Trouser', price: '₹1,749', tag: 'No. 3', colour: 'Slate', img: IMG.trouserPleat, rating: 4.6, reviews: 388 },
  { id: 'p-12', name: 'Matka Silk Overshirt', price: '₹2,899', tag: 'No. 4', colour: 'Bronze', img: IMG.shirtSand, rating: 4.7, reviews: 205 },
];

export const FITS = [
  { name: 'Oversized', note: 'Drop shoulder, +6 cm chest', img: IMG.teeBoxy },
  { name: 'Relaxed', note: 'Straight body, +3 cm chest', img: IMG.shirtLinen },
  { name: 'Regular', note: 'True to size, clean line', img: IMG.shirtCamp },
  { name: 'Tailored', note: 'Close fit, high armhole', img: IMG.jacketWool },
];

export const STYLES = [
  { name: 'Quiet Minimal', note: 'Bone, stone, charcoal. Nothing loud.', img: IMG.teeGrey },
  { name: 'Resort Linen', note: 'Flax, camp collars, open weaves.', img: IMG.shirtFlax },
  { name: 'Street Weight', note: '280 GSM, boxed shoulders, cargo.', img: IMG.teeBlack },
  { name: 'Festive Craft', note: 'Silk, bronze, hand-finished.', img: IMG.shirtSand },
];

export const LOOKS: DemoLook[] = [
  { title: 'The Long Afternoon', note: 'Look 01 · Resort', img: IMG.modelB, pieces: ['Cuban Linen Shirt', 'Pleated Trouser', 'Leather Slide'] },
  { title: 'Studio Uniform', note: 'Look 02 · Minimal', img: IMG.modelA, pieces: ['Heavyweight Tee', 'Wide Trouser', 'Wool Overshirt'] },
  { title: 'Evening Clay', note: 'Look 03 · Festive', img: IMG.modelC, pieces: ['Silk Overshirt', 'Tapered Trouser', 'Soft Blazer'] },
];

export const REVIEWS: DemoReview[] = [
  { name: 'Rohan Mehta', city: 'Mumbai', rating: 5, text: 'The linen shirt drapes like something twice its price. Three washes in and the collar still stands.' },
  { name: 'Aarav Sharma', city: 'Bengaluru', rating: 5, text: 'Finally a 240 GSM tee that keeps its shoulder line. The boxy cut is exactly what the photos promised.' },
  { name: 'Kabir Nair', city: 'Delhi', rating: 4, text: 'Ordered the Gurkha trouser on Thursday, wore it to a wedding on Sunday. Fit was perfect out of the box.' },
  { name: 'Dev Patel', city: 'Ahmedabad', rating: 5, text: 'The wool jacket is light enough for a workday and sharp enough for dinner. Returns were painless too.' },
];

export const UGC: DemoUgc[] = [
  { handle: '@arjun.wears', caption: 'Linen shirt, 38°C, still standing.', img: IMG.modelB, views: '48K' },
  { handle: '@studio.nikhil', caption: 'Boxy tee + pleat. That is the fit.', img: IMG.modelA, views: '31K' },
  { handle: '@farhan.fit', caption: 'Jacket arrived, tailoring held.', img: IMG.modelC, views: '22K' },
  { handle: '@the.men.edit', caption: 'Unboxing the harvest drop.', img: IMG.modelD, views: '17K' },
];

export const SOCIAL: DemoSocial[] = [
  { img: IMG.teeWhite, likes: '2.4K', caption: 'Drop 04 is live' },
  { img: IMG.shirtCamp, likes: '1.9K', caption: 'Camp collar season' },
  { img: IMG.store, likes: '1.2K', caption: 'Inside the atelier' },
  { img: IMG.trouserPleat, likes: '3.1K', caption: 'Pleats, pressed' },
  { img: IMG.rack, likes: '980', caption: 'Restock Friday' },
  { img: IMG.jacketWool, likes: '2.7K', caption: 'Half-canvas, no logo' },
];

export const OFFERS: DemoOffer[] = [
  { code: 'FLAT200', headline: '₹200 off your first order', detail: 'On carts above ₹1,499. Applies to full-price pieces.', rule: 'First order' },
  { code: 'LINEN10', headline: '10% off all linen', detail: 'Camp collars, overshirts and resort shirts included.', rule: 'This week' },
  { code: 'BUNDLE3', headline: 'Buy 3 tees, save ₹500', detail: 'Mix any three heavyweight tees, any colour.', rule: 'Always on' },
];

export const TRUST: DemoTrust[] = [
  { title: 'Free shipping above ₹1,499', body: 'Delivered in 2–5 working days across India.' },
  { title: '14-day easy returns', body: 'Unworn, tags on. Pickup from your door.' },
  { title: 'Measured, not guessed', body: 'Every garment listed flat with real measurements.' },
  { title: 'Traceable cloth', body: 'Mill, lot and weight printed on each product page.' },
];
