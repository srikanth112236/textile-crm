import { Metadata } from 'next';
import ShopLookClient from './ShopLookClient';

export const metadata: Metadata = {
  title: 'Shop the Look | Mentoos Admin',
  description: 'Curate outfit bundles with ADD ALL TO CART',
};

export default function ShopLookPage() {
  return <ShopLookClient />;
}
