import { QuantityStepper } from '@/components/quantity-stepper';
import { SmartImage } from '@/components/smart-image';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { settingsApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { FREE_SHIPPING_FALLBACK, useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { LogInIcon, ShoppingBagIcon, TagIcon, Trash2Icon, TruckIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const { lines, itemCount, subtotal, savings, isLoading, isMutating, setQuantity, remove, clear, error } = useCart();

  const settings = useQuery({
    queryKey: qk.settings,
    queryFn: async () => (await settingsApi.get()).data,
    staleTime: 5 * 60_000,
  });

  const threshold =
    Number(settings.data?.shipping?.freeShippingThreshold ?? FREE_SHIPPING_FALLBACK) || FREE_SHIPPING_FALLBACK;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, threshold > 0 ? (subtotal / threshold) * 100 : 100);

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center" style={{ paddingTop: insets.top }}>
        <Text className="text-label text-muted-foreground">Loading your bag…</Text>
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-8" style={{ paddingTop: insets.top }}>
        <View className="bg-muted h-20 w-20 items-center justify-center rounded-full">
          <Icon as={ShoppingBagIcon} size={30} className="text-muted-foreground" />
        </View>
        <Text className="text-h2 text-foreground mt-5">Your bag is empty</Text>
        <Text className="text-label text-muted-foreground mt-1 text-center">
          Free shipping over {formatPrice(threshold)} and 30-day returns on everything.
        </Text>
        <Link href="/" asChild>
          <Button className="mt-5 px-6">
            <Text>Start shopping</Text>
          </Button>
        </Link>
      </View>
    );
  }

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-baseline justify-between px-4">
        <View>
          <Text className="text-h1 text-foreground">Your bag</Text>
          <Text className="text-label text-muted-foreground mt-0.5">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
            {savings > 0 ? ` · saving ${formatPrice(savings)}` : ''}
          </Text>
        </View>
        <Pressable onPress={() => void clear()} hitSlop={8} className="active:opacity-60">
          <Text className="text-caption text-muted-foreground underline">Clear</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        {!isSignedIn ? (
          <Link href="/auth" asChild>
            <Pressable className="border-border bg-secondary mx-4 mt-4 flex-row items-center gap-2 rounded-xl border px-3 py-2.5 active:opacity-80">
              <Icon as={LogInIcon} size={15} className="text-secondary-foreground" />
              <Text className="text-caption text-secondary-foreground flex-1">
                You’re shopping as a guest. Sign in to sync your bag across devices.
              </Text>
              <Text className="text-caption text-foreground font-semibold">Sign in</Text>
            </Pressable>
          </Link>
        ) : null}

        {error ? (
          <View className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <Text className="text-caption text-destructive">{error}</Text>
          </View>
        ) : null}

        {/* Free shipping progress */}
        <View className="border-border mx-4 mt-4 rounded-xl border p-3">
          <View className="flex-row items-center gap-2">
            <Icon as={TruckIcon} size={15} className="text-foreground" />
            <Text className="text-caption text-foreground flex-1">
              {remaining > 0 ? `Add ${formatPrice(remaining)} for free shipping` : 'Free shipping unlocked 🎉'}
            </Text>
          </View>
          <View className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
            <View className="bg-success h-full rounded-full" style={{ width: `${progress}%` }} />
          </View>
        </View>

        {/* Lines */}
        <View className="mt-4 gap-4 px-4">
          {lines.map((line) => (
            <View key={line.key} className="flex-row gap-3">
              <Link href={{ pathname: '/product/[id]', params: { id: line.productId } }} asChild>
                <Pressable>
                  <SmartImage
                    uri={line.image}
                    style={{ width: 78, height: 98, borderRadius: 10 }}
                  />
                </Pressable>
              </Link>

              <View className="flex-1 justify-between">
                <View>
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="text-body text-foreground flex-1 font-medium" numberOfLines={2}>
                      {line.name}
                    </Text>
                    <Pressable
                      accessibilityLabel={`Remove ${line.name}`}
                      hitSlop={10}
                      disabled={isMutating}
                      onPress={() => void remove(line.key)}
                      className="active:opacity-60">
                      <Icon as={Trash2Icon} size={16} className="text-muted-foreground" />
                    </Pressable>
                  </View>
                  {line.variations.length > 0 ? (
                    <Text className="text-caption text-muted-foreground mt-0.5">
                      {line.variations.map((variation) => variation.value).join(' · ')}
                    </Text>
                  ) : null}
                  {line.stock !== undefined && line.stock > 0 && line.stock <= 5 ? (
                    <Text className="text-caption text-sale mt-0.5">Only {line.stock} left</Text>
                  ) : null}
                </View>

                <View className="flex-row items-center justify-between">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(next) => void setQuantity(line.key, next)}
                    size="sm"
                    max={Math.min(10, line.stock && line.stock > 0 ? line.stock : 10)}
                  />
                  <Text className="text-body text-foreground font-semibold">
                    {formatPrice(line.price * line.quantity)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View className="border-border mt-6 border-t px-4 pt-4">
          <Row label="Subtotal" value={formatPrice(subtotal)} />
          {savings > 0 ? <Row label="You save" value={`− ${formatPrice(savings)}`} success /> : null}
          <Row label="Shipping" value={remaining > 0 ? 'Calculated at checkout' : 'Free'} muted />
          <View className="border-border mt-2 border-t pt-2">
            <Row label="Total" value={formatPrice(subtotal)} strong />
          </View>
          <Text className="text-caption text-muted-foreground mt-2">
            Taxes and shipping are confirmed at checkout.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="border-border bg-background border-t px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          className="h-12"
          disabled={isMutating}
          onPress={() => router.push(isSignedIn ? '/checkout' : '/auth')}>
          <Text className="text-body font-semibold">
            {isSignedIn ? 'Checkout' : 'Sign in to checkout'}
          </Text>
        </Button>
        <View className="mt-2 flex-row items-center justify-center gap-1.5">
          <Icon as={TagIcon} size={12} className="text-muted-foreground" />
          <Text className="text-caption text-muted-foreground">Coupons and loyalty points at checkout</Text>
        </View>
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
  success,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  success?: boolean;
}) {
  return (
    <View className="flex-row items-baseline justify-between py-1">
      <Text className={`text-label ${strong ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
        {label}
      </Text>
      <Text
        className={`${strong ? 'text-body font-semibold' : 'text-label'} ${
          success ? 'text-success' : muted ? 'text-muted-foreground' : 'text-foreground'
        }`}>
        {value}
      </Text>
    </View>
  );
}
