import { Metadata } from 'next';
import AdminReturnsClient from './AdminReturnsClient';

export const metadata: Metadata = {
  title: 'Returns & Exchange | Mentoos Admin',
  description: 'RMA queue with WhatsApp customer updates',
};

export default function AdminReturnsPage() {
  return <AdminReturnsClient />;
}
