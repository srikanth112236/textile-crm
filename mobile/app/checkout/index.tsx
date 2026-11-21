import { Sheet } from '@/components/sheet';
import { SmartImage } from '@/components/smart-image';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { discountsApi, ordersApi, profileApi, settingsApi, shipmentApi } from '@/lib/api/endpoints';
import type { Address } from '@/lib/api/types';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  BanknoteIcon,
  CheckIcon,
  ChevronLeftIcon,
  CreditCardIcon,
  MapPinIcon,
  PlusIcon,
  TagIcon,
  TruckIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMPTY_ADDRESS: Address = { street: '', city: '', state: '', zip: '', country: 'India', isDefault: false };

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const { lines, subtotal, savings, itemCount, clear } = useCart();
  const queryClient = useQueryClient();

  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);
  const [addressSheet, setAddressSheet] = React.useState(false);
  const [draft, setDraft] = React.useState<Address>(EMPTY_ADDRESS);
  const [payment, setPayment] = React.useState<'cod' | 'online'>('cod');
  const [coupon, setCoupon] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const addresses = useQuery({
    queryKey: qk.addresses,
    queryFn: async () => (await profileApi.addresses()).data,
    enabled: isSignedIn,
  });

  const settings = useQuery({
    queryKey: qk.settings,
    queryFn: async () => (await settingsApi.get()).data,
    staleTime: 5 * 60_000,
  });

  const addresses_ = addresses.data ?? [];
  const selected = addresses_.find((address) => address._id === selectedAddressId) ?? addresses_.find((address) => address.isDefault) ?? addresses_[0];

  React.useEffect(() => {
    if (!selectedAddressId && addresses_.length > 0) {
      setSelectedAddressId((addresses_.find((address) => address.isDefault) ?? addresses_[0])._id ?? null);
    }
  }, [addresses_, selectedAddressId]);

  const items = React.useMemo(
    () => lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
    [lines]
  );

  const quote = useQuery({
    queryKey: ['shipping-quote', selected?.zip, subtotal, payment, items.map((item) => item.productId).join(',')],
    queryFn: async () =>
      (
        await shipmentApi.quote({
          pincode: selected?.zip ?? '',
          paymentMethod: payment === 'cod' ? 'cod' : 'razorpay',
          orderValue: subtotal,
          items,
        })
      ).data,
    enabled: Boolean(selected?.zip) && items.length > 0,
    staleTime: 60_000,
  });

  const codQuote = useQuery({
    queryKey: ['cod-quote', subtotal, selected?.zip],
    queryFn: async () => (await settingsApi.codQuote({ orderValue: subtotal, pincode: selected?.zip })).data,
    enabled: items.length > 0 && payment === 'cod',
    staleTime: 60_000,
  });

  const saveAddress = useMutation({
    mutationFn: async (address: Address) => profileApi.createAddress(address),
    onSuccess: async (response) => {
      setAddressSheet(false);
      setDraft(EMPTY_ADDRESS);
      setSelectedAddressId(response.data._id ?? null);
      await queryClient.invalidateQueries({ queryKey: qk.addresses });
    },
    onError: (cause) => setError((cause as Error).message),
  });

  const applyCoupon = useMutation({
    mutationFn: async () =>
      (
        await discountsApi.validate({
          code: coupon.trim().toUpperCase(),
          items,
          orderTotal: subtotal,
        })
      ).data,
    onSuccess: (data) => {
      setCouponError(null);
      setAppliedCoupon({ code: data.code, discount: data.discount });
    },
    onError: (cause) => {
      setAppliedCoupon(null);
      setCouponError((cause as Error).message);
    },
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('Add a delivery address first.');
      const response = await ordersApi.create({
        shippingAddress: {
          street: selected.street,
          city: selected.city,
          state: selected.state,
          zip: selected.zip,
          country: selected.country || 'India',
        },
        paymentMethod: payment === 'cod' ? 'cod' : 'razorpay',
        discountCode: appliedCoupon?.code,
      });
      return response.data;
    },
    onSuccess: async (order) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Navigate first so the empty-bag guard never flashes on the way out.
      router.replace({ pathname: '/orders/[id]', params: { id: order._id, placed: '1' } });
      void queryClient.invalidateQueries({ queryKey: qk.orders() });
      await clear();
    },
    onError: (cause) => setError((cause as Error).message),
  });

  const shipping = quote.data?.charge ?? 0;
  const discount = appliedCoupon?.discount ?? 0;
  const codAdvance = codQuote.data?.advance ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;
  const codEnabled = codQuote.data?.codAllowed ?? true;

  if (!isSignedIn) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-3 px-8" style={{ paddingTop: insets.top }}>
        <Text className="text-h2 text-foreground text-center">Sign in to checkout</Text>
        <Text className="text-label text-muted-foreground text-center">
          Your bag is saved. Sign in to add a delivery address and place the order.
        </Text>
        <Button className="mt-2" onPress={() => router.push('/auth')}>
          <Text>Sign in or create account</Text>
        </Button>
      </View>
    );
  }

  if (itemCount === 0) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-3 px-8" style={{ paddingTop: insets.top }}>
        <Text className="text-h2 text-foreground">Your bag is empty</Text>
        <Button onPress={() => router.replace('/')}>
          <Text>Continue shopping</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2 px-4 pb-2">
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/cart'))}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent">
          <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
        </Pressable>
        <Text className="text-h2 text-foreground flex-1">Checkout</Text>
        <Text className="text-caption text-muted-foreground">{itemCount} items</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Address */}
        <Section title="Delivery address" action={addresses_.length > 0 ? 'Add new' : undefined} onAction={() => setAddressSheet(true)}>
          {addresses.isLoading ? (
            <Text className="text-label text-muted-foreground">Loading addresses…</Text>
          ) : addresses_.length === 0 ? (
            <Pressable
              onPress={() => setAddressSheet(true)}
              className="border-border items-center gap-1 rounded-xl border border-dashed p-5 active:opacity-70">
              <Icon as={MapPinIcon} size={18} className="text-muted-foreground" />
              <Text className="text-label text-foreground font-medium">Add a delivery address</Text>
              <Text className="text-caption text-muted-foreground">Street, city, state and PIN code</Text>
            </Pressable>
          ) : (
            <View className="gap-2">
              {addresses_.map((address) => {
                const active = selected?._id === address._id;
                return (
                  <Pressable
                    key={address._id ?? address.zip}
                    onPress={() => setSelectedAddressId(address._id ?? null)}
                    className={`flex-row gap-3 rounded-xl border p-3 active:opacity-80 ${
                      active ? 'border-primary bg-primary/5' : 'border-border'
                    }`}>
                    <View
                      className={`mt-0.5 h-4 w-4 items-center justify-center rounded-full border ${
                        active ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                      {active ? <CheckIcon size={10} color="#F8FAFC" /> : null}
                    </View>
                    <View className="flex-1">
                      <Text className="text-body text-foreground font-medium">
                        {address.street}
                      </Text>
                      <Text className="text-caption text-muted-foreground mt-0.5">
                        {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                      </Text>
                      {address.isDefault ? (
                        <Text className="text-caption text-success mt-1">Default address</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Section>

        {/* Shipping */}
        <Section title="Delivery">
          {!selected?.zip ? (
            <Text className="text-label text-muted-foreground">
              Add an address to see delivery charges and timings.
            </Text>
          ) : quote.isLoading ? (
            <Text className="text-label text-muted-foreground">Checking delivery options…</Text>
          ) : quote.data ? (
            <View className="flex-row items-center gap-3 rounded-xl border border-border p-3">
              <Icon as={TruckIcon} size={18} className="text-foreground" />
              <View className="flex-1">
                <Text className="text-label text-foreground font-medium">
                  {quote.data.source === 'free' || quote.data.charge === 0
                    ? 'Free standard delivery'
                    : `${quote.data.courierName ?? 'Standard delivery'} · ${formatPrice(quote.data.charge)}`}
                </Text>
                <Text className="text-caption text-muted-foreground">
                  {quote.data.etd
                    ? `Arrives ${quote.data.etd}`
                    : quote.data.estimatedDays
                      ? `Arrives in ${quote.data.estimatedDays} days`
                      : 'Timeline confirmed after dispatch'}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-label text-muted-foreground">
              Delivery quote unavailable for this PIN code — we’ll confirm before dispatch.
            </Text>
          )}
        </Section>

        {/* Payment */}
        <Section title="Payment method">
          <View className="gap-2">
            <PaymentOption
              active={payment === 'cod'}
              disabled={!codEnabled}
              icon={BanknoteIcon}
              title="Cash on delivery"
              subtitle={
                codAdvance > 0
                  ? `${formatPrice(codAdvance)} advance, rest on delivery`
                  : 'Pay the courier when your order arrives'
              }
              onPress={() => setPayment('cod')}
            />
            <PaymentOption
              active={payment === 'online'}
              disabled
              icon={CreditCardIcon}
              title="UPI / Cards / Netbanking"
              subtitle="Card payments arrive in the next app build — use COD for now"
              onPress={() => setPayment('online')}
            />
          </View>
        </Section>

        {/* Coupon */}
        <Section title="Coupon">
          <View className="flex-row gap-2">
            <View className="flex-1 justify-center">
              <View className="absolute left-3 z-10">
                <Icon as={TagIcon} size={16} className="text-muted-foreground" />
              </View>
              <Input
                value={coupon}
                onChangeText={(text) => {
                  setCoupon(text);
                  setCouponError(null);
                }}
                placeholder="Enter code"
                autoCapitalize="characters"
                autoCorrect={false}
                className="h-11 pl-10"
              />
            </View>
            <Button
              variant="outline"
              disabled={applyCoupon.isPending || coupon.trim().length < 2}
              onPress={() => applyCoupon.mutate()}>
              <Text>{applyCoupon.isPending ? 'Checking…' : 'Apply'}</Text>
            </Button>
          </View>
          {appliedCoupon ? (
            <View className="mt-2 flex-row items-center justify-between rounded-lg bg-success/10 px-3 py-2">
              <Text className="text-caption text-success">
                {appliedCoupon.code} applied · −{formatPrice(appliedCoupon.discount)}
              </Text>
              <Pressable onPress={() => setAppliedCoupon(null)} hitSlop={6}>
                <Text className="text-caption text-muted-foreground underline">Remove</Text>
              </Pressable>
            </View>
          ) : null}
          {couponError ? <Text className="text-caption text-destructive mt-2">{couponError}</Text> : null}
        </Section>

        {/* Items */}
        <Section title={`Order summary (${itemCount})`}>
          <View className="gap-3">
            {lines.map((line) => (
              <View key={line.key} className="flex-row items-center gap-3">
                <SmartImage uri={line.image} style={{ width: 52, height: 64, borderRadius: 8 }} />
                <View className="flex-1">
                  <Text className="text-label text-foreground" numberOfLines={2}>
                    {line.name}
                  </Text>
                  <Text className="text-caption text-muted-foreground">
                    Qty {line.quantity}
                    {line.variations.length ? ` · ${line.variations.map((entry) => entry.value).join(' / ')}` : ''}
                  </Text>
                </View>
                <Text className="text-label text-foreground font-medium">
                  {formatPrice(line.price * line.quantity)}
                </Text>
              </View>
            ))}
          </View>

          <View className="border-border mt-4 gap-1.5 border-t pt-3">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            {savings > 0 ? <Row label="Product savings" value={`− ${formatPrice(savings)}`} success /> : null}
            {discount > 0 ? <Row label="Coupon" value={`− ${formatPrice(discount)}`} success /> : null}
            <Row label="Shipping" value={quote.data ? (shipping === 0 ? 'Free' : formatPrice(shipping)) : 'Calculated next'} />
            <View className="border-border mt-1 border-t pt-2">
              <Row label="Total payable" value={formatPrice(total)} strong />
            </View>
            {payment === 'cod' && codAdvance > 0 ? (
              <Text className="text-caption text-muted-foreground mt-1">
                {formatPrice(codAdvance)} advance online, {formatPrice(Math.max(0, total - codAdvance))} on delivery.
              </Text>
            ) : null}
          </View>
        </Section>

        {error ? (
          <View className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <Text className="text-caption text-destructive">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="border-border bg-background border-t px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          className="h-12"
          disabled={!selected || placeOrder.isPending}
          onPress={() => {
            setError(null);
            placeOrder.mutate();
          }}>
          <Text className="text-body font-semibold">
            {placeOrder.isPending ? 'Placing order…' : `Place order · ${formatPrice(total)}`}
          </Text>
        </Button>
        <Text className="text-caption text-muted-foreground mt-2 text-center">
          Secure checkout · Prices include GST
        </Text>
      </View>

      {/* New address sheet */}
      <Sheet
        open={addressSheet}
        onClose={() => setAddressSheet(false)}
        title="Add delivery address"
        footer={
          <View className="flex-row gap-2 pb-1">
            <Button variant="outline" className="flex-1" onPress={() => setAddressSheet(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button
              className="flex-1"
              disabled={saveAddress.isPending}
              onPress={() => {
                setError(null);
                const required = [draft.street, draft.city, draft.state, draft.zip];
                if (required.some((value) => !value.trim())) {
                  setError('Fill in street, city, state and PIN code.');
                  return;
                }
                saveAddress.mutate({ ...draft, country: draft.country || 'India' });
              }}>
              <Text>{saveAddress.isPending ? 'Saving…' : 'Save address'}</Text>
            </Button>
          </View>
        }>
        <View className="gap-3">
          <AddressField label="Street / house no." value={draft.street} onChange={(street) => setDraft({ ...draft, street })} />
          <AddressField label="City" value={draft.city} onChange={(city) => setDraft({ ...draft, city })} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AddressField label="State" value={draft.state} onChange={(state) => setDraft({ ...draft, state })} />
            </View>
            <View className="flex-1">
              <AddressField
                label="PIN code"
                value={draft.zip}
                keyboardType="number-pad"
                maxLength={6}
                onChange={(zip) => setDraft({ ...draft, zip })}
              />
            </View>
          </View>
          <AddressField label="Country" value={draft.country} onChange={(country) => setDraft({ ...draft, country })} />
        </View>
      </Sheet>
    </View>
  );
}

function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4 px-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-caption text-muted-foreground font-semibold tracking-widest uppercase">
          {title}
        </Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={6} className="flex-row items-center gap-1 active:opacity-60">
            <Icon as={PlusIcon} size={12} className="text-foreground" />
            <Text className="text-caption text-foreground font-medium">{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function PaymentOption({
  active,
  disabled,
  icon: IconComponent,
  title,
  subtitle,
  onPress,
}: {
  active: boolean;
  disabled?: boolean;
  icon: typeof BanknoteIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`flex-row gap-3 rounded-xl border p-3 active:opacity-80 ${
        active ? 'border-primary bg-primary/5' : 'border-border'
      } ${disabled ? 'opacity-45' : ''}`}>
      <View
        className={`mt-0.5 h-4 w-4 items-center justify-center rounded-full border ${
          active ? 'border-primary bg-primary' : 'border-border'
        }`}>
        {active ? <CheckIcon size={10} color="#F8FAFC" /> : null}
      </View>
      <Icon as={IconComponent} size={18} className="text-foreground" />
      <View className="flex-1">
        <Text className="text-label text-foreground font-medium">{title}</Text>
        <Text className="text-caption text-muted-foreground mt-0.5">{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function Row({ label, value, strong, success }: { label: string; value: string; strong?: boolean; success?: boolean }) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Text className={`text-label ${strong ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
        {label}
      </Text>
      <Text
        className={`${strong ? 'text-body font-semibold' : 'text-label'} ${
          success ? 'text-success' : 'text-foreground'
        }`}>
        {value}
      </Text>
    </View>
  );
}

function AddressField({
  label,
  value,
  onChange,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
}) {
  return (
    <View className="gap-1">
      <Text className="text-caption text-muted-foreground">{label}</Text>
      <Input
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        maxLength={maxLength}
        className="h-11"
        placeholder={label}
      />
    </View>
  );
}
