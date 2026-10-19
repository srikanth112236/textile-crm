import { Request, Response } from 'express';
import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Warehouse } from '../models/Warehouse';
import { StockMovement, StockMovementType } from '../models/StockMovement';
import mongoose from 'mongoose';

// =====================================================
// MAIN ANALYTICS ENDPOINT
// =====================================================

/**
 * Get comprehensive analytics data
 */
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    // Get all confirmed orders
    const allOrders = await Order.find({
      paymentStatus: PaymentStatus.CONFIRMED,
    }).lean();

    // Calculate total revenue
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Revenue by period
    const revenueToday = allOrders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= todayStart && orderDate <= todayEnd;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const revenueThisMonth = allOrders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= thisMonthStart;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const revenueLastMonth = allOrders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const revenueThisYear = allOrders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= thisYearStart;
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);

    // Orders statistics
    const totalOrders = allOrders.length;
    const ordersToday = allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= todayStart && orderDate <= todayEnd;
    }).length;

    const ordersThisMonth = allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= thisMonthStart;
    }).length;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by status
    const ordersByStatus = {
      pending: await Order.countDocuments({ status: OrderStatus.PENDING }),
      processing: await Order.countDocuments({ status: OrderStatus.PROCESSING }),
      shipped: await Order.countDocuments({ status: OrderStatus.SHIPPED }),
      delivered: await Order.countDocuments({ status: OrderStatus.DELIVERED }),
      cancelled: await Order.countDocuments({ status: OrderStatus.CANCELLED }),
      refunded: await Order.countDocuments({ status: OrderStatus.REFUNDED }),
    };

    // User statistics
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonthStart },
    });

    // Product statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const lowStockProducts = await Product.countDocuments({ stock: { $lte: 10 } });

    // Recent orders (last 10)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'email name')
      .lean();

    // Revenue growth (month over month)
    const revenueGrowth = revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

    // Order growth
    const ordersLastMonth = allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
    }).length;
    const orderGrowth = ordersLastMonth > 0
      ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
      : 0;

    // Top products (by quantity sold)
    const productSales = await Order.aggregate([
      { $match: { paymentStatus: PaymentStatus.CONFIRMED } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          totalUsers,
          totalProducts,
        },
        revenue: {
          total: totalRevenue,
          today: revenueToday,
          thisMonth: revenueThisMonth,
          lastMonth: revenueLastMonth,
          thisYear: revenueThisYear,
          growth: revenueGrowth,
        },
        orders: {
          total: totalOrders,
          today: ordersToday,
          thisMonth: ordersThisMonth,
          averageValue: averageOrderValue,
          growth: orderGrowth,
          byStatus: ordersByStatus,
        },
        users: {
          total: totalUsers,
          admins: totalAdmins,
          regular: totalUsers - totalAdmins,
          thisMonth: usersThisMonth,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
          topSelling: productSales,
        },
        recentOrders,
      },
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// SALES FORECASTING
// =====================================================

/**
 * Get sales forecast based on historical data
 */
export const getSalesForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const historicalDays = parseInt(days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historicalDays);

    // Get daily sales data
    const dailySales = await Order.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.CONFIRMED,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Calculate average daily revenue and orders
    const avgDailyRevenue = dailySales.reduce((sum, d) => sum + d.totalRevenue, 0) / Math.max(dailySales.length, 1);
    const avgDailyOrders = dailySales.reduce((sum, d) => sum + d.orderCount, 0) / Math.max(dailySales.length, 1);

    // Simple trend calculation (linear regression)
    const n = dailySales.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    dailySales.forEach((d, i) => {
      sumX += i;
      sumY += d.totalRevenue;
      sumXY += i * d.totalRevenue;
      sumX2 += i * i;
    });

    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
    const intercept = n > 0 ? (sumY - slope * sumX) / n : avgDailyRevenue;

    // Generate forecast for next 30 days
    const forecast: any[] = [];
    for (let i = 1; i <= 30; i++) {
      const projectedRevenue = Math.max(0, intercept + slope * (n + i - 1));
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        day: i,
        date: date.toISOString().split('T')[0],
        projectedRevenue: Math.round(projectedRevenue * 100) / 100,
        projectedOrders: Math.round(projectedRevenue / (avgDailyRevenue / avgDailyOrders) || 0),
      });
    }

    // Calculate totals
    const projectedMonthlyRevenue = forecast.reduce((sum, f) => sum + f.projectedRevenue, 0);
    const projectedMonthlyOrders = forecast.reduce((sum, f) => sum + f.projectedOrders, 0);

    res.status(200).json({
      success: true,
      data: {
        historicalDays,
        avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
        avgDailyOrders: Math.round(avgDailyOrders * 10) / 10,
        trend: slope > 0 ? 'growing' : slope < 0 ? 'declining' : 'stable',
        trendPercentage: avgDailyRevenue > 0 ? Math.round((slope / avgDailyRevenue) * 100 * 100) / 100 : 0,
        forecast,
        projectedMonthlyRevenue: Math.round(projectedMonthlyRevenue * 100) / 100,
        projectedMonthlyOrders: Math.round(projectedMonthlyOrders),
        historicalData: dailySales.map((d) => ({
          date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
          revenue: d.totalRevenue,
          orders: d.orderCount,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get sales forecast error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// CUSTOMER LIFETIME VALUE (CLV)
// =====================================================

/**
 * Get customer lifetime value analysis
 */
export const getCustomerLifetimeValue = async (req: Request, res: Response): Promise<void> => {
  try {
    // Calculate CLV for each customer
    const customerStats = await Order.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.CONFIRMED,
        },
      },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' },
          avgOrderValue: { $avg: '$total' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          email: '$user.email',
          name: '$user.name',
          totalSpent: 1,
          orderCount: 1,
          firstOrder: 1,
          lastOrder: 1,
          avgOrderValue: 1,
          daysSinceFirstOrder: {
            $divide: [
              { $subtract: [new Date(), '$firstOrder'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      { $sort: { totalSpent: -1 } },
    ]);

    // Calculate CLV metrics
    const totalCustomers = customerStats.length;
    const avgCLV = totalCustomers > 0
      ? customerStats.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers
      : 0;

    // Segment customers
    const segments = {
      vip: customerStats.filter((c) => c.totalSpent >= avgCLV * 2),
      regular: customerStats.filter((c) => c.totalSpent >= avgCLV * 0.5 && c.totalSpent < avgCLV * 2),
      lowValue: customerStats.filter((c) => c.totalSpent < avgCLV * 0.5),
    };

    // Top 20 customers
    const topCustomers = customerStats.slice(0, 20).map((c) => ({
      userId: c.userId,
      email: c.email,
      name: c.name,
      totalSpent: Math.round(c.totalSpent * 100) / 100,
      orderCount: c.orderCount,
      avgOrderValue: Math.round(c.avgOrderValue * 100) / 100,
      customerSince: c.firstOrder,
      lastOrderDate: c.lastOrder,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        avgCLV: Math.round(avgCLV * 100) / 100,
        segments: {
          vip: {
            count: segments.vip.length,
            percentage: Math.round((segments.vip.length / totalCustomers) * 100 * 10) / 10,
            totalRevenue: Math.round(segments.vip.reduce((sum, c) => sum + c.totalSpent, 0) * 100) / 100,
          },
          regular: {
            count: segments.regular.length,
            percentage: Math.round((segments.regular.length / totalCustomers) * 100 * 10) / 10,
            totalRevenue: Math.round(segments.regular.reduce((sum, c) => sum + c.totalSpent, 0) * 100) / 100,
          },
          lowValue: {
            count: segments.lowValue.length,
            percentage: Math.round((segments.lowValue.length / totalCustomers) * 100 * 10) / 10,
            totalRevenue: Math.round(segments.lowValue.reduce((sum, c) => sum + c.totalSpent, 0) * 100) / 100,
          },
        },
        topCustomers,
      },
    });
  } catch (error: any) {
    console.error('Get CLV error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// CONVERSION FUNNEL
// =====================================================

/**
 * Get conversion funnel analysis
 */
export const getConversionFunnel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    // Get counts for each stage
    const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
    
    // Users who added to cart (have cart items)
    const usersWithCart = await mongoose.model('Cart').countDocuments({
      updatedAt: { $gte: startDate },
      'items.0': { $exists: true },
    });

    // Users who started checkout (pending orders)
    const checkoutStarted = await Order.countDocuments({
      createdAt: { $gte: startDate },
      status: { $in: [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
    });

    // Users who completed purchase
    const purchaseCompleted = await Order.countDocuments({
      createdAt: { $gte: startDate },
      paymentStatus: PaymentStatus.CONFIRMED,
    });

    // Repeat customers
    const repeatCustomers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: PaymentStatus.CONFIRMED,
        },
      },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
        },
      },
      {
        $match: {
          orderCount: { $gt: 1 },
        },
      },
    ]);

    const funnel = [
      { stage: 'Registered Users', count: totalUsers, percentage: 100 },
      {
        stage: 'Added to Cart',
        count: usersWithCart,
        percentage: totalUsers > 0 ? Math.round((usersWithCart / totalUsers) * 100 * 10) / 10 : 0,
      },
      {
        stage: 'Checkout Started',
        count: checkoutStarted,
        percentage: totalUsers > 0 ? Math.round((checkoutStarted / totalUsers) * 100 * 10) / 10 : 0,
      },
      {
        stage: 'Purchase Completed',
        count: purchaseCompleted,
        percentage: totalUsers > 0 ? Math.round((purchaseCompleted / totalUsers) * 100 * 10) / 10 : 0,
      },
      {
        stage: 'Repeat Customers',
        count: repeatCustomers.length,
        percentage: totalUsers > 0 ? Math.round((repeatCustomers.length / totalUsers) * 100 * 10) / 10 : 0,
      },
    ];

    // Calculate drop-off rates
    const dropOffRates = [];
    for (let i = 1; i < funnel.length; i++) {
      const prevCount = funnel[i - 1].count;
      const currCount = funnel[i].count;
      dropOffRates.push({
        from: funnel[i - 1].stage,
        to: funnel[i].stage,
        dropOffRate: prevCount > 0 ? Math.round(((prevCount - currCount) / prevCount) * 100 * 10) / 10 : 0,
        conversionRate: prevCount > 0 ? Math.round((currCount / prevCount) * 100 * 10) / 10 : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: `Last ${days} days`,
        funnel,
        dropOffRates,
        overallConversionRate: totalUsers > 0 ? Math.round((purchaseCompleted / totalUsers) * 100 * 10) / 10 : 0,
      },
    });
  } catch (error: any) {
    console.error('Get conversion funnel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// REVENUE BY CATEGORY
// =====================================================

/**
 * Get revenue breakdown by category
 */
export const getRevenueByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage: any = {
      paymentStatus: PaymentStatus.CONFIRMED,
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
    }

    const revenueByCategory = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product.category',
          categoryName: { $first: '$category.name' },
          totalRevenue: { $sum: '$items.subtotal' },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          categoryId: '$_id',
          categoryName: { $ifNull: ['$categoryName', 'Uncategorized'] },
          totalRevenue: 1,
          totalQuantity: 1,
          orderCount: { $size: '$orderCount' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const totalRevenue = revenueByCategory.reduce((sum, c) => sum + c.totalRevenue, 0);

    const categoriesWithPercentage = revenueByCategory.map((c) => ({
      ...c,
      percentage: totalRevenue > 0 ? Math.round((c.totalRevenue / totalRevenue) * 100 * 10) / 10 : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        categories: categoriesWithPercentage,
      },
    });
  } catch (error: any) {
    console.error('Get revenue by category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// GEOGRAPHIC SALES DISTRIBUTION
// =====================================================

/**
 * Get geographic sales distribution
 */
export const getGeographicSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesByLocation = await Order.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.CONFIRMED,
        },
      },
      {
        $group: {
          _id: {
            country: '$shippingAddress.country',
            state: '$shippingAddress.state',
          },
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Aggregate by country
    const salesByCountry: { [key: string]: any } = {};
    salesByLocation.forEach((loc) => {
      const country = loc._id.country || 'Unknown';
      if (!salesByCountry[country]) {
        salesByCountry[country] = {
          country,
          totalRevenue: 0,
          orderCount: 0,
          states: [],
        };
      }
      salesByCountry[country].totalRevenue += loc.totalRevenue;
      salesByCountry[country].orderCount += loc.orderCount;
      salesByCountry[country].states.push({
        state: loc._id.state,
        revenue: loc.totalRevenue,
        orders: loc.orderCount,
      });
    });

    const countryData = Object.values(salesByCountry)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .map((c: any) => ({
        ...c,
        totalRevenue: Math.round(c.totalRevenue * 100) / 100,
        states: c.states.slice(0, 10), // Top 10 states per country
      }));

    res.status(200).json({
      success: true,
      data: {
        countries: countryData,
        topLocations: salesByLocation.slice(0, 20).map((loc) => ({
          country: loc._id.country,
          state: loc._id.state,
          revenue: Math.round(loc.totalRevenue * 100) / 100,
          orders: loc.orderCount,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get geographic sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// COHORT ANALYSIS
// =====================================================

/**
 * Get cohort analysis (customer retention over time)
 */
export const getCohortAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = 6 } = req.query;
    const numMonths = parseInt(months as string) || 6;

    // Get all users with their first order month
    const userCohorts = await Order.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.CONFIRMED,
        },
      },
      {
        $group: {
          _id: '$userId',
          firstOrderDate: { $min: '$createdAt' },
          orders: {
            $push: {
              date: '$createdAt',
              total: '$total',
            },
          },
        },
      },
      {
        $project: {
          userId: '$_id',
          cohortMonth: {
            $dateToString: { format: '%Y-%m', date: '$firstOrderDate' },
          },
          orders: 1,
        },
      },
    ]);

    // Build cohort matrix
    const cohortMap: { [key: string]: { [key: number]: Set<string> } } = {};
    
    userCohorts.forEach((user) => {
      const cohortMonth = user.cohortMonth;
      if (!cohortMap[cohortMonth]) {
        cohortMap[cohortMonth] = {};
        for (let i = 0; i <= numMonths; i++) {
          cohortMap[cohortMonth][i] = new Set();
        }
      }

      user.orders.forEach((order: any) => {
        const orderMonth = new Date(order.date);
        const cohortDate = new Date(cohortMonth + '-01');
        const monthsDiff = (orderMonth.getFullYear() - cohortDate.getFullYear()) * 12 +
          (orderMonth.getMonth() - cohortDate.getMonth());
        
        if (monthsDiff >= 0 && monthsDiff <= numMonths) {
          cohortMap[cohortMonth][monthsDiff].add(user.userId.toString());
        }
      });
    });

    // Format cohort data
    const cohortData = Object.keys(cohortMap)
      .sort()
      .slice(-numMonths)
      .map((cohortMonth) => {
        const cohort = cohortMap[cohortMonth];
        const baseSize = cohort[0]?.size || 0;
        
        const retention: number[] = [];
        for (let i = 0; i <= numMonths; i++) {
          const activeUsers = cohort[i]?.size || 0;
          retention.push(baseSize > 0 ? Math.round((activeUsers / baseSize) * 100) : 0);
        }

        return {
          cohort: cohortMonth,
          baseSize,
          retention,
        };
      });

    res.status(200).json({
      success: true,
      data: {
        months: numMonths,
        cohorts: cohortData,
        columns: ['Month 0', ...Array.from({ length: numMonths }, (_, i) => `Month ${i + 1}`)],
      },
    });
  } catch (error: any) {
    console.error('Get cohort analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// PRODUCT PERFORMANCE
// =====================================================

/**
 * Get product performance analytics
 */
export const getProductPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, sortBy = 'revenue' } = req.query;
    const numLimit = parseInt(limit as string) || 50;

    const productStats = await Order.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.CONFIRMED,
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalRevenue: { $sum: '$items.subtotal' },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $addToSet: '$_id' },
          avgPrice: { $avg: '$items.price' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          sku: '$product.sku',
          currentStock: '$product.stock',
          currentPrice: '$product.price',
          totalRevenue: 1,
          totalQuantity: 1,
          orderCount: { $size: '$orderCount' },
          avgPrice: 1,
          status: '$product.status',
        },
      },
      {
        $sort: sortBy === 'quantity' ? { totalQuantity: -1 } : { totalRevenue: -1 },
      },
      { $limit: numLimit },
    ]);

    // Calculate additional metrics
    const productsWithMetrics = productStats.map((p) => ({
      ...p,
      totalRevenue: Math.round(p.totalRevenue * 100) / 100,
      avgPrice: Math.round(p.avgPrice * 100) / 100,
      avgOrderValue: p.orderCount > 0 ? Math.round((p.totalRevenue / p.orderCount) * 100) / 100 : 0,
      stockTurnover: p.currentStock > 0 ? Math.round((p.totalQuantity / p.currentStock) * 100) / 100 : null,
    }));

    // Summary stats
    const totalRevenue = productsWithMetrics.reduce((sum, p) => sum + p.totalRevenue, 0);
    const topPerformers = productsWithMetrics.slice(0, 5);
    const worstPerformers = [...productsWithMetrics].sort((a, b) => a.totalRevenue - b.totalRevenue).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        products: productsWithMetrics,
        summary: {
          totalProducts: productsWithMetrics.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          topPerformers: topPerformers.map((p) => ({ name: p.name, revenue: p.totalRevenue })),
          worstPerformers: worstPerformers.map((p) => ({ name: p.name, revenue: p.totalRevenue })),
        },
      },
    });
  } catch (error: any) {
    console.error('Get product performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// INVENTORY ANALYTICS
// =====================================================

/**
 * Get inventory analytics
 */
export const getInventoryAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get warehouse stats
    const warehouses = await Warehouse.find({ isActive: true }).lean();

    const warehouseStats = warehouses.map((wh) => {
      const totalStock = wh.stock.reduce((sum, s) => sum + s.quantity, 0);
      const totalReserved = wh.stock.reduce((sum, s) => sum + s.reservedQuantity, 0);
      const lowStockItems = wh.stock.filter((s) => s.quantity <= s.reorderPoint).length;

      return {
        warehouseId: wh._id,
        warehouseName: wh.name,
        warehouseCode: wh.code,
        totalStock,
        totalReserved,
        availableStock: totalStock - totalReserved,
        productCount: wh.stock.length,
        lowStockItems,
      };
    });

    // Get recent stock movements
    const recentMovements = await StockMovement.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('productId', 'name sku')
      .lean();

    // Movement summary by type
    const movementSummary = await StockMovement.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: { $abs: '$quantity' } },
        },
      },
    ]);

    // Total inventory value (approximate)
    const inventoryValue = await Product.aggregate([
      {
        $match: { status: 'active' },
      },
      {
        $project: {
          value: { $multiply: ['$stock', '$price'] },
        },
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$value' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        warehouses: warehouseStats,
        totalWarehouses: warehouses.length,
        totalInventoryValue: inventoryValue[0]?.totalValue || 0,
        recentMovements,
        movementSummary: movementSummary.map((m) => ({
          type: m._id,
          count: m.count,
          totalQuantity: m.totalQuantity,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get inventory analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// EXPORT ANALYTICS REPORT
// =====================================================

/**
 * Export analytics data as JSON (can be converted to CSV/PDF on frontend)
 */
export const exportAnalyticsReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, reportType = 'full' } = req.query;

    const matchStage: any = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
    }

    let reportData: any = {};

    if (reportType === 'full' || reportType === 'orders') {
      const orders = await Order.find({
        ...matchStage,
        paymentStatus: PaymentStatus.CONFIRMED,
      })
        .populate('userId', 'name email')
        .populate('items.productId', 'name sku')
        .lean();

      reportData.orders = orders.map((o) => ({
        orderNumber: o.orderNumber,
        date: o.createdAt,
        customer: (o.userId as any)?.email,
        total: o.total,
        status: o.status,
        items: o.items.length,
      }));
    }

    if (reportType === 'full' || reportType === 'products') {
      const products = await Product.find({ status: 'active' })
        .select('name sku price stock status')
        .lean();

      reportData.products = products;
    }

    if (reportType === 'full' || reportType === 'users') {
      const users = await User.find(matchStage.createdAt ? { createdAt: matchStage.createdAt } : {})
        .select('name email role createdAt')
        .lean();

      reportData.users = users;
    }

    res.status(200).json({
      success: true,
      data: {
        reportType,
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: startDate || 'all time',
          end: endDate || 'now',
        },
        ...reportData,
      },
    });
  } catch (error: any) {
    console.error('Export analytics report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
