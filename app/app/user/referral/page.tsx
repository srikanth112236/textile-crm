import { Metadata } from 'next';
import { ReferralProgram } from '@/components/store/ReferralProgram';

export const metadata: Metadata = {
  title: 'Refer a Friend | Mentoos',
  description: 'Invite friends to Mentoos and earn rewards for every successful referral.',
};

export default function ReferralPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ReferralProgram />
    </div>
  );
}
