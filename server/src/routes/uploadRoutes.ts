import express from 'express';
import { uploadAvatar } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId;
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// All upload routes require authentication
router.use(authenticate);

// Avatar upload endpoint
router.post('/avatar', upload.single('image'), uploadAvatar);

// Product image upload endpoint (multiple images)
const productUploadsDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true });
}

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId;
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `product-${userId}-${uniqueSuffix}${ext}`);
  },
});

const productUpload = multer({
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

import { uploadProductImage, uploadReviewPhoto, uploadCategoryImage, uploadShopLookImage, uploadProductVideo } from '../controllers/uploadController';
router.post('/product', productUpload.single('image'), uploadProductImage);

// Product video upload (PDP floating player). Kept separate from images so
// the image filter stays strict while videos get a bigger size budget.
const videoFileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'));
  }
};

const productVideoUpload = multer({
  storage: productStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: videoFileFilter,
});

router.post('/product-video', productVideoUpload.single('video'), uploadProductVideo);

// Phase 8: Review photo upload (uses same storage as product images for now)
router.post('/review', productUpload.single('image'), uploadReviewPhoto);

// Category image upload (parent + sub-category hero images)
const categoryUploadsDir = path.join(__dirname, '../../uploads/categories');
if (!fs.existsSync(categoryUploadsDir)) {
  fs.mkdirSync(categoryUploadsDir, { recursive: true });
}

const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, categoryUploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId;
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `category-${userId}-${uniqueSuffix}${ext}`);
  },
});

const categoryUpload = multer({
  storage: categoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

router.post('/category', categoryUpload.single('image'), uploadCategoryImage);

// Shop the Look hero images
const shopLookUploadsDir = path.join(__dirname, '../../uploads/shoplooks');
if (!fs.existsSync(shopLookUploadsDir)) {
  fs.mkdirSync(shopLookUploadsDir, { recursive: true });
}

const shopLookStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, shopLookUploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId;
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `shoplook-${userId}-${uniqueSuffix}${ext}`);
  },
});

const shopLookUpload = multer({
  storage: shopLookStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

router.post('/shoplook', shopLookUpload.single('image'), uploadShopLookImage);

export default router;

