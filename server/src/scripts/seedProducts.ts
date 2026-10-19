import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Category data with realistic categories for an e-commerce platform
const categoriesData = [
  { name: 'Electronics', slug: 'electronics', description: 'Latest gadgets and electronic devices' },
  { name: 'Clothing', slug: 'clothing', description: 'Fashionable apparel for all occasions' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Essential items for your home and kitchen' },
  { name: 'Books', slug: 'books', description: 'Books for all reading preferences' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Gear for sports and outdoor activities' },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Beauty products and personal care items' },
  { name: 'Toys & Games', slug: 'toys-games', description: 'Fun toys and games for all ages' },
  { name: 'Automotive', slug: 'automotive', description: 'Car accessories and automotive supplies' },
  { name: 'Health & Wellness', slug: 'health-wellness', description: 'Products for health and wellness' },
  { name: 'Garden & Tools', slug: 'garden-tools', description: 'Gardening supplies and tools' },
];

// Product templates for different categories
const productTemplates: Record<string, Array<{ name: string; description: string; priceRange: [number, number]; stockRange: [number, number]; variations?: Array<{ type: string; values: string[] }> }>> = {
  'electronics': [
    { name: 'Wireless Bluetooth Headphones', description: 'Premium noise-cancelling wireless headphones with 30-hour battery life', priceRange: [49.99, 299.99], stockRange: [10, 100], variations: [{ type: 'Color', values: ['Black', 'White', 'Blue', 'Red'] }, { type: 'Size', values: ['Standard'] }] },
    { name: 'Smartphone', description: 'Latest generation smartphone with advanced camera and fast processor', priceRange: [199.99, 999.99], stockRange: [5, 50], variations: [{ type: 'Storage', values: ['64GB', '128GB', '256GB'] }, { type: 'Color', values: ['Black', 'Silver', 'Gold'] }] },
    { name: 'Laptop', description: 'High-performance laptop for work and gaming', priceRange: [499.99, 2499.99], stockRange: [3, 30], variations: [{ type: 'RAM', values: ['8GB', '16GB', '32GB'] }, { type: 'Storage', values: ['256GB SSD', '512GB SSD', '1TB SSD'] }] },
    { name: 'Smart Watch', description: 'Feature-rich smartwatch with fitness tracking', priceRange: [99.99, 499.99], stockRange: [10, 80], variations: [{ type: 'Size', values: ['40mm', '44mm'] }, { type: 'Color', values: ['Black', 'Silver', 'Rose Gold'] }] },
    { name: 'Tablet', description: 'Versatile tablet for entertainment and productivity', priceRange: [199.99, 799.99], stockRange: [5, 40], variations: [{ type: 'Storage', values: ['32GB', '64GB', '128GB'] }, { type: 'Color', values: ['Space Gray', 'Silver'] }] },
    { name: 'Camera', description: 'Professional DSLR camera with multiple lenses', priceRange: [599.99, 2999.99], stockRange: [2, 20], variations: [{ type: 'Lens', values: ['18-55mm', '18-135mm', '24-70mm'] }] },
    { name: 'Gaming Console', description: 'Next-generation gaming console with 4K support', priceRange: [299.99, 499.99], stockRange: [5, 25], variations: [{ type: 'Storage', values: ['500GB', '1TB'] }] },
    { name: 'TV', description: '4K Ultra HD Smart TV with streaming capabilities', priceRange: [299.99, 1999.99], stockRange: [3, 20], variations: [{ type: 'Size', values: ['43"', '55"', '65"', '75"'] }] },
    { name: 'Wireless Earbuds', description: 'True wireless earbuds with active noise cancellation', priceRange: [29.99, 199.99], stockRange: [15, 100], variations: [{ type: 'Color', values: ['Black', 'White', 'Blue'] }] },
    { name: 'Portable Speaker', description: 'Waterproof Bluetooth speaker with 360-degree sound', priceRange: [39.99, 199.99], stockRange: [10, 80], variations: [{ type: 'Color', values: ['Black', 'Blue', 'Red', 'Gray'] }] },
  ],
  'clothing': [
    { name: 'Cotton T-Shirt', description: 'Comfortable 100% cotton t-shirt in various colors', priceRange: [9.99, 29.99], stockRange: [20, 200], variations: [{ type: 'Size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }, { type: 'Color', values: ['White', 'Black', 'Navy', 'Gray', 'Red'] }] },
    { name: 'Jeans', description: 'Classic fit jeans made from premium denim', priceRange: [39.99, 99.99], stockRange: [15, 150], variations: [{ type: 'Size', values: ['28', '30', '32', '34', '36', '38', '40'] }, { type: 'Color', values: ['Blue', 'Black', 'Light Blue'] }] },
    { name: 'Running Shoes', description: 'Comfortable running shoes with cushioning technology', priceRange: [59.99, 149.99], stockRange: [10, 100], variations: [{ type: 'Size', values: ['7', '8', '9', '10', '11', '12'] }, { type: 'Color', values: ['Black', 'White', 'Blue', 'Red'] }] },
    { name: 'Winter Jacket', description: 'Warm insulated jacket for cold weather', priceRange: [79.99, 249.99], stockRange: [8, 80], variations: [{ type: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] }, { type: 'Color', values: ['Black', 'Navy', 'Gray', 'Red'] }] },
    { name: 'Dress Shirt', description: 'Formal dress shirt perfect for business occasions', priceRange: [24.99, 79.99], stockRange: [12, 120], variations: [{ type: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] }, { type: 'Color', values: ['White', 'Light Blue', 'Pink'] }] },
    { name: 'Sneakers', description: 'Casual sneakers for everyday wear', priceRange: [49.99, 129.99], stockRange: [15, 150], variations: [{ type: 'Size', values: ['7', '8', '9', '10', '11', '12'] }, { type: 'Color', values: ['White', 'Black', 'Gray', 'Blue'] }] },
    { name: 'Hoodie', description: 'Cozy hoodie with adjustable drawstring hood', priceRange: [34.99, 89.99], stockRange: [18, 180], variations: [{ type: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] }, { type: 'Color', values: ['Black', 'Gray', 'Navy', 'Red'] }] },
    { name: 'Summer Shorts', description: 'Lightweight shorts perfect for warm weather', priceRange: [19.99, 49.99], stockRange: [20, 200], variations: [{ type: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] }, { type: 'Color', values: ['Khaki', 'Navy', 'Black', 'Gray'] }] },
  ],
  'home-kitchen': [
    { name: 'Coffee Maker', description: 'Programmable coffee maker with thermal carafe', priceRange: [49.99, 199.99], stockRange: [8, 80], variations: [{ type: 'Capacity', values: ['8 cups', '12 cups'] }, { type: 'Color', values: ['Black', 'Silver', 'White'] }] },
    { name: 'Air Fryer', description: 'Healthier cooking with rapid air circulation technology', priceRange: [59.99, 249.99], stockRange: [10, 100], variations: [{ type: 'Capacity', values: ['3.5L', '5.5L', '7L'] }, { type: 'Color', values: ['Black', 'Silver', 'White'] }] },
    { name: 'Cookware Set', description: 'Non-stick cookware set with various pot and pan sizes', priceRange: [79.99, 299.99], stockRange: [5, 50], variations: [{ type: 'Pieces', values: ['8-piece', '12-piece', '16-piece'] }] },
    { name: 'Blender', description: 'High-speed blender for smoothies and food prep', priceRange: [39.99, 199.99], stockRange: [12, 120], variations: [{ type: 'Capacity', values: ['32oz', '48oz', '64oz'] }, { type: 'Color', values: ['Black', 'Red', 'Silver'] }] },
    { name: 'Bed Sheets Set', description: 'Soft cotton bed sheets set in various sizes', priceRange: [24.99, 89.99], stockRange: [15, 150], variations: [{ type: 'Size', values: ['Twin', 'Full', 'Queen', 'King'] }, { type: 'Color', values: ['White', 'Gray', 'Beige', 'Blue'] }] },
    { name: 'Dining Table', description: 'Modern dining table with extension leaf', priceRange: [299.99, 999.99], stockRange: [2, 20], variations: [{ type: 'Size', values: ['4-seater', '6-seater', '8-seater'] }, { type: 'Material', values: ['Wood', 'Glass'] }] },
    { name: 'Vacuum Cleaner', description: 'Powerful bagless vacuum cleaner with HEPA filter', priceRange: [89.99, 399.99], stockRange: [8, 80], variations: [{ type: 'Type', values: ['Upright', 'Canister', 'Stick'] }] },
    { name: 'Smart Light Bulbs', description: 'WiFi-enabled smart LED bulbs with app control', priceRange: [14.99, 49.99], stockRange: [20, 200], variations: [{ type: 'Pack', values: ['1-pack', '2-pack', '4-pack'] }, { type: 'Color', values: ['White', 'Color'] }] },
  ],
  'books': [
    { name: 'Fiction Novel', description: 'Bestselling fiction novel with compelling storyline', priceRange: [9.99, 24.99], stockRange: [20, 200], variations: [{ type: 'Format', values: ['Paperback', 'Hardcover', 'E-book'] }] },
    { name: 'Self-Help Book', description: 'Inspirational self-help book for personal growth', priceRange: [12.99, 29.99], stockRange: [15, 150], variations: [{ type: 'Format', values: ['Paperback', 'Hardcover', 'E-book'] }] },
    { name: 'Cookbook', description: 'Collection of delicious recipes from renowned chefs', priceRange: [19.99, 39.99], stockRange: [10, 100], variations: [{ type: 'Format', values: ['Paperback', 'Hardcover'] }] },
    { name: 'Science Fiction', description: 'Award-winning science fiction novel', priceRange: [11.99, 27.99], stockRange: [18, 180], variations: [{ type: 'Format', values: ['Paperback', 'Hardcover', 'E-book'] }] },
    { name: 'Biography', description: 'Fascinating biography of a notable figure', priceRange: [14.99, 34.99], stockRange: [12, 120], variations: [{ type: 'Format', values: ['Paperback', 'Hardcover'] }] },
  ],
  'sports-outdoors': [
    { name: 'Yoga Mat', description: 'Non-slip yoga mat with carrying strap', priceRange: [19.99, 79.99], stockRange: [25, 250], variations: [{ type: 'Thickness', values: ['4mm', '6mm', '8mm'] }, { type: 'Color', values: ['Purple', 'Blue', 'Pink', 'Black'] }] },
    { name: 'Dumbbells Set', description: 'Adjustable dumbbells for home workouts', priceRange: [49.99, 299.99], stockRange: [5, 50], variations: [{ type: 'Weight', values: ['5-25lbs', '10-50lbs', '20-90lbs'] }] },
    { name: 'Bicycle', description: 'Mountain bike with 21-speed gear system', priceRange: [199.99, 999.99], stockRange: [3, 30], variations: [{ type: 'Size', values: ['Small', 'Medium', 'Large'] }, { type: 'Color', values: ['Black', 'Blue', 'Red'] }] },
    { name: 'Tennis Racket', description: 'Professional tennis racket with premium strings', priceRange: [79.99, 249.99], stockRange: [8, 80], variations: [{ type: 'Grip Size', values: ['4 1/4"', '4 3/8"', '4 1/2"'] }] },
    { name: 'Camping Tent', description: 'Waterproof camping tent for outdoor adventures', priceRange: [89.99, 399.99], stockRange: [6, 60], variations: [{ type: 'Capacity', values: ['2-person', '4-person', '6-person'] }] },
    { name: 'Running Shorts', description: 'Lightweight running shorts with moisture-wicking fabric', priceRange: [24.99, 59.99], stockRange: [20, 200], variations: [{ type: 'Size', values: ['S', 'M', 'L', 'XL'] }, { type: 'Color', values: ['Black', 'Navy', 'Gray'] }] },
  ],
  'beauty-personal-care': [
    { name: 'Facial Cleanser', description: 'Gentle facial cleanser for all skin types', priceRange: [9.99, 34.99], stockRange: [30, 300], variations: [{ type: 'Size', values: ['100ml', '200ml', '500ml'] }, { type: 'Skin Type', values: ['Normal', 'Oily', 'Dry', 'Sensitive'] }] },
    { name: 'Moisturizer', description: 'Hydrating face moisturizer with SPF protection', priceRange: [14.99, 59.99], stockRange: [25, 250], variations: [{ type: 'Size', values: ['50ml', '100ml'] }, { type: 'Skin Type', values: ['Normal', 'Oily', 'Dry'] }] },
    { name: 'Shampoo', description: 'Professional-grade shampoo for healthy hair', priceRange: [7.99, 29.99], stockRange: [40, 400], variations: [{ type: 'Size', values: ['250ml', '500ml', '1L'] }, { type: 'Hair Type', values: ['Normal', 'Oily', 'Dry', 'Damaged'] }] },
    { name: 'Perfume', description: 'Luxury fragrance with long-lasting scent', priceRange: [29.99, 149.99], stockRange: [15, 150], variations: [{ type: 'Size', values: ['30ml', '50ml', '100ml'] }] },
    { name: 'Makeup Brush Set', description: 'Professional makeup brush set with carrying case', priceRange: [19.99, 79.99], stockRange: [20, 200], variations: [{ type: 'Pieces', values: ['5-piece', '10-piece', '15-piece'] }] },
  ],
  'toys-games': [
    { name: 'Board Game', description: 'Classic family board game for all ages', priceRange: [14.99, 49.99], stockRange: [25, 250], variations: [{ type: 'Players', values: ['2-4 players', '2-6 players', '2-8 players'] }] },
    { name: 'Action Figure', description: 'Detailed action figure with accessories', priceRange: [9.99, 39.99], stockRange: [30, 300], variations: [{ type: 'Character', values: ['Hero A', 'Hero B', 'Villain'] }] },
    { name: 'Building Blocks Set', description: 'Educational building blocks for creative play', priceRange: [19.99, 99.99], stockRange: [20, 200], variations: [{ type: 'Pieces', values: ['50 pieces', '100 pieces', '200 pieces'] }] },
    { name: 'Remote Control Car', description: 'Fast RC car with rechargeable battery', priceRange: [24.99, 149.99], stockRange: [15, 150], variations: [{ type: 'Scale', values: ['1:24', '1:18', '1:10'] }, { type: 'Color', values: ['Red', 'Blue', 'Yellow'] }] },
    { name: 'Puzzle', description: 'Challenging jigsaw puzzle with beautiful artwork', priceRange: [12.99, 34.99], stockRange: [30, 300], variations: [{ type: 'Pieces', values: ['500 pieces', '1000 pieces', '1500 pieces'] }] },
  ],
  'automotive': [
    { name: 'Car Phone Mount', description: 'Universal car phone mount with strong grip', priceRange: [12.99, 39.99], stockRange: [50, 500], variations: [{ type: 'Type', values: ['Dashboard', 'Vent', 'Windshield'] }] },
    { name: 'Car Floor Mats', description: 'Weather-resistant car floor mats', priceRange: [29.99, 129.99], stockRange: [20, 200], variations: [{ type: 'Set', values: ['Front only', 'Full set'] }, { type: 'Color', values: ['Black', 'Gray', 'Tan'] }] },
    { name: 'Jump Starter', description: 'Portable car battery jump starter', priceRange: [59.99, 199.99], stockRange: [10, 100], variations: [{ type: 'Capacity', values: ['1000A', '2000A', '3001A'] }] },
    { name: 'Car Vacuum', description: 'Handheld car vacuum with multiple attachments', priceRange: [24.99, 89.99], stockRange: [25, 250], variations: [{ type: 'Power', values: ['12V', 'Cordless'] }] },
  ],
  'health-wellness': [
    { name: 'Vitamins', description: 'Daily multivitamin supplement for overall health', priceRange: [14.99, 49.99], stockRange: [40, 400], variations: [{ type: 'Count', values: ['30 tablets', '60 tablets', '90 tablets'] }] },
    { name: 'Protein Powder', description: 'Whey protein powder for muscle recovery', priceRange: [24.99, 79.99], stockRange: [25, 250], variations: [{ type: 'Size', values: ['1lb', '2lb', '5lb'] }, { type: 'Flavor', values: ['Vanilla', 'Chocolate', 'Strawberry'] }] },
    { name: 'Yoga Block', description: 'High-density foam yoga block for alignment', priceRange: [9.99, 24.99], stockRange: [50, 500], variations: [{ type: 'Size', values: ['3"', '4"'] }, { type: 'Color', values: ['Purple', 'Blue', 'Pink'] }] },
    { name: 'Massage Gun', description: 'Deep tissue percussion massage gun', priceRange: [79.99, 299.99], stockRange: [8, 80], variations: [{ type: 'Speed Levels', values: ['3 speeds', '5 speeds', '10 speeds'] }] },
  ],
  'garden-tools': [
    { name: 'Garden Tool Set', description: 'Complete set of essential gardening tools', priceRange: [29.99, 129.99], stockRange: [15, 150], variations: [{ type: 'Pieces', values: ['5-piece', '10-piece', '15-piece'] }] },
    { name: 'Plant Pots', description: 'Decorative plant pots with drainage holes', priceRange: [4.99, 34.99], stockRange: [50, 500], variations: [{ type: 'Size', values: ['Small', 'Medium', 'Large'] }, { type: 'Material', values: ['Ceramic', 'Plastic', 'Terracotta'] }] },
    { name: 'Garden Hose', description: 'Flexible garden hose with spray nozzle', priceRange: [19.99, 79.99], stockRange: [20, 200], variations: [{ type: 'Length', values: ['25ft', '50ft', '100ft'] }, { type: 'Color', values: ['Green', 'Black'] }] },
    { name: 'Lawn Mower', description: 'Electric lawn mower with grass collection bag', priceRange: [149.99, 499.99], stockRange: [5, 50], variations: [{ type: 'Cutting Width', values: ['14"', '16"', '20"'] }] },
  ],
};

// Generate a random SKU
const generateSKU = (categorySlug: string, index: number): string => {
  const categoryPrefix = categorySlug.substring(0, 3).toUpperCase();
  const paddedIndex = String(index).padStart(6, '0');
  return `${categoryPrefix}-${paddedIndex}`;
};

// Generate a random number between min and max
const random = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a random price within range
const randomPrice = (range: [number, number]): number => {
  const price = Math.random() * (range[1] - range[0]) + range[0];
  return Math.round(price * 100) / 100; // Round to 2 decimal places
};

// Generate random stock within range
const randomStock = (range: [number, number]): number => {
  return random(range[0], range[1]);
};

// Generate product images (using placeholder images)
const generateImages = (productName: string, count: number = 1): Array<{ url: string; altText: string }> => {
  const images: Array<{ url: string; altText: string }> = [];
  for (let i = 0; i < count; i++) {
    // Using placeholder image service
    const imageIndex = random(1, 1000);
    images.push({
      url: `https://picsum.photos/seed/${productName.replace(/\s+/g, '-')}-${imageIndex}/800/800`,
      altText: `${productName} - Image ${i + 1}`,
    });
  }
  return images;
};

// Generate variations based on template
const generateVariations = (
  template: typeof productTemplates[string][number],
  sku: string
): { variations?: Array<{ name: string; value: string; priceModifier?: number; stock?: number; sku?: string }>; variationOptions?: Array<{ type: string; values: string[] }> } => {
  if (!template.variations || template.variations.length === 0) {
    return {};
  }

  // Copy variation options as-is (all possible combinations)
  const variationOptions = template.variations.map(v => ({
    type: v.type,
    values: [...v.values],
  }));

  // Generate a few sample variations (not all combinations, just a sample)
  // This is more realistic - products typically have a few variations, not all combinations
  const variations: Array<{ name: string; value: string; priceModifier?: number; stock?: number; sku?: string }> = [];
  
  // Randomly decide if we should include variations (70% chance)
  if (Math.random() > 0.3 && template.variations.length > 0) {
    // Pick first variation type and create 1-3 variations for it
    const firstVariationType = template.variations[0];
    const numVariations = random(1, Math.min(3, firstVariationType.values.length));
    
    for (let i = 0; i < numVariations; i++) {
      const value = firstVariationType.values[i];
      const priceMod = random(0, 15); // Random price modifier (0-15)
      const varStock = random(5, 50); // Stock for this variation
      
      variations.push({
        name: firstVariationType.type,
        value: value,
        priceModifier: priceMod > 5 ? priceMod : undefined, // Only add if significant
        stock: varStock,
        sku: `${sku}-${firstVariationType.type.substring(0, 2).toUpperCase()}-${i + 1}`,
      });
    }
  }

  return { variations, variationOptions };
};

// Main seed function
const seedProducts = async () => {
  try {
    console.log('🌱 Starting product seeding process...\n');
    
    // Connect to database
    await connectDatabase();
    
    // Step 1: Create or get categories
    console.log('📁 Step 1: Setting up categories...');
    const categoryMap: Map<string, mongoose.Types.ObjectId> = new Map();
    
    for (const catData of categoriesData) {
      let category = await Category.findOne({ slug: catData.slug });
      if (!category) {
        category = new Category({
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          status: 'active',
        });
        await category.save();
        console.log(`   ✅ Created category: ${catData.name}`);
      } else {
        console.log(`   ℹ️  Category already exists: ${catData.name}`);
      }
      categoryMap.set(catData.slug, category._id);
    }
    
    console.log(`\n📦 Step 2: Generating products...`);
    
    // Step 2: Create products
    const totalProducts = 100;
    let productCount = 0;
    let skuCounter = 1;
    
    // Calculate products per category (distribute evenly)
    const productsPerCategory = Math.floor(totalProducts / categoriesData.length);
    const remainder = totalProducts % categoriesData.length;
    
    for (let catIndex = 0; catIndex < categoriesData.length; catIndex++) {
      if (productCount >= totalProducts) break;
      
      const catData = categoriesData[catIndex];
      const categoryId = categoryMap.get(catData.slug);
      if (!categoryId) {
        console.log(`   ⚠️  Skipping category ${catData.slug} - ID not found`);
        continue;
      }
      
      const templates = productTemplates[catData.slug] || [];
      if (templates.length === 0) {
        console.log(`   ⚠️  No templates found for category: ${catData.slug}`);
        continue;
      }
      
      // Calculate how many products to create for this category
      // Add remainder to first few categories to ensure exactly 100 products
      const productsForThisCategory = productsPerCategory + (catIndex < remainder ? 1 : 0);
      const remainingProducts = totalProducts - productCount;
      const actualProductsToCreate = Math.min(productsForThisCategory, remainingProducts);
      
      console.log(`\n   📂 Processing category: ${catData.name} (${actualProductsToCreate} products)`);
      
      // Create products for this category
      for (let i = 0; i < actualProductsToCreate && productCount < totalProducts; i++) {
        // Cycle through templates and create variants
        const templateIndex = i % templates.length;
        const template = templates[templateIndex];
        const variantIndex = Math.floor(i / templates.length);
        
        // Generate unique SKU
        const baseSKU = generateSKU(catData.slug, skuCounter++);
        let sku = baseSKU;
        let skuExists = true;
        let skuAttempts = 0;
        
        // Ensure SKU is unique
        while (skuExists && skuAttempts < 100) {
          const existing = await Product.findOne({ sku });
          if (!existing) {
            skuExists = false;
          } else {
            sku = `${baseSKU}-${skuAttempts}`;
            skuAttempts++;
          }
        }
        
        if (skuExists) {
          console.log(`   ⚠️  Could not generate unique SKU for product ${productCount + 1}, skipping...`);
          continue;
        }
        
        // Generate product data
        const price = randomPrice(template.priceRange);
        const stock = randomStock(template.stockRange);
        const images = generateImages(template.name, random(1, 3));
        const { variations, variationOptions } = generateVariations(template, sku);
        
        // Generate product name with variant (add small variation to name for uniqueness)
        let productName = template.name;
        if (variantIndex > 0) {
          productName = `${template.name} - Style ${variantIndex + 1}`;
        } else if (i > 0) {
          // Add some uniqueness even for first variant
          const nameVariants = ['Pro', 'Premium', 'Classic', 'Deluxe', 'Ultra'];
          const variant = nameVariants[Math.floor(Math.random() * nameVariants.length)];
          if (Math.random() > 0.5) {
            productName = `${variant} ${template.name}`;
          }
        }
        
        // Create product
        const product = new Product({
          name: productName,
          description: template.description,
          price: price,
          category: categoryId,
          images: images,
          variations: variations,
          variationOptions: variationOptions,
          stock: stock,
          sku: sku,
          status: stock > 0 ? 'active' : 'out_of_stock',
          lowStockThreshold: 10,
        });
        
        await product.save();
        productCount++;
        
        if (productCount % 10 === 0) {
          console.log(`   ✅ Created ${productCount}/${totalProducts} products...`);
        }
      }
      
      console.log(`   ✅ Completed category: ${catData.name} (${actualProductsToCreate} products)`);
    }
    
    console.log(`\n🎉 Successfully seeded ${productCount} products!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Categories: ${categoriesData.length}`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Average products per category: ${(productCount / categoriesData.length).toFixed(1)}`);
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding products:', error);
    console.error('Stack trace:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedProducts();

