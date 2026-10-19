import React from 'react';
import { WishlistClient } from './WishlistClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | E-Commerce',
  description: 'View and manage your saved wishlist items',
};

export default function WishlistPage() {
  return <WishlistClient />;
}

