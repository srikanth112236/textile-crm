import { Request, Response } from 'express';
import Product from '../models/Product';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json(products);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { sku, name, category, unit, price, purchasePrice, stockQuantity, minStockLevel, taxRate, description } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: 'Name, category, and selling price are required' });
    }

    let finalSku = sku;
    if (!finalSku) {
      const count = await Product.countDocuments();
      finalSku = `TEX-${(5001 + count).toString().padStart(4, '0')}`;
    }

    const existingProduct = await Product.findOne({ sku: finalSku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product SKU already exists' });
    }

    const newProduct = new Product({
      sku: finalSku.toUpperCase(),
      name,
      category,
      unit: unit || 'Meters',
      price: Number(price),
      purchasePrice: Number(purchasePrice || 0),
      stockQuantity: Number(stockQuantity || 0),
      minStockLevel: Number(minStockLevel || 50),
      taxRate: Number(taxRate || 18),
      description: description || '',
    });

    const savedProduct = await newProduct.save();
    return res.status(201).json({ message: 'Product created successfully', product: savedProduct });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};
