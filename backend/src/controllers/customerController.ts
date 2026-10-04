import { Response } from 'express';
import bcrypt from 'bcryptjs';
import Customer from '../models/Customer';
import Invoice from '../models/Invoice';
import User from '../models/User';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    return res.json(customers);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const invoices = await Invoice.find({ customer: customer._id }).sort({ createdAt: -1 });
    return res.json({ customer, invoices });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching customer details', error: error.message });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { name, contactPerson, email, phone, address, gstNumber, goodsCategory, creditLimit, paymentTerms, status } = req.body;

    if (!name || !email || !phone || !address) {
      return res.status(400).json({ message: 'Name, email, phone, and address are required' });
    }

    const count = await Customer.countDocuments();
    const customerCode = `CUST-${(2001 + count).toString().padStart(4, '0')}`;

    const initialPassword = `Cust@${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const newCustomer = new Customer({
      customerCode,
      name,
      contactPerson: contactPerson || name,
      email,
      phone,
      address,
      gstNumber: gstNumber || '',
      goodsCategory: goodsCategory || 'Fabrics & Textiles',
      creditLimit: Number(creditLimit || 100000),
      paymentTerms: paymentTerms || 'Net 30 Days',
      status: status || 'active',
    });

    const savedCustomer = await newCustomer.save();

    // Provision user login account for customer
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'customer',
      mustChangePassword: true,
      customerId: savedCustomer._id,
    });

    const savedUser = await newUser.save();
    savedCustomer.userId = savedUser._id;
    await savedCustomer.save();

    return res.status(201).json({
      message: 'Customer and portal login account created successfully',
      customer: savedCustomer,
      createdCredentials: {
        email: savedUser.email,
        initialPassword,
        customerCode: savedCustomer.customerCode,
        mustChangePassword: true,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

export const getMyCustomerPortalData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let customer = await Customer.findOne({ $or: [{ userId: user._id }, { email: user.email }] });
    if (!customer) {
      // Fallback: auto-create customer profile if missing
      const count = await Customer.countDocuments();
      customer = await Customer.create({
        customerCode: `CUST-${(2001 + count).toString().padStart(4, '0')}`,
        name: user.name,
        contactPerson: user.name,
        email: user.email,
        phone: '0000000000',
        address: 'Customer Address',
        userId: user._id,
      });
    }

    const invoices = await Invoice.find({ $or: [{ customer: customer._id }, { customerEmail: user.email }] }).sort({ createdAt: -1 });
    const products = await Product.find({ status: 'active' }).sort({ name: 1 });

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalDue = totalInvoiced - totalPaid;

    return res.json({
      customer,
      invoices,
      products,
      summary: {
        totalInvoices: invoices.length,
        totalInvoiced,
        totalPaid,
        totalDue,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching customer portal data', error: error.message });
  }
};

export const requestCustomerInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { items, notes } = req.body;
    const userId = req.user?.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one product item is required' });
    }

    const user = await User.findById(userId);
    let customer = await Customer.findOne({ $or: [{ userId: user?._id }, { email: user?.email }] });

    const count = await Invoice.countDocuments();
    const invoiceNumber = `ORD-${new Date().getFullYear()}-${(3001 + count).toString().padStart(4, '0')}`;

    let subTotal = 0;
    const invoiceItems: any[] = [];

    for (const item of items) {
      const prod = await Product.findById(item.productId);
      if (prod) {
        const qty = Number(item.quantity) || 1;
        const lineTotal = prod.price * qty;
        subTotal += lineTotal;
        invoiceItems.push({
          product: prod._id,
          sku: prod.sku,
          name: prod.name,
          quantity: qty,
          unitPrice: prod.price,
          discountPercentage: 0,
          totalPrice: lineTotal,
        });
      }
    }

    const taxRate = 18;
    const taxAmount = Math.round((subTotal * taxRate) / 100);
    const grandTotal = subTotal + taxAmount;

    const newInvoice = new Invoice({
      invoiceNumber,
      customer: customer ? customer._id : undefined,
      customerName: customer ? customer.name : user?.name,
      customerEmail: customer ? customer.email : user?.email,
      customerPhone: customer ? customer.phone : '0000000000',
      customerAddress: customer ? customer.address : 'Address',
      items: invoiceItems,
      subTotal,
      taxRate,
      taxAmount,
      discountAmount: 0,
      grandTotal,
      amountPaid: 0,
      status: 'pending',
    });

    const savedInvoice = await newInvoice.save();

    return res.status(201).json({
      message: 'Product order & invoice request submitted successfully. Awaiting Admin Approval.',
      invoice: savedInvoice,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error requesting order invoice', error: error.message });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    return res.json({ message: 'Customer updated successfully', customer: updatedCustomer });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    return res.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
};
