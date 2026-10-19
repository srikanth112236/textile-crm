import { Request, Response } from 'express';
import { User } from '../models/User';
import { Order, OrderStatus } from '../models/Order';
import Joi from 'joi';
import { AuditLog, AuditAction } from '../models/AuditLog';

// Configuration: Points earned per dollar spent
const POINTS_PER_DOLLAR = 1; // 1 point per $1

// Validation schema
const redeemPointsSchema = Joi.object({
  points: Joi.number().integer().min(1).required(),
});

// Get user loyalty points balance
export const getLoyaltyBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    const user = await User.findById(userId).select('loyaltyPoints loyaltyPointsHistory');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        balance: user.loyaltyPoints,
        history: user.loyaltyPointsHistory.slice(-20), // Last 20 entries
      },
    });
  } catch (error: any) {
    console.error('Get loyalty balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get full loyalty points history
export const getLoyaltyHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const user = await User.findById(userId).select('loyaltyPointsHistory');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const total = user.loyaltyPointsHistory.length;
    const history = user.loyaltyPointsHistory
      .slice()
      .reverse()
      .slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get loyalty history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Redeem points for discount
export const redeemPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    const { error, value } = redeemPointsSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.loyaltyPoints < value.points) {
      res.status(400).json({ error: 'Insufficient loyalty points' });
      return;
    }

    // Deduct points
    user.loyaltyPoints -= value.points;
    user.loyaltyPointsHistory.push({
      points: -value.points,
      reason: `Points redeemed: ${value.points} points`,
      createdAt: new Date(),
    });

    await user.save();

    // Log redemption
    await AuditLog.create({
      userId,
      action: AuditAction.LOYALTY_REDEEM,
      resource: 'loyalty',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        pointsRedeemed: value.points,
        remainingBalance: user.loyaltyPoints,
      },
      status: 'success',
    });

    // Calculate discount value (1 point = $0.01, or 100 points = $1)
    const discountValue = value.points / 100;

    res.status(200).json({
      success: true,
      message: 'Points redeemed successfully',
      data: {
        pointsRedeemed: value.points,
        discountValue,
        remainingBalance: user.loyaltyPoints,
      },
    });
  } catch (error: any) {
    console.error('Redeem points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Award points for order completion (called from order controller)
export const awardPointsForOrder = async (
  orderId: string,
  userId: string,
  orderTotal: number
): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for points award:', userId);
      return;
    }

    // Calculate points earned (round down to nearest integer)
    const pointsEarned = Math.floor(orderTotal * POINTS_PER_DOLLAR);

    if (pointsEarned > 0) {
      user.loyaltyPoints += pointsEarned;
      user.loyaltyPointsHistory.push({
        orderId: orderId as any,
        points: pointsEarned,
        reason: `Order completed: ${pointsEarned} points earned`,
        createdAt: new Date(),
      });

      await user.save();

      // Log points award
      await AuditLog.create({
        userId: userId as any,
        action: AuditAction.LOYALTY_REDEEM, // Could add LOYALTY_EARN action
        resource: 'loyalty',
        resourceId: user._id,
        details: {
          orderId,
          pointsEarned,
          orderTotal,
          newBalance: user.loyaltyPoints,
        },
        status: 'success',
      });
    }
  } catch (error: any) {
    console.error('Award points error:', error);
    // Don't throw - this is a background operation
  }
};

// Revoke points if order is cancelled (called from order controller)
export const revokePointsForOrder = async (
  orderId: string,
  userId: string
): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for points revocation:', userId);
      return;
    }

    // Find the points entry for this order
    const pointsEntry = user.loyaltyPointsHistory.find(
      (entry) => entry.orderId?.toString() === orderId && entry.points > 0
    );

    if (pointsEntry && pointsEntry.points > 0) {
      // Deduct the points
      user.loyaltyPoints = Math.max(0, user.loyaltyPoints - pointsEntry.points);

      // Add revocation entry
      user.loyaltyPointsHistory.push({
        orderId: orderId as any,
        points: -pointsEntry.points,
        reason: `Order cancelled: ${pointsEntry.points} points revoked`,
        createdAt: new Date(),
      });

      await user.save();
    }
  } catch (error: any) {
    console.error('Revoke points error:', error);
    // Don't throw - this is a background operation
  }
};

