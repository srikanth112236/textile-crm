import { Metadata } from 'next';
import DataExport from '@/components/gdpr/DataExport';
import DeleteAccount from '@/components/gdpr/DeleteAccount';

export const metadata: Metadata = {
  title: 'Account Settings | Mentoos',
  description: 'Manage your account settings, privacy, and data',
};

export default function UserSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your privacy and account data
        </p>
      </div>

      <div className="space-y-6">
        <DataExport />
        <DeleteAccount />
      </div>
    </div>
  );
}
