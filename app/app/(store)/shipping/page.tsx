import { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = {
  title: 'Shipping Information | Mentoos',
  description: 'Dispatch times, delivery estimates, shipping charges and COD availability at Mentoos.',
  alternates: { canonical: '/shipping' },
};

export default function ShippingPage() {
  return (
    <InfoPage
      title="Shipping Information"
      intro="Everything you need to know about dispatch, delivery timelines and shipping charges."
      sections={[
        {
          heading: 'Dispatch',
          body: [
            'Orders are packed and handed to our courier partner within 24–48 hours of confirmation (excluding Sundays and public holidays).',
          ],
        },
        {
          heading: 'Delivery timelines',
          body: [
            'Metro cities usually receive orders in 2–4 working days. Other serviceable PIN codes take 3–7 working days. Remote areas may take slightly longer.',
            'You will receive tracking details by SMS/WhatsApp/email once the courier picks up your parcel.',
          ],
        },
        {
          heading: 'Shipping charges',
          body: [
            'Shipping is free on orders above ₹999. Below that, a flat shipping charge of ₹55 applies (configured in Store Settings).',
            'Cash on Delivery may require a small prepaid confirmation advance depending on the order value and delivery PIN code.',
          ],
        },
        {
          heading: 'Serviceability',
          body: [
            'Use the PIN code checker on any product page to confirm delivery and COD availability for your address.',
          ],
        },
      ]}
    />
  );
}
