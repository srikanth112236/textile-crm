import { Request, Response } from 'express';
import { Tag, ITag } from '../models/Tag';
import { Product } from '../models/Product';
import { AuditLog, AuditAction } from '../models/AuditLog';
import Joi from 'joi';
import mongoose from 'mongoose';

// Validation schemas
const createTagSchema = Joi.object({
  name: Joi.string().max(50).trim().required(),
  slug: Joi.string()
    .pattern(/^[a-z0-9\-]+$/)
    .lowercase()
    .trim()
    .optional(),
  description: Joi.string().max(200).trim().optional().allow(''),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .trim()
    .optional()
    .allow(''),
  isActive: Joi.boolean().optional(),
});

const updateTagSchema = Joi.object({
  name: Joi.string().max(50).trim().optional(),
  slug: Joi.string()
    .pattern(/^[a-z0-9\-]+$/)
    .lowercase()
    .trim()
    .optional(),
  description: Joi.string().max(200).trim().optional().allow(''),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .trim()
    .optional()
    .allow(''),
  isActive: Joi.boolean().optional(),
});

// Get all tags (public: active only, admin: all)
export const getTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const { active, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Public users only see active tags, admin can see all
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    
    const filter: any = {};
    if (active === 'true' || (!isAdmin && active !== 'false')) {
      filter.isActive = true;
    }

    const tags = await Tag.find(filter)
      .sort({ usageCount: -1, name: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Tag.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tags,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single tag
export const getTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Try to find by ID or slug
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const tag = isObjectId
      ? await Tag.findById(id)
      : await Tag.findOne({ slug: id });

    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    // Public users only see active tags
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    
    if (!tag.isActive && !isAdmin) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (error: any) {
    console.error('Get tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create tag (Admin/Superadmin only)
export const createTag = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = createTagSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    // Generate slug from name if not provided
    if (!value.slug && value.name) {
      value.slug = value.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Check if tag with same name or slug exists
    const existingTag = await Tag.findOne({
      $or: [{ name: value.name }, { slug: value.slug }],
    });

    if (existingTag) {
      res.status(400).json({ error: 'Tag with this name or slug already exists' });
      return;
    }

    // Create tag
    const tag = new Tag(value);
    await tag.save();

    // Log audit
    try {
      const userId = (req as any).user?.id;
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.CREATE,
        resource: 'tag',
        resourceId: tag._id,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        details: { tagName: tag.name, slug: tag.slug },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag,
    });
  } catch (error: any) {
    console.error('Create tag error:', error);
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'Tag with this name or slug already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update tag (Admin/Superadmin only)
export const updateTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateTagSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const tag = await Tag.findById(id);

    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    // Check if name or slug already exists (if changed)
    if (value.name || value.slug) {
      const checkName = value.name || tag.name;
      const checkSlug = value.slug || tag.slug;
      
      const existingTag = await Tag.findOne({
        _id: { $ne: id },
        $or: [{ name: checkName }, { slug: checkSlug }],
      });

      if (existingTag) {
        res.status(400).json({ error: 'Tag with this name or slug already exists' });
        return;
      }
    }

    // Update fields
    Object.keys(value).forEach((key) => {
      if (value[key] !== undefined) {
        (tag as any)[key] = value[key];
      }
    });

    await tag.save();

    // Log audit
    try {
      const userId = (req as any).user?.id;
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.UPDATE,
        resource: 'tag',
        resourceId: tag._id,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        details: { tagName: tag.name, slug: tag.slug },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      data: tag,
    });
  } catch (error: any) {
    console.error('Update tag error:', error);
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'Tag with this name or slug already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete tag (Admin/Superadmin only)
// Note: Before deleting, we should remove tag from all products and update usageCount
export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const tag = await Tag.findById(id);

    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    // Remove tag from all products
    await Product.updateMany(
      { tags: id },
      { $pull: { tags: id } }
    );

    const tagId = tag._id;
    const tagName = tag.name;

    await Tag.findByIdAndDelete(id);

    // Log audit
    try {
      const userId = (req as any).user?.id;
      await AuditLog.create({
        userId: userId || undefined,
        action: AuditAction.DELETE,
        resource: 'tag',
        resourceId: tagId,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        details: { tagName },
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get tag analytics (usage count, most popular tags)
export const getTagAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Get most used tags
    const popularTags = await Tag.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(limitNum)
      .select('name slug usageCount color')
      .lean();

    // Get total tag count
    const totalTags = await Tag.countDocuments({ isActive: true });

    // Get tags with zero usage
    const unusedTags = await Tag.countDocuments({ isActive: true, usageCount: 0 });

    res.status(200).json({
      success: true,
      data: {
        popularTags,
        totalTags,
        unusedTags,
      },
    });
  } catch (error: any) {
    console.error('Get tag analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

