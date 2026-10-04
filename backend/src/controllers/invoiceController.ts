import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Product from '../models/Product';
import Customer from '../models/Customer';

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      taxRate = 18,
      overallDiscount = 0,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one product item is required for billing' });
    }

    let finalCustName = customerName;
    let finalCustEmail = customerEmail;
    let finalCustPhone = customerPhone;
    let finalCustAddress = customerAddress;

    if (customerId) {
      const cust = await Customer.findById(customerId);
      if (cust) {
        finalCustName = cust.name;
        finalCustEmail = cust.email;
        finalCustPhone = cust.phone;
        finalCustAddress = cust.address;
      }
    }

    if (!finalCustName || !finalCustEmail || !finalCustPhone) {
      return res.status(400).json({ message: 'Customer details (name, email, phone) are required' });
    }

    // Process items & update stock
    const processedItems = [];
    let subTotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product not found for ID ${item.productId}` });
      }

      if (product.stockQuantity < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}` });
      }

      // Decrement stock quantity
      product.stockQuantity -= item.quantity;
      await product.save();

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.price;
      const discountPercentage = Number(item.discountPercentage || 0);
      const itemRawTotal = unitPrice * item.quantity;
      const itemDiscount = (itemRawTotal * discountPercentage) / 100;
      const itemFinalTotal = itemRawTotal - itemDiscount;

      subTotal += itemFinalTotal;

      processedItems.push({
        product: product._id,
        sku: product.sku,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        discountPercentage,
        totalPrice: itemFinalTotal,
      });
    }

    const discountAmount = Number(overallDiscount || 0);
    const taxableTotal = Math.max(0, subTotal - discountAmount);
    const taxAmount = (taxableTotal * Number(taxRate)) / 100;
    const grandTotal = taxableTotal + taxAmount;

    // Generate Invoice Number
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(1001 + count).toString().padStart(4, '0')}`;

    const newInvoice = new Invoice({
      invoiceNumber,
      customer: customerId || undefined,
      customerName: finalCustName,
      customerEmail: finalCustEmail,
      customerPhone: finalCustPhone,
      customerAddress: finalCustAddress || 'N/A',
      items: processedItems,
      subTotal,
      taxRate,
      taxAmount,
      discountAmount,
      grandTotal,
      status: 'paid',
      issueDate: new Date(),
    });

    const savedInvoice = await newInvoice.save();
    return res.status(201).json({ message: 'Invoice generated successfully', invoice: savedInvoice });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error generating invoice', error: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return res.json(invoices);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    return res.json(invoice);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching invoice details', error: error.message });
  }
};
