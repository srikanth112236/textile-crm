import { Metadata } from 'next';
import UgcClient from './UgcClient';

export const metadata: Metadata = {
  title: 'UGC & Social | Mentoos Admin',
  description: 'Manage customer videos, Instagram feed and featured social proof',
};

export default function UgcAdminPage() {
  return <UgcClient />;
}
