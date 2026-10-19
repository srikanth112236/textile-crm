import { Request, Response } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import mongoose from 'mongoose';
import { requireCustomer } from '../utils/requireCustomer';

/**
 * Get user wishlist
 */
export const getWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await User.findById(userId).select('wishlist');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Populate product details
    const products = await Product.find({
      _id: { $in: user.wishlist },
      status: 'active', // Only show active products
    })
      .select('name price images stock status sku averageRating totalReviews')
      .lean();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add product to wishlist
 */
export const addToWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { productId } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (!requireCustomer(req, res)) return;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already in wishlist
    if (user.wishlist.some((id) => id.toString() === productId)) {
      res.status(400).json({ error: 'Product already in wishlist' });
      return;
    }

    // Add to wishlist
    user.wishlist.push(new mongoose.Types.ObjectId(productId));
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
    });
  } catch (error: any) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { productId } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!requireCustomer(req, res)) return;

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error: any) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check if product is in wishlist
 */
export const checkWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { productId } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const user = await User.findById(userId).select('wishlist');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isInWishlist = user.wishlist.some((id) => id.toString() === productId);

    res.status(200).json({
      success: true,
      data: {
        isInWishlist,
      },
    });
  } catch (error: any) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


