import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Discount, DiscountType } from '../models/Discount';
import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Warehouse } from '../models/Warehouse';
import { StockMovement, StockMovementType, StockMovementStatus } from '../models/StockMovement';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdminData = async () => {
  try {
    console.log('🚀 Starting Fast Comprehensive Admin Data Seeder...');
    await connectDatabase();

    // 1. Fetch or Create Demo Customers & Admin User
    let adminUser = await User.findOne({ role: UserRole.SUPERADMIN });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Mentoos Admin',
        email: process.env.SUPERADMIN_EMAIL || 'admin@mentoos.in',
        password: process.env.SUPERADMIN_PASSWORD || 'Admin123!@#',
        role: UserRole.SUPERADMIN,
      });
      console.log('✅ Created Superadmin User');
    }

    let customer1 = await User.findOne({ email: 'srikanth@gmail.com' });
    if (!customer1) {
      customer1 = await User.create({
        name: 'Srikanth Verma',
        email: 'srikanth@gmail.com',
        password: 'Password123!',
        role: UserRole.USER,
        loyaltyPoints: 450,
        addresses: [
          {
            street: 'Somandepalli Road, Plot #42',
            city: 'Somandepalle',
            state: 'Andhra Pradesh',
            zip: '515122',
            country: 'India',
            isDefault: true,
          },
        ],
      });
    }

    let customer2 = await User.findOne({ email: 'priya.sharma@gmail.com' });
    if (!customer2) {
      customer2 = await User.create({
        name: 'Priya Sharma',
        email: 'priya.sharma@gmail.com',
        password: 'Password123!',
        role: UserRole.USER,
        loyaltyPoints: 120,
        addresses: [
          {
            street: 'Flat 402, Green Glen Layout, Bellandur',
            city: 'Bengaluru',
            state: 'Karnataka',
            zip: '560103',
            country: 'India',
            isDefault: true,
          },
        ],
      });
    }

    let customer3 = await User.findOne({ email: 'rahul.mehta@gmail.com' });
    if (!customer3) {
      customer3 = await User.create({
        name: 'Rahul Mehta',
        email: 'rahul.mehta@gmail.com',
        password: 'Password123!',
        role: UserRole.USER,
        loyaltyPoints: 310,
        addresses: [
          {
            street: '12-B, Bandra Reclamation, Opp Rangsharda',
            city: 'Mumbai',
            state: 'Maharashtra',
            zip: '400050',
            country: 'India',
            isDefault: true,
          },
        ],
      });
    }

    // 2. Seed Discounts & Coupons
    console.log('📦 Seeding Discounts & Promo Coupons...');
    await Discount.deleteMany({});

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);

    const discounts = [
      {
        code: 'WELCOME10',
        type: DiscountType.PERCENTAGE,
        value: 10,
        minPurchase: 499,
        maxDiscount: 200,
        expiry: futureDate,
        usageLimit: 500,
        usedCount: 42,
        isActive: true,
        description: '10% OFF for new buyers on first purchase over ₹499.',
      },
      {
        code: 'MENTOOS20',
        type: DiscountType.PERCENTAGE,
        value: 20,
        minPurchase: 999,
        maxDiscount: 500,
        expiry: futureDate,
        usageLimit: 1000,
        usedCount: 156,
        isActive: true,
        description: '20% OFF Flat storewide discount on orders above ₹999.',
      },
      {
        code: 'FREESHIP',
        type: DiscountType.FIXED,
        value: 99,
        minPurchase: 799,
        expiry: futureDate,
        usageLimit: 2000,
        usedCount: 312,
        isActive: true,
        description: 'Free Shipping voucher on cart values above ₹799.',
      },
      {
        code: 'FLASH500',
        type: DiscountType.FIXED,
        value: 500,
        minPurchase: 2499,
        expiry: futureDate,
        usageLimit: 100,
        usedCount: 18,
        isActive: true,
        description: 'Flat ₹500 Instant Discount on orders over ₹2,499.',
      },
      {
        code: 'FESTIVE15',
        type: DiscountType.PERCENTAGE,
        value: 15,
        minPurchase: 1499,
        maxDiscount: 750,
        expiry: futureDate,
        usageLimit: 500,
        usedCount: 89,
        isActive: true,
        description: '15% OFF Festival Special offer on ethnics & formals.',
      },
    ];

    await Discount.insertMany(discounts);
    console.log('✅ Created 5 Promo Coupons');

    // 3. Fetch Catalog Products for Orders & Reviews
    const products = await Product.find({ status: 'active' }).limit(10);
    if (products.length === 0) {
      console.warn('⚠️ No products found in MongoDB! Please run seedMentoosCatalog.ts first.');
      process.exit(0);
    }

    // 4. Seed Reviews on Catalog Products
    console.log('⭐ Seeding Product Reviews & Ratings...');
    const reviewData = [
      {
        comment: 'Fabric feels extremely premium and breathable. Stitching is top notch. Highly recommended for daily wear.',
        rating: 5,
        status: 'approved' as const,
        helpfulCount: 14,
      },
      {
        comment: 'Color is exactly as shown in images. Fits comfortably around shoulders.',
        rating: 5,
        status: 'approved' as const,
        helpfulCount: 9,
      },
      {
        comment: 'Delivered fast within 3 days to Hyderabad. Great packaging.',
        rating: 4,
        status: 'approved' as const,
        helpfulCount: 6,
      },
      {
        comment: 'Quality is decent for the price. Size runs slightly snug so order 1 size larger.',
        rating: 3,
        status: 'approved' as const,
        helpfulCount: 2,
      },
      {
        comment: 'Testing moderation workflow for new review submissions.',
        rating: 4,
        status: 'pending' as const,
        helpfulCount: 0,
      },
    ];

    for (let i = 0; i < Math.min(products.length, 5); i++) {
      const prod = products[i];
      const rev = reviewData[i % reviewData.length];
      const existingReviews = prod.reviews || [];
      existingReviews.push({
        userId: customer1._id as any,
        userName: customer1.name,
        rating: rev.rating,
        comment: rev.comment,
        verifiedPurchase: true,
        helpfulVotes: [],
        helpfulCount: rev.helpfulCount,
        notHelpfulCount: 0,
        moderationStatus: rev.status,
      } as any);

      const approvedRevs = existingReviews.filter((r: any) => r.moderationStatus === 'approved');
      const avgRating = approvedRevs.length > 0
        ? approvedRevs.reduce((acc: number, cur: any) => acc + cur.rating, 0) / approvedRevs.length
        : 0;

      await Product.updateOne(
        { _id: prod._id },
        {
          $set: {
            reviews: existingReviews,
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: approvedRevs.length,
          }
        }
      );
    }
    console.log('✅ Created Product Reviews & Ratings');

    // 5. Seed Multi-Status Orders
    console.log('🛒 Seeding Orders Across All 6 Statuses...');
    await Order.deleteMany({});

    const sampleCustomers = [customer1, customer2, customer3];
    const orderStatuses = [
      { status: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING, method: 'cod' },
      { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.CONFIRMED, method: 'upi' },
      { status: OrderStatus.SHIPPED, paymentStatus: PaymentStatus.CONFIRMED, method: 'razorpay' },
      { status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.CONFIRMED, method: 'upi' },
      { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.CANCELLED, method: 'cod' },
      { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.REFUNDED, method: 'upi' },
      { status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.CONFIRMED, method: 'credit_card' },
      { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.CONFIRMED, method: 'upi' },
    ];

    let orderCounter = 100;
    for (let i = 0; i < orderStatuses.length; i++) {
      const config = orderStatuses[i];
      const cust = sampleCustomers[i % sampleCustomers.length];
      const prod1 = products[i % products.length];
      const prod2 = products[(i + 1) % products.length];

      const item1Price = prod1.price;
      const item2Price = prod2.price;
      const subtotal = item1Price * 1 + item2Price * 2;
      const discountAmount = i % 2 === 0 ? 200 : 0;
      const total = subtotal - discountAmount;
      orderCounter++;

      const orderNumber = `ORD-20261008-${orderCounter}`;

      const newOrder = new Order({
        userId: cust._id,
        orderNumber,
        items: [
          {
            productId: prod1._id,
            quantity: 1,
            variations: [{ name: 'Size', value: 'L' }, { name: 'Color', value: 'Black' }],
            price: item1Price,
            subtotal: item1Price,
            fulfilledQuantity: config.status === OrderStatus.DELIVERED ? 1 : 0,
          },
          {
            productId: prod2._id,
            quantity: 2,
            variations: [{ name: 'Size', value: 'XL' }, { name: 'Color', value: 'Navy' }],
            price: item2Price,
            subtotal: item2Price * 2,
            fulfilledQuantity: config.status === OrderStatus.DELIVERED ? 2 : 0,
          },
        ],
        total,
        taxAmount: Math.round(total * 0.05),
        discountAmount,
        shippingCost: subtotal > 999 ? 0 : 99,
        shippingAddress: cust.addresses[0] || {
          street: 'Main Market Road',
          city: 'Hyderabad',
          state: 'Telangana',
          zip: '500001',
          country: 'India',
        },
        status: config.status,
        paymentStatus: config.paymentStatus,
        paymentMethod: config.method,
        cancelledReason: config.status === OrderStatus.CANCELLED ? 'Customer changed mind before dispatch' : undefined,
        timeline: [
          {
            event: 'Order Created',
            description: `Order ${orderNumber} placed by customer`,
            type: 'system',
            createdAt: new Date(Date.now() - (i + 1) * 86400000),
          },
          {
            event: `Status set to ${config.status}`,
            description: `Order transitioned to ${config.status}`,
            type: 'status_change',
            createdAt: new Date(Date.now() - i * 43200000),
          },
        ],
        createdAt: new Date(Date.now() - (i + 1) * 86400000),
      });

      await newOrder.save();
    }
    console.log('✅ Created 8 Sample Orders across Pending, Processing, Shipped, Delivered, Cancelled & Refunded statuses');

    // 6. Seed Warehouses & Inventory
    console.log('🏭 Seeding Warehouses & Stock Movements...');
    await Warehouse.deleteMany({});
    await StockMovement.deleteMany({});

    const warehouses = [
      {
        name: 'Hyderabad Central Fulfillment Hub',
        code: 'WH-HYD-01',
        address: {
          street: 'Gachibowli Logistics Park, Outer Ring Road',
          city: 'Hyderabad',
          state: 'Telangana',
          zip: '500032',
          country: 'India',
        },
        contact: {
          name: 'Vikram Reddy',
          email: 'hyd-hub@mentoos.in',
          phone: '+91 98765 11111',
        },
        settings: {
          priority: 1,
          maxCapacity: 50000,
          handlingTime: 1,
          supportedRegions: ['India'],
          isPickup: false,
        },
        isActive: true,
        isDefault: true,
        stock: products.map((p) => ({
          productId: p._id as any,
          variantSku: p.sku,
          quantity: 150,
          reservedQuantity: 10,
          availableQuantity: 140,
          reorderPoint: 20,
          reorderQuantity: 100,
          lastStockUpdate: new Date(),
          location: 'Aisle 4, Bin B-12',
        })),
        createdBy: adminUser._id as any,
      },
      {
        name: 'Mumbai Express Logistics Hub',
        code: 'WH-BOM-02',
        address: {
          street: 'Bhiwandi Freight Corridor, Building C',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '421302',
          country: 'India',
        },
        contact: {
          name: 'Suresh Patil',
          email: 'mumbai-hub@mentoos.in',
          phone: '+91 98765 22222',
        },
        settings: {
          priority: 2,
          maxCapacity: 35000,
          handlingTime: 1,
          supportedRegions: ['India'],
          isPickup: false,
        },
        isActive: true,
        isDefault: false,
        stock: products.map((p) => ({
          productId: p._id as any,
          variantSku: p.sku,
          quantity: 80,
          reservedQuantity: 5,
          availableQuantity: 75,
          reorderPoint: 15,
          reorderQuantity: 50,
          lastStockUpdate: new Date(),
          location: 'Aisle 2, Bin A-05',
        })),
        createdBy: adminUser._id as any,
      },
    ];

    const createdWarehouses = await Warehouse.insertMany(warehouses);
    console.log('✅ Created 2 Fulfillment Warehouses');

    // Seed Stock Movements
    const movements = [
      {
        movementNumber: 'MOV-20261008-001',
        type: StockMovementType.STOCK_IN,
        status: StockMovementStatus.COMPLETED,
        productId: products[0]._id,
        productName: products[0].name,
        variantSku: products[0].sku,
        quantity: 200,
        previousStock: 0,
        newStock: 200,
        warehouseId: createdWarehouses[0]._id,
        warehouseName: createdWarehouses[0].name,
        warehouseCode: createdWarehouses[0].code,
        reason: 'Initial Factory Production Batch Receipt',
        createdBy: adminUser._id,
      },
      {
        movementNumber: 'MOV-20261008-002',
        type: StockMovementType.ORDER,
        status: StockMovementStatus.COMPLETED,
        productId: products[0]._id,
        productName: products[0].name,
        variantSku: products[0].sku,
        quantity: -2,
        previousStock: 200,
        newStock: 198,
        warehouseId: createdWarehouses[0]._id,
        warehouseName: createdWarehouses[0].name,
        warehouseCode: createdWarehouses[0].code,
        reason: 'Customer Order Dispatch (ORD-20261008-101)',
        createdBy: adminUser._id,
      },
      {
        movementNumber: 'MOV-20261008-003',
        type: StockMovementType.TRANSFER,
        status: StockMovementStatus.COMPLETED,
        productId: products[1]._id,
        productName: products[1].name,
        variantSku: products[1].sku,
        quantity: 30,
        previousStock: 50,
        newStock: 80,
        warehouseId: createdWarehouses[1]._id,
        warehouseName: createdWarehouses[1].name,
        warehouseCode: createdWarehouses[1].code,
        transfer: {
          fromWarehouseId: createdWarehouses[0]._id as any,
          toWarehouseId: createdWarehouses[1]._id as any,
          fromWarehouseName: createdWarehouses[0].name,
          toWarehouseName: createdWarehouses[1].name,
          transferNumber: 'TRF-20261008-001',
        },
        reason: 'Inter-warehouse stock balancing',
        createdBy: adminUser._id,
      },
    ];

    await StockMovement.insertMany(movements);
    console.log('✅ Created Sample Stock Movements');

    console.log('🎉 Admin Data Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedAdminData();
