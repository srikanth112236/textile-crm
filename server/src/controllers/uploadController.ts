import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { CustomError } from '../middleware/errorHandler';

// Delete old avatar file
const deleteOldAvatar = (avatarUrl: string): void => {
  if (!avatarUrl || !avatarUrl.includes('/uploads/avatars/')) {
    return;
  }

  try {
    const filename = path.basename(avatarUrl);
    const filePath = path.join(__dirname, '../../uploads/avatars', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting old avatar:', error);
    // Don't throw - deletion of old file is not critical
  }
};

// Upload avatar
export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new CustomError('No image file provided', 400);
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    // Get the uploaded file path
    const filePath = req.file.path;
    const filename = req.file.filename;
    
    // Generate URL for the uploaded image
    // In production, this should be a CDN URL or static file server URL
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/avatars/${filename}`;

    // If user has an existing avatar, delete it
    const { User } = await import('../models/User');
    const user = await User.findById(userId);
    if (user?.avatar && user.avatar.includes('/uploads/avatars/')) {
      deleteOldAvatar(user.avatar);
    }

    // Update user's avatar URL in database
    await User.findByIdAndUpdate(userId, { avatar: imageUrl });

    res.status(200).json({
      success: true,
      imageUrl,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    next(error);
  }
};

// Upload product image
export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new CustomError('No image file provided', 400);
    }

    // Generate URL for the uploaded image
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

    res.status(200).json({
      success: true,
      imageUrl,
      url: imageUrl, // Also return as 'url' for consistency
      message: 'Product image uploaded successfully',
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    next(error);
  }
};

// Phase 8: Upload review photo
export const uploadReviewPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new CustomError('No image file provided', 400);
    }

    // Generate URL for the uploaded image
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

    res.status(200).json({
      success: true,
      imageUrl,
      url: imageUrl, // Return as 'url' for review photos
      message: 'Review photo uploaded successfully',
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    next(error);
  }
};

