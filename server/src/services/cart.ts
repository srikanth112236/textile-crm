import redisClient, { safeRedisOperation } from '../config/redis';
import { Cart, ICart, ICartItem } from '../models/Cart';
import { Product } from '../models/Product';
import mongoose from 'mongoose';

const CART_TTL = 3600; // 1 hour in seconds
const REDIS_CART_PREFIX = 'cart:';

/**
 * Get Redis key for user cart
 */
const getCartKey = (userId: string): string => {
  return `${REDIS_CART_PREFIX}${userId}`;
};

/**
 * Get cart from Redis
 */
export const getCartFromRedis = async (userId: string): Promise<ICart | null> => {
  const cartData = await safeRedisOperation(async () => {
    const key = getCartKey(userId);
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  });

  if (!cartData) return null;

  // Convert to Mongoose document format
  return {
    userId: new mongoose.Types.ObjectId(cartData.userId),
    items: cartData.items || [],
    updatedAt: new Date(cartData.updatedAt),
    createdAt: new Date(cartData.createdAt),
  } as ICart;
};

/**
 * Save cart to Redis
 */
export const saveCartToRedis = async (userId: string, cart: ICart | any): Promise<void> => {
  await safeRedisOperation(async () => {
    const key = getCartKey(userId);
    const cartData = {
      userId: cart.userId?.toString() || userId,
      items: cart.items || [],
      updatedAt: cart.updatedAt || new Date(),
      createdAt: cart.createdAt || new Date(),
    };
    await redisClient.setex(key, CART_TTL, JSON.stringify(cartData));
  });
};

/**
 * Delete cart from Redis
 */
export const deleteCartFromRedis = async (userId: string): Promise<void> => {
  await safeRedisOperation(async () => {
    const key = getCartKey(userId);
    await redisClient.del(key);
  });
};

/**
 * Get user cart (check Redis first, fallback to DB)
 */
export const getUserCart = async (userId: string): Promise<ICart | null> => {
  // Try Redis first
  const redisCart = await getCartFromRedis(userId);
  if (redisCart && redisCart.items && redisCart.items.length > 0) {
    return redisCart;
  }

  // Fallback to MongoDB - always check DB for persistence
  const dbCart = await Cart.findOne({ userId });
  if (dbCart && dbCart.items && dbCart.items.length > 0) {
    // Sync to Redis for faster future access
    await saveCartToRedis(userId, dbCart);
    return dbCart;
  }

  // If no cart exists, return null (will create empty cart in controller)
  return null;
};

/**
 * Sync cart from Redis to MongoDB
 */
export const syncCartToDB = async (userId: string): Promise<ICart> => {
  const redisCart = await getCartFromRedis(userId);
  
  if (!redisCart || !redisCart.items || redisCart.items.length === 0) {
    // If no Redis cart or empty, get from DB (DB is source of truth for persistence)
    const dbCart = await Cart.findOne({ userId });
    if (dbCart && dbCart.items && dbCart.items.length > 0) {
      // Sync DB cart back to Redis if it has items
      await saveCartToRedis(userId, dbCart);
      return dbCart;
    }
    // Create empty cart if none exists
    const newCart = await Cart.findOneAndUpdate(
      { userId },
      { userId, items: [], updatedAt: new Date() },
      { upsert: true, new: true }
    );
    return newCart;
  }

  // Update or create cart in DB with Redis data
  const cart = await Cart.findOneAndUpdate(
    { userId },
    {
      items: redisCart.items,
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return cart;
};

/**
 * Add item to cart
 */
export const addItemToCart = async (
  userId: string,
  productId: string,
  quantity: number,
  variations?: Array<{ name: string; value: string }>
): Promise<ICart> => {
  // Validate product exists and is active
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  if (product.status !== 'active') {
    throw new Error('Product is not available');
  }

  // Check stock
  if (product.stock < quantity) {
    throw new Error(`Insufficient stock. Available: ${product.stock}`);
  }

  // Calculate price (base price + variation modifiers)
  let itemPrice = product.price;
  if (variations && variations.length > 0 && product.variations) {
    variations.forEach((variation) => {
      const productVariation = product.variations?.find(
        (v) => v.name === variation.name && v.value === variation.value
      );
      if (productVariation?.priceModifier) {
        itemPrice += productVariation.priceModifier;
      }
    });
  }

  // Get or create cart
  let cart = await getUserCart(userId);
  
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  // Check if item already exists in cart (same product and variations)
  const existingItemIndex = cart.items.findIndex((item) => {
    if (item.productId.toString() !== productId) return false;
    
    // Check if variations match
    if (!variations || variations.length === 0) {
      return !item.variations || item.variations.length === 0;
    }
    
    if (!item.variations || item.variations.length !== variations.length) {
      return false;
    }
    
    return variations.every((v) =>
      item.variations?.some((iv) => iv.name === v.name && iv.value === v.value)
    );
  });

  if (existingItemIndex >= 0) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    // Check stock again with new quantity
    if (product.stock < newQuantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}`);
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      productId: new mongoose.Types.ObjectId(productId),
      quantity,
      variations: variations || [],
      price: itemPrice,
      addedAt: new Date(),
    });
  }

  cart.updatedAt = new Date();

  // Save to Redis first
  await saveCartToRedis(userId, cart);

  // Sync to DB immediately (synchronous for persistence - critical for page refresh)
  // Directly update DB with the cart we just modified
  const finalCart = await Cart.findOneAndUpdate(
    { userId },
    {
      items: cart.items,
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Ensure Redis is in sync with DB
  await saveCartToRedis(userId, finalCart);

  return finalCart;
};

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = async (
  userId: string,
  itemIndex: number,
  quantity: number
): Promise<ICart> => {
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  // Get cart from DB first (source of truth) to ensure we have the latest state
  let cart = await Cart.findOne({ userId });
  
  // If no cart in DB, try Redis
  if (!cart || !cart.items || cart.items.length === 0) {
    const redisCart = await getCartFromRedis(userId);
    if (redisCart && redisCart.items && redisCart.items.length > 0) {
      cart = redisCart;
    } else {
      throw new Error('Cart not found');
    }
  }

  if (itemIndex < 0 || itemIndex >= cart.items.length) {
    throw new Error('Invalid item index');
  }

  const item = cart.items[itemIndex];
  
  // Validate product and stock
  const product = await Product.findById(item.productId);
  if (!product) {
    throw new Error('Product not found');
  }

  if (product.stock < quantity) {
    throw new Error(`Insufficient stock. Available: ${product.stock}`);
  }

  // Update quantity
  item.quantity = quantity;
  cart.updatedAt = new Date();

  // Save to Redis first
  await saveCartToRedis(userId, cart);

  // Sync to DB immediately for persistence (critical for page refresh)
  // Directly update DB with the cart we just modified
  const finalCart = await Cart.findOneAndUpdate(
    { userId },
    {
      items: cart.items,
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Ensure Redis is in sync with DB
  await saveCartToRedis(userId, finalCart);

  return finalCart;
};

/**
 * Remove item from cart
 */
export const removeCartItem = async (userId: string, itemIndex: number): Promise<ICart> => {
  // Get cart from DB first (source of truth) to ensure we have the latest state
  let cart = await Cart.findOne({ userId });
  
  // If no cart in DB, try Redis
  if (!cart || !cart.items || cart.items.length === 0) {
    const redisCart = await getCartFromRedis(userId);
    if (redisCart && redisCart.items && redisCart.items.length > 0) {
      cart = redisCart;
    } else {
      throw new Error('Cart not found');
    }
  }

  if (itemIndex < 0 || itemIndex >= cart.items.length) {
    throw new Error('Invalid item index');
  }

  cart.items.splice(itemIndex, 1);
  cart.updatedAt = new Date();

  // Save to Redis first
  await saveCartToRedis(userId, cart);

  // Sync to DB immediately for persistence (critical for page refresh)
  // Directly update DB with the cart we just modified
  const finalCart = await Cart.findOneAndUpdate(
    { userId },
    {
      items: cart.items,
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Ensure Redis is in sync with DB
  await saveCartToRedis(userId, finalCart);

  return finalCart;
};

/**
 * Clear cart
 */
export const clearCart = async (userId: string): Promise<void> => {
  // Delete from Redis
  await deleteCartFromRedis(userId);

  // Delete from DB
  await Cart.findOneAndDelete({ userId });
};

/**
 * Get abandoned carts (24 hours inactive)
 */
export const getAbandonedCarts = async (): Promise<ICart[]> => {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const carts = await Cart.find({
    updatedAt: { $lt: twentyFourHoursAgo },
    items: { $exists: true, $ne: [] }, // Has items
  }).populate('userId', 'email name');

  return carts;
};

