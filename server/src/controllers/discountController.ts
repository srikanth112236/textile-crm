import { Request, Response } from 'express';
import { Discount, DiscountType } from '../models/Discount';
import Joi from 'joi';

// Validation schemas
const objectIdList = Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).max(50).optional();

const createDiscountSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
  type: Joi.string().valid(DiscountType.PERCENTAGE, DiscountType.FIXED).required(),
  value: Joi.number().min(0).required(),
  minPurchase: Joi.number().min(0).optional(),
  maxDiscount: Joi.number().min(0).optional(),
  expiry: Joi.date().iso().greater('now').required(),
  usageLimit: Joi.number().integer().min(1).optional(),
  description: Joi.string().max(500).trim().optional(),
  isActive: Joi.boolean().optional().default(true),
  firstOrderOnly: Joi.boolean().optional(),
  minItems: Joi.number().integer().min(0).optional(),
  applicableCategories: objectIdList,
  freeShipping: Joi.boolean().optional(),
});

const updateDiscountSchema = Joi.object({
  code: Joi.string().trim().uppercase().optional(),
  type: Joi.string().valid(DiscountType.PERCENTAGE, DiscountType.FIXED).optional(),
  value: Joi.number().min(0).optional(),
  minPurchase: Joi.number().min(0).optional().allow(null),
  maxDiscount: Joi.number().min(0).optional().allow(null),
  expiry: Joi.date().iso().optional(),
  usageLimit: Joi.number().integer().min(1).optional().allow(null),
  description: Joi.string().max(500).trim().optional().allow(''),
  isActive: Joi.boolean().optional(),
  firstOrderOnly: Joi.boolean().optional(),
  minItems: Joi.number().integer().min(0).optional().allow(null),
  applicableCategories: objectIdList.allow(null),
  freeShipping: Joi.boolean().optional(),
});

// Get all discounts (public active, admin all)
export const getDiscounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive, expired } = req.query;
    const userRole = (req as any).user?.role;

    const filter: any = {};

    // If not admin/superadmin, only show active non-expired discounts
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      filter.isActive = true;
      filter.expiry = { $gte: new Date() };
    } else {
      // Admin can filter
      if (isActive === 'true') {
        filter.isActive = true;
      } else if (isActive === 'false') {
        filter.isActive = false;
      }
      if (expired === 'true') {
        filter.expiry = { $lt: new Date() };
      } else if (expired === 'false') {
        filter.expiry = { $gte: new Date() };
      }
    }

    const discounts = await Discount.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: discounts,
    });
  } catch (error: any) {
    console.error('Get discounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single discount by ID or code
export const getDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const discount = await Discount.findOne({
      $or: [{ _id: id }, { code: id.toUpperCase() }],
    }).lean();

    if (!discount) {
      res.status(404).json({ error: 'Discount not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: discount,
    });
  } catch (error: any) {
    console.error('Get discount error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create discount (Admin/Superadmin only)
export const createDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = createDiscountSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    // Validate percentage discount
    if (value.type === DiscountType.PERCENTAGE && value.value > 100) {
      res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
      return;
    }

    const discount = new Discount(value);
    await discount.save();

    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      data: discount,
    });
  } catch (error: any) {
    console.error('Create discount error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Discount code already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update discount (Admin/Superadmin only)
export const updateDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error, value } = updateDiscountSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const discount = await Discount.findById(id);
    if (!discount) {
      res.status(404).json({ error: 'Discount not found' });
      return;
    }

    // Validate percentage discount if type or value changed
    if (
      (value.type === DiscountType.PERCENTAGE || discount.type === DiscountType.PERCENTAGE) &&
      value.value !== undefined &&
      value.value > 100
    ) {
      res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
      return;
    }

    // Update fields
    Object.assign(discount, value);
    await discount.save();

    res.status(200).json({
      success: true,
      message: 'Discount updated successfully',
      data: discount,
    });
  } catch (error: any) {
    console.error('Update discount error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Discount code already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete discount (Admin/Superadmin only)
export const deleteDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) {
      res.status(404).json({ error: 'Discount not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Discount deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete discount error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Validate and calculate discount.
// context.userId enables first-order checks; context.items enables
// combo (minItems) and category-scope checks. orderTotal is the merchandise
// total; for category-scoped coupons minPurchase applies to the qualifying
// subtotal and % is computed on it.
export interface DiscountContext {
  userId?: string;
  items?: Array<{ productId: string; quantity: number; price?: number; subtotal?: number }>;
}

export const validateDiscount = async (
  code: string,
  orderTotal: number,
  session?: any,
  context?: DiscountContext
): Promise<{ valid: boolean; discount?: number; freeShipping?: boolean; qualifyingSubtotal?: number; error?: string; discountDoc?: any }> => {
  try {
    const query = Discount.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (session) {
      query.session(session);
    }

    const discount = await query;

    if (!discount) {
      return { valid: false, error: 'Invalid discount code' };
    }

    // Check expiry
    if (discount.expiry < new Date()) {
      return { valid: false, error: 'Discount code has expired' };
    }

    // Check usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return { valid: false, error: 'Discount code usage limit reached' };
    }

    const items = context?.items || [];
    const itemCount = items.reduce((s, it) => s + (it.quantity || 0), 0);

    // First-order restriction (logged-in customers with prior orders fail;
    // guests pass — their account is created fresh at checkout).
    if (discount.firstOrderOnly && context?.userId) {
      const { Order } = await import('../models/Order');
      const prior = await Order.countDocuments({
        userId: context.userId,
        status: { $nin: ['cancelled', 'refunded'] },
      });
      if (prior > 0) {
        return { valid: false, error: 'This coupon is for first orders only' };
      }
    }

    // Combo / minimum-items restriction (e.g. BUY2GET10).
    if (discount.minItems && discount.minItems > 0 && itemCount < discount.minItems) {
      return { valid: false, error: `Add ${discount.minItems - itemCount} more item(s) to use this coupon` };
    }

    // Category scope (e.g. FESTIVE20 on ethnic wear): resolve qualifying items.
    let qualifyingSubtotal = orderTotal;
    const scoped = (discount.applicableCategories || []).length > 0;
    if (scoped && items.length > 0) {
      const { Product } = await import('../models/Product');
      const prods = await Product.find({ _id: { $in: items.map((it) => it.productId) } })
        .select('category price')
        .lean();
      const catOf = new Map(prods.map((p: any) => [String(p._id), String(p.category)]));
      const allowed = new Set((discount.applicableCategories || []).map((c: any) => String(c)));
      qualifyingSubtotal = 0;
      for (const it of items) {
        if (allowed.has(catOf.get(String(it.productId)) || '')) {
          qualifyingSubtotal += it.subtotal ?? (it.price || 0) * (it.quantity || 0);
        }
      }
      if (qualifyingSubtotal <= 0) {
        return { valid: false, error: 'This coupon applies only to specific categories in your cart' };
      }
    }

    // Check minimum purchase (against qualifying subtotal when scoped).
    if (discount.minPurchase && qualifyingSubtotal < discount.minPurchase) {
      return {
        valid: false,
        error: `Minimum purchase of ${discount.minPurchase} required${scoped ? ' on eligible items' : ''}`,
      };
    }

    // Calculate discount amount (on qualifying subtotal when scoped).
    let discountAmount = 0;
    if (discount.type === DiscountType.PERCENTAGE) {
      discountAmount = (qualifyingSubtotal * discount.value) / 100;
      if (discount.maxDiscount) {
        discountAmount = Math.min(discountAmount, discount.maxDiscount);
      }
    } else {
      discountAmount = Math.min(discount.value, qualifyingSubtotal); // Cannot exceed qualifying total
    }

    return {
      valid: true,
      discount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      freeShipping: !!discount.freeShipping,
      qualifyingSubtotal: scoped ? Math.round(qualifyingSubtotal * 100) / 100 : undefined,
      discountDoc: discount,
    };
  } catch (error: any) {
    console.error('Validate discount error:', error);
    return { valid: false, error: 'Error validating discount code' };
  }
};

// POST /discounts/validate — public cart/checkout pre-check.
// Body: { code, items: [{productId, quantity}], orderTotal? }.
// Authenticated callers also get first-order evaluation via their userId.
export const validateCartDiscount = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      code: Joi.string().trim().uppercase().required(),
      items: Joi.array()
        .items(
          Joi.object({
            productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            quantity: Joi.number().integer().min(1).required(),
          })
        )
        .min(1)
        .required(),
      orderTotal: Joi.number().min(0).optional(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const userId = (req as any).user?.userId;
    const { Product } = await import('../models/Product');
    const prods = await Product.find({ _id: { $in: value.items.map((it: any) => it.productId) } })
      .select('price')
      .lean();
    const priceOf = new Map(prods.map((p: any) => [String(p._id), p.price || 0]));
    const items = value.items.map((it: any) => ({
      productId: it.productId,
      quantity: it.quantity,
      price: priceOf.get(String(it.productId)) || 0,
      subtotal: (priceOf.get(String(it.productId)) || 0) * it.quantity,
    }));
    const total = value.orderTotal ?? items.reduce((s: number, it: any) => s + it.subtotal, 0);
    const result = await validateDiscount(value.code, total, undefined, { userId, items });
    if (!result.valid) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        code: value.code,
        discount: result.discount,
        freeShipping: !!result.freeShipping,
        qualifyingSubtotal: result.qualifyingSubtotal,
        orderTotal: total,
      },
    });
  } catch (err: any) {
    console.error('Validate cart discount error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

