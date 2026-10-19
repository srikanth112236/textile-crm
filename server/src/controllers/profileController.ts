import { Request, Response } from 'express';
import { User, IAddress } from '../models/User';
import Joi from 'joi';

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().max(100).trim().optional(),
  phone: Joi.string().pattern(/^\+?[\d\s\-()]+$/).trim().optional().allow(''),
  avatar: Joi.string().trim().max(500).optional().allow('', null),
  measurements: Joi.object({
    heightCm: Joi.number().min(140).max(220).optional(),
    weightKg: Joi.number().min(35).max(180).optional(),
    chestIn: Joi.number().min(28).max(60).optional(),
    waistIn: Joi.number().min(22).max(60).optional(),
    hipIn: Joi.number().min(28).max(65).optional(),
    fit: Joi.string().valid('slim', 'regular', 'relaxed', 'oversized').optional(),
  }).optional(),
});

const addressSchema = Joi.object({
  street: Joi.string().max(200).trim().required(),
  city: Joi.string().max(100).trim().required(),
  state: Joi.string().max(100).trim().required(),
  zip: Joi.string().max(20).trim().required(),
  country: Joi.string().max(100).trim().required(),
  isDefault: Joi.boolean().default(false),
});

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('-password -mfaSecret');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        addresses: user.addresses,
        measurements: (user as any).measurements,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate input
    const { error, value } = updateProfileSchema.validate(req.body, {
      abortEarly: false,
    });

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

    // Update fields
    if (value.name !== undefined) user.name = value.name;
    if (value.phone !== undefined) user.phone = value.phone || undefined;
    if (value.avatar !== undefined) {
      // Convert empty string to undefined
      user.avatar = value.avatar && value.avatar.trim() !== '' ? value.avatar.trim() : undefined;
    }
    if (value.measurements !== undefined) {
      (user as any).measurements = { ...((user as any).measurements?.toObject?.() || (user as any).measurements || {}), ...value.measurements };
    }

    await user.save();

    // Return updated user (without sensitive fields)
    const updatedUser = await User.findById(userId).select('-password -mfaSecret');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser!._id,
        email: updatedUser!.email,
        role: updatedUser!.role,
        name: updatedUser!.name,
        phone: updatedUser!.phone,
        avatar: updatedUser!.avatar,
        addresses: updatedUser!.addresses,
        measurements: (updatedUser as any)!.measurements,
        mfaEnabled: updatedUser!.mfaEnabled,
        createdAt: updatedUser!.createdAt,
        updatedAt: updatedUser!.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user addresses
export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('addresses');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user.addresses,
    });
  } catch (error: any) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add address
export const addAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate input
    const { error, value } = addressSchema.validate(req.body, {
      abortEarly: false,
    });

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

    // If this is set as default, unset other defaults
    if (value.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // Add new address
    user.addresses.push(value as IAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses[user.addresses.length - 1],
    });
  } catch (error: any) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update address
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate input
    const { error, value } = addressSchema.validate(req.body, {
      abortEarly: false,
    });

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

    // Find address index
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id?.toString() === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    // If this is set as default, unset other defaults
    if (value.isDefault) {
      user.addresses.forEach((addr, index) => {
        if (index !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    // Update address
    user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...value } as IAddress;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses[addressIndex],
    });
  } catch (error: any) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete address
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find address index
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id?.toString() === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    // Remove address
    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export user data (GDPR)
export const exportUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('-password -mfaSecret');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prepare export data
    const exportData = {
      profile: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      addresses: user.addresses,
      // Add more data as needed (orders, reviews, etc. in future phases)
    };

    res.status(200).json({
      success: true,
      data: exportData,
    });
  } catch (error: any) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete account (GDPR)
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Anonymize user data instead of deleting (GDPR best practice)
    user.email = `deleted_${user._id}@deleted.local`;
    user.name = 'Deleted User';
    user.phone = undefined;
    user.avatar = undefined;
    user.addresses = [];
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    // Keep password hashed but invalidate it
    user.password = '$2a$12$deleted_account_invalid_hash';

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully. All personal data has been anonymized.',
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

