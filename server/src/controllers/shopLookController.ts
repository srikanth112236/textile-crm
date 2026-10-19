import { Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { ShopLook } from '../models/ShopLook';
import { Product } from '../models/Product';

const upsertSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  imageUrl: Joi.string().trim().required().max(1000),
  productIds: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).min(1).max(8).required(),
  bundlePrice: Joi.number().min(0).optional().allow(null),
  isActive: Joi.boolean().optional(),
  position: Joi.number().min(0).optional(),
});

// GET /api/shop-look — public active combos with product details
export const getShopLooks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const looks = await ShopLook.find({ isActive: true })
      .sort({ position: 1, createdAt: -1 })
      .limit(10)
      .populate('productIds', 'name price compareAtPrice images stock status')
      .lean();
    res.status(200).json({ success: true, data: looks });
  } catch (err) {
    console.error('Get shop looks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/shop-look/admin — Admin all
export const listShopLooks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await ShopLook.find({}).sort({ position: 1, createdAt: -1 }).populate('productIds', 'name price').lean();
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('List shop looks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/shop-look/admin — Admin create
export const createShopLook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = upsertSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const found = await Product.countDocuments({ _id: { $in: value.productIds }, status: 'active' });
    if (found !== value.productIds.length) {
      res.status(400).json({ error: 'One or more products not found or inactive' });
      return;
    }
    const look = await ShopLook.create({
      ...value,
      productIds: value.productIds.map((id: string) => new mongoose.Types.ObjectId(id)),
    });
    res.status(201).json({ success: true, data: look });
  } catch (err) {
    console.error('Create shop look error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/shop-look/admin/:id
export const updateShopLook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = upsertSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const look = await ShopLook.findByIdAndUpdate(
      req.params.id,
      { ...value, productIds: value.productIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      { new: true }
    );
    if (!look) {
      res.status(404).json({ error: 'Look not found' });
      return;
    }
    res.status(200).json({ success: true, data: look });
  } catch (err) {
    console.error('Update shop look error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/shop-look/admin/:id
export const deleteShopLook = async (req: Request, res: Response): Promise<void> => {
  try {
    const look = await ShopLook.findByIdAndDelete(req.params.id);
    if (!look) {
      res.status(404).json({ error: 'Look not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Look deleted' });
  } catch (err) {
    console.error('Delete shop look error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
