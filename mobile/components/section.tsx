import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { Product } from '@/lib/api/types';
import { Link } from 'expo-router';
import { ArrowRightIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  href?: string;
  action?: string;
  className?: string;
};

export function SectionHeader({ title, subtitle, href, action = 'See all', className = '' }: SectionHeaderProps) {
  return (
    <View className={`flex-row items-end justify-between gap-3 ${className}`}>
      <View className="flex-1">
        <Text className="text-h2 text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="text-label text-muted-foreground mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      {href ? (
        <Link href={href as never} asChild>
          <Pressable hitSlop={10} className="flex-row items-center gap-1 active:opacity-60">
            <Text className="text-label text-foreground font-medium">{action}</Text>
            <Icon as={ArrowRightIcon} size={14} className="text-foreground" />
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

type RailProps = {
  title: string;
  subtitle?: string;
  href?: string;
  products: Product[] | undefined;
  loading?: boolean;
  cardWidth?: number;
};

export function ProductRail({ title, subtitle, href, products, loading, cardWidth = 158 }: RailProps) {
  if (!loading && (!products || products.length === 0)) return null;

  return (
    <View className="gap-3">
      <SectionHeader title={title} subtitle={subtitle} href={href} className="px-4" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {loading
          ? Array.from({ length: 3 }).map((_, index) => <RailSkeleton key={index} width={cardWidth} />)
          : products?.map((product) => (
              <ProductCard key={product._id} product={product} width={cardWidth} />
            ))}
      </ScrollView>
    </View>
  );
}

export function RailSkeleton({ width = 158 }: { width?: number }) {
  return (
    <View style={{ width }}>
      <Skeleton className="rounded-xl" style={{ width, aspectRatio: 0.78 }} />
      <Skeleton className="mt-2 h-3 w-1/2 rounded" />
      <Skeleton className="mt-1.5 h-3.5 w-5/6 rounded" />
      <Skeleton className="mt-1.5 h-3.5 w-1/3 rounded" />
    </View>
  );
}
