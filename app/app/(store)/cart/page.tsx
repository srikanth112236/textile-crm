import React from 'react';
import { CartClient } from './CartClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart | E-Commerce',
  description: 'Review your cart items and proceed to checkout',
};

export default function CartPage() {
  return <CartClient />;
}


