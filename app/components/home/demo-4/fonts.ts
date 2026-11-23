import { Bebas_Neue, DM_Sans } from 'next/font/google';

export const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
  weight: '400',
});

export const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});
