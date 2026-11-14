import { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = {
  title: 'Contact Us | Mentoos',
  description: 'Get in touch with the Mentoos support team for orders, exchanges, payments and delivery help.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact Us"
      intro="Questions about an order, size, payment or delivery? Our support team is here to help."
      sections={[
        {
          heading: 'Email',
          body: [
            'Write to support@mentoos.in with your order number and registered mobile number. We reply within one business day.',
          ],
        },
        {
          heading: 'WhatsApp',
          body: [
            'For quick order updates and exchange requests, message us on WhatsApp at +91 98765 43210 during support hours (Mon–Sat, 10:00–18:00 IST).',
          ],
        },
        {
          heading: 'Order tracking',
          body: [
            'You can track any order any time from the Track Order page using your order number and registered mobile number.',
          ],
        },
        {
          heading: 'Business enquiries',
          body: [
            'For bulk orders, collaborations or wholesale enquiries, email support@mentoos.in with the subject line “Business enquiry”.',
          ],
        },
      ]}
    />
  );
}
