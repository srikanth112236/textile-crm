import { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = {
  title: 'Returns & Exchanges | Mentoos',
  description: 'Mentoos 7-day exchange and return policy, eligibility and how to raise a request.',
  alternates: { canonical: '/returns' },
};

export default function ReturnsPage() {
  return (
    <InfoPage
      title="Returns & Exchanges"
      intro="We want you to love what you ordered. If the fit or style isn’t right, you can request an exchange or return within 7 days of delivery."
      sections={[
        {
          heading: 'Eligibility',
          body: [
            'Items must be unused, unwashed and returned with original tags and packaging.',
            'Innerwear, boxers and altered items are not eligible for return for hygiene reasons.',
          ],
        },
        {
          heading: 'How to request',
          body: [
            'Open My Orders → select the order → choose Return / Exchange and follow the steps. You can also contact support with your order number.',
            'Once approved, our courier partner will arrange a pickup where serviceable. Refunds are processed to the original payment method after quality check.',
          ],
        },
        {
          heading: 'Exchanges',
          body: [
            'Size exchanges are free for the first request, subject to stock availability. If the requested size is unavailable, we will offer a refund or store credit.',
          ],
        },
        {
          heading: 'Refund timelines',
          body: [
            'Prepaid refunds are usually completed within 5–7 business days after pickup and inspection. COD orders are refunded via UPI or bank transfer.',
          ],
        },
      ]}
    />
  );
}
