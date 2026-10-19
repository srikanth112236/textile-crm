import { Request, Response } from 'express';
import { Category, ICategory } from '../models/Category';
import Joi from 'joi';

// Validation schemas
const createCategorySchema = Joi.object({
  name: Joi.string().max(100).trim().required(),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).lowercase().trim().required(),
  description: Joi.string().max(500).trim().optional().allow(''),
  parent: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(null, ''),
  image: Joi.string().trim().max(500).optional().allow(''),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().max(100).trim().optional(),
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).lowercase().trim().optional(),
  description: Joi.string().max(500).trim().optional().allow(''),
  parent: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(null, ''),
  image: Joi.string().trim().max(500).optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
});

// Get all categories (tree structure)
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    
    const filter: any = {};
    if (status === 'active' || status === 'inactive') {
      filter.status = status;
    }

    // Get all categories
    const categories = await Category.find(filter)
      .populate('parent', 'name slug')
      .sort({ name: 1 })
      .lean();

    // Build tree structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // First pass: create map of all categories
    categories.forEach((cat: any) => {
      categoryMap.set(cat._id.toString(), { ...cat, children: [] });
    });

    // Second pass: build tree
    categories.forEach((cat: any) => {
      const categoryNode = categoryMap.get(cat._id.toString());
      if (!cat.parent) {
        rootCategories.push(categoryNode);
      } else {
        const parentNode = categoryMap.get(cat.parent.toString());
        if (parentNode) {
          parentNode.children.push(categoryNode);
        } else {
          // Orphan category, add to root
          rootCategories.push(categoryNode);
        }
      }
    });

    res.status(200).json({
      success: true,
      data: rootCategories,
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single category
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate('parent', 'name slug');

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create category (Admin/Superadmin only)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = createCategorySchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    // Validate parent exists if provided
    if (value.parent) {
      const parentExists = await Category.findById(value.parent);
      if (!parentExists) {
        res.status(400).json({ error: 'Parent category not found' });
        return;
      }
    }

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug: value.slug });
    if (existingCategory) {
      res.status(400).json({ error: 'Category with this slug already exists' });
      return;
    }

    const category = new Category(value);
    await category.save();

    await category.populate('parent', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Category with this slug already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update category (Admin/Superadmin only)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateCategorySchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Validate parent exists if provided
    if (value.parent) {
      if (value.parent === id) {
        res.status(400).json({ error: 'Category cannot be its own parent' });
        return;
      }
      const parentExists = await Category.findById(value.parent);
      if (!parentExists) {
        res.status(400).json({ error: 'Parent category not found' });
        return;
      }
    }

    // Check if slug already exists (if changed)
    if (value.slug && value.slug !== category.slug) {
      const existingCategory = await Category.findOne({ slug: value.slug });
      if (existingCategory) {
        res.status(400).json({ error: 'Category with this slug already exists' });
        return;
      }
    }

    // Update fields
    Object.keys(value).forEach((key) => {
      if (value[key] !== undefined) {
        (category as any)[key] = value[key];
      }
    });

    await category.save();
    await category.populate('parent', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Category with this slug already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete category (Superadmin only)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check if category has children
    const hasChildren = await Category.findOne({ parent: id });
    if (hasChildren) {
      res.status(400).json({ 
        error: 'Cannot delete category with child categories. Please delete or reassign children first.' 
      });
      return;
    }

    // Check if category has products (in future, we'll check Product model)
    // For now, we'll just delete it

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

