import { Request, Response } from 'express';
import Joi from 'joi';
import {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  syncCartToDB,
} from '../services/cart';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { requireCustomer } from '../utils/requireCustomer';

// Validation schemas
const addItemSchema = Joi.object({
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  quantity: Joi.number().integer().min(1).required(),
  variations: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().required(),
        value: Joi.string().trim().required(),
      })
    )
    .optional(),
});

const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

/**
 * Get user cart
 */
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    let cart = await getUserCart(userId);
    
    // If no cart exists in Redis or DB, create empty cart in DB for persistence
    if (!cart) {
      const { Cart } = await import('../models/Cart');
      cart = await Cart.findOneAndUpdate(
        { userId },
        { userId, items: [], updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    
    if (!cart || !cart.items || cart.items.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          items: [],
          total: 0,
          itemCount: 0,
        },
      });
      return;
    }

    // Populate product details for each item
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId).select(
          'name price images stock status sku'
        );
        
        if (!product) {
          return null;
        }

        return {
          productId: item.productId,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            stock: product.stock,
            status: product.status,
            sku: product.sku,
          },
          quantity: item.quantity,
          variations: item.variations || [],
          price: item.price,
          subtotal: item.price * item.quantity,
          addedAt: item.addedAt,
        };
      })
    );

    // Filter out null items (products that no longer exist)
    const validItems = populatedItems.filter((item) => item !== null) as any[];

    // Calculate totals
    const total = validItems.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      success: true,
      data: {
        items: validItems,
        total,
        itemCount,
      },
    });
  } catch (error: any) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add item to cart
 */
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!requireCustomer(req, res)) return;

    // Validate input
    const { error, value } = addItemSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const cart = await addItemToCart(
      userId,
      value.productId,
      value.quantity,
      value.variations
    );

    // Ensure cart has items
    if (!cart || !cart.items || cart.items.length === 0) {
      res.status(500).json({ error: 'Failed to add item to cart' });
      return;
    }

    // Populate product details
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId).select(
          'name price images stock status sku'
        );
        if (!product) return null;

        const itemPrice = item.price || product.price;
        const itemQuantity = item.quantity || 1;

        return {
          _id: item._id || `item-${item.productId}`,
          productId: item.productId,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            stock: product.stock,
            status: product.status,
            sku: product.sku,
          },
          quantity: itemQuantity,
          variations: item.variations || [],
          price: itemPrice,
          subtotal: itemPrice * itemQuantity,
          addedAt: item.addedAt || new Date(),
        };
      })
    );

    const validItems = populatedItems.filter((item) => item !== null) as any[];
    const total = validItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const itemCount = validItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: {
        items: validItems,
        total,
        itemCount,
      },
    });
  } catch (error: any) {
    console.error('Add item to cart error:', error);
    if (error.message.includes('not found') || error.message.includes('not available')) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message.includes('Insufficient stock')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update cart item quantity
 */
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { itemId } = req.params;
    const itemIndex = parseInt(itemId, 10);

    if (isNaN(itemIndex)) {
      res.status(400).json({ error: 'Invalid item ID' });
      return;
    }

    if (!requireCustomer(req, res)) return;

    // Validate input
    const { error, value } = updateItemSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const cart = await updateCartItemQuantity(userId, itemIndex, value.quantity);

    // Ensure cart has items
    if (!cart || !cart.items || cart.items.length === 0) {
      res.status(200).json({
        success: true,
        message: 'Cart item updated',
        data: {
          items: [],
          total: 0,
          itemCount: 0,
        },
      });
      return;
    }

    // Populate product details
    const populatedItems = await Promise.all(
      cart.items.map(async (item, index) => {
        const product = await Product.findById(item.productId).select(
          'name price images stock status sku'
        );
        if (!product) return null;

        const itemPrice = item.price || product.price;
        const itemQuantity = item.quantity || 1;

        return {
          _id: item._id || `item-${item.productId}-${index}`,
          productId: item.productId,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            stock: product.stock,
            status: product.status,
            sku: product.sku,
          },
          quantity: itemQuantity,
          variations: item.variations || [],
          price: itemPrice,
          subtotal: itemPrice * itemQuantity,
          addedAt: item.addedAt || new Date(),
        };
      })
    );

    const validItems = populatedItems.filter((item) => item !== null) as any[];
    const total = validItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const itemCount = validItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: {
        items: validItems,
        total,
        itemCount,
      },
    });
  } catch (error: any) {
    console.error('Update cart item error:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message.includes('Insufficient stock')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Remove item from cart
 */
export const removeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { itemId } = req.params;
    const itemIndex = parseInt(itemId, 10);

    if (isNaN(itemIndex)) {
      res.status(400).json({ error: 'Invalid item ID' });
      return;
    }

    if (!requireCustomer(req, res)) return;

    const cart = await removeCartItem(userId, itemIndex);

    // Populate product details
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId).select(
          'name price images stock status sku'
        );
        if (!product) return null;

        return {
          productId: item.productId,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            stock: product.stock,
            status: product.status,
            sku: product.sku,
          },
          quantity: item.quantity,
          variations: item.variations || [],
          price: item.price,
          subtotal: item.price * item.quantity,
          addedAt: item.addedAt,
        };
      })
    );

    const validItems = populatedItems.filter((item) => item !== null) as any[];
    const total = validItems.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: {
        items: validItems,
        total,
        itemCount,
      },
    });
  } catch (error: any) {
    console.error('Remove cart item error:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Clear cart
 */
export const clearUserCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!requireCustomer(req, res)) return;

    await clearCart(userId);

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error: any) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

