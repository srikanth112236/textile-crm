import { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = {
  title: 'About Us | Mentoos',
  description: 'The story behind Mentoos — modern men’s fashion built for everyday confidence.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <InfoPage
      title="About Mentoos"
      intro="Mentoos makes modern men’s essentials — heavyweight tees, relaxed shirts, trousers and ethnic wear — designed to look sharp, feel comfortable and last longer."
      sections={[
        {
          heading: 'Built for everyday wear',
          body: [
            'We focus on fabric, fit and finish. Every style is sampled, washed and tested before it reaches the store so sizing and colour stay consistent.',
            'Our core collection runs from breathable cotton tees to occasion-ready kurtas, with new drops added through the year.',
          ],
        },
        {
          heading: 'Direct-to-you pricing',
          body: [
            'By designing and selling directly, we keep margins honest and prices transparent. No inflated MRPs — just fair prices with regular offers and loyalty rewards.',
          ],
        },
        {
          heading: 'Here when you need us',
          body: [
            'Orders are dispatched from our warehouse with live tracking, COD availability on serviceable PIN codes and a 7-day exchange window.',
          ],
        },
      ]}
    />
  );
}
