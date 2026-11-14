import { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = {
  title: 'Terms of Service | Mentoos',
  description: 'The terms that apply when you browse, create an account or place an order with Mentoos.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      intro="By using the Mentoos website you agree to these terms. Please read them along with our Privacy Policy."
      sections={[
        {
          heading: 'Accounts',
          body: [
            'You are responsible for keeping your login details secure and for all activity on your account. Provide accurate contact and delivery information so orders can be fulfilled.',
          ],
        },
        {
          heading: 'Orders and pricing',
          body: [
            'All prices are in Indian Rupees and include applicable taxes unless stated otherwise. We may cancel an order if an item is mispriced, unavailable or fails fraud checks; any amount paid will be refunded.',
          ],
        },
        {
          heading: 'Payments',
          body: [
            'Online payments are processed by third-party payment providers. Cash on Delivery may require a prepaid confirmation advance, which is adjusted against the order total.',
          ],
        },
        {
          heading: 'Delivery and returns',
          body: [
            'Delivery timelines are estimates. Returns and exchanges are governed by our Returns & Exchanges policy.',
          ],
        },
        {
          heading: 'Acceptable use',
          body: [
            'Do not misuse the website, attempt unauthorised access, scrape content at scale or place fraudulent orders.',
          ],
        },
        {
          heading: 'Contact',
          body: ['Questions about these terms can be sent to support@mentoos.in.'],
        },
      ]}
    />
  );
}
