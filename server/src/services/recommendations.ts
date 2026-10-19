import mongoose from 'mongoose';
import redisClient, { safeRedisOperation } from '../config/redis';
import { Product, IProduct } from '../models/Product';
import { Order } from '../models/Order';
import { OrderStatus } from '../models/Order';
import { getMoreLikeThis } from './search';

// Redis keys
const BROWSING_HISTORY_KEY = (userId: string) => `browsing:${userId}`;
const RECOMMENDATIONS_CACHE_KEY = (userId: string) => `recommendations:${userId}`;
const TRENDING_PRODUCTS_KEY = 'trending:products';

// MongoDB schema for browsing history (optional persistent storage)
interface IBrowsingHistory {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  viewedAt: Date;
  viewCount: number;
}

/**
 * Track product view in browsing history (Phase 8)
 * Stores in Redis with 30-day expiration, periodically syncs to MongoDB
 */
export const trackProductView = async (
  userId: string,
  productId: string
): Promise<void> => {
  try {
    const historyKey = BROWSING_HISTORY_KEY(userId);
    
    // Store in Redis with score (timestamp) for sorting
    await safeRedisOperation(async () => {
      const timestamp = Date.now();
      await redisClient.zadd(historyKey, timestamp, productId);
      // Set expiration to 30 days
      await redisClient.expire(historyKey, 30 * 24 * 60 * 60);
      // Limit history to last 100 products
      await redisClient.zremrangebyrank(historyKey, 0, -101);
    });

    // Invalidate recommendations cache
    await safeRedisOperation(async () => {
      await redisClient.del(RECOMMENDATIONS_CACHE_KEY(userId));
    });
  } catch (error: any) {
    console.error('Error tracking product view:', error.message);
  }
};

/**
 * Get user browsing history from Redis
 */
export const getUserBrowsingHistory = async (
  userId: string,
  limit: number = 20
): Promise<string[]> => {
  try {
    const historyKey = BROWSING_HISTORY_KEY(userId);
    
    const result = await safeRedisOperation<string[]>(async () => {
      // Get most recent products (highest scores = most recent)
      const productIds = await redisClient.zrevrange(historyKey, 0, limit - 1);
      return productIds || [];
    }, []);

    return result || [];
  } catch (error: any) {
    console.error('Error getting browsing history:', error.message);
    return [];
  }
};

/**
 * Get user purchase history from orders
 */
export const getUserPurchaseHistory = async (
  userId: string
): Promise<string[]> => {
  try {
    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] },
    }).select('items.productId');

    const productIds = new Set<string>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        productIds.add(item.productId.toString());
      });
    });

    return Array.from(productIds);
  } catch (error: any) {
    console.error('Error getting purchase history:', error.message);
    return [];
  }
};

/**
 * Content-based recommendations using Elasticsearch "more_like_this"
 */
const getContentBasedRecommendations = async (
  productIds: string[],
  limit: number = 10,
  excludeIds: string[] = []
): Promise<string[]> => {
  const recommendations = new Set<string>();
  
  // Get recommendations for each viewed product
  for (const productId of productIds.slice(0, 5)) { // Limit to top 5 for performance
    try {
      const similar = await getMoreLikeThis(productId, limit);
      similar.forEach((product: any) => {
        if (!excludeIds.includes(product._id) && product._id !== productId) {
          recommendations.add(product._id);
        }
      });
    } catch (error: any) {
      console.error(`Error getting content-based recs for ${productId}:`, error.message);
    }
  }

  return Array.from(recommendations).slice(0, limit);
};

/**
 * Collaborative filtering: "Users who bought X also bought Y"
 */
const getCollaborativeRecommendations = async (
  userId: string,
  limit: number = 10,
  excludeIds: string[] = []
): Promise<string[]> => {
  try {
    const purchaseHistory = await getUserPurchaseHistory(userId);
    
    if (purchaseHistory.length === 0) {
      return [];
    }

    // Find other users who bought the same products
    const similarUsers = await Order.aggregate([
      {
        $match: {
          'items.productId': { $in: purchaseHistory.map(id => new mongoose.Types.ObjectId(id)) },
          userId: { $ne: new mongoose.Types.ObjectId(userId) },
          status: { $in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.productId',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    return similarUsers.map((item: any) => item._id.toString());
  } catch (error: any) {
    console.error('Error getting collaborative recommendations:', error.message);
    return [];
  }
};

/**
 * Get trending products (based on sales velocity)
 */
export const getTrendingProducts = async (limit: number = 10): Promise<string[]> => {
  try {
    // Try to get from cache first
    const cached = await safeRedisOperation<string[]>(async () => {
      const cached = await redisClient.get(TRENDING_PRODUCTS_KEY);
      return cached ? JSON.parse(cached) : null;
    }, null);

    if (cached) {
      return cached;
    }

    // Calculate trending: products with most orders in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.productId',
          orderCount: { $sum: '$items.quantity' },
        },
      },
      {
        $sort: { orderCount: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    const productIds = trending.map((item: any) => item._id.toString());

    // Cache for 1 hour
    await safeRedisOperation(async () => {
      await redisClient.setex(TRENDING_PRODUCTS_KEY, 3600, JSON.stringify(productIds));
    });

    return productIds;
  } catch (error: any) {
    console.error('Error getting trending products:', error.message);
    return [];
  }
};

/**
 * Get personalized recommendations (Phase 8 main function)
 * Combines collaborative filtering, content-based filtering, and trending
 */
export const getPersonalizedRecommendations = async (
  userId: string,
  limit: number = 20
): Promise<IProduct[]> => {
  try {
    // Try cache first (1 hour TTL)
    const cacheKey = RECOMMENDATIONS_CACHE_KEY(userId);
    const cached = await safeRedisOperation<string | null>(async () => {
      return await redisClient.get(cacheKey);
    }, null);

    if (cached) {
      const productIds = JSON.parse(cached);
      const products = await Product.find({
        _id: { $in: productIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
        status: 'active',
      })
        .populate('category', 'name slug')
        .select('name price images stock status sku averageRating totalReviews')
        .lean();

      // Maintain order
      const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
      return productIds
        .map((id: string) => productMap.get(id))
        .filter((p: any) => p !== undefined) as IProduct[];
    }

    // Get user data
    const browsingHistory = await getUserBrowsingHistory(userId, 50);
    const purchaseHistory = await getUserPurchaseHistory(userId);
    const allViewedIds = [...new Set([...browsingHistory, ...purchaseHistory])];

    // Combine recommendations from multiple sources
    const recommendations = new Map<string, number>(); // productId -> score

    // 1. Content-based from browsing history (weight: 3)
    if (browsingHistory.length > 0) {
      const contentBased = await getContentBasedRecommendations(
        browsingHistory,
        limit * 2,
        allViewedIds
      );
      contentBased.forEach((id) => {
        recommendations.set(id, (recommendations.get(id) || 0) + 3);
      });
    }

    // 2. Collaborative filtering from purchase history (weight: 5)
    if (purchaseHistory.length > 0) {
      const collaborative = await getCollaborativeRecommendations(
        userId,
        limit * 2,
        allViewedIds
      );
      collaborative.forEach((id) => {
        recommendations.set(id, (recommendations.get(id) || 0) + 5);
      });
    }

    // 3. Trending products (weight: 1) - fallback
    if (recommendations.size < limit) {
      const trending = await getTrendingProducts(limit);
      trending.forEach((id) => {
        if (!allViewedIds.includes(id)) {
          recommendations.set(id, (recommendations.get(id) || 0) + 1);
        }
      });
    }

    // Sort by score and get top products
    const sortedRecommendations = Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    // If still not enough, add popular products from same category
    if (sortedRecommendations.length < limit && browsingHistory.length > 0) {
      const recentProduct = await Product.findById(browsingHistory[0]);
      if (recentProduct) {
        const categoryProducts = await Product.find({
          category: recentProduct.category,
          _id: { $nin: allViewedIds.map(id => new mongoose.Types.ObjectId(id)) },
          status: 'active',
        })
          .sort({ averageRating: -1, totalReviews: -1 })
          .limit(limit - sortedRecommendations.length)
          .select('_id')
          .lean();

        categoryProducts.forEach((p: any) => {
          if (!sortedRecommendations.includes(p._id.toString())) {
            sortedRecommendations.push(p._id.toString());
          }
        });
      }
    }

    // Cache recommendations for 1 hour
    await safeRedisOperation(async () => {
      await redisClient.setex(cacheKey, 3600, JSON.stringify(sortedRecommendations));
    });

    // Fetch full product details
    const products = await Product.find({
      _id: { $in: sortedRecommendations.map((id) => new mongoose.Types.ObjectId(id)) },
      status: 'active',
    })
      .populate('category', 'name slug')
      .select('name price images stock status sku averageRating totalReviews tags')
      .lean();

    // Maintain order
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
    return sortedRecommendations
      .map((id) => productMap.get(id))
      .filter((p: any) => p !== undefined) as IProduct[];
  } catch (error: any) {
    console.error('Error getting personalized recommendations:', error.message);
    // Fallback to trending products
    return getTrendingProducts(limit).then(async (ids) => {
      const products = await Product.find({
        _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
        status: 'active',
      })
        .populate('category', 'name slug')
        .select('name price images stock status sku averageRating totalReviews')
        .lean();
      return products as IProduct[];
    });
  }
};

/**
 * Get "recently viewed" products
 */
export const getRecentlyViewedProducts = async (
  userId: string,
  limit: number = 10
): Promise<IProduct[]> => {
  try {
    const history = await getUserBrowsingHistory(userId, limit);
    
    if (history.length === 0) {
      return [];
    }

    const products = await Product.find({
      _id: { $in: history.map((id) => new mongoose.Types.ObjectId(id)) },
      status: 'active',
    })
      .populate('category', 'name slug')
      .select('name price images stock status sku averageRating totalReviews')
      .lean();

    // Maintain order from history
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
    return history
      .map((id) => productMap.get(id))
      .filter((p: any) => p !== undefined) as IProduct[];
  } catch (error: any) {
    console.error('Error getting recently viewed products:', error.message);
    return [];
  }
};

