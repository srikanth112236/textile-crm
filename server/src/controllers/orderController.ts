import { Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { Order, IOrder, OrderStatus, PaymentStatus } from '../models/Order';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { User, IAddress } from '../models/User';
import { clearCart } from '../services/cart';
import { emitToUser, emitToAdmins } from '../config/socket';
import { generateOrderNumber } from '../utils/orderNumber';
import { validateDiscount } from './discountController';
import { awardPointsForOrder, revokePointsForOrder } from './loyaltyController';
import { runSafeTransaction } from '../utils/safeSession';
import { requireCustomer } from '../utils/requireCustomer';

/**
 * Fire-and-forget auto-push to Shiprocket once admin confirms an order.
 * Keeps manual POST /shipment/orders/:id/ship as fallback.
 */
export async function tryAutoShipToShiprocket(orderId: string): Promise<void> {
  try {
    const { isShiprocketConfigured, createShiprocketOrder } = await import('../services/shiprocket');
    if (!isShiprocketConfigured()) return;
    const { Order: OrderModel, OrderStatus: OS } = await import('../models/Order');
    const { Settings: SettingsModel } = await import('../models/Settings');
    const { emitToUser: emit } = await import('../config/socket');
    const order: any = await OrderModel.findById(orderId).populate('userId', 'name email phone');
    if (!order) return;
    if (order.shiprocketOrderId || order.shiprocketShipmentId) return; // already pushed
    if (![OS.PROCESSING, OS.PACKED].includes(order.status)) return;
    const settings: any = await SettingsModel.findOne({ key: 'global' });
    if (settings?.shipment && settings.shipment.autoPush === false) return;
    const pickupLocation = String(order.pickupLocation || settings?.shipment?.pickupLocation || process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary').trim();
    const weightKg = Math.max(0.1, ((order.packageWeightG || settings?.shipping?.defaultWeightG || 500) / 1000));
    const length = order.packageLengthCm || settings?.shipping?.defaultLengthCm || 30;
    const breadth = order.packageWidthCm || settings?.shipping?.defaultWidthCm || 25;
    const height = order.packageHeightCm || settings?.shipping?.defaultHeightCm || 3;
    const isCOD = order.paymentMethod === 'cod';
    const u: any = order.userId;
    const name = u?.name || 'Mentoos Customer';
    // Shiprocket accepts exactly 10-digit Indian mobiles — skip auto-push if invalid
    // (admin can fix the phone and push manually from Admin > Orders).
    const { normalizePhone: normalizeBuyerPhone } = await import('../models/OtpCode');
    const phone = normalizeBuyerPhone(String(u?.phone || ''));
    if (!phone) return;
    const email = u?.email || '';
    const addr = order.shippingAddress;
    if (!addr?.street || !addr?.city || !addr?.zip) return;
    const items = (order.items || []).map((it: any) => ({
      name: `Product ${String(it.productId).slice(-6)}`,
      sku: `SKU-${String(it.productId).slice(-6)}`,
      units: it.quantity,
      selling_price: it.price,
    }));
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date();
    const orderDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const sr: any = await createShiprocketOrder({
      orderId: order.orderNumber,
      orderDate,
      billing: { name, address: addr.street, city: addr.city, state: addr.state, country: addr.country || 'India', pincode: addr.zip, phone, email },
      shipping: { name, address: addr.street, city: addr.city, state: addr.state, country: addr.country || 'India', pincode: addr.zip, phone },
      items,
      paymentMethod: isCOD ? 'COD' : 'Prepaid',
      subTotal: order.total,
      length, breadth, height, weight: weightKg,
      pickupLocation,
      channelId: settings?.shipment?.channelId || undefined,
    });
    order.shiprocketOrderId = String(sr.order_id || '');
    order.shiprocketShipmentId = String(sr.shipment_id || '');
    order.shiprocketStatus = sr.status || 'created';
    order.trackingNumber = order.shiprocketShipmentId;
    if (order.status === OS.PROCESSING || (order as any).status === 'confirmed') order.status = OS.SHIPPED;
    await order.save();
    try { emit(order.userId.toString(), 'orderShipped', { orderId: order._id.toString(), orderNumber: order.orderNumber, shipmentId: order.shiprocketShipmentId }); } catch { /* ignore */ }
    try {
      const { notifyOrderWhatsApp } = await import('../services/whatsapp');
      if (phone) notifyOrderWhatsApp(phone, 'shipped', { orderNumber: order.orderNumber, courier: 'partner', awb: order.shiprocketShipmentId || '' }).catch(() => {});
    } catch { /* ignore */ }
  } catch (e) {
    console.error('Auto-ship to Shiprocket failed (manual Ship still available):', (e as any)?.message);
  }
}

// Validation schemas
const createOrderSchema = Joi.object({
  shippingAddressId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  shippingAddress: Joi.object({
    street: Joi.string().trim().required().max(200),
    city: Joi.string().trim().required().max(100),
    state: Joi.string().trim().required().max(100),
    zip: Joi.string().trim().required().max(20),
    country: Joi.string().trim().required().max(100),
  }).optional(),
  paymentMethod: Joi.string().trim().valid('manual', 'razorpay', 'cod', 'upi', 'card', 'netbanking', 'wallet').default('manual'),
  discountCode: Joi.string().trim().uppercase().optional().allow(''),
  loyaltyPointsRedeemed: Joi.number().integer().min(0).optional(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .required(),
  notes: Joi.string().trim().max(500).optional(),
});

const confirmPaymentSchema = Joi.object({
  notes: Joi.string().trim().max(500).optional(),
});

const refundOrderSchema = Joi.object({
  refundAmount: Joi.number().min(1).optional(), // If not provided, refund full amount
  notes: Joi.string().trim().max(500).required(),
  refundMethod: Joi.string().valid('source', 'upi', 'bank').default('source'),
  upiId: Joi.string().trim().max(100).optional().allow(''),
  bankAccountName: Joi.string().trim().max(100).optional().allow(''),
  bankAccountNumber: Joi.string().trim().max(30).optional().allow(''),
  bankIfsc: Joi.string().trim().max(11).uppercase().optional().allow(''),
});

export { UPI_RE, IFSC_RE, isValidUpiId, isValidBankDestination } from '../utils/refundValidation';
import { UPI_RE as UPI_PATTERN, IFSC_RE as IFSC_PATTERN } from '../utils/refundValidation';

const cancelOrderSchema = Joi.object({
  reason: Joi.string().trim().max(500).optional(),
});

/**
 * Get user orders
 */
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const status = req.query.status as string | undefined;

    const query: any = { userId };
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.productId', 'name images sku')
      .lean();

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get single order
 */
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const userRole = req.user?.role;

    // First, get the order without populating userId to check access
    const order = await Order.findById(id).lean();

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Check if user has access to this order
    const orderUserId = order.userId.toString();
    if (orderUserId !== userId && userRole !== 'admin' && userRole !== 'superadmin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Now populate the order with all needed fields
    const populatedOrder = await Order.findById(id)
      .populate('items.productId', 'name images sku description price')
      .populate('userId', 'name email phone')
      .lean();

    if (!populatedOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: populatedOrder,
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create order from cart
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!requireCustomer(req, res)) return;

    // Validate input
    const { error, value } = createOrderSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    await runSafeTransaction(async (session) => {
      // Get user cart
      const cart = await Cart.findOne({ userId }).session(session || null);
      if (!cart || !cart.items || cart.items.length === 0) {
        res.status(400).json({ error: 'Cart is empty' });
        return;
      }

      // Get shipping address
      let shippingAddress: IAddress | undefined;
      const user = await User.findById(userId).session(session || null);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (value.shippingAddressId) {
        const addressIndex = user.addresses.findIndex(
          (addr) => (addr as any)._id?.toString() === value.shippingAddressId
        );
        if (addressIndex !== -1) {
          shippingAddress = user.addresses[addressIndex];
        }
      }

      if (!shippingAddress && value.shippingAddress) {
        shippingAddress = value.shippingAddress;
      }

      if (!shippingAddress && user.addresses && user.addresses.length > 0) {
        const defaultAddr = user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
        shippingAddress = defaultAddr;
      }

      // Fallback default address if none provided or configured
      if (!shippingAddress) {
        shippingAddress = {
          street: 'Somandepalli Road',
          city: 'Somandepalle',
          state: 'Andhra Pradesh',
          zip: '515122',
          country: 'India',
          isDefault: true,
        };
      }

      // Validate and prepare order items
      const orderItems = [];
      let total = 0;

      for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.productId).session(session || null);
        if (!product) {
          res.status(404).json({ error: `Product ${cartItem.productId} not found` });
          return;
        }

        if (product.status !== 'active') {
          res.status(400).json({ error: `Product ${product.name} is not available` });
          return;
        }

        // Price snapshot (stock validated + decremented below at size level)
        const itemPrice = cartItem.price || product.price;
        const subtotal = itemPrice * cartItem.quantity;
        total += subtotal;

        orderItems.push({
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          variations: cartItem.variations || [],
          price: itemPrice,
          subtotal,
        });

        // Decrement size-level stock (top-level is a variant rollup — the
        // helper picks the ordered size and validates availability).
        const { decrementStockForOrder } = await import('../utils/stock');
        const dec = await decrementStockForOrder(product, cartItem.variations, cartItem.quantity, session);
        if (!dec.ok) {
          res.status(400).json({ error: dec.reason || `Insufficient stock for ${product.name}` });
          return;
        }
      }

      // Apply discount code if provided
      let discountAmount = 0;
      let freeShipCoupon = false;
      let discountCode = value.discountCode;
      if (discountCode && discountCode.trim()) {
        const discountValidation = await validateDiscount(discountCode, total, session, { userId, items: orderItems });
        if (!discountValidation.valid) {
          res.status(400).json({ error: discountValidation.error || 'Invalid discount code' });
          return;
        }
        discountAmount = discountValidation.discount || 0;
        freeShipCoupon = !!discountValidation.freeShipping;
        if (discountValidation.discountDoc) {
          discountValidation.discountDoc.usedCount += 1;
          await discountValidation.discountDoc.save({ session });
        }
      }

      // Apply loyalty points redemption if provided
      let loyaltyDiscountAmount = 0;
      if (value.loyaltyPointsRedeemed && value.loyaltyPointsRedeemed > 0) {
        if (user.loyaltyPoints < value.loyaltyPointsRedeemed) {
          res.status(400).json({ error: 'Insufficient loyalty points' });
          return;
        }

        loyaltyDiscountAmount = value.loyaltyPointsRedeemed / 100;
        loyaltyDiscountAmount = Math.min(loyaltyDiscountAmount, total - discountAmount);

        user.loyaltyPoints -= value.loyaltyPointsRedeemed;
        user.loyaltyPointsHistory.push({
          points: -value.loyaltyPointsRedeemed,
          reason: `Order: ${value.loyaltyPointsRedeemed} points redeemed`,
          createdAt: new Date(),
        });
        await user.save({ session });
      }

      const finalTotal = Math.max(0, total - discountAmount - loyaltyDiscountAmount);
      const orderNumber = await generateOrderNumber(session);

      // Phase 0/1 + E: shipping cost + smart COD advance/balance from Settings
      let shippingCost = 0;
      let codBalance = 0;
      try {
        const { Settings } = await import('../models/Settings');
        const { getCODQuoteDetailed } = await import('../services/codRules');
        const settings = await Settings.findOne({ key: 'global' });
        if (settings) {
          const threshold = settings.shipping.freeShippingThreshold ?? 999;
          shippingCost = freeShipCoupon ? 0 : (finalTotal >= threshold ? 0 : (settings.shipping.flatShippingCost ?? 49));
          if ((value.paymentMethod || 'manual') === 'cod' && settings.payments.codEnabled) {
            const quote = await getCODQuoteDetailed(finalTotal + shippingCost, {
              pincode: shippingAddress.zip,
              userId,
            });
            if (!quote.codAllowed) {
              res.status(400).json({ error: quote.reason });
              return;
            }
            codBalance = quote.balance;
          }
        }
      } catch {
        // settings optional — fall through with zero shipping
      }

      const order = new Order({
        userId,
        orderNumber,
        items: orderItems,
        total: finalTotal + shippingCost,
        subtotal: total,
        discountAmount,
        discountCode: value.discountCode ? String(value.discountCode).toUpperCase() : undefined,
        shippingCost,
        shippingAddress: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.zip,
          country: shippingAddress.country,
        },
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: value.paymentMethod || 'manual',
        codAdvancePaid: 0,
        codBalance,
      } as any);

      await order.save({ session });
      await clearCart(userId);

      const populatedOrder = await Order.findById(order._id)
        .populate('items.productId', 'name images sku')
        .lean();

      emitToUser(userId.toString(), 'orderCreated', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
      });

      emitToAdmins('newOrder', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: userId.toString(),
        total: order.total,
        timestamp: new Date(),
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: populatedOrder,
      });
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const guestOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        quantity: Joi.number().integer().min(1).max(10).required(),
        variations: Joi.array()
          .items(Joi.object({ name: Joi.string().required(), value: Joi.string().required() }))
          .optional(),
      })
    )
    .min(1)
    .max(20)
    .required(),
  phone: Joi.string().trim().required().max(20),
  email: Joi.string().trim().email().optional().allow(''),
  name: Joi.string().trim().max(100).optional().allow(''),
  shippingAddress: Joi.object({
    street: Joi.string().trim().required().max(200),
    city: Joi.string().trim().required().max(100),
    state: Joi.string().trim().required().max(100),
    zip: Joi.string().trim().required().max(20),
    country: Joi.string().trim().required().max(100),
  }).required(),
  paymentMethod: Joi.string().trim().valid('manual', 'razorpay', 'cod', 'upi', 'card', 'netbanking', 'wallet').default('cod'),
  discountCode: Joi.string().trim().uppercase().optional().allow(''),
});

/**
 * Guest checkout: no login needed. Account auto-created by mobile number
 * and claimable later via OTP login (Enter Mobile Number → OTP → Login).
 */
export const createGuestOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = guestOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }

    const { normalizePhone } = await import('../models/OtpCode');
    const phone = normalizePhone(value.phone);
    if (!phone) {
      res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
      return;
    }

    await runSafeTransaction(async (session) => {
      // Find-or-create guest user by phone
      const { User } = await import('../models/User');
      const { UserRole } = await import('../types/roles');
      let user = await User.findOne({ phone }).session(session || null);
      if (!user && value.email) {
        user = await User.findOne({ email: value.email.toLowerCase() }).session(session || null);
      }
      if (!user) {
        const crypto = await import('crypto');
        user = new User({
          email: (value.email || `${phone}@otp.mentoos.in`).toLowerCase(),
          password: crypto.randomBytes(24).toString('hex'),
          role: UserRole.USER,
          phone,
          name: value.name || undefined,
        });
        await user.save({ session });
      } else if (!user.phone) {
        user.phone = phone;
        if (value.name && !user.name) user.name = value.name;
        await user.save({ session });
      }
      const userId = (user as any)._id.toString();

      // Validate items + decrement stock
      const orderItems = [];
      let total = 0;
      for (const it of value.items) {
        const product = await Product.findById(it.productId).session(session || null);
        if (!product) {
          res.status(404).json({ error: `Product ${it.productId} not found` });
          return;
        }
        if (product.status !== 'active') {
          res.status(400).json({ error: `Product ${product.name} is not available` });
          return;
        }
        if (product.stock < it.quantity) {
          res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
          return;
        }
        const subtotal = product.price * it.quantity;
        total += subtotal;
        orderItems.push({
          productId: it.productId,
          quantity: it.quantity,
          variations: it.variations || [],
          price: product.price,
          subtotal,
        });
        // Decrement size-level stock (see logged-in flow).
        const { decrementStockForOrder } = await import('../utils/stock');
        const gdec = await decrementStockForOrder(product, it.variations, it.quantity, session);
        if (!gdec.ok) {
          res.status(400).json({ error: gdec.reason || `Insufficient stock for ${product.name}` });
          return;
        }
      }

      // Discount code (no loyalty for guests)
      let discountAmount = 0;
      let freeShipCoupon = false;
      if (value.discountCode && value.discountCode.trim()) {
        const discountValidation = await validateDiscount(value.discountCode, total, session, { userId, items: orderItems });
        if (!discountValidation.valid) {
          res.status(400).json({ error: discountValidation.error || 'Invalid discount code' });
          return;
        }
        discountAmount = discountValidation.discount || 0;
        freeShipCoupon = !!discountValidation.freeShipping;
        if (discountValidation.discountDoc) {
          discountValidation.discountDoc.usedCount += 1;
          await discountValidation.discountDoc.save({ session });
        }
      }

      const finalTotal = Math.max(0, total - discountAmount);
      const orderNumber = await generateOrderNumber(session);

      let shippingCost = 0;
      let codBalance = 0;
      try {
        const { Settings } = await import('../models/Settings');
        const { getCODQuoteDetailed } = await import('../services/codRules');
        const settings = await Settings.findOne({ key: 'global' });
        if (settings) {
          const threshold = settings.shipping.freeShippingThreshold ?? 999;
          shippingCost = freeShipCoupon ? 0 : (finalTotal >= threshold ? 0 : (settings.shipping.flatShippingCost ?? 49));
          if (value.paymentMethod === 'cod' && settings.payments.codEnabled) {
            const quote = await getCODQuoteDetailed(finalTotal + shippingCost, {
              pincode: value.shippingAddress.zip,
              userId,
            });
            if (!quote.codAllowed) {
              res.status(400).json({ error: quote.reason });
              return;
            }
            codBalance = quote.balance;
          }
        }
      } catch { /* settings optional */ }

      const order = new Order({
        userId,
        orderNumber,
        items: orderItems,
        total: finalTotal + shippingCost,
        subtotal: total,
        discountAmount,
        discountCode: value.discountCode ? String(value.discountCode).toUpperCase() : undefined,
        shippingCost,
        shippingAddress: {
          street: value.shippingAddress.street,
          city: value.shippingAddress.city,
          state: value.shippingAddress.state,
          zip: value.shippingAddress.zip,
          country: value.shippingAddress.country,
        },
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: value.paymentMethod || 'cod',
        codAdvancePaid: 0,
        codBalance,
        source: 'guest-checkout',
      } as any);

      await order.save({ session });

      emitToUser(userId.toString(), 'orderCreated', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
      });
      emitToAdmins('newOrder', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: userId.toString(),
        total: order.total,
        timestamp: new Date(),
      });

      res.status(201).json({
        success: true,
        message: 'Guest order created. Login with OTP on the same mobile number to track it in your account.',
        data: order,
      });
    });
  } catch (error: any) {
    console.error('Create guest order error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Update order status (Admin/Superadmin only)
 */export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateOrderStatusSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const order = await Order.findById(id).populate('userId', 'name email');
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const oldStatus = order.status;
    order.status = value.status as OrderStatus;

    // Update payment status based on order status — but a COD order with
    // balance still due is NOT paid in full, so it stays PENDING (same rule
    // as the Order pre-save hook; explicit sets here would bypass it).
    if (value.status === OrderStatus.PROCESSING) {
      const isCod = (order as any).paymentMethod === 'cod';
      const balanceDue = (order as any).codBalance || 0;
      if (!(isCod && balanceDue > 0)) {
        order.paymentStatus = PaymentStatus.CONFIRMED;
      }
    }

    // Add notes if provided
    if (value.notes) {
      if (value.status === OrderStatus.CANCELLED || value.status === OrderStatus.REFUNDED) {
        order.cancelledReason = value.notes;
      }
    }

    await order.save();

    // Award loyalty points when order is delivered
    if (oldStatus !== OrderStatus.DELIVERED && value.status === OrderStatus.DELIVERED) {
      await awardPointsForOrder(order._id.toString(), order.userId.toString(), order.total);
    }

    // Revoke loyalty points if order is cancelled/refunded
    if (
      oldStatus !== OrderStatus.CANCELLED &&
      oldStatus !== OrderStatus.REFUNDED &&
      (value.status === OrderStatus.CANCELLED || value.status === OrderStatus.REFUNDED)
    ) {
      await revokePointsForOrder(order._id.toString(), order.userId.toString());
    }

    // Emit status update notification to user
    emitToUser(order.userId.toString(), 'orderStatusUpdate', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: order.status,
      timestamp: new Date(),
    });

    // Auto-push to Shiprocket once admin confirms (processing/packed).
    // Manual POST /shipment/orders/:id/ship remains as fallback.
    if (value.status === OrderStatus.PROCESSING || value.status === OrderStatus.PACKED) {
      tryAutoShipToShiprocket(order._id.toString()).catch(() => {});
    }

    // WhatsApp updates for packed / out-for-delivery / delivered transitions
    try {
      const { User } = await import('../models/User');
      const { notifyOrderWhatsApp } = await import('../services/whatsapp');
      const buyer: any = await User.findById(order.userId).select('phone').lean();
      if (buyer?.phone && oldStatus !== order.status) {
        if (order.status === OrderStatus.PACKED) {
          notifyOrderWhatsApp(buyer.phone, 'packed', { orderNumber: order.orderNumber }).catch(() => {});
        } else if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
          const trackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/track-order`;
          notifyOrderWhatsApp(buyer.phone, 'out_for_delivery', { orderNumber: order.orderNumber, trackUrl }).catch(() => {});
        } else if (order.status === OrderStatus.DELIVERED && oldStatus !== OrderStatus.DELIVERED) {
          notifyOrderWhatsApp(buyer.phone, 'delivered', { orderNumber: order.orderNumber }).catch(() => {});
        }
      }
    } catch { /* notifications optional */ }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order,
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Confirm payment manually (Admin/Superadmin only)
 */
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = confirmPaymentSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const order = await Order.findById(id).populate('userId', 'name email');
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.paymentStatus === PaymentStatus.CONFIRMED) {
      res.status(400).json({ error: 'Payment already confirmed' });
      return;
    }

    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      res.status(400).json({ error: 'Cannot confirm payment for refunded order' });
      return;
    }

    // Double-confirm guard: if Razorpay already captured the FULL payment,
    // manual confirmation would double-mark the same money.
    try {
      const { Payment } = await import('../models/Payment');
      const captured: any = await Payment.findOne({ orderId: id, status: 'captured' }).sort({ createdAt: -1 });
      if (captured && captured.purpose !== 'cod_advance') {
        res.status(409).json({
          error: 'Razorpay payment already captured for this order — no manual confirmation needed',
          razorpayPaymentId: captured.razorpayPaymentId,
        });
        return;
      }
    } catch { /* ledger check optional — fall through to manual confirm */ }

    order.paymentStatus = PaymentStatus.CONFIRMED;
    if (value.notes) {
      order.paymentNotes = value.notes;
    }

    // Update order status to processing if it's pending
    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PROCESSING;
    }

    await order.save();

    // Emit payment confirmed notification to user
    emitToUser(order.userId.toString(), 'paymentConfirmed', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      total: order.total,
      timestamp: new Date(),
    });

    emitToUser(order.userId.toString(), 'orderStatusUpdate', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      oldStatus: OrderStatus.PENDING,
      newStatus: OrderStatus.PROCESSING,
      timestamp: new Date(),
    });

    // Auto-push to Shiprocket on payment confirmation (admin confirmed order)
    tryAutoShipToShiprocket(order._id.toString()).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Payment confirmed',
      data: order,
    });
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Refund order (Admin/Superadmin only)
 */
export const refundOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = refundOrderSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const order = await Order.findById(id).populate('userId', 'name email phone');
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      res.status(400).json({ error: 'Order already refunded' });
      return;
    }

    const refundAmount = value.refundAmount || order.total;

    if (refundAmount > order.total) {
      res.status(400).json({ error: 'Refund amount cannot exceed order total' });
      return;
    }

    // Destination rules: online money always returns to source (Razorpay rule —
    // no UPI/bank details needed). Manual settlements require a destination.
    const hasOnlineMoney = Boolean((order as any).razorpayPaymentId);
    const refundMethod = hasOnlineMoney ? 'source' : value.refundMethod || 'source';
    if (refundMethod === 'upi' && !UPI_PATTERN.test(value.upiId || '')) {
      res.status(400).json({ error: 'Enter a valid UPI ID (e.g. name@okbank)' });
      return;
    }
    if (
      refundMethod === 'bank' &&
      (!value.bankAccountName || !value.bankAccountNumber || !IFSC_PATTERN.test(value.bankIfsc || ''))
    ) {
      res.status(400).json({ error: 'Bank account name, number and valid IFSC are required for bank refunds' });
      return;
    }

    // Route online money through Razorpay FIRST — before touching local state.
    // If Razorpay fails the order is left untouched so the admin can retry.
    // COD / manual orders (no razorpayPaymentId) refund locally.
    let razorpayRefundId: string | null = null;
    let refundMode: 'razorpay' | 'manual' = 'manual';
    const rpPaymentId = (order as any).razorpayPaymentId;
    if (rpPaymentId && refundAmount > 0) {
      try {
        const { refundRazorpayPayment } = await import('../services/razorpay');
        const rf: any = await refundRazorpayPayment(rpPaymentId, refundAmount);
        razorpayRefundId = String(rf.id || rf.refund_id || '');
        refundMode = 'razorpay';
      } catch (e: any) {
        console.error('Razorpay refund failed:', e.response?.data || e.message);
        res.status(502).json({
          error: 'Razorpay refund failed — order NOT refunded, safe to retry',
          details: e.response?.data || e.message,
        });
        return;
      }
    }

    // DB writes run in a transaction on replica sets, plain writes on
    // standalone Mongo (runSafeTransaction) — never crashes with
    // "Transaction numbers are only allowed on a replica set member".
    await runSafeTransaction(async (session) => {
      const o = await Order.findById(id).session(session || null);
      if (!o) throw new Error('ORDER_NOT_FOUND');
      if (o.paymentStatus === PaymentStatus.REFUNDED) throw new Error('ALREADY_REFUNDED');

      // Partial refunds keep the order alive; only full refunds close it.
      const isPartial = refundAmount < o.total;
      o.paymentStatus = isPartial ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED;
      if (!isPartial) o.status = OrderStatus.REFUNDED;
      o.refundAmount = refundAmount;
      o.refundNotes = value.notes;
      (o as any).refundMethod = refundMethod;
      if (refundMethod === 'upi') {
        (o as any).refundUpiId = value.upiId;
        (o as any).refundBankName = undefined;
        (o as any).refundBankAccount = undefined;
        (o as any).refundBankIfsc = undefined;
      } else if (refundMethod === 'bank') {
        (o as any).refundBankName = value.bankAccountName;
        (o as any).refundBankAccount = value.bankAccountNumber;
        (o as any).refundBankIfsc = value.bankIfsc;
        (o as any).refundUpiId = undefined;
      }
      if (razorpayRefundId) {
        o.paymentNotes = `${o.paymentNotes || ''} Razorpay refund: ${razorpayRefundId}`.trim();
        (o as any).refundStatus = 'completed';
        (o as any).refundReference = razorpayRefundId;
        (o as any).refundCompletedAt = new Date();
        o.timeline.push({
          event: refundMode === 'razorpay' ? 'Refund completed' : 'Refund initiated',
          description: `₹${refundAmount} refunded to source via Razorpay (5–7 working days). Ref: ${razorpayRefundId}`.slice(0, 500),
          type: 'payment',
          metadata: { amount: refundAmount, mode: refundMode, reference: razorpayRefundId },
          createdAt: new Date(),
        } as any);
      } else {
        // Manual settlement — admin completes it after paying the customer.
        (o as any).refundStatus = 'processing';
        o.timeline.push({
          event: 'Refund initiated',
          description: `₹${refundAmount} manual refund via ${refundMethod === 'upi' ? `UPI ${value.upiId}` : `bank ${value.bankAccountNumber}`}. Completing after settlement.`.slice(0, 500),
          type: 'payment',
          metadata: { amount: refundAmount, mode: 'manual', method: refundMethod },
          createdAt: new Date(),
        } as any);
      }

      // Return size-level stock for refunded items — full refunds only.
      if (!isPartial) {
        const { restoreStockForOrder } = await import('../utils/stock');
        for (const item of o.items) {
          const product = await Product.findById(item.productId).session(session || null);
          if (product) {
            await restoreStockForOrder(product, item.variations, item.quantity, session);
          }
        }
      }

      await o.save({ session });
    });

    const fresh = await Order.findById(id);

    // userId may be populated (doc) or raw (ObjectId) — normalize once.
    const userIdStr =
      (order.userId as any)?._id?.toString?.() || order.userId?.toString?.() || '';

    // Mirror the refund into the payment ledger (best-effort)
    try {
      const { Payment } = await import('../models/Payment');
      const payment: any = rpPaymentId
        ? await Payment.findOne({ razorpayPaymentId: rpPaymentId })
        : await Payment.findOne({ orderId: id, status: 'captured' }).sort({ createdAt: -1 });
      if (payment) {
        if (razorpayRefundId) payment.refundId = razorpayRefundId;
        payment.refundAmount = refundAmount;
        payment.status = refundAmount < order.total ? 'partially_refunded' : 'refunded';
        await payment.save().catch(() => {});
      }
    } catch { /* ledger optional */ }

    // Revoke loyalty points if they were awarded
    await revokePointsForOrder(order._id.toString(), userIdStr);

    // Emit refund notification to user
    emitToUser(userIdStr, 'orderRefunded', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      refundAmount,
      refundMode,
      timestamp: new Date(),
    });

    emitToUser(userIdStr, 'orderStatusUpdate', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      oldStatus: order.status,
      newStatus: OrderStatus.REFUNDED,
      timestamp: new Date(),
    });

    // WhatsApp: refund initiated/completed with ETA (fire-and-forget)
    try {
      const { notifyOrderWhatsApp } = await import('../services/whatsapp');
      const buyerPhone = (order.userId as any)?.phone;
      if (buyerPhone) {
        if (refundMode === 'razorpay') {
          notifyOrderWhatsApp(buyerPhone, 'refund_completed', { orderNumber: order.orderNumber, amount: `₹${refundAmount}` }).catch(() => {});
        } else {
          notifyOrderWhatsApp(buyerPhone, 'refund_initiated', { orderNumber: order.orderNumber, amount: `₹${refundAmount}` }).catch(() => {});
        }
      }
    } catch { /* notifications optional */ }

    res.status(200).json({
      success: true,
      message:
        refundMode === 'razorpay'
          ? refundAmount < order.total
            ? 'Partial refund processed via Razorpay'
            : 'Order refunded successfully via Razorpay'
          : refundAmount < order.total
            ? 'Partial refund recorded (COD/manual — settle with customer)'
            : 'Order refunded successfully (COD/manual — settle with customer)',
      data: fresh,
      refundMode,
      refundMethod,
      razorpayRefundId,
    });
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (error.message === 'ALREADY_REFUNDED') {
      res.status(400).json({ error: 'Order already refunded' });
      return;
    }
    console.error('Refund order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Complete a manual refund (Admin/Superadmin only).
 * Marks a `processing` manual refund completed after paying the customer
 * via the stored UPI/bank destination. Requires a reference note (audit).
 */
export const completeManualRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      reference: Joi.string().trim().max(100).required(),
      notes: Joi.string().trim().max(500).optional().allow(''),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const order = await Order.findById(id).populate('userId', 'name email phone');
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if ((order as any).refundStatus !== 'processing') {
      res.status(400).json({ error: 'Only refunds in processing state can be completed' });
      return;
    }
    (order as any).refundStatus = 'completed';
    (order as any).refundReference = value.reference;
    (order as any).refundCompletedAt = new Date();
    if (value.notes) order.refundNotes = value.notes;
    const dest =
      (order as any).refundMethod === 'upi'
        ? `UPI ${(order as any).refundUpiId}`
        : (order as any).refundMethod === 'bank'
          ? `bank ${(order as any).refundBankAccount}`
          : 'source';
    order.timeline.push({
      event: 'Refund completed',
      description: `₹${(order as any).refundAmount} manual refund completed via ${dest}. Ref: ${value.reference}`.slice(0, 500),
      type: 'payment',
      metadata: { amount: (order as any).refundAmount, mode: 'manual', reference: value.reference },
      createdAt: new Date(),
    } as any);
    await order.save();
    const userIdStr = (order.userId as any)?._id?.toString?.() || order.userId?.toString?.() || '';
    emitToUser(userIdStr, 'orderRefunded', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      refundAmount: (order as any).refundAmount,
      refundMode: 'manual',
      timestamp: new Date(),
    });
    try {
      const { notifyOrderWhatsApp } = await import('../services/whatsapp');
      const buyerPhone = (order.userId as any)?.phone;
      if (buyerPhone) {
        notifyOrderWhatsApp(buyerPhone, 'refund_completed', { orderNumber: order.orderNumber, amount: `₹${(order as any).refundAmount}` }).catch(() => {});
      }
    } catch { /* notifications optional */ }
    res.status(200).json({ success: true, message: 'Manual refund marked completed', data: order });
  } catch (err) {
    console.error('Complete refund error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Cancel order (User can cancel, or Admin can cancel)
 */
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const userRole = req.user?.role;

    // Validate input
    const { error, value } = cancelOrderSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const order = await Order.findById(id).populate('userId', 'name email');
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Check access: user can only cancel their own orders, admin can cancel any
    const orderUserId = (order.userId as any)?._id?.toString?.() || order.userId?.toString?.();
    if (orderUserId !== userId && userRole !== 'admin' && userRole !== 'superadmin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Only allow cancellation if order is pending or processing
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PROCESSING
    ) {
      res.status(400).json({
        error: `Cannot cancel order with status: ${order.status}`,
      });
      return;
    }

    const oldStatus = order.status;

    // Refund policy (Admin > Settings > Refunds). Missing section = legacy behavior.
    const { Settings: SettingsModel } = await import('../models/Settings');
    let refundSettings: any = await SettingsModel.findOne({ key: 'global' }).lean();
    if (!refundSettings) {
      const { DEFAULT_SETTINGS } = await import('../models/Settings');
      refundSettings = DEFAULT_SETTINGS;
    }
    const refundsCfg = refundSettings?.refunds || {};

    // Customer cancel window (staff bypass)
    const isStaff = userRole === 'admin' || userRole === 'superadmin';
    const cancelWindowHrs = refundsCfg.allowCustomerCancelHours ?? null;
    if (!isStaff && typeof cancelWindowHrs === 'number') {
      const ageHrs = (Date.now() - new Date(order.createdAt).getTime()) / 3600000;
      if (ageHrs > cancelWindowHrs) {
        res.status(400).json({
          error: `Cancellation window expired (allowed within ${cancelWindowHrs}h of ordering). Please contact support.`,
        });
        return;
      }
    }

    // Gap-1: a cancelled order must not keep captured money. If a COD advance
    // was paid online, route it back through Razorpay FIRST — before any DB
    // write. Gateway failure leaves the order untouched so cancel can retry.
    // Gated by refunds.autoRefundOnCancel + refunds.codAdvanceRefundable.
    const autoRefund = refundsCfg.autoRefundOnCancel !== false;
    const advanceRefundable = refundsCfg.codAdvanceRefundable !== false;
    let advanceRefundId: string | null = null;
    let advanceRefundHeld = false;
    const advancePaid = (order as any).codAdvancePaid || 0;
    const rpPaymentId = (order as any).razorpayPaymentId;
    if (advancePaid > 0 && rpPaymentId && autoRefund && advanceRefundable) {
      try {
        const { refundRazorpayPayment } = await import('../services/razorpay');
        const rf: any = await refundRazorpayPayment(rpPaymentId, advancePaid);
        advanceRefundId = String(rf.id || rf.refund_id || '');
      } catch (e: any) {
        console.error('Cancel advance-refund failed:', e.response?.data || e.message);
        res.status(502).json({
          error: 'Razorpay advance refund failed — order NOT cancelled, safe to retry',
          details: e.response?.data || e.message,
        });
        return;
      }
    } else if (advancePaid > 0 && rpPaymentId) {
      // Policy holds the money for manual review instead of auto-refunding.
      advanceRefundHeld = true;
    }

    await runSafeTransaction(async (session) => {
      const o = await Order.findById(id).session(session || null);
      if (!o) throw new Error('ORDER_NOT_FOUND');
      o.status = OrderStatus.CANCELLED;
      o.cancelledBy = new mongoose.Types.ObjectId(userId);
      if (value.reason) {
        o.cancelledReason = value.reason;
      }
      if (advanceRefundId) {
        // The only money on the order was the advance — it is now refunded.
        o.paymentStatus = PaymentStatus.REFUNDED;
        o.refundAmount = advancePaid;
        o.paymentNotes = `${o.paymentNotes || ''} Advance refunded via Razorpay: ${advanceRefundId}`.trim();
        (o as any).refundMethod = 'source';
        (o as any).refundStatus = 'completed';
        (o as any).refundReference = advanceRefundId;
        (o as any).refundCompletedAt = new Date();
        o.timeline.push({
          event: 'Refund completed',
          description: `COD advance ₹${advancePaid} refunded to source via Razorpay (5–7 working days). Ref: ${advanceRefundId}`.slice(0, 500),
          type: 'payment',
          metadata: { amount: advancePaid, mode: 'razorpay', reference: advanceRefundId },
          createdAt: new Date(),
        } as any);
      } else if (advanceRefundHeld) {
        // Policy disabled auto-refund — money stays captured for manual settlement.
        (o as any).refundStatus = 'pending';
        (o as any).refundAmount = advancePaid;
        o.paymentNotes = `${o.paymentNotes || ''} Advance ₹${advancePaid} held — auto-refund disabled, settle manually via Refund.`.trim();
        o.timeline.push({
          event: 'Refund pending',
          description: `COD advance ₹${advancePaid} held for manual refund (auto-refund disabled in settings).`.slice(0, 500),
          type: 'payment',
          metadata: { amount: advancePaid, mode: 'manual-hold' },
          createdAt: new Date(),
        } as any);
      }

      // Return size-level stock for all items
      const { restoreStockForOrder } = await import('../utils/stock');
      for (const item of o.items) {
        const product = await Product.findById(item.productId).session(session || null);
        if (product) {
          await restoreStockForOrder(product, item.variations, item.quantity, session);
        }
      }

      await o.save({ session });
    });

    // Mirror an advance refund into the payment ledger (best-effort)
    if (advanceRefundId) {
      try {
        const { Payment } = await import('../models/Payment');
        const payment: any = await Payment.findOne({ razorpayPaymentId: rpPaymentId });
        if (payment) {
          payment.refundId = advanceRefundId;
          payment.refundAmount = advancePaid;
          payment.status = 'refunded';
          await payment.save().catch(() => {});
        }
      } catch { /* ledger optional */ }
    }

    // Revoke loyalty points if they were awarded
    await revokePointsForOrder(order._id.toString(), orderUserId);

    // Emit cancellation notification to user
    emitToUser(orderUserId, 'orderCancelled', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      reason: value.reason,
      timestamp: new Date(),
    });

    emitToUser(orderUserId, 'orderStatusUpdate', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: OrderStatus.CANCELLED,
      timestamp: new Date(),
    });

    const fresh = await Order.findById(id);
    res.status(200).json({
      success: true,
      message: advanceRefundId
        ? 'Order cancelled successfully, advance refunded via Razorpay'
        : 'Order cancelled successfully',
      data: fresh,
      advanceRefunded: advancePaid > 0 ? advancePaid : 0,
      razorpayRefundId: advanceRefundId,
    });
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Repeat order (create new order from existing order)
 */
export const repeatOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const originalOrder = await Order.findById(id);
    if (!originalOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Check access
    if (originalOrder.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (!requireCustomer(req, res)) return;

    let newOrderId: string = '';
    await runSafeTransaction(async (session) => {
      // Validate all items are still available and in stock
      const orderItems = [];
      let total = 0;

      for (const item of originalOrder.items) {
        const product = await Product.findById(item.productId).session(session || null);
        if (!product || product.status !== 'active') {
          throw new Error(`PRODUCT_UNAVAILABLE:${item.productId}`);
        }

        const currentPrice = product.price;
        const subtotal = currentPrice * item.quantity;
        total += subtotal;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          variations: item.variations || [],
          price: currentPrice,
          subtotal,
        });

        // Decrement size-level stock
        const { decrementStockForOrder } = await import('../utils/stock');
        const rdec = await decrementStockForOrder(product, item.variations, item.quantity, session);
        if (!rdec.ok) {
          throw new Error(`STOCK:${rdec.reason}`);
        }
      }

      // Generate unique order number
      const orderNumber = await generateOrderNumber(session);

      // Create new order
      const newOrder = new Order({
        userId,
        orderNumber,
        items: orderItems,
        total,
        shippingAddress: originalOrder.shippingAddress,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: originalOrder.paymentMethod,
      });

      await newOrder.save({ session });
      newOrderId = newOrder._id.toString();
    });

    const populatedOrder = await Order.findById(newOrderId)
      .populate('items.productId', 'name images sku')
      .lean();

    // Emit order created notification
    emitToUser(userId.toString(), 'orderCreated', {
      orderId: newOrderId,
      orderNumber: populatedOrder?.orderNumber,
      total: populatedOrder?.total,
      status: populatedOrder?.status,
    });

    emitToAdmins('newOrder', {
      orderId: newOrderId,
      orderNumber: populatedOrder?.orderNumber,
      userId: userId.toString(),
      total: populatedOrder?.total,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Order repeated successfully',
      data: populatedOrder,
    });
  } catch (error: any) {
    if (error.message?.startsWith('PRODUCT_UNAVAILABLE:')) {
      res.status(400).json({
        error: `Product ${error.message.split(':')[1]} is no longer available`,
      });
      return;
    }
    if (error.message?.startsWith('INSUFFICIENT_STOCK:')) {
      const [, name, stock] = error.message.split(':');
      res.status(400).json({
        error: `Insufficient stock for ${name}. Available: ${stock}`,
      });
      return;
    }
    if (error.message?.startsWith('STOCK:')) {
      res.status(400).json({ error: error.message.slice('STOCK:'.length) });
      return;
    }
    console.error('Repeat order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all orders (Admin/Superadmin only)
 */
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const status = req.query.status as string | undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const userId = req.query.userId as string | undefined;
    const priority = req.query.priority as string | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;
    const isArchived = req.query.isArchived as string | undefined;
    const search = req.query.search as string | undefined;

    const query: any = {};
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      query.status = status;
    }
    if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
      query.paymentStatus = paymentStatus;
    }
    if (userId) {
      query.userId = userId;
    }
    if (priority) {
      query.priority = priority;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    if (isArchived !== undefined) {
      query.isArchived = isArchived === 'true';
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { trackingNumber: { $regex: search, $options: 'i' } },
        { internalReference: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.productId', 'name images sku')
      .populate('userId', 'name email phone')
      .populate('assignedTo', 'name email')
      .lean();

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// PHASE 9: ORDER MANAGEMENT ENHANCEMENTS
// =====================================================

const addOrderNoteSchema = Joi.object({
  content: Joi.string().trim().required().max(2000),
  type: Joi.string().valid('internal', 'customer', 'system').default('internal'),
});

const updateOrderPrioritySchema = Joi.object({
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').required(),
});

const assignOrderSchema = Joi.object({
  assignedTo: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null).required(),
});

const bulkUpdateOrdersSchema = Joi.object({
  orderIds: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).min(1).max(100).required(),
  status: Joi.string().valid(...Object.values(OrderStatus)).optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  assignedTo: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(null),
  addFlag: Joi.string().optional(),
  removeFlag: Joi.string().optional(),
});

const updateTrackingSchema = Joi.object({
  trackingNumber: Joi.string().trim().max(100).required(),
  trackingUrl: Joi.string().trim().uri().optional(),
  estimatedDelivery: Joi.date().optional(),
});

/**
 * Add note to order
 */
export const addOrderNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userName = req.user?.name || 'Unknown';
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const { error, value } = addOrderNoteSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const note = {
      content: value.content,
      type: value.type,
      createdBy: new mongoose.Types.ObjectId(userId),
      createdByName: userName,
      createdAt: new Date(),
    };

    order.notes.push(note as any);

    // Add timeline event
    order.timeline.push({
      event: 'Note added',
      description: `${value.type} note added by ${userName}`,
      type: 'note_added',
      metadata: { noteType: value.type },
      createdBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    } as any);

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('Add order note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update order priority
 */
export const updateOrderPriority = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const { error, value } = updateOrderPrioritySchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const oldPriority = order.priority;
    order.priority = value.priority;

    // Add timeline event
    order.timeline.push({
      event: 'Priority changed',
      description: `Priority changed from ${oldPriority} to ${value.priority}`,
      type: 'system',
      metadata: { oldPriority, newPriority: value.priority },
      createdBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    } as any);

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Priority updated successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('Update order priority error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Assign order to admin
 */
export const assignOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const { error, value } = assignOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Get assignee name if provided
    let assigneeName = null;
    if (value.assignedTo) {
      const assignee = await User.findById(value.assignedTo).select('name').lean();
      if (!assignee) {
        res.status(404).json({ error: 'Assignee not found' });
        return;
      }
      assigneeName = assignee.name;
    }

    order.assignedTo = value.assignedTo ? new mongoose.Types.ObjectId(value.assignedTo) : undefined;
    order.assignedToName = assigneeName || undefined;

    // Add timeline event
    order.timeline.push({
      event: value.assignedTo ? 'Order assigned' : 'Order unassigned',
      description: value.assignedTo ? `Order assigned to ${assigneeName}` : 'Order unassigned',
      type: 'system',
      metadata: { assignedTo: value.assignedTo, assigneeName },
      createdBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    } as any);

    await order.save();

    // Emit notification to assigned admin
    if (value.assignedTo) {
      emitToUser(value.assignedTo, 'orderAssigned', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        assignedBy: userId,
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order assignment updated successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('Assign order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Bulk update orders
 */
export const bulkUpdateOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { error, value } = bulkUpdateOrdersSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    const updateData: any = {};
    const timelineEvent: any = {
      event: 'Bulk update',
      description: 'Order updated via bulk operation',
      type: 'system',
      metadata: {},
      createdBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    };

    if (value.status) {
      updateData.status = value.status;
      timelineEvent.metadata.newStatus = value.status;
    }
    if (value.priority) {
      updateData.priority = value.priority;
      timelineEvent.metadata.newPriority = value.priority;
    }
    if (value.assignedTo !== undefined) {
      if (value.assignedTo) {
        const assignee = await User.findById(value.assignedTo).select('name').lean();
        updateData.assignedTo = value.assignedTo;
        updateData.assignedToName = assignee?.name;
        timelineEvent.metadata.assignedTo = value.assignedTo;
      } else {
        updateData.assignedTo = null;
        updateData.assignedToName = null;
      }
    }

    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const orderId of value.orderIds) {
      try {
        const order = await Order.findById(orderId);
        if (!order) {
          results.failed++;
          results.errors.push(`Order ${orderId} not found`);
          continue;
        }

        Object.assign(order, updateData);

        // Handle flags
        if (value.addFlag && !order.flags.includes(value.addFlag)) {
          order.flags.push(value.addFlag);
          timelineEvent.metadata.addedFlag = value.addFlag;
        }
        if (value.removeFlag) {
          order.flags = order.flags.filter((f) => f !== value.removeFlag);
          timelineEvent.metadata.removedFlag = value.removeFlag;
        }

        order.timeline.push(timelineEvent);
        await order.save();
        results.updated++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Order ${orderId}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk update completed: ${results.updated} updated, ${results.failed} failed`,
      data: results,
    });
  } catch (error: any) {
    console.error('Bulk update orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update tracking information
 */
export const updateTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const { error, value } = updateTrackingSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    const order = await Order.findById(id).populate('userId', 'name email');
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.trackingNumber = value.trackingNumber;
    if (value.trackingUrl) order.trackingUrl = value.trackingUrl;
    if (value.estimatedDelivery) order.estimatedDelivery = value.estimatedDelivery;

    // Update status to shipped if not already
    if (order.status === OrderStatus.PROCESSING) {
      order.status = OrderStatus.SHIPPED;
    }

    // Add timeline event
    order.timeline.push({
      event: 'Tracking updated',
      description: `Tracking number: ${value.trackingNumber}`,
      type: 'fulfillment',
      metadata: { trackingNumber: value.trackingNumber, trackingUrl: value.trackingUrl },
      createdBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    } as any);

    await order.save();

    // Notify customer
    emitToUser(order.userId.toString(), 'orderShipped', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      trackingNumber: value.trackingNumber,
      trackingUrl: value.trackingUrl,
      estimatedDelivery: value.estimatedDelivery,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Tracking information updated successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('Update tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Export orders
 */
export const exportOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status, format = 'json' } = req.query;

    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('items.productId', 'name sku')
      .lean();

    // Format data for export
    const exportData = orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customer: {
        name: (order.userId as any)?.name,
        email: (order.userId as any)?.email,
      },
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      shippingCost: order.shippingCost,
      priority: order.priority,
      assignedTo: order.assignedToName,
      trackingNumber: order.trackingNumber,
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        productName: (item.productId as any)?.name,
        sku: (item.productId as any)?.sku,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
    }));

    if (format === 'csv') {
      // Return CSV-ready data
      const csvData = exportData.map((order) => ({
        orderNumber: order.orderNumber,
        date: order.date,
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        priority: order.priority,
        trackingNumber: order.trackingNumber || '',
        shippingCity: order.shippingAddress.city,
        shippingCountry: order.shippingAddress.country,
        itemCount: order.items.length,
      }));

      res.status(200).json({
        success: true,
        format: 'csv',
        data: csvData,
      });
    } else {
      res.status(200).json({
        success: true,
        format: 'json',
        data: {
          exportedAt: new Date().toISOString(),
          totalOrders: exportData.length,
          orders: exportData,
        },
      });
    }
  } catch (error: any) {
    console.error('Export orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get order timeline
 */
export const getOrderTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .select('orderNumber timeline notes')
      .populate('timeline.createdBy', 'name email')
      .populate('notes.createdBy', 'name email')
      .lean();

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        timeline: order.timeline.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        notes: order.notes.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      },
    });
  } catch (error: any) {
    console.error('Get order timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Archive/unarchive order
 */
export const toggleArchiveOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.isArchived = !order.isArchived;
    await order.save();

    res.status(200).json({
      success: true,
      message: order.isArchived ? 'Order archived' : 'Order unarchived',
      data: { isArchived: order.isArchived },
    });
  } catch (error: any) {
    console.error('Toggle archive order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

