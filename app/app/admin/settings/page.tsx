import { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Store Settings | Mentoos Admin',
  description: 'COD, shipping, Razorpay, Shiprocket, WhatsApp and storefront settings',
};

export default function AdminSettingsPage() {
  return <SettingsClient />;
}
