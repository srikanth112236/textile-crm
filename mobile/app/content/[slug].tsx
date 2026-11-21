import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Page = { title: string; intro: string; sections: Array<{ heading: string; body: string[] }> };

const PAGES: Record<string, Page> = {
  about: {
    title: 'About Mentoos',
    intro:
      'Mentoos is a modern Indian menswear label. We design oversized tees, kurtas, cargos and essentials in-house, then make them in small batches so quality never slips.',
    sections: [
      {
        heading: 'How we design',
        body: [
          'Every style starts with fabric: combed cotton, European linen, and bio-washed fleece. We test shrinkage and colour-fastness before a style goes live.',
          'Fits are graded on real bodies, not just size charts — that is why our size guide includes chest, length and waist for every style.',
        ],
      },
      {
        heading: 'Made responsibly',
        body: [
          'We work with a small set of partner factories in Tiruppur and Bengaluru, audited yearly.',
          'Offcuts are recycled into packaging filler and our polybags are recycled LDPE.',
        ],
      },
    ],
  },
  shipping: {
    title: 'Shipping & delivery',
    intro: 'Orders ship from Bengaluru within 24–48 hours on business days. Delivery timelines depend on your PIN code.',
    sections: [
      {
        heading: 'Charges',
        body: [
          'Free standard shipping on orders over ₹1,999.',
          'Below that, a flat ₹99 is added at checkout. Exact courier charges are shown before you pay.',
          'Cash-on-delivery orders may need a small advance for high-value baskets.',
        ],
      },
      {
        heading: 'Timelines',
        body: [
          'Metros: 2–4 business days. Rest of India: 4–7 business days.',
          'You get a tracking link by email and SMS as soon as the courier scans the parcel.',
        ],
      },
      {
        heading: 'Serviceability',
        body: ['We deliver to 24,000+ PIN codes. If your PIN code is not serviceable we will contact you within 24 hours.'],
      },
    ],
  },
  returns: {
    title: 'Returns & refunds',
    intro: 'Changed your mind? You have 30 days from delivery to return or exchange an item.',
    sections: [
      {
        heading: 'Eligibility',
        body: [
          'Items must be unworn, unwashed and have original tags attached.',
          'Innerwear, socks and altered garments cannot be returned for hygiene reasons.',
        ],
      },
      {
        heading: 'How to return',
        body: [
          'Open Orders → select the order → Start a return.',
          'Choose a pickup slot. Once the parcel reaches our warehouse, refunds are issued in 3–5 business days.',
        ],
      },
      {
        heading: 'Refund method',
        body: [
          'Prepaid orders are refunded to the original payment method or UPI.',
          'COD orders are refunded to a bank account or UPI ID you provide.',
        ],
      },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    intro: 'Quick answers to the things customers ask us most.',
    sections: [
      {
        heading: 'How do I pick a size?',
        body: [
          'Every product page has a size guide with chest, length and waist in inches. If you are between sizes on oversized fits, size down.',
        ],
      },
      {
        heading: 'Can I edit my order?',
        body: [
          'You can cancel or change an address from Orders until the parcel is packed. After that, contact support and we will intercept it if possible.',
        ],
      },
      {
        heading: 'Do you restock sold-out sizes?',
        body: ['Most core styles restock every 3–4 weeks. Subscribe to a stock alert on the product page to be notified.'],
      },
    ],
  },
  support: {
    title: 'Help & support',
    intro: 'Real humans, 9am–7pm IST, Monday to Saturday.',
    sections: [
      {
        heading: 'Chat with us',
        body: ['WhatsApp +91 90000 00000 and quote your order number for the fastest response.'],
      },
      {
        heading: 'Email',
        body: ['care@mentoos.com — we reply within one business day.'],
      },
      {
        heading: 'Order issues',
        body: [
          'Missing item, wrong size delivered, or damaged in transit? Send a photo within 48 hours of delivery and we will replace it.',
        ],
      },
    ],
  },
  contact: {
    title: 'Contact us',
    intro: 'We would love to hear from you.',
    sections: [
      {
        heading: 'Customer care',
        body: ['WhatsApp: +91 90000 00000', 'Email: care@mentoos.com', 'Hours: Mon–Sat, 9am–7pm IST'],
      },
      {
        heading: 'Registered office',
        body: ['Mentoos Apparel, Somandepalle, Andhra Pradesh 515001, India'],
      },
    ],
  },
  terms: {
    title: 'Terms of service',
    intro: 'By using mentoos.com or the Mentoos app you agree to these terms.',
    sections: [
      {
        heading: 'Orders and pricing',
        body: [
          'Prices are in INR and include GST unless stated otherwise.',
          'We may cancel an order if an item is mispriced or out of stock, and will refund you in full.',
        ],
      },
      {
        heading: 'Accounts',
        body: ['You are responsible for keeping your login secure. Do not share OTPs with anyone, including our staff.'],
      },
      {
        heading: 'Liability',
        body: ['Our liability for any order is limited to the amount paid for that order.'],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'We collect only what we need to fulfil your order and improve the store.',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Contact details, delivery addresses, order history and device information for fraud prevention.',
          'Payment data is handled by our payment partner; we never store your card or UPI credentials.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          'You can export or delete your account data from Account → Personal details.',
          'Marketing messages are opt-in and can be turned off any time.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie policy',
    intro: 'We use a small number of cookies and local storage keys to keep your bag and session working.',
    sections: [
      {
        heading: 'Essential',
        body: ['Session, cart and security cookies. The store cannot work without these.'],
      },
      {
        heading: 'Analytics',
        body: ['Aggregated, anonymised page-view and funnel data so we know which pages need work.'],
      },
    ],
  },
};

export default function ContentScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = PAGES[slug ?? ''] ?? null;

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2 px-4">
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent">
          <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
        </Pressable>
        <Text className="text-h2 text-foreground flex-1" numberOfLines={1}>
          {page?.title ?? 'Information'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        {!page ? (
          <Text className="text-label text-muted-foreground">This page isn’t available yet.</Text>
        ) : (
          <>
            <Text className="text-h1 text-foreground">{page.title}</Text>
            <Text className="text-body text-muted-foreground mt-2">{page.intro}</Text>

            {page.sections.map((section) => (
              <View key={section.heading} className="mt-6 gap-2">
                <Text className="text-h2 text-foreground">{section.heading}</Text>
                {section.body.map((paragraph) => (
                  <Text key={paragraph} className="text-body text-muted-foreground">
                    {paragraph}
                  </Text>
                ))}
              </View>
            ))}

            <Text className="text-caption text-muted-foreground mt-8">
              Last updated November 2026 · Prices in INR
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
