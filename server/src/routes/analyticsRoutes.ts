import express from 'express';
import {
  getAnalytics,
  getSalesForecast,
  getCustomerLifetimeValue,
  getConversionFunnel,
  getRevenueByCategory,
  getGeographicSales,
  getCohortAnalysis,
  getProductPerformance,
  getInventoryAnalytics,
  exportAnalyticsReport,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = express.Router();

/**
 * @route POST /api/analytics/web-vitals
 * @desc Fire-and-forget Core Web Vitals beacon from storefront (no auth).
 *   Logs poor (4G-budget-busting) experiences server-side for the perf backlog.
 * @access Public
 */
router.post('/web-vitals', (req, res) => {
  try {
    const { name, value, rating, path } = req.body || {};
    if (rating === 'poor') {
      console.warn(`[web-vitals] POOR ${name}=${Math.round(value)} on ${path || '?'} — investigate for 4G budget`);
    }
  } catch {
    // never fail the beacon
  }
  res.status(204).end();
});

// All routes below require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route GET /api/analytics
 * @desc Get comprehensive analytics overview
 * @access Admin, Superadmin
 */
router.get('/', getAnalytics);

/**
 * @route GET /api/analytics/forecast
 * @desc Get sales forecast
 * @access Admin, Superadmin
 */
router.get('/forecast', getSalesForecast);

/**
 * @route GET /api/analytics/clv
 * @desc Get customer lifetime value analysis
 * @access Admin, Superadmin
 */
router.get('/clv', getCustomerLifetimeValue);

/**
 * @route GET /api/analytics/funnel
 * @desc Get conversion funnel analysis
 * @access Admin, Superadmin
 */
router.get('/funnel', getConversionFunnel);

/**
 * @route GET /api/analytics/revenue/category
 * @desc Get revenue breakdown by category
 * @access Admin, Superadmin
 */
router.get('/revenue/category', getRevenueByCategory);

/**
 * @route GET /api/analytics/geographic
 * @desc Get geographic sales distribution
 * @access Admin, Superadmin
 */
router.get('/geographic', getGeographicSales);

/**
 * @route GET /api/analytics/cohort
 * @desc Get cohort analysis (customer retention)
 * @access Admin, Superadmin
 */
router.get('/cohort', getCohortAnalysis);

/**
 * @route GET /api/analytics/products
 * @desc Get product performance analytics
 * @access Admin, Superadmin
 */
router.get('/products', getProductPerformance);

/**
 * @route GET /api/analytics/inventory
 * @desc Get inventory analytics
 * @access Admin, Superadmin
 */
router.get('/inventory', getInventoryAnalytics);

/**
 * @route GET /api/analytics/export
 * @desc Export analytics report
 * @access Admin, Superadmin
 */
router.get('/export', exportAnalyticsReport);

export default router;
