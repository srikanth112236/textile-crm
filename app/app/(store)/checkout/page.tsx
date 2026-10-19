import React from 'react';
import { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout | E-Commerce',
  description: 'Complete your purchase',
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}

