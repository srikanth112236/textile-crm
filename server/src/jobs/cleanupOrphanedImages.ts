import fs from 'fs';
import path from 'path';
import { Product } from '../models/Product';

/**
 * Cleanup job to remove orphaned product images from the filesystem
 * This should be run periodically (e.g., daily via cron or scheduler)
 */
export async function cleanupOrphanedImages(): Promise<void> {
  try {
    const productsDir = path.join(__dirname, '../../uploads/products');
    
    // Ensure directory exists
    if (!fs.existsSync(productsDir)) {
      console.log('Products upload directory does not exist, skipping cleanup');
      return;
    }

    // Get all files in the products directory
    const files = fs.readdirSync(productsDir);
    console.log(`Checking ${files.length} files for orphaned images...`);

    // Get all product images from database
    const products = await Product.find({}, 'images').lean();
    const usedImagePaths = new Set<string>();

    // Extract image filenames from product images array (supports both string and object formats)
    products.forEach((product) => {
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((image: string | { url: string; altText?: string }) => {
          const imageUrl = typeof image === 'string' ? image : (image as any).url;
          if (imageUrl && imageUrl.includes('/uploads/products/')) {
            const filename = path.basename(imageUrl);
            usedImagePaths.add(filename);
          }
        });
      }
    });

    console.log(`Found ${usedImagePaths.size} images in use`);

    // Find orphaned files
    let deletedCount = 0;
    let errorCount = 0;

    files.forEach((filename) => {
      if (!usedImagePaths.has(filename)) {
        const filePath = path.join(productsDir, filename);
        
        try {
          // Check if it's a file (not a directory)
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            fs.unlinkSync(filePath);
            console.log(`Deleted orphaned image: ${filename}`);
            deletedCount++;
          }
        } catch (error: any) {
          console.error(`Error deleting file ${filename}:`, error.message);
          errorCount++;
        }
      }
    });

    console.log(`Cleanup complete: ${deletedCount} orphaned images deleted, ${errorCount} errors`);
  } catch (error: any) {
    console.error('Error in cleanupOrphanedImages job:', error);
    throw error;
  }
}

/**
 * Run cleanup job (can be called from cron or scheduler)
 * Example cron: 0 2 * * * (runs daily at 2 AM)
 */
if (require.main === module) {
  // Only run if executed directly (not imported)
  cleanupOrphanedImages()
    .then(() => {
      console.log('Cleanup job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup job failed:', error);
      process.exit(1);
    });
}

