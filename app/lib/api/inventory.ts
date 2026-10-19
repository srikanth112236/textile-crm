import apiClient from './client';

// =====================================================
// TYPES
// =====================================================

export interface WarehouseAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface WarehouseContact {
  name?: string;
  email?: string;
  phone?: string;
}

export interface WarehouseSettings {
  priority: number;
  maxCapacity?: number;
  handlingTime?: number;
  supportedRegions?: string[];
  isPickup?: boolean;
}

export interface WarehouseStock {
  _id?: string;
  productId: string;
  variantSku?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastStockUpdate: string;
  location?: string;
}

export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  address: WarehouseAddress;
  contact?: WarehouseContact;
  settings: WarehouseSettings;
  isActive: boolean;
  isDefault: boolean;
  stock: WarehouseStock[];
  createdBy: string | { name: string; email: string };
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  _id: string;
  movementNumber: string;
  type: string;
  status: string;
  productId: string | { name: string; sku: string; images?: string[] };
  productName?: string;
  variantSku?: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  warehouseId?: string;
  warehouseName?: string;
  warehouseCode?: string;
  transfer?: {
    fromWarehouseId: string;
    toWarehouseId: string;
    fromWarehouseName?: string;
    toWarehouseName?: string;
    transferNumber?: string;
  };
  orderId?: string;
  orderNumber?: string;
  reason: string;
  notes?: string;
  createdBy: string | { name: string; email: string };
  createdByName?: string;
  createdAt: string;
}

export interface LowStockAlert {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  productName: string;
  productSku: string;
  variantSku?: string;
  currentStock: number;
  reorderPoint: number;
  suggestedReorder: number;
  severity: 'critical' | 'warning';
}

export interface StockForecast {
  productId: string;
  warehouseId: string;
  currentStock: number;
  avgDailySales: number;
  daysUntilStockout: number | null;
  forecast: Array<{
    day: number;
    date: string;
    projectedStock: number;
  }>;
  recommendation: string;
}

// =====================================================
// WAREHOUSE API
// =====================================================

export async function getWarehouses(params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}): Promise<{
  warehouses: Warehouse[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

  const response = await apiClient.get(`/inventory/warehouses?${queryParams.toString()}`);
  // Backend returns { success: true, data: { warehouses, pagination } }
  return response.data.data || { warehouses: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
}

export async function getWarehouse(id: string): Promise<Warehouse> {
  const response = await apiClient.get(`/inventory/warehouses/${id}`);
  return response.data.data;
}

export async function createWarehouse(data: {
  name: string;
  code: string;
  address: WarehouseAddress;
  contact?: WarehouseContact;
  settings?: Partial<WarehouseSettings>;
  isActive?: boolean;
  isDefault?: boolean;
}): Promise<Warehouse> {
  const response = await apiClient.post('/inventory/warehouses', data);
  return response.data.data;
}

export async function updateWarehouse(
  id: string,
  data: Partial<{
    name: string;
    address: WarehouseAddress;
    contact: WarehouseContact;
    settings: Partial<WarehouseSettings>;
    isActive: boolean;
    isDefault: boolean;
  }>
): Promise<Warehouse> {
  const response = await apiClient.put(`/inventory/warehouses/${id}`, data);
  return response.data.data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await apiClient.delete(`/inventory/warehouses/${id}`);
}

// =====================================================
// STOCK MANAGEMENT API
// =====================================================

export async function getProductStock(productId: string): Promise<{
  productId: string;
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    stock: WarehouseStock[];
  }>;
  totals: {
    totalQuantity: number;
    totalReserved: number;
    totalAvailable: number;
  };
}> {
  const response = await apiClient.get(`/inventory/stock/${productId}`);
  return response.data.data;
}

export async function adjustStock(
  warehouseId: string,
  data: {
    productId: string;
    variantSku?: string;
    quantity: number;
    reason: string;
    notes?: string;
    location?: string;
    reorderPoint?: number;
    reorderQuantity?: number;
  }
): Promise<{
  warehouse: { id: string; name: string };
  stock: WarehouseStock;
  movement: StockMovement;
}> {
  const response = await apiClient.post(`/inventory/warehouses/${warehouseId}/stock`, data);
  return response.data.data;
}

export async function transferStock(data: {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  variantSku?: string;
  quantity: number;
  reason?: string;
  notes?: string;
  estimatedArrival?: string;
}): Promise<{
  transferNumber: string;
  fromWarehouse: { id: string; name: string; newStock: number };
  toWarehouse: { id: string; name: string; newStock: number };
  movement: StockMovement;
}> {
  const response = await apiClient.post('/inventory/transfer', data);
  return response.data.data;
}

export async function bulkStockUpdate(data: {
  updates: Array<{
    productId: string;
    warehouseId: string;
    variantSku?: string;
    quantity: number;
    reason?: string;
  }>;
}): Promise<{
  successful: Array<{
    productId: string;
    warehouseId: string;
    previousStock: number;
    newStock: number;
    movementNumber: string;
  }>;
  failed: Array<{ update: any; error: string }>;
}> {
  const response = await apiClient.post('/inventory/bulk-update', data);
  return response.data.data;
}

// =====================================================
// STOCK MOVEMENT HISTORY API
// =====================================================

export async function getStockMovements(params?: {
  page?: number;
  limit?: number;
  productId?: string;
  warehouseId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  movements: StockMovement[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.productId) queryParams.append('productId', params.productId);
  if (params?.warehouseId) queryParams.append('warehouseId', params.warehouseId);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const response = await apiClient.get(`/inventory/movements?${queryParams.toString()}`);
  // Backend returns { success: true, data: { movements, pagination } }
  return response.data.data || { movements: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
}

export async function getStockMovement(id: string): Promise<StockMovement> {
  const response = await apiClient.get(`/inventory/movements/${id}`);
  return response.data.data;
}

// =====================================================
// STOCK ALERTS & FORECAST API
// =====================================================

export async function getLowStockAlerts(): Promise<{
  alerts: LowStockAlert[];
  totalAlerts: number;
  criticalCount: number;
  warningCount: number;
}> {
  const response = await apiClient.get('/inventory/alerts');
  return response.data.data || { alerts: [], totalAlerts: 0, criticalCount: 0, warningCount: 0 };
}

export async function getStockForecast(
  productId: string,
  warehouseId?: string,
  days?: number
): Promise<StockForecast> {
  const queryParams = new URLSearchParams();
  queryParams.append('productId', productId);
  if (warehouseId) queryParams.append('warehouseId', warehouseId);
  if (days) queryParams.append('days', days.toString());

  const response = await apiClient.get(`/inventory/forecast?${queryParams.toString()}`);
  return response.data.data;
}

