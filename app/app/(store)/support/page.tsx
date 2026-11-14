import { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = {
  title: 'Support | Mentoos',
  description: 'Mentoos customer support — order help, payments, delivery, returns and account assistance.',
  alternates: { canonical: '/support' },
};

export default function SupportPage() {
  return (
    <InfoPage
      title="Customer Support"
      intro="We are here to make every order easy — before, during and after delivery."
      sections={[
        {
          heading: 'Order help',
          body: [
            'For order status, address changes or delivery issues, share your order number and registered mobile number with our team.',
          ],
        },
        {
          heading: 'Payments & refunds',
          body: [
            'If a payment was deducted but the order shows pending, contact us with the payment reference. Refunds are tracked under My Refunds.',
          ],
        },
        {
          heading: 'Returns & exchanges',
          body: [
            'Raise a request from My Orders within 7 days of delivery. For damaged or wrong items, attach a photo so we can resolve it faster.',
          ],
        },
        {
          heading: 'Account assistance',
          body: [
            'For login, OTP or profile issues, email support@mentoos.in from your registered email address.',
          ],
        },
        {
          heading: 'Hours',
          body: ['Monday to Saturday, 10:00–18:00 IST. We aim to reply to every message within one business day.'],
        },
      ]}
    />
  );
}
