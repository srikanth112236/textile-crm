import { Request, Response } from 'express';
import { User } from '../models/User';
import Joi from 'joi';
import { UserRole } from '../types/roles';

// Validation schema for creating admin
const createAdminSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().max(100).trim().optional(),
});

// Create admin user (Superadmin only)
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = createAdminSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const { email, password, name } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Create admin user (only admins can be created, not superadmins)
    const user = new User({
      email,
      password, // Will be hashed by pre-save hook
      role: UserRole.ADMIN,
      name: name || undefined,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users (Superadmin only)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      role,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (role && (role === UserRole.ADMIN || role === UserRole.USER || role === UserRole.SUPERADMIN)) {
      filter.role = role;
    }

    if (search && typeof search === 'string') {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password -mfaSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

