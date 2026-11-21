import { formatPrice } from '@/lib/format';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export function discountPercent(price: number, compareAtPrice?: number) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}

type Props = {
  price: number;
  compareAtPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  showSavePill?: boolean;
};

export function Price({ price, compareAtPrice, size = 'md', showSavePill = false }: Props) {
  const off = discountPercent(price, compareAtPrice);
  const priceClass =
    size === 'lg' ? 'text-h2' : size === 'sm' ? 'text-label' : 'text-body';

  return (
    <View className="flex-row flex-wrap items-baseline gap-1.5">
      <Text className={`${priceClass} text-foreground font-semibold`}>{formatPrice(price)}</Text>
      {off > 0 ? (
        <>
          <Text className="text-caption text-muted-foreground line-through">
            {formatPrice(compareAtPrice!)}
          </Text>
          {showSavePill ? (
            <View className="bg-sale/10 rounded-full px-2 py-0.5">
              <Text className="text-caption text-sale font-semibold">{off}% off</Text>
            </View>
          ) : (
            <Text className="text-caption text-sale font-semibold">−{off}%</Text>
          )}
        </>
      ) : null}
    </View>
  );
}
