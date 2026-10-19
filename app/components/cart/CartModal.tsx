'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/contexts/CartContext';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface CartModalProps {
  children?: React.ReactNode;
}

export const CartModal: React.FC<CartModalProps> = ({ children }) => {
  const { items, total, itemCount, updateItem, removeItem, loading } = useCart();
  const [open, setOpen] = useState(false);

  const handleQuantityChange = async (itemIndex: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateItem(itemIndex, newQuantity);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleRemove = async (itemIndex: number) => {
    try {
      await removeItem(itemIndex);
    } catch (error) {
      // Error handled in context
    }
  };

  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="relative" aria-label="Shopping cart">
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                aria-label={`${itemCount} items in cart`}
              >
                {itemCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading cart...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex gap-4">
                  <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    {item.product.images && item.product.images.length > 0 && (
                      <Image
                        src={getImageUrl(item.product.images[0])}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productId}`}
                      onClick={() => setOpen(false)}
                      className="font-medium hover:underline line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    {item.variations && item.variations.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.variations.map((v, i) => (
                          <span key={i}>
                            {v.name}: {v.value}
                            {i < item.variations!.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(index, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatPrice(item.subtotal)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleRemove(index)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} asChild>
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button className="flex-1" onClick={() => setOpen(false)} asChild>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};


