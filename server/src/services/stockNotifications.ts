import { Product } from '../models/Product';
import { BackInStock } from '../models/BackInStock';
import { PriceAlert } from '../models/PriceAlert';
import { sendEmail } from './email';
import { notifyOrderWhatsApp } from './whatsapp';
import { emitToUser } from '../config/socket';

function contactIsEmail(contact: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
}

// Called from Product post-save when stock is available.
export async function notifyRestock(productId: string): Promise<number> {
  try {
    const product: any = await Product.findById(productId).lean();
    if (!product || product.stock <= 0) return 0;
    const pending = await BackInStock.find({ productId: product._id, notified: false }).limit(200);
    let sent = 0;
    for (const sub of pending) {
      // Size-level check against variant stock
      if (sub.size && Array.isArray(product.variantSKUs) && product.variantSKUs.length > 0) {
        const match = product.variantSKUs.find((v: any) => {
          const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : v.attributes || {};
          return String(attrs.Size || attrs.size || '').toUpperCase() === String(sub.size).toUpperCase() && v.isEnabled !== false;
        });
        if (match && (match.stock || 0) <= 0) continue;
      }
      const link = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/products/${product._id}`;
      if (sub.contactType === 'email' || contactIsEmail(sub.contact)) {
        await sendEmail({
          to: sub.contact,
          subject: `Back in stock: ${product.name}${sub.size ? ` (${sub.size})` : ''}`,
          html: `<p>Good news! <b>${product.name}</b>${sub.size ? ` in size <b>${sub.size}</b>` : ''} is back in stock at <b>₹${product.price}</b>.</p><p><a href="${link}">SHOP NOW</a></p>`,
        });
      } else {
        await notifyOrderWhatsApp(sub.contact, 'back_in_stock', { productName: product.name, size: sub.size || 'all' });
      }
      if (sub.userId) {
        try {
          emitToUser(sub.userId.toString(), 'backInStock', { productId: String(product._id), productName: product.name, size: sub.size });
        } catch { /* socket optional */ }
      }
      sub.notified = true;
      sub.notifiedAt = new Date();
      await sub.save();
      sent += 1;
    }
    if (sent > 0) console.log(`Back-in-stock: notified ${sent} subs for ${product.name}`);
    return sent;
  } catch (err) {
    console.error('notifyRestock error:', err);
    return 0;
  }
}

// Called from updateProduct when price drops.
export async function notifyPriceDrop(productId: string, oldPrice: number, newPrice: number): Promise<number> {
  try {
    if (!(newPrice < oldPrice)) return 0;
    const product: any = await Product.findById(productId).lean();
    if (!product) return 0;
    const alerts = await PriceAlert.find({ productId: product._id, active: true, targetPrice: { $gt: newPrice } }).limit(200);
    let sent = 0;
    for (const alert of alerts) {
      if (alert.lastNotifiedPrice !== undefined && newPrice >= alert.lastNotifiedPrice) continue;
      const link = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/products/${product._id}`;
      const contact = alert.contact;
      if (contact && (alert.contactType === 'email' || contactIsEmail(contact))) {
        await sendEmail({
          to: contact,
          subject: `Price drop: ${product.name} now ₹${newPrice}`,
          html: `<p><b>${product.name}</b> dropped from <s>₹${oldPrice}</s> to <b>₹${newPrice}</b>.</p><p><a href="${link}">Grab it now</a></p>`,
        });
      } else if (contact) {
        await notifyOrderWhatsApp(contact, 'price_drop', { productName: product.name, oldPrice, newPrice });
      }
      if (alert.userId) {
        try {
          emitToUser(alert.userId.toString(), 'priceDrop', { productId: String(product._id), productName: product.name, oldPrice, newPrice });
        } catch { /* socket optional */ }
      }
      alert.lastNotifiedPrice = newPrice;
      await alert.save();
      sent += 1;
    }
    if (sent > 0) console.log(`Price-drop: notified ${sent} alerts for ${product.name} ${oldPrice}→${newPrice}`);
    return sent;
  } catch (err) {
    console.error('notifyPriceDrop error:', err);
    return 0;
  }
}
