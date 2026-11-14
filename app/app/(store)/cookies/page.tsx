import { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = {
  title: 'Cookie Policy | Mentoos',
  description: 'How Mentoos uses cookies and similar technologies, and how you can control them.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <InfoPage
      title="Cookie Policy"
      intro="Cookies help the store remember your session, cart and preferences. Here is what we use and why."
      sections={[
        {
          heading: 'Essential cookies',
          body: [
            'Required for login, session security, cart persistence and checkout. The store cannot work correctly without them.',
          ],
        },
        {
          heading: 'Preference cookies',
          body: [
            'Remember choices such as your preferred language or dismissed banners so you do not see the same prompt repeatedly.',
          ],
        },
        {
          heading: 'Analytics cookies',
          body: [
            'Help us understand which pages are used most and where shoppers run into problems. Data is aggregated and used to improve the store.',
          ],
        },
        {
          heading: 'Marketing cookies',
          body: [
            'Used only where permitted to measure campaigns and show relevant offers. You can decline non-essential cookies from the cookie banner.',
          ],
        },
        {
          heading: 'Managing cookies',
          body: [
            'You can clear or block cookies in your browser settings. Blocking essential cookies may prevent checkout and account features from working.',
          ],
        },
      ]}
    />
  );
}
