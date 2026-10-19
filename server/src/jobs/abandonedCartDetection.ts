import { getAbandonedCarts } from '../services/cart';
import { emitToUser } from '../config/socket';

/**
 * Detect and notify users about abandoned carts
 * This job should run periodically (e.g., every hour via cron)
 */
export const detectAbandonedCarts = async (): Promise<void> => {
  try {
    console.log('🛒 Checking for abandoned carts...');
    
    const abandonedCarts = await getAbandonedCarts();
    
    if (abandonedCarts.length === 0) {
      console.log('✅ No abandoned carts found');
      return;
    }

    console.log(`📧 Found ${abandonedCarts.length} abandoned cart(s)`);

    // Emit Socket.io events for each abandoned cart
    for (const cart of abandonedCarts) {
      const userId = cart.userId.toString();

      try {
        emitToUser(userId, 'abandonedCartReminder', {
          cartId: cart._id.toString(),
          itemCount: cart.items.length,
          lastUpdated: cart.updatedAt,
          message: 'You have items in your cart. Complete your purchase now!',
        });

        console.log(`✅ Sent abandoned cart reminder to user ${userId}`);
      } catch (error: any) {
        console.error(`❌ Failed to send reminder to user ${userId}:`, error.message);
        // Continue with other carts even if one fails
      }

      // WhatsApp nudge with 72h cooldown (consent-free transactional style is skipped;
      // only users with a phone on file get this recovery message)
      try {
        const last = (cart as any).abandonedNotifiedAt ? new Date((cart as any).abandonedNotifiedAt).getTime() : 0;
        if (Date.now() - last > 72 * 3600 * 1000) {
          const { User } = await import('../models/User');
          const { notifyOrderWhatsApp } = await import('../services/whatsapp');
          const buyer: any = await User.findById(userId).select('phone').lean();
          if (buyer?.phone) {
            const total = cart.items.reduce((s: number, it: any) => s + (it.price || 0) * (it.quantity || 1), 0);
            await notifyOrderWhatsApp(buyer.phone, 'abandoned_cart', { itemCount: cart.items.length, total: `₹${total}` });
            (cart as any).abandonedNotifiedAt = new Date();
            await (cart as any).save();
          }
        }
      } catch (error: any) {
        console.error(`❌ Failed WhatsApp nudge to user ${userId}:`, error.message);
      }
    }

    // TODO: In future, add email fallback for critical alerts
    // if (Socket.io fails, send email notification)
  } catch (error: any) {
    console.error('❌ Error detecting abandoned carts:', error.message);
  }
};

// Run the job immediately (for testing)
// In production, this should be scheduled via cron or a job scheduler
if (process.env.NODE_ENV === 'development') {
  // Run after 5 seconds (to allow server to start)
  setTimeout(() => {
    detectAbandonedCarts().catch(console.error);
  }, 5000);
}


