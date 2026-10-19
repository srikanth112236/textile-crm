import { Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import axios from 'axios';
import { UgcItem } from '../models/UgcItem';
import { safeRedisOperation } from '../config/redis';
import redisClient from '../config/redis';

const FEATURED_CACHE_KEY = 'ugc:featured';
const FEED_CACHE_KEY = 'ugc:instagram-feed';

// GET /api/ugc/featured — public, cached 1h, falls back to DB on cache miss
export const getFeaturedUgc = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cached = await safeRedisOperation(async () => redisClient.get(FEATURED_CACHE_KEY));
    if (cached) {
      res.status(200).json({ success: true, cached: true, data: JSON.parse(cached as string) });
      return;
    }
    const items = await UgcItem.find({ featured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('productId', 'name price images')
      .lean();
    await safeRedisOperation(async () => redisClient.setex(FEATURED_CACHE_KEY, 3600, JSON.stringify(items)));
    res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('Featured UGC error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/ugc/feed — public Instagram feed (synced items), cached 1h
export const getInstagramFeed = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cached = await safeRedisOperation(async () => redisClient.get(FEED_CACHE_KEY));
    if (cached) {
      res.status(200).json({ success: true, cached: true, data: JSON.parse(cached as string) });
      return;
    }
    const items = await UgcItem.find({ source: 'instagram', isActive: true })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('productId', 'name price images')
      .lean();
    await safeRedisOperation(async () => redisClient.setex(FEED_CACHE_KEY, 3600, JSON.stringify(items)));
    res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('Instagram feed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const upsertSchema = Joi.object({
  source: Joi.string().valid('customer', 'instagram', 'admin').default('admin'),
  mediaType: Joi.string().valid('image', 'video').default('video'),
  mediaUrl: Joi.string().trim().required().max(1000),
  thumbnailUrl: Joi.string().trim().optional().allow(''),
  permalink: Joi.string().trim().optional().allow(''),
  customerName: Joi.string().trim().max(100).optional().allow(''),
  caption: Joi.string().trim().max(500).optional().allow(''),
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow('', null),
  featured: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

// GET /api/ugc/admin — Admin list
export const listUgc = async (req: Request, res: Response): Promise<void> => {
  try {
    const source = req.query.source as string | undefined;
    const filter: any = {};
    if (source === 'customer' || source === 'instagram' || source === 'admin') filter.source = source;
    const rows = await UgcItem.find(filter).sort({ createdAt: -1 }).limit(200).populate('productId', 'name price').lean();
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('List UGC error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/ugc/admin — Admin create
export const createUgc = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = upsertSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const item = await UgcItem.create({
      ...value,
      productId: value.productId ? new mongoose.Types.ObjectId(value.productId) : undefined,
    });
    await safeRedisOperation(async () => {
      await redisClient.del(FEATURED_CACHE_KEY);
      await redisClient.del(FEED_CACHE_KEY);
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error('Create UGC error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/ugc/admin/:id — Admin update (feature/unfeature, product tag)
export const updateUgc = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = upsertSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const item = await UgcItem.findByIdAndUpdate(
      req.params.id,
      { ...value, productId: value.productId ? new mongoose.Types.ObjectId(value.productId) : undefined },
      { new: true }
    );
    if (!item) {
      res.status(404).json({ error: 'UGC item not found' });
      return;
    }
    await safeRedisOperation(async () => {
      await redisClient.del(FEATURED_CACHE_KEY);
      await redisClient.del(FEED_CACHE_KEY);
    });
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    console.error('Update UGC error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/ugc/admin/:id
export const deleteUgc = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await UgcItem.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'UGC item not found' });
      return;
    }
    await safeRedisOperation(async () => {
      await redisClient.del(FEATURED_CACHE_KEY);
      await redisClient.del(FEED_CACHE_KEY);
    });
    res.status(200).json({ success: true, message: 'UGC item deleted' });
  } catch (err) {
    console.error('Delete UGC error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/ugc/admin/sync-instagram — pull latest brand media via Graph API
export const syncInstagram = async (_req: Request, res: Response): Promise<void> => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    const userId = process.env.INSTAGRAM_USER_ID || 'me';
    if (!token) {
      res.status(503).json({ error: 'Instagram not connected. Set INSTAGRAM_ACCESS_TOKEN (+ INSTAGRAM_USER_ID) in server/.env' });
      return;
    }
    const { data } = await axios.get(`https://graph.instagram.com/${userId}/media`, {
      params: { fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp', limit: 25, access_token: token },
      timeout: 20000,
    });
    const media: any[] = data?.data || [];
    let added = 0;
    let skipped = 0;
    for (const m of media) {
      if (m.media_type !== 'IMAGE' && m.media_type !== 'VIDEO' && m.media_type !== 'CAROUSEL_ALBUM') {
        skipped += 1;
        continue;
      }
      const exists = await UgcItem.findOne({ externalId: m.id }).lean();
      if (exists) {
        skipped += 1;
        continue;
      }
      await UgcItem.create({
        source: 'instagram',
        mediaType: m.media_type === 'VIDEO' ? 'video' : 'image',
        mediaUrl: m.media_url,
        thumbnailUrl: m.thumbnail_url || m.media_url,
        externalId: m.id,
        permalink: m.permalink,
        caption: (m.caption || '').slice(0, 500),
        featured: false,
        isActive: true,
      });
      added += 1;
    }
    await safeRedisOperation(async () => {
      await redisClient.del(FEED_CACHE_KEY);
      await redisClient.del(FEATURED_CACHE_KEY);
    });
    res.status(200).json({ success: true, message: `Instagram sync done: ${added} added, ${skipped} skipped.`, data: { added, skipped } });
  } catch (err: any) {
    console.error('Instagram sync error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Instagram sync failed. Check token validity.' });
  }
};
