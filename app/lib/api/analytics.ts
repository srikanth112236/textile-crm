import apiClient from './client';

// =====================================================
// TYPES
// =====================================================

export interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalUsers: number;
    totalProducts: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    growth: number;
  };
  orders: {
    total: number;
    today: number;
    thisMonth: number;
    averageValue: number;
    growth: number;
    byStatus: {
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
      refunded: number;
    };
  };
  users: {
    total: number;
    admins: number;
    regular: number;
    thisMonth: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    topSelling: Array<{
      productId: string;
      productName: string;
      totalQuantity: number;
      totalRevenue: number;
    }>;
  };
  recentOrders: any[];
}

export interface SalesForecast {
  historicalDays: number;
  avgDailyRevenue: number;
  avgDailyOrders: number;
  trend: 'growing' | 'declining' | 'stable';
  trendPercentage: number;
  forecast: Array<{
    day: number;
    date: string;
    projectedRevenue: number;
    projectedOrders: number;
  }>;
  projectedMonthlyRevenue: number;
  projectedMonthlyOrders: number;
  historicalData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface CustomerSegment {
  count: number;
  percentage: number;
  totalRevenue: number;
}

export interface CustomerLifetimeValue {
  totalCustomers: number;
  avgCLV: number;
  segments: {
    vip: CustomerSegment;
    regular: CustomerSegment;
    lowValue: CustomerSegment;
  };
  topCustomers: Array<{
    userId: string;
    email: string;
    name: string;
    totalSpent: number;
    orderCount: number;
    avgOrderValue: number;
    customerSince: string;
    lastOrderDate: string;
  }>;
}

export interface ConversionFunnel {
  period: string;
  funnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  dropOffRates: Array<{
    from: string;
    to: string;
    dropOffRate: number;
    conversionRate: number;
  }>;
  overallConversionRate: number;
}

export interface RevenueByCategory {
  totalRevenue: number;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    totalRevenue: number;
    totalQuantity: number;
    orderCount: number;
    percentage: number;
  }>;
}

export interface GeographicSales {
  countries: Array<{
    country: string;
    totalRevenue: number;
    orderCount: number;
    states: Array<{
      state: string;
      revenue: number;
      orders: number;
    }>;
  }>;
  topLocations: Array<{
    country: string;
    state: string;
    revenue: number;
    orders: number;
  }>;
}

export interface CohortAnalysis {
  months: number;
  cohorts: Array<{
    cohort: string;
    baseSize: number;
    retention: number[];
  }>;
  columns: string[];
}

export interface ProductPerformance {
  products: Array<{
    productId: string;
    name: string;
    sku: string;
    currentStock: number;
    currentPrice: number;
    totalRevenue: number;
    totalQuantity: number;
    orderCount: number;
    avgPrice: number;
    avgOrderValue: number;
    stockTurnover: number | null;
    status: string;
  }>;
  summary: {
    totalProducts: number;
    totalRevenue: number;
    topPerformers: Array<{ name: string; revenue: number }>;
    worstPerformers: Array<{ name: string; revenue: number }>;
  };
}

export interface InventoryAnalytics {
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    totalStock: number;
    totalReserved: number;
    availableStock: number;
    productCount: number;
    lowStockItems: number;
  }>;
  totalWarehouses: number;
  totalInventoryValue: number;
  recentMovements: any[];
  movementSummary: Array<{
    type: string;
    count: number;
    totalQuantity: number;
  }>;
}

// =====================================================
// API CLIENT
// =====================================================

export const analyticsApi = {
  /**
   * Get comprehensive analytics overview
   */
  getAnalytics: async (): Promise<{ success: boolean; data: AnalyticsData }> => {
    const response = await apiClient.get('/analytics');
    return response.data;
  },

  /**
   * Get sales forecast
   */
  getSalesForecast: async (days?: number): Promise<{ success: boolean; data: SalesForecast }> => {
    const params = days ? `?days=${days}` : '';
    const response = await apiClient.get(`/analytics/forecast${params}`);
    return response.data;
  },

  /**
   * Get customer lifetime value analysis
   */
  getCustomerLifetimeValue: async (): Promise<{ success: boolean; data: CustomerLifetimeValue }> => {
    const response = await apiClient.get('/analytics/clv');
    return response.data;
  },

  /**
   * Get conversion funnel analysis
   */
  getConversionFunnel: async (days?: number): Promise<{ success: boolean; data: ConversionFunnel }> => {
    const params = days ? `?days=${days}` : '';
    const response = await apiClient.get(`/analytics/funnel${params}`);
    return response.data;
  },

  /**
   * Get revenue breakdown by category
   */
  getRevenueByCategory: async (startDate?: string, endDate?: string): Promise<{ success: boolean; data: RevenueByCategory }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/analytics/revenue/category${queryString}`);
    return response.data;
  },

  /**
   * Get geographic sales distribution
   */
  getGeographicSales: async (): Promise<{ success: boolean; data: GeographicSales }> => {
    const response = await apiClient.get('/analytics/geographic');
    return response.data;
  },

  /**
   * Get cohort analysis
   */
  getCohortAnalysis: async (months?: number): Promise<{ success: boolean; data: CohortAnalysis }> => {
    const params = months ? `?months=${months}` : '';
    const response = await apiClient.get(`/analytics/cohort${params}`);
    return response.data;
  },

  /**
   * Get product performance analytics
   */
  getProductPerformance: async (
    limit?: number,
    sortBy?: 'revenue' | 'quantity'
  ): Promise<{ success: boolean; data: ProductPerformance }> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (sortBy) params.append('sortBy', sortBy);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/analytics/products${queryString}`);
    return response.data;
  },

  /**
   * Get inventory analytics
   */
  getInventoryAnalytics: async (): Promise<{ success: boolean; data: InventoryAnalytics }> => {
    const response = await apiClient.get('/analytics/inventory');
    return response.data;
  },

  /**
   * Export analytics report
   */
  exportAnalyticsReport: async (
    reportType?: 'full' | 'orders' | 'products' | 'users',
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; data: any }> => {
    const params = new URLSearchParams();
    if (reportType) params.append('reportType', reportType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/analytics/export${queryString}`);
    return response.data;
  },
};
