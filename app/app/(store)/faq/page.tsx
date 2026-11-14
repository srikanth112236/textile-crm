import { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = {
  title: 'Mentoos FAQs: Orders, Sizes, Shipping & Returns',
  description: 'Frequently asked questions about orders, sizes, payments, shipping and returns at Mentoos.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <InfoPage
      title="Frequently Asked Questions"
      intro="Quick answers to the questions we hear most often."
      sections={[
        {
          heading: 'How do I choose the right size?',
          body: [
            'Every product page has a Size Guide and Find My Size tool. If you are between sizes and prefer a relaxed fit, size up.',
          ],
        },
        {
          heading: 'Can I order without creating an account?',
          body: [
            'Yes — guest checkout is available. Add your address during checkout and track the order later with your order number and mobile number.',
          ],
        },
        {
          heading: 'What payment methods do you accept?',
          body: [
            'UPI, debit/credit cards, netbanking and wallets are processed securely through Razorpay. Cash on Delivery is available on serviceable PIN codes, sometimes with a small prepaid advance.',
          ],
        },
        {
          heading: 'How do coupons work?',
          body: [
            'Apply a coupon in the cart or on the express checkout payment page. The discount is validated on the server and applied to your final total.',
          ],
        },
        {
          heading: 'When will my order arrive?',
          body: [
            'Orders dispatch in 24–48 hours and usually arrive in 3–5 working days. Use Track Order for live updates.',
          ],
        },
        {
          heading: 'Can I change my delivery address after ordering?',
          body: [
            'Contact support as soon as possible. If the order has not been dispatched, we can usually update the address.',
          ],
        },
      ]}
    />
  );
}
