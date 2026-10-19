import mongoose from 'mongoose';
import { Order } from '../models/Order';

/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXX (e.g., ORD-20250101-001)
 */
export async function generateOrderNumber(session?: mongoose.ClientSession): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const prefix = `ORD-${dateStr}-`;

  // Escape special regex characters in prefix
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Find the last order with the same prefix
  const query = Order.findOne({
    orderNumber: { $regex: `^${escapedPrefix}`, $options: 'i' },
  }).sort({ orderNumber: -1 });

  // Use session if provided
  if (session) {
    query.session(session);
  }

  const lastOrder = await query.lean().exec();

  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length >= 3) {
      const lastSeq = parseInt(parts[2] || '0', 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }

  // Format sequence with 3 digits (001, 002, etc.)
  const seqStr = sequence.toString().padStart(3, '0');
  return `${prefix}${seqStr}`.toUpperCase();
}

