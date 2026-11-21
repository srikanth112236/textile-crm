import { Text } from '@/components/ui/text';
import * as React from 'react';

/**
 * Storefront wordmark: MENTOOS + amber period, matching the web header
 * (`app/components/navigation/Header.tsx`).
 */
export function Wordmark({
  size = 'md',
  inverted = false,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  inverted?: boolean;
  className?: string;
}) {
  const sizeClass =
    size === 'xl'
      ? 'text-[40px] leading-[46px] tracking-[4px]'
      : size === 'lg'
        ? 'text-[30px] leading-[36px] tracking-[3px]'
        : size === 'sm'
          ? 'text-[15px] leading-[20px] tracking-[2px]'
          : 'text-[21px] leading-[26px] tracking-[2.5px]';

  return (
    <Text
      className={`${sizeClass} font-extrabold uppercase ${
        inverted ? 'text-white' : 'text-foreground'
      } ${className}`}>
      Mentoos
      <Text className={`${sizeClass} font-extrabold uppercase text-brand`}>.</Text>
    </Text>
  );
}
