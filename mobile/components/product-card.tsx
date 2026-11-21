import { discountPercent } from '@/components/price';
import { SmartImage } from '@/components/smart-image';
import { Text } from '@/components/ui/text';
import type { Product } from '@/lib/api/types';
import { productImages } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import { Link } from 'expo-router';
import { StarIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type Props = {
  product: Product;
  width?: number | 'flex';
  compact?: boolean;
};

export function ProductCard({ product, width = 'flex', compact = false }: Props) {
  const image = productImages(product)[0];
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0 || product.status === 'out_of_stock';
  const badge = product.badges?.find((entry) => entry === 'new' || entry === 'bestseller' || entry === 'limited');

  return (
    <Link href={{ pathname: '/product/[id]', params: { id: product._id } }} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={product.name}
        className="active:opacity-85"
        style={width === 'flex' ? { flex: 1 } : { width }}>
        <View
          className="bg-muted w-full overflow-hidden rounded-xl"
          style={{ aspectRatio: compact ? 1 : 0.78 }}>
          <SmartImage uri={image} style={{ width: '100%', height: '100%' }} />

          <View className="absolute left-2 top-2 gap-1">
            {off > 0 ? (
              <View className="bg-sale rounded-full px-2 py-0.5">
                <Text className="text-caption text-sale-foreground font-semibold">−{off}%</Text>
              </View>
            ) : null}
            {badge ? (
              <View className="bg-background/95 rounded-full px-2 py-0.5">
                <Text className="text-caption text-foreground font-semibold uppercase">{badge}</Text>
              </View>
            ) : null}
          </View>

          {soldOut ? (
            <View className="bg-background/70 absolute inset-0 items-center justify-center">
              <View className="bg-background rounded-full px-3 py-1">
                <Text className="text-caption text-foreground font-medium">Sold out</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View className="mt-2 gap-0.5">
          {product.brand?.name ? (
            <Text className="text-caption text-muted-foreground" numberOfLines={1}>
              {product.brand.name}
            </Text>
          ) : null}
          <Text className="text-body text-foreground font-medium leading-5" numberOfLines={2}>
            {product.name}
          </Text>
          <View className="mt-0.5 flex-row items-baseline gap-1.5">
            <Text className="text-label text-foreground font-semibold">
              {formatPrice(product.price)}
            </Text>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <Text className="text-caption text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </Text>
            ) : null}
          </View>
          {!compact && (product.averageRating ?? 0) > 0 ? (
            <View className="flex-row items-center gap-1">
              <Icon as={StarIcon} size={10} className="fill-sale text-sale" />
              <Text className="text-caption text-muted-foreground">
                {(product.averageRating ?? 0).toFixed(1)}
                {product.totalReviews ? ` (${product.totalReviews})` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  const rows: Product[][] = [];
  for (let index = 0; index < products.length; index += 2) {
    rows.push(products.slice(index, index + 2));
  }

  return (
    <View className="gap-5">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-3">
          {row.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}
