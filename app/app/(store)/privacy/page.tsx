import { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | Mentoos',
  description: 'How Mentoos collects, uses and protects your personal information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="This policy explains what information we collect, why we collect it and how you can control it."
      sections={[
        {
          heading: 'Information we collect',
          body: [
            'Account details such as name, email address, mobile number and saved delivery addresses.',
            'Order information including items purchased, payment status and delivery updates. We never store full card numbers or UPI credentials — payments are processed by Razorpay.',
            'Basic technical data such as device type and pages visited, used to keep the store secure and improve the experience.',
          ],
        },
        {
          heading: 'How we use it',
          body: [
            'To process orders, arrange delivery, provide support, prevent fraud and send transactional updates about your orders.',
            'With your consent, to send offers and product updates. You can opt out at any time.',
          ],
        },
        {
          heading: 'Sharing',
          body: [
            'We share only what is necessary with delivery partners, payment processors and service providers. We do not sell your personal data.',
          ],
        },
        {
          heading: 'Your rights',
          body: [
            'You can access, correct or delete your personal data from your account settings or by contacting support. Some records may be retained where required by law.',
          ],
        },
        {
          heading: 'Security',
          body: [
            'We use encryption in transit, access controls and audit logging to protect account and order data.',
          ],
        },
      ]}
    />
  );
}
