import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductFilters,
  getRecommendations,
  submitReview,
  getReviews,
  voteReviewHelpful,
  moderateReview,
  getPersonalizedRecommendations,
  getRecentlyViewed,
  getTrendingProducts,
  getAllReviews,
  getFeaturedReviews,
  replyToReview,
  toggleReviewVisibility,
  toggleReviewFlag,
  deleteReview,
  // Advanced variant endpoints
  generateVariantCombinations,
  validateVariantSKUs,
  bulkUpdateVariantStock,
  getProductVariants,
  duplicateProduct,
} from '../controllers/productController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/filters', getProductFilters);
router.get('/reviews/featured', getFeaturedReviews);
// Get single product - optionally authenticated (for admin/superadmin to see drafts)
router.get('/:id', optionalAuthenticate, getProduct);
// Get recommendations
router.get('/:id/recommendations', optionalAuthenticate, getRecommendations);
// Get reviews - optionally authenticated (allows admin to see hidden reviews)
router.get('/:id/reviews', optionalAuthenticate, getReviews);

// Phase 8: Personalized recommendations routes
router.get('/recommendations/personalized', authenticate, getPersonalizedRecommendations);
router.get('/recommendations/recently-viewed', authenticate, getRecentlyViewed);
router.get('/recommendations/trending', getTrendingProducts);

// Protected routes (Admin/Superadmin only - requireAdmin includes both)
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);
router.post('/:id/duplicate', authenticate, requireAdmin, duplicateProduct);

// Advanced Variant Routes (Admin only)
router.post('/variants/generate', authenticate, requireAdmin, generateVariantCombinations);
router.post('/variants/validate', authenticate, requireAdmin, validateVariantSKUs);
router.get('/:id/variants', authenticate, requireAdmin, getProductVariants);
router.put('/:id/variants/bulk-stock', authenticate, requireAdmin, bulkUpdateVariantStock);

// User routes (authenticated users)
router.post('/:id/reviews', authenticate, submitReview);
router.post('/:id/reviews/:reviewId/helpful', authenticate, voteReviewHelpful);

// Admin routes (review moderation)
router.get('/reviews/all', authenticate, requireAdmin, getAllReviews);
router.post('/:id/reviews/:reviewId/moderate', authenticate, requireAdmin, moderateReview);
router.post('/:id/reviews/:reviewId/reply', authenticate, requireAdmin, replyToReview);
router.post('/:id/reviews/:reviewId/hide', authenticate, requireAdmin, toggleReviewVisibility);
router.post('/:id/reviews/:reviewId/flag', authenticate, requireAdmin, toggleReviewFlag);
router.delete('/:id/reviews/:reviewId', authenticate, requireAdmin, deleteReview);

export default router;

