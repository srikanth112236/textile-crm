import { Request, Response } from 'express';

/**
 * Customer-only guard for storefront shopping writes (cart, wishlist,
 * orders, reviews, price alerts). Admins/superadmins are dashboard-only:
 * they may browse the public site but must not shop with staff accounts.
 * Reads (getCart, listings, search, pincode) stay open.
 *
 * Returns true when the caller may proceed; otherwise sends 403 and
 * returns false. Call AFTER the 401 userId check.
 */
export function requireCustomer(req: Request, res: Response): boolean {
  const role = (req as any).user?.role;
  if (role && role !== 'user') {
    res.status(403).json({
      error: 'Shopping actions are for customer accounts only. Staff, please use the dashboard — or log in with a customer account to shop.',
    });
    return false;
  }
  return true;
}
