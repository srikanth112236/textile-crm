import { Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { Warehouse, IWarehouse, IWarehouseStock } from '../models/Warehouse';
import { StockMovement, StockMovementType, StockMovementStatus } from '../models/StockMovement';
import { Product } from '../models/Product';
import { emitToAdmins } from '../config/socket';
import { runSafeTransaction } from '../utils/safeSession';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createWarehouseSchema = Joi.object({
  name: Joi.string().trim().required().max(100),
  code: Joi.string().trim().uppercase().required().max(20).pattern(/^[A-Z0-9\-]+$/),
  address: Joi.object({
    street: Joi.string().trim().required().max(200),
    city: Joi.string().trim().required().max(100),
    state: Joi.string().trim().required().max(100),
    zip: Joi.string().trim().required().max(20),
    country: Joi.string().trim().required().max(100),
  }).required(),
  contact: Joi.object({
    name: Joi.string().trim().max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().trim().max(20).optional(),
  }).optional(),
  settings: Joi.object({
    priority: Joi.number().min(0).default(0),
    maxCapacity: Joi.number().min(0).optional(),
    handlingTime: Joi.number().min(0).default(1),
    supportedRegions: Joi.array().items(Joi.string()).default([]),
    isPickup: Joi.boolean().default(false),
  }).optional(),
  isActive: Joi.boolean().default(true),
  isDefault: Joi.boolean().default(false),
});

const updateWarehouseSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  address: Joi.object({
    street: Joi.string().trim().max(200),
    city: Joi.string().trim().max(100),
    state: Joi.string().trim().max(100),
    zip: Joi.string().trim().max(20),
    country: Joi.string().trim().max(100),
  }).optional(),
  contact: Joi.object({
    name: Joi.string().trim().max(100).optional().allow(''),
    email: Joi.string().email().optional().allow(''),
    phone: Joi.string().trim().max(20).optional().allow(''),
  }).optional(),
  settings: Joi.object({
    priority: Joi.number().min(0),
    maxCapacity: Joi.number().min(0),
    handlingTime: Joi.number().min(0),
    supportedRegions: Joi.array().items(Joi.string()),
    isPickup: Joi.boolean(),
  }).optional(),
  isActive: Joi.boolean().optional(),
  isDefault: Joi.boolean().optional(),
});

const stockAdjustmentSchema = Joi.object({
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  variantSku: Joi.string().trim().uppercase().allow('', null).optional(),
  quantity: Joi.number().required(), // Positive for add, negative for remove
  reason: Joi.string().trim().required().max(500),
  notes: Joi.string().trim().max(1000).allow('', null).optional(),
  location: Joi.string().trim().max(50).allow('', null).optional(),
  reorderPoint: Joi.number().min(0).allow(null).optional(),
  reorderQuantity: Joi.number().min(0).allow(null).optional(),
});

const stockTransferSchema = Joi.object({
  fromWarehouseId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  toWarehouseId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  variantSku: Joi.string().trim().uppercase().allow('', null).optional(),
  quantity: Joi.number().integer().min(1).required(),
  reason: Joi.string().trim().max(500).allow('', null).default('Warehouse transfer'),
  notes: Joi.string().trim().max(1000).allow('', null).optional(),
  estimatedArrival: Joi.date().allow(null).optional(),
});

const bulkStockUpdateSchema = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      warehouseId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      variantSku: Joi.string().trim().uppercase().optional(),
      quantity: Joi.number().required(),
      reason: Joi.string().trim().max(500).default('Bulk update'),
    })
  ).min(1).max(100).required(),
});

// =====================================================
// WAREHOUSE CRUD
// =====================================================

/**
 * Get all warehouses
 */
export const getWarehouses = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const warehouses = await Warehouse.find(query)
      .sort({ 'settings.priority': 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean();

    const total = await Warehouse.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        warehouses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get single warehouse
 */
export const getWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    if (!warehouse) {
      res.status(404).json({ error: 'Warehouse not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error: any) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create warehouse
 */
export const createWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { error, value } = createWarehouseSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    // Check if code already exists
    const existingWarehouse = await Warehouse.findOne({ code: value.code });
    if (existingWarehouse) {
      res.status(400).json({ error: 'Warehouse code already exists' });
      return;
    }

    // First warehouse created becomes the default automatically so the store
    // always has exactly one default fulfilment source.
    const warehouseCount = await Warehouse.countDocuments();
    const makeDefault = value.isDefault === true || warehouseCount === 0;

    const warehouse = new Warehouse({
      ...value,
      isDefault: makeDefault,
      createdBy: userId,
    });

    await warehouse.save();

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse,
    });
  } catch (error: any) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update warehouse
 */
export const updateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const { error, value } = updateWarehouseSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      res.status(404).json({ error: 'Warehouse not found' });
      return;
    }

    // Update fields
    Object.assign(warehouse, value);
    warehouse.updatedBy = new mongoose.Types.ObjectId(userId);

    await warehouse.save();

    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse,
    });
  } catch (error: any) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete warehouse (soft delete by deactivating)
 */
export const deleteWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      res.status(404).json({ error: 'Warehouse not found' });
      return;
    }

    // The default warehouse is protected: orders and new products fall back to it.
    if (warehouse.isDefault) {
      res.status(400).json({
        error: 'Cannot delete the default warehouse. Set another warehouse as default first.',
      });
      return;
    }

    // Never allow removing the last remaining warehouse.
    const totalWarehouses = await Warehouse.countDocuments();
    if (totalWarehouses <= 1) {
      res.status(400).json({
        error: 'Cannot delete the only warehouse. Create another warehouse first.',
      });
      return;
    }

    // Check if warehouse has stock
    const hasStock = warehouse.stock.some((s) => s.quantity > 0);
    if (hasStock) {
      res.status(400).json({
        error: 'Cannot delete warehouse with stock. Transfer or adjust stock first.',
      });
      return;
    }

    await Warehouse.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// STOCK MANAGEMENT
// =====================================================

/**
 * Get warehouse stock for a product
 */
export const getProductStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const warehouses = await Warehouse.find({
      'stock.productId': productId,
      isActive: true,
    })
      .select('name code stock')
      .lean();

    const stockInfo = warehouses.map((wh) => ({
      warehouseId: wh._id,
      warehouseName: wh.name,
      warehouseCode: wh.code,
      stock: wh.stock.filter((s) => s.productId.toString() === productId),
    }));

    // Calculate totals
    const totals = {
      totalQuantity: 0,
      totalReserved: 0,
      totalAvailable: 0,
    };

    stockInfo.forEach((wh) => {
      wh.stock.forEach((s) => {
        totals.totalQuantity += s.quantity;
        totals.totalReserved += s.reservedQuantity;
        totals.totalAvailable += s.availableQuantity;
      });
    });

    res.status(200).json({
      success: true,
      data: {
        productId,
        warehouses: stockInfo,
        totals,
      },
    });
  } catch (error: any) {
    console.error('Get product stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Adjust stock in a warehouse
 */
export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  // Validate BEFORE starting session/transaction
  const userId = req.user?.userId;
  const userName = req.user?.name || 'Unknown';
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { id: warehouseId } = req.params;

  const { error, value } = stockAdjustmentSchema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({
      error: 'Validation error',
      details: error.details.map((d) => d.message),
    });
    return;
  }

  // Start session only after validation passes (safe on standalone Mongo too)
  let stockEntryResult: IWarehouseStock | null = null;
  let newStockValue = 0;
  let reorderPointValue = 10;

  try {
    const result = await runSafeTransaction(async (session) => {
      const warehouse = await Warehouse.findById(warehouseId).session(session || null);
      if (!warehouse) {
        throw new Error('WAREHOUSE_NOT_FOUND');
      }

      const product = await Product.findById(value.productId).session(session || null);
      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      // Find or create stock entry
      let stockEntry = warehouse.stock.find(
        (s) =>
          s.productId.toString() === value.productId &&
          (value.variantSku ? s.variantSku === value.variantSku : !s.variantSku)
      );

      const previousStock = stockEntry?.quantity || 0;
      const newStock = Math.max(0, previousStock + value.quantity);
      newStockValue = newStock;

      if (!stockEntry) {
        // Create new stock entry
        stockEntry = {
          productId: new mongoose.Types.ObjectId(value.productId),
          variantSku: value.variantSku,
          quantity: newStock,
          reservedQuantity: 0,
          availableQuantity: newStock,
          reorderPoint: value.reorderPoint || 10,
          reorderQuantity: value.reorderQuantity || 50,
          lastStockUpdate: new Date(),
          location: value.location,
        } as IWarehouseStock;
        warehouse.stock.push(stockEntry);
      } else {
        // Update existing stock entry
        stockEntry.quantity = newStock;
        stockEntry.availableQuantity = Math.max(0, newStock - stockEntry.reservedQuantity);
        stockEntry.lastStockUpdate = new Date();
        if (value.reorderPoint !== undefined) stockEntry.reorderPoint = value.reorderPoint;
        if (value.reorderQuantity !== undefined) stockEntry.reorderQuantity = value.reorderQuantity;
        if (value.location) stockEntry.location = value.location;
      }

      stockEntryResult = stockEntry;
      reorderPointValue = stockEntry.reorderPoint;

      await warehouse.save({ session });

      // Update main product stock - calculate without session to avoid transaction conflicts
      let totalStock = 0;
      
      // Get the updated warehouse stock
      totalStock += newStock;
      
      // Get stock from other warehouses
      const otherWarehouses = await Warehouse.find({ 
        _id: { $ne: warehouseId },
        'stock.productId': value.productId 
      }).select('stock').session(session || null).lean();
      
      otherWarehouses.forEach((wh) => {
        wh.stock.forEach((s) => {
          if (s.productId.toString() === value.productId) {
            totalStock += s.availableQuantity;
          }
        });
      });

      product.stock = totalStock;
      await product.save({ session });

      // Generate movement number
      const movementNumber = await generateMovementNumber();

      // Create stock movement record
      const movementType = value.quantity >= 0 ? StockMovementType.STOCK_IN : StockMovementType.ADJUSTMENT;
      const movement = new StockMovement({
        movementNumber,
        type: movementType,
        status: StockMovementStatus.COMPLETED,
        productId: value.productId,
        productName: product.name,
        variantSku: value.variantSku,
        quantity: value.quantity,
        previousStock,
        newStock,
        warehouseId,
        warehouseName: warehouse.name,
        warehouseCode: warehouse.code,
        reason: value.reason,
        notes: value.notes,
        location: value.location,
        createdBy: userId,
        createdByName: userName,
      });

      await movement.save({ session });

      return {
        warehouse: {
          id: warehouse._id,
          name: warehouse.name,
        },
        stock: stockEntry,
        movement,
        productName: product.name,
        restocked: previousStock <= 0 && newStock > 0,
      };
    });

    // Emit low stock alert if needed (after transaction commits)
    if (newStockValue <= reorderPointValue && newStockValue > 0 && result) {
      emitToAdmins('lowStockAlert', {
        warehouseId,
        warehouseName: result.warehouse.name,
        productId: value.productId,
        productName: result.productName,
        variantSku: value.variantSku,
        stock: newStockValue,
        threshold: reorderPointValue,
        timestamp: new Date(),
      });
    }

    // Back-in-stock: warehouse entry went 0 → >0 (total-level; size check best-effort)
    try {
      if (result && (result as any).restocked) {
        const { notifyRestock } = await import('../services/stockNotifications');
        notifyRestock(value.productId).catch((e) => console.warn('Restock notify failed:', e));
      }
    } catch (e) {
      console.warn('Restock check skipped:', e);
    }

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Adjust stock error:', error);
    
    if (error.message === 'WAREHOUSE_NOT_FOUND') {
      res.status(404).json({ error: 'Warehouse not found' });
    } else if (error.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Transfer stock between warehouses
 */
export const transferStock = async (req: Request, res: Response): Promise<void> => {
  // Validate BEFORE starting session/transaction
  const userId = req.user?.userId;
  const userName = req.user?.name || 'Unknown';
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { error, value } = stockTransferSchema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({
      error: 'Validation error',
      details: error.details.map((d) => d.message),
    });
    return;
  }

  if (value.fromWarehouseId === value.toWarehouseId) {
    res.status(400).json({ error: 'Cannot transfer to the same warehouse' });
    return;
  }

  // Start session only after validation passes (safe on standalone Mongo too)
  try {
    // Use safe transaction (real txn on replica sets, plain writes on standalone)
    const result = await runSafeTransaction(async (session) => {
      const [fromWarehouse, toWarehouse, product] = await Promise.all([
        Warehouse.findById(value.fromWarehouseId).session(session || null),
        Warehouse.findById(value.toWarehouseId).session(session || null),
        Product.findById(value.productId).session(session || null),
      ]);

      if (!fromWarehouse) {
        throw new Error('SOURCE_NOT_FOUND');
      }

      if (!toWarehouse) {
        throw new Error('DEST_NOT_FOUND');
      }

      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      // Find stock in source warehouse
      const sourceStock = fromWarehouse.stock.find(
        (s) =>
          s.productId.toString() === value.productId &&
          (value.variantSku ? s.variantSku === value.variantSku : !s.variantSku)
      );

      if (!sourceStock || sourceStock.availableQuantity < value.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${sourceStock?.availableQuantity || 0}`);
      }

      // Deduct from source
      const sourcePreviousStock = sourceStock.quantity;
      sourceStock.quantity -= value.quantity;
      sourceStock.availableQuantity = Math.max(0, sourceStock.quantity - sourceStock.reservedQuantity);
      sourceStock.lastStockUpdate = new Date();

      // Add to destination
      let destStock = toWarehouse.stock.find(
        (s) =>
          s.productId.toString() === value.productId &&
          (value.variantSku ? s.variantSku === value.variantSku : !s.variantSku)
      );

      if (!destStock) {
        destStock = {
          productId: new mongoose.Types.ObjectId(value.productId),
          variantSku: value.variantSku,
          quantity: value.quantity,
          reservedQuantity: 0,
          availableQuantity: value.quantity,
          reorderPoint: sourceStock.reorderPoint,
          reorderQuantity: sourceStock.reorderQuantity,
          lastStockUpdate: new Date(),
          location: sourceStock.location,
        } as IWarehouseStock;
        toWarehouse.stock.push(destStock);
      } else {
        destStock.quantity += value.quantity;
        destStock.availableQuantity = Math.max(0, destStock.quantity - destStock.reservedQuantity);
        destStock.lastStockUpdate = new Date();
      }

      await fromWarehouse.save({ session });
      await toWarehouse.save({ session });

      // Generate transfer number
      const transferNumber = `TRF-${Date.now()}`;
      const movementNumber = await generateMovementNumber();

      // Create stock movement record
      const movement = new StockMovement({
        movementNumber,
        type: StockMovementType.TRANSFER,
        status: StockMovementStatus.COMPLETED,
        productId: value.productId,
        productName: product.name,
        variantSku: value.variantSku,
        quantity: value.quantity,
        previousStock: sourcePreviousStock,
        newStock: sourceStock.quantity,
        warehouseId: value.fromWarehouseId,
        warehouseName: fromWarehouse.name,
        warehouseCode: fromWarehouse.code,
        transfer: {
          fromWarehouseId: value.fromWarehouseId,
          toWarehouseId: value.toWarehouseId,
          fromWarehouseName: fromWarehouse.name,
          toWarehouseName: toWarehouse.name,
          transferNumber,
          estimatedArrival: value.estimatedArrival,
          actualArrival: new Date(),
        },
        reason: value.reason,
        notes: value.notes,
        createdBy: userId,
        createdByName: userName,
      });

      await movement.save({ session });

      return {
        transferNumber,
        fromWarehouse: {
          id: fromWarehouse._id,
          name: fromWarehouse.name,
          newStock: sourceStock.quantity,
        },
        toWarehouse: {
          id: toWarehouse._id,
          name: toWarehouse.name,
          newStock: destStock.quantity,
        },
        movement,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Stock transferred successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Transfer stock error:', error);
    
    // Handle specific errors
    if (error.message === 'SOURCE_NOT_FOUND') {
      res.status(404).json({ error: 'Source warehouse not found' });
    } else if (error.message === 'DEST_NOT_FOUND') {
      res.status(404).json({ error: 'Destination warehouse not found' });
    } else if (error.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ error: 'Product not found' });
    } else if (error.message?.startsWith('INSUFFICIENT_STOCK:')) {
      const available = error.message.split(':')[1];
      res.status(400).json({ error: `Insufficient stock in source warehouse. Available: ${available}` });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Bulk stock update
 */
export const bulkStockUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userName = req.user?.name || 'Unknown';
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { error, value } = bulkStockUpdateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    const results: any[] = [];
    const errors: any[] = [];

    await runSafeTransaction(async (session) => {
      for (const update of value.updates) {
        try {
          const warehouse = await Warehouse.findById(update.warehouseId).session(session || null);
          if (!warehouse) {
            errors.push({ update, error: 'Warehouse not found' });
            continue;
          }

          const product = await Product.findById(update.productId).session(session || null);
          if (!product) {
            errors.push({ update, error: 'Product not found' });
            continue;
          }

          let stockEntry = warehouse.stock.find(
            (s) =>
              s.productId.toString() === update.productId &&
              (update.variantSku ? s.variantSku === update.variantSku : !s.variantSku)
          );

          const previousStock = stockEntry?.quantity || 0;
          const newStock = Math.max(0, previousStock + update.quantity);

          if (!stockEntry) {
            stockEntry = {
              productId: new mongoose.Types.ObjectId(update.productId),
              variantSku: update.variantSku,
              quantity: newStock,
              reservedQuantity: 0,
              availableQuantity: newStock,
              reorderPoint: 10,
              reorderQuantity: 50,
              lastStockUpdate: new Date(),
            } as IWarehouseStock;
            warehouse.stock.push(stockEntry);
          } else {
            stockEntry.quantity = newStock;
            stockEntry.availableQuantity = Math.max(0, newStock - stockEntry.reservedQuantity);
            stockEntry.lastStockUpdate = new Date();
          }

          await warehouse.save({ session });

          // Create movement record
          const movementNumber = await generateMovementNumber();
          const movement = new StockMovement({
            movementNumber,
            type: StockMovementType.ADJUSTMENT,
            status: StockMovementStatus.COMPLETED,
            productId: update.productId,
            productName: product.name,
            variantSku: update.variantSku,
            quantity: update.quantity,
            previousStock,
            newStock,
            warehouseId: update.warehouseId,
            warehouseName: warehouse.name,
            warehouseCode: warehouse.code,
            reason: update.reason,
            createdBy: userId,
            createdByName: userName,
          });

          await movement.save({ session });

          results.push({
            productId: update.productId,
            warehouseId: update.warehouseId,
            previousStock,
            newStock,
            movementNumber,
          });
        } catch (err: any) {
          errors.push({ update, error: err.message });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Bulk update completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        failed: errors,
      },
    });
  } catch (error: any) {
    console.error('Bulk stock update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// STOCK MOVEMENT HISTORY
// =====================================================

/**
 * Get stock movements
 */
export const getStockMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const {
      productId,
      warehouseId,
      type,
      startDate,
      endDate,
    } = req.query;

    const query: any = {};
    if (productId) query.productId = productId;
    if (warehouseId) query.warehouseId = warehouseId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const movements = await StockMovement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'name sku images')
      .populate('createdBy', 'name email')
      .lean();

    const total = await StockMovement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        movements,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get stock movement by ID
 */
export const getStockMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const movement = await StockMovement.findById(id)
      .populate('productId', 'name sku images')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .lean();

    if (!movement) {
      res.status(404).json({ error: 'Stock movement not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: movement,
    });
  } catch (error: any) {
    console.error('Get stock movement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// STOCK ANALYTICS
// =====================================================

/**
 * Get low stock alerts
 */
export const getLowStockAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouses = await Warehouse.find({ isActive: true })
      .select('name code stock')
      .lean();

    const alerts: any[] = [];

    for (const warehouse of warehouses) {
      for (const stock of warehouse.stock) {
        if (stock.quantity <= stock.reorderPoint) {
          const product = await Product.findById(stock.productId)
            .select('name sku images')
            .lean();

          if (product) {
            alerts.push({
              warehouseId: warehouse._id,
              warehouseName: warehouse.name,
              warehouseCode: warehouse.code,
              productId: stock.productId,
              productName: product.name,
              productSku: product.sku,
              variantSku: stock.variantSku,
              currentStock: stock.quantity,
              reorderPoint: stock.reorderPoint,
              suggestedReorder: stock.reorderQuantity,
              severity: stock.quantity === 0 ? 'critical' : 'warning',
            });
          }
        }
      }
    }

    // Sort by severity and stock level
    alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return a.currentStock - b.currentStock;
    });

    res.status(200).json({
      success: true,
      data: {
        alerts,
        totalAlerts: alerts.length,
        criticalCount: alerts.filter((a) => a.severity === 'critical').length,
        warningCount: alerts.filter((a) => a.severity === 'warning').length,
      },
    });
  } catch (error: any) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get stock forecast
 */
export const getStockForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, warehouseId, days = 30 } = req.query;

    if (!productId) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }

    const daysNum = parseInt(days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get historical movements
    const movements = await StockMovement.find({
      productId,
      warehouseId: warehouseId || { $exists: true },
      type: { $in: [StockMovementType.ORDER, StockMovementType.STOCK_OUT] },
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Calculate average daily sales
    const totalSold = movements.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    const avgDailySales = totalSold / daysNum;

    // Get current stock
    const stockQuery: any = { 'stock.productId': productId };
    if (warehouseId) stockQuery._id = warehouseId;

    const warehouses = await Warehouse.find(stockQuery)
      .select('name code stock')
      .lean();

    let currentStock = 0;
    warehouses.forEach((wh) => {
      wh.stock.forEach((s) => {
        if (s.productId.toString() === productId) {
          currentStock += s.availableQuantity;
        }
      });
    });

    // Calculate days until stockout
    const daysUntilStockout = avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : null;

    // Generate forecast for next 30 days
    const forecast: any[] = [];
    let projectedStock = currentStock;

    for (let i = 1; i <= 30; i++) {
      projectedStock = Math.max(0, projectedStock - avgDailySales);
      forecast.push({
        day: i,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectedStock: Math.round(projectedStock),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        productId,
        warehouseId: warehouseId || 'all',
        currentStock,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        daysUntilStockout,
        forecast,
        recommendation: daysUntilStockout !== null && daysUntilStockout < 14
          ? 'Reorder soon - stock will run out in less than 2 weeks'
          : 'Stock levels are healthy',
      },
    });
  } catch (error: any) {
    console.error('Get stock forecast error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function generateMovementNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const lastMovement = await StockMovement.findOne({
    movementNumber: { $regex: `^MOV-${dateStr}` },
  })
    .sort({ movementNumber: -1 })
    .lean();
  
  let sequence = 1;
  if (lastMovement) {
    const lastSequence = parseInt(lastMovement.movementNumber.split('-').pop() || '0', 10);
    sequence = lastSequence + 1;
  }
  
  return `MOV-${dateStr}-${sequence.toString().padStart(4, '0')}`;
}

