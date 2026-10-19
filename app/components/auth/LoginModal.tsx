'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, LogIn, UserPlus, Lock } from 'lucide-react';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Where the modal's Login button navigates (e.g. allows passing callbackUrl). */
  loginHref?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  open,
  onOpenChange,
  title = 'Login Required',
  description = 'Login or register to add to cart, wishlist, checkout or place orders. Browsing and pincode check work without login.',
  loginHref = '/login',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            You need to be logged in to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Add items to cart and checkout
            </li>
            <li className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Save items to wishlist
            </li>
            <li className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Place orders and track them
            </li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={loginHref} onClick={() => onOpenChange(false)}>
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
          <Button variant="secondary" asChild className="w-full sm:w-auto">
            <Link href="/register" onClick={() => onOpenChange(false)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


