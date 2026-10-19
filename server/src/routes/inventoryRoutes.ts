import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  // Warehouse CRUD
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  // Stock management
  getProductStock,
  adjustStock,
  transferStock,
  bulkStockUpdate,
  // Stock movements
  getStockMovements,
  getStockMovement,
  // Stock analytics
  getLowStockAlerts,
  getStockForecast,
} from '../controllers/inventoryController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// WAREHOUSE ROUTES (Admin/Superadmin only)
// =====================================================

/**
 * @route GET /api/inventory/warehouses
 * @desc Get all warehouses
 * @access Admin, Superadmin
 */
router.get(
  '/warehouses',
  requireRole('admin', 'superadmin'),
  getWarehouses
);

/**
 * @route GET /api/inventory/warehouses/:id
 * @desc Get single warehouse
 * @access Admin, Superadmin
 */
router.get(
  '/warehouses/:id',
  requireRole('admin', 'superadmin'),
  getWarehouse
);

/**
 * @route POST /api/inventory/warehouses
 * @desc Create warehouse
 * @access Superadmin only
 */
router.post(
  '/warehouses',
  requireRole('superadmin'),
  createWarehouse
);

/**
 * @route PUT /api/inventory/warehouses/:id
 * @desc Update warehouse
 * @access Admin, Superadmin
 */
router.put(
  '/warehouses/:id',
  requireRole('admin', 'superadmin'),
  updateWarehouse
);

/**
 * @route DELETE /api/inventory/warehouses/:id
 * @desc Delete warehouse
 * @access Superadmin only
 */
router.delete(
  '/warehouses/:id',
  requireRole('superadmin'),
  deleteWarehouse
);

// =====================================================
// STOCK MANAGEMENT ROUTES
// =====================================================

/**
 * @route GET /api/inventory/stock/:productId
 * @desc Get stock levels for a product across all warehouses
 * @access Admin, Superadmin
 */
router.get(
  '/stock/:productId',
  requireRole('admin', 'superadmin'),
  getProductStock
);

/**
 * @route POST /api/inventory/warehouses/:id/stock
 * @desc Adjust stock in a warehouse
 * @access Admin, Superadmin
 */
router.post(
  '/warehouses/:id/stock',
  requireRole('admin', 'superadmin'),
  adjustStock
);

/**
 * @route POST /api/inventory/transfer
 * @desc Transfer stock between warehouses
 * @access Admin, Superadmin
 */
router.post(
  '/transfer',
  requireRole('admin', 'superadmin'),
  transferStock
);

/**
 * @route POST /api/inventory/bulk-update
 * @desc Bulk update stock across warehouses
 * @access Admin, Superadmin
 */
router.post(
  '/bulk-update',
  requireRole('admin', 'superadmin'),
  bulkStockUpdate
);

// =====================================================
// STOCK MOVEMENT HISTORY ROUTES
// =====================================================

/**
 * @route GET /api/inventory/movements
 * @desc Get stock movement history
 * @access Admin, Superadmin
 */
router.get(
  '/movements',
  requireRole('admin', 'superadmin'),
  getStockMovements
);

/**
 * @route GET /api/inventory/movements/:id
 * @desc Get single stock movement
 * @access Admin, Superadmin
 */
router.get(
  '/movements/:id',
  requireRole('admin', 'superadmin'),
  getStockMovement
);

// =====================================================
// STOCK ANALYTICS ROUTES
// =====================================================

/**
 * @route GET /api/inventory/alerts
 * @desc Get low stock alerts
 * @access Admin, Superadmin
 */
router.get(
  '/alerts',
  requireRole('admin', 'superadmin'),
  getLowStockAlerts
);

/**
 * @route GET /api/inventory/forecast
 * @desc Get stock forecast for a product
 * @access Admin, Superadmin
 */
router.get(
  '/forecast',
  requireRole('admin', 'superadmin'),
  getStockForecast
);

export default router;

