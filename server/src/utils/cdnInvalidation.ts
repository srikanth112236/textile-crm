/**
 * CDN Invalidation Utility
 * 
 * This utility provides helpers for invalidating CDN cache when images are deleted.
 * 
 * For production, implement CDN-specific invalidation based on your CDN provider:
 * 
 * - AWS CloudFront: Use AWS SDK to create invalidation
 * - Cloudflare: Use Cloudflare API to purge cache
 * - Vercel: Images are automatically cached, use revalidateTag if using Next.js Image Optimization
 * - Azure CDN: Use Azure SDK to purge endpoints
 * 
 * Example implementation for AWS CloudFront:
 * 
 * ```typescript
 * import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
 * 
 * const cloudfront = new CloudFrontClient({ region: 'us-east-1' });
 * 
 * export async function invalidateCDN(imageUrls: string[]): Promise<void> {
 *   const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
 *   if (!distributionId) {
 *     console.warn('CLOUDFRONT_DISTRIBUTION_ID not set, skipping CDN invalidation');
 *     return;
 *   }
 * 
 *   const paths = imageUrls.map(url => {
 *     const urlPath = new URL(url).pathname;
 *     return urlPath;
 *   });
 * 
 *   const command = new CreateInvalidationCommand({
 *     DistributionId: distributionId,
 *     InvalidationBatch: {
 *       Paths: {
 *         Quantity: paths.length,
 *         Items: paths,
 *       },
 *       CallerReference: `product-images-${Date.now()}`,
 *     },
 *   });
 * 
 *   await cloudfront.send(command);
 * }
 * ```
 */

/**
 * Placeholder function for CDN invalidation
 * Replace this with your actual CDN provider implementation
 */
export async function invalidateCDN(imageUrls: string[]): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.warn('CDN invalidation not implemented. Image URLs to invalidate:', imageUrls);
    // TODO: Implement CDN invalidation based on your CDN provider
    // Example: await invalidateCloudFront(imageUrls);
    // Example: await invalidateCloudflare(imageUrls);
  } else {
    console.log('CDN invalidation skipped in development mode');
  }
}

/**
 * Helper to extract image paths from full URLs for CDN invalidation
 */
export function extractImagePaths(imageUrls: string[]): string[] {
  return imageUrls.map((url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // If URL parsing fails, assume it's already a path
      return url.startsWith('/') ? url : `/${url}`;
    }
  });
}

