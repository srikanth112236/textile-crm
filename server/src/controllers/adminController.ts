import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
import Joi from 'joi';
import { UserRole } from '../types/roles';

// Validation schemas
const updateUserSchema = Joi.object({
  name: Joi.string().max(100).trim().optional(),
  phone: Joi.string().trim().optional().allow(''),
  role: Joi.string().valid(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.USER).optional(),
  isBanned: Joi.boolean().optional(),
  bannedReason: Joi.string().max(500).trim().optional().allow(''),
});

const banUserSchema = Joi.object({
  reason: Joi.string().max(500).trim().required(),
});

// Get all users (Admin/Superadmin only)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      role,
      search,
      isBanned,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (role && (role === UserRole.ADMIN || role === UserRole.USER || role === UserRole.SUPERADMIN)) {
      filter.role = role;
    }

    if (isBanned === 'true') {
      filter.isBanned = true;
    } else if (isBanned === 'false') {
      filter.isBanned = false;
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

// Get single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -mfaSecret').lean();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user (Admin/Superadmin only)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id; // Admin performing the action

    // Validate input
    const { error, value } = updateUserSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent modifying superadmin (only superadmin can modify superadmin)
    if (user.role === UserRole.SUPERADMIN && (req as any).user?.role !== UserRole.SUPERADMIN) {
      res.status(403).json({ error: 'Cannot modify superadmin user' });
      return;
    }

    // Prevent promoting to superadmin (only existing superadmin can do this)
    if (value.role === UserRole.SUPERADMIN && (req as any).user?.role !== UserRole.SUPERADMIN) {
      res.status(403).json({ error: 'Cannot assign superadmin role' });
      return;
    }

    // Track changes for audit log
    const changes: any = {};
    if (value.name !== undefined && value.name !== user.name) {
      changes.name = { old: user.name, new: value.name };
      user.name = value.name;
    }
    if (value.phone !== undefined && value.phone !== user.phone) {
      changes.phone = { old: user.phone, new: value.phone };
      user.phone = value.phone;
    }
    if (value.role !== undefined && value.role !== user.role) {
      changes.role = { old: user.role, new: value.role };
      user.role = value.role;
    }
    if (value.isBanned !== undefined) {
      const wasBanned = user.isBanned;
      user.isBanned = value.isBanned;
      if (value.isBanned && !wasBanned) {
        user.bannedAt = new Date();
        user.bannedReason = value.bannedReason || 'Violation of terms of service';
        
        // Log ban action
        await AuditLog.create({
          userId: userId ? userId : undefined,
          action: AuditAction.USER_BAN,
          resource: 'user',
          resourceId: user._id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: {
            reason: user.bannedReason,
            changes,
          },
          status: 'success',
        });
      } else if (!value.isBanned && wasBanned) {
        user.bannedAt = undefined;
        user.bannedReason = undefined;
        
        // Log unban action
        await AuditLog.create({
          userId: userId ? userId : undefined,
          action: AuditAction.USER_UNBAN,
          resource: 'user',
          resourceId: user._id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { changes },
          status: 'success',
        });
      }
    }

    await user.save();

    // Log update if role changed
    if (changes.role) {
      await AuditLog.create({
        userId: userId ? userId : undefined,
        action: AuditAction.ROLE_CHANGE,
        resource: 'user',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: changes,
        status: 'success',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isBanned: user.isBanned,
      },
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Ban user
export const banUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const { error, value } = banUserSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.role === UserRole.SUPERADMIN) {
      res.status(403).json({ error: 'Cannot ban superadmin user' });
      return;
    }

    user.isBanned = true;
    user.bannedAt = new Date();
    user.bannedReason = value.reason;
    await user.save();

    // Log ban action
    await AuditLog.create({
      userId: userId ? userId : undefined,
      action: AuditAction.USER_BAN,
      resource: 'user',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { reason: value.reason },
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: 'User banned successfully',
    });
  } catch (error: any) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Unban user
export const unbanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isBanned = false;
    user.bannedAt = undefined;
    user.bannedReason = undefined;
    await user.save();

    // Log unban action
    await AuditLog.create({
      userId: userId ? userId : undefined,
      action: AuditAction.USER_UNBAN,
      resource: 'user',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {},
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: 'User unbanned successfully',
    });
  } catch (error: any) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get audit logs
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      userId,
      action,
      resource,
      resourceId,
      status,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (userId) {
      filter.userId = userId;
    }
    if (action) {
      filter.action = action;
    }
    if (resource) {
      filter.resource = resource;
    }
    if (resourceId) {
      filter.resourceId = resourceId;
    }
    if (status && (status === 'success' || status === 'failed')) {
      filter.status = status;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'email name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all permissions
export const getPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    let permissions = await Permission.find().sort({ resource: 1, action: 1 }).lean();

    // If no permissions exist, initialize default permissions
    if (permissions.length === 0) {
      const defaultPermissions = [
        // Products
        { name: 'products.create', resource: 'products', action: 'create', description: 'Create products' },
        { name: 'products.read', resource: 'products', action: 'read', description: 'View products' },
        { name: 'products.update', resource: 'products', action: 'update', description: 'Update products' },
        { name: 'products.delete', resource: 'products', action: 'delete', description: 'Delete products' },
        { name: 'products.manage', resource: 'products', action: 'manage', description: 'Full product management' },
        // Orders
        { name: 'orders.create', resource: 'orders', action: 'create', description: 'Create orders' },
        { name: 'orders.read', resource: 'orders', action: 'read', description: 'View orders' },
        { name: 'orders.update', resource: 'orders', action: 'update', description: 'Update orders' },
        { name: 'orders.delete', resource: 'orders', action: 'delete', description: 'Delete orders' },
        { name: 'orders.manage', resource: 'orders', action: 'manage', description: 'Full order management' },
        // Users
        { name: 'users.create', resource: 'users', action: 'create', description: 'Create users' },
        { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
        { name: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
        { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
        { name: 'users.manage', resource: 'users', action: 'manage', description: 'Full user management' },
        // Categories
        { name: 'categories.create', resource: 'categories', action: 'create', description: 'Create categories' },
        { name: 'categories.read', resource: 'categories', action: 'read', description: 'View categories' },
        { name: 'categories.update', resource: 'categories', action: 'update', description: 'Update categories' },
        { name: 'categories.delete', resource: 'categories', action: 'delete', description: 'Delete categories' },
        { name: 'categories.manage', resource: 'categories', action: 'manage', description: 'Full category management' },
        // Discounts
        { name: 'discounts.create', resource: 'discounts', action: 'create', description: 'Create discounts' },
        { name: 'discounts.read', resource: 'discounts', action: 'read', description: 'View discounts' },
        { name: 'discounts.update', resource: 'discounts', action: 'update', description: 'Update discounts' },
        { name: 'discounts.delete', resource: 'discounts', action: 'delete', description: 'Delete discounts' },
        { name: 'discounts.manage', resource: 'discounts', action: 'manage', description: 'Full discount management' },
        // Loyalty
        { name: 'loyalty.read', resource: 'loyalty', action: 'read', description: 'View loyalty points' },
        { name: 'loyalty.manage', resource: 'loyalty', action: 'manage', description: 'Manage loyalty points' },
        // Analytics
        { name: 'analytics.read', resource: 'analytics', action: 'read', description: 'View analytics' },
        // Settings
        { name: 'settings.read', resource: 'settings', action: 'read', description: 'View settings' },
        { name: 'settings.update', resource: 'settings', action: 'update', description: 'Update settings' },
        { name: 'settings.manage', resource: 'settings', action: 'manage', description: 'Full settings management' },
      ];

      // Insert default permissions
      await Permission.insertMany(defaultPermissions);
      
      // Fetch the newly created permissions
      permissions = await Permission.find().sort({ resource: 1, action: 1 }).lean();
    }

    res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create permission (Superadmin only)
export const createPermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      name: Joi.string().trim().lowercase().required(),
      resource: Joi.string()
        .valid(
          'products',
          'orders',
          'users',
          'categories',
          'discounts',
          'loyalty',
          'analytics',
          'settings'
        )
        .required(),
      action: Joi.string().valid('create', 'read', 'update', 'delete', 'manage').required(),
      description: Joi.string().max(500).trim().optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    const permission = new Permission(value);
    await permission.save();

    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: permission,
    });
  } catch (error: any) {
    console.error('Create permission error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Permission already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update role permissions (Superadmin only)
export const updateRolePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;
    const schema = Joi.object({
      permissionIds: Joi.array().items(Joi.string().hex().length(24)).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
      return;
    }

    // Verify permissions exist
    const permissions = await Permission.find({
      _id: { $in: value.permissionIds },
    });

    if (permissions.length !== value.permissionIds.length) {
      res.status(400).json({ error: 'One or more permissions not found' });
      return;
    }

    const role = await Role.findById(roleId);
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    role.permissions = permissions.map((p) => p.name);
    await role.save();

    // Log permission change
    const userId = (req as any).user?.id;
    await AuditLog.create({
      userId: userId ? userId : undefined,
      action: AuditAction.PERMISSION_CHANGE,
      resource: 'role',
      resourceId: role._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        permissions: role.permissions,
      },
      status: 'success',
    });

    res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully',
      data: role,
    });
  } catch (error: any) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

