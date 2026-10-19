import { Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { requireCustomer } from '../utils/requireCustomer';
import { BackInStock } from '../models/BackInStock';
import { PriceAlert } from '../models/PriceAlert';
import { Product } from '../models/Product';

function classifyContact(contact: string): 'email' | 'phone' | null {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return 'email';
  const digits = contact.replace(/\D/g, '').slice(-10);
  if (/^[6-9]\d{9}$/.test(digits)) return 'phone';
  return null;
}

// POST /api/stock-alerts/subscribe { productId, size?, contact, whatsappConsent? } — guest allowed
export const subscribeBackInStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      size: Joi.string().trim().max(10).optional().allow(''),
      contact: Joi.string().trim().required().max(100),
      whatsappConsent: Joi.boolean().optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const kind = classifyContact(value.contact);
    if (!kind) {
      res.status(400).json({ error: 'Enter a valid email or 10-digit mobile number' });
      return;
    }
    const product = await Product.findById(value.productId).select('name').lean();
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const contact = kind === 'phone' ? value.contact.replace(/\D/g, '').slice(-10) : value.contact.toLowerCase();
    const existing = await BackInStock.findOne({ productId: value.productId, size: (value.size || '').toUpperCase() || undefined, contact, notified: false });
    if (existing) {
      res.status(200).json({ success: true, message: 'Already subscribed. We will alert you on restock.', data: existing });
      return;
    }
    const sub = await BackInStock.create({
      productId: new mongoose.Types.ObjectId(value.productId),
      productName: (product as any).name,
      size: value.size ? String(value.size).toUpperCase() : undefined,
      contact,
      contactType: kind,
      whatsappConsent: !!value.whatsappConsent,
      userId: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
    });
    res.status(201).json({ success: true, message: 'Subscribed! We will alert you as soon as it is restocked.', data: sub });
  } catch (err) {
    console.error('Back-in-stock subscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/stock-alerts/admin — Admin queue
export const listBackInStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const notified = req.query.notified as string | undefined;
    const filter: any = {};
    if (notified === 'true' || notified === 'false') filter.notified = notified === 'true';
    const rows = await BackInStock.find(filter).sort({ createdAt: -1 }).limit(200).populate('productId', 'name price stock').lean();
    const pending = await BackInStock.countDocuments({ notified: false });
    res.status(200).json({ success: true, data: { subscriptions: rows, pending } });
  } catch (err) {
    console.error('List back-in-stock error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/stock-alerts/:id — owner or admin
export const deleteBackInStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const sub = await BackInStock.findById(req.params.id);
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    const role = req.user?.role;
    const uid = req.user?.userId;
    if (role !== 'admin' && role !== 'superadmin' && (!sub.userId || sub.userId.toString() !== uid)) {
      res.status(403).json({ error: 'Not allowed' });
      return;
    }
    await sub.deleteOne();
    res.status(200).json({ success: true, message: 'Subscription removed' });
  } catch (err) {
    console.error('Delete back-in-stock error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/price-alerts/subscribe { productId } — auth, alerts on any drop below current price
export const subscribePriceAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({ productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required() });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error' });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Login to set price alerts' });
      return;
    }
    if (!requireCustomer(req, res)) return;
    const product: any = await Product.findById(value.productId).lean();
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const existing = await PriceAlert.findOne({ productId: value.productId, userId, active: true });
    if (existing) {
      res.status(200).json({ success: true, message: 'Price alert already active.', data: existing });
      return;
    }
    const { User } = await import('../models/User');
    const user: any = await User.findById(userId).select('email phone').lean();
    const alert = await PriceAlert.create({
      productId: value.productId,
      productName: product.name,
      targetPrice: product.price,
      contact: user?.email || user?.phone,
      contactType: user?.email ? 'email' : user?.phone ? 'phone' : undefined,
      userId,
    });
    res.status(201).json({ success: true, message: `We will alert you if price drops below ₹${product.price}.`, data: alert });
  } catch (err) {
    console.error('Price alert subscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/price-alerts/mine — my alerts
export const myPriceAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await PriceAlert.find({ userId: req.user?.userId, active: true }).populate('productId', 'name price images').lean();
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('My price alerts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/price-alerts/admin — Admin queue
export const listPriceAlerts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await PriceAlert.find({}).sort({ createdAt: -1 }).limit(200).populate('productId', 'name price').lean();
    const active = await PriceAlert.countDocuments({ active: true });
    res.status(200).json({ success: true, data: { alerts: rows, active } });
  } catch (err) {
    console.error('List price alerts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/price-alerts/:id — owner or admin
export const deletePriceAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const alert = await PriceAlert.findById(req.params.id);
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }
    const role = req.user?.role;
    if (role !== 'admin' && role !== 'superadmin' && alert.userId?.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not allowed' });
      return;
    }
    alert.active = false;
    await alert.save();
    res.status(200).json({ success: true, message: 'Price alert removed' });
  } catch (err) {
    console.error('Delete price alert error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
