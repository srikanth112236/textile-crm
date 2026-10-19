import { Metadata } from 'next';
import StockAlertsClient from './StockAlertsClient';

export const metadata: Metadata = {
  title: 'Stock Alerts | Mentoos Admin',
  description: 'Back-in-stock and price-drop alert queues',
};

export default function StockAlertsPage() {
  return <StockAlertsClient />;
}
