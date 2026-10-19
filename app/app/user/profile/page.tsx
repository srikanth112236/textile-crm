import { Metadata } from 'next';
import ProfileClient from '@/components/profile/ProfileClient';

export const metadata: Metadata = {
  title: 'My Profile | Mentoos',
  description: 'Manage your profile, addresses, and account settings',
};

export default function UserProfilePage() {
  return <ProfileClient />;
}
