import { ThemeToggle } from '@/components/theme-toggle';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { loyaltyApi, ordersApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import {
  BanknoteIcon,
  ChevronRightIcon,
  CreditCardIcon,
  FileTextIcon,
  GiftIcon,
  HeartIcon,
  HelpCircleIcon,
  InfoIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MapPinIcon,
  PackageIcon,
  RotateCcwIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  TruckIcon,
  UserRoundIcon,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { status, isSignedIn, user, profile, signOut } = useAuth();

  const loyalty = useQuery({
    queryKey: qk.loyalty,
    queryFn: async () => (await loyaltyApi.balance()).data,
    enabled: isSignedIn,
  });

  const orderCount = useQuery({
    queryKey: qk.orders('all'),
    queryFn: async () => (await ordersApi.list({ limit: 1 })).data.pagination.total,
    enabled: isSignedIn,
  });

  const name = profile?.name || user?.name || 'Mentoos member';
  const email = profile?.email || user?.email || user?.phone || '';
  const initials = name
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const points = loyalty.data?.balance ?? 0;
  const nextTier = points < 500 ? 500 : points < 1500 ? 1500 : 3000;
  const progress = Math.min(100, (points / nextTier) * 100);

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}>
      <View className="px-4">
        <Text className="text-h1 text-foreground">Account</Text>
      </View>

      {status === 'loading' ? (
        <View className="mt-8 items-center">
          <Text className="text-label text-muted-foreground">Loading your account…</Text>
        </View>
      ) : !isSignedIn ? (
        <View className="mt-4 px-4">
          <View className="bg-primary overflow-hidden rounded-3xl p-5">
            <Icon as={SparklesIcon} size={22} className="text-primary-foreground/80" />
            <Text className="text-h2 text-primary-foreground mt-3">Join Mentoos</Text>
            <Text className="text-label mt-1 text-primary-foreground/80">
              Track orders, save your bag, earn reward points and get early access to drops.
            </Text>
            <View className="mt-4 flex-row gap-2">
              <Button className="bg-background flex-1" onPress={() => router.push('/auth')}>
                <Text className="text-primary font-semibold">Sign in</Text>
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-white/40 bg-transparent"
                onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })}>
                <Text className="text-primary-foreground">Create account</Text>
              </Button>
            </View>
          </View>

          <View className="mt-6 gap-1">
            <Row icon={PackageIcon} label="Track an order" onPress={() => router.push('/track-order')} />
            <Row icon={TruckIcon} label="Shipping & delivery" onPress={() => router.push('/content/shipping')} />
            <Row icon={LifeBuoyIcon} label="Help & support" onPress={() => router.push('/content/support')} />
          </View>

          <View className="border-border mt-4 flex-row items-center justify-between rounded-xl border px-3 py-2">
            <Text className="text-body text-foreground">Appearance</Text>
            <ThemeToggle />
          </View>
        </View>
      ) : (
        <View className="mt-4 gap-6">
          {/* Identity */}
          <View className="flex-row items-center gap-3 px-4">
            <View className="bg-primary h-14 w-14 items-center justify-center rounded-full">
              <Text className="text-h2 text-primary-foreground">{initials || 'M'}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-h2 text-foreground" numberOfLines={1}>
                {name}
              </Text>
              <Text className="text-label text-muted-foreground" numberOfLines={1}>
                {email}
              </Text>
            </View>
            <Link href="/account/profile" asChild>
              <Pressable className="border-border rounded-full border px-3 py-1.5 active:opacity-70">
                <Text className="text-caption text-foreground font-medium">Edit</Text>
              </Pressable>
            </Link>
          </View>

          {/* Rewards */}
          <View className="px-4">
            <Link href="/loyalty" asChild>
              <Pressable className="bg-primary rounded-2xl p-4 active:opacity-90">
                <View className="flex-row items-center justify-between">
                  <Text className="text-label text-primary-foreground/80 font-medium">Mentoos Rewards</Text>
                  <Text className="text-caption text-primary-foreground/70">Next tier {nextTier}</Text>
                </View>
                <Text className="text-display text-primary-foreground mt-1">{points} pts</Text>
                <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <View className="bg-background h-full rounded-full" style={{ width: `${progress}%` }} />
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-caption text-primary-foreground/80">
                    {Math.max(0, nextTier - points)} pts to unlock the next reward
                  </Text>
                  <ChevronRightIcon size={14} color="#F8FAFC" />
                </View>
              </Pressable>
            </Link>
          </View>

          {/* Quick tiles */}
          <View className="flex-row gap-2 px-4">
            <Tile
              icon={PackageIcon}
              label="Orders"
              hint={orderCount.data !== undefined ? `${orderCount.data} total` : '—'}
              href="/orders"
            />
            <Tile icon={HeartIcon} label="Wishlist" hint="Saved items" href="/wishlist" />
            <Tile icon={MapPinIcon} label="Addresses" hint="Delivery" href="/account/addresses" />
          </View>

          {/* Rows */}
          <View className="px-4">
            <Text className="text-caption text-muted-foreground mb-2 font-semibold tracking-widest">
              SHOPPING
            </Text>
            <View className="border-border overflow-hidden rounded-xl border">
              <Row icon={GiftIcon} label="Refer & earn" hint="₹500 per friend" onPress={() => router.push('/referrals')} />
              <Divider />
              <Row icon={TruckIcon} label="Track an order" onPress={() => router.push('/track-order')} />
              <Divider />
              <Row icon={SparklesIcon} label="Reward history" onPress={() => router.push('/loyalty')} />
            </View>
          </View>

          <View className="px-4">
            <Text className="text-caption text-muted-foreground mb-2 font-semibold tracking-widest">
              ORDERS & PAYMENTS
            </Text>
            <View className="border-border overflow-hidden rounded-xl border">
              <Row icon={PackageIcon} label="Orders" hint={`${orderCount.data ?? 0} total`} onPress={() => router.push('/orders')} />
              <Divider />
              <Row icon={RotateCcwIcon} label="Returns & exchanges" onPress={() => router.push('/returns')} />
              <Divider />
              <Row icon={FileTextIcon} label="Tax invoices" onPress={() => router.push('/invoices')} />
              <Divider />
              <Row icon={CreditCardIcon} label="Payments" onPress={() => router.push('/payments')} />
              <Divider />
              <Row icon={BanknoteIcon} label="Refunds" onPress={() => router.push('/refunds')} />
            </View>
          </View>

          <View className="px-4">
            <Text className="text-caption text-muted-foreground mb-2 font-semibold tracking-widest">
              SUPPORT
            </Text>
            <View className="border-border overflow-hidden rounded-xl border">
              <Row icon={HelpCircleIcon} label="FAQ" onPress={() => router.push('/content/faq')} />
              <Divider />
              <Row icon={TruckIcon} label="Shipping & delivery" onPress={() => router.push('/content/shipping')} />
              <Divider />
              <Row icon={ShieldCheckIcon} label="Returns & refunds" onPress={() => router.push('/content/returns')} />
              <Divider />
              <Row icon={LifeBuoyIcon} label="Contact us" onPress={() => router.push('/content/support')} />
              <Divider />
              <Row icon={InfoIcon} label="About Mentoos" onPress={() => router.push('/content/about')} />
            </View>
          </View>

          <View className="px-4">
            <Text className="text-caption text-muted-foreground mb-2 font-semibold tracking-widest">
              PREFERENCES
            </Text>
            <View className="border-border overflow-hidden rounded-xl border">
              <View className="h-12 flex-row items-center justify-between px-3">
                <Text className="text-body text-foreground">Appearance</Text>
                <ThemeToggle />
              </View>
              <Divider />
              <Row icon={UserRoundIcon} label="Personal details" onPress={() => router.push('/account/profile')} />
              <Divider />
              <Row icon={Settings2Icon} label="Account settings" hint="Data & privacy" onPress={() => router.push('/settings')} />
            </View>
          </View>

          <View className="px-4">
            <Button variant="outline" className="h-11" onPress={() => void signOut()}>
              <Icon as={LogOutIcon} size={16} className="text-destructive" />
              <Text className="text-destructive">Sign out</Text>
            </Button>
            <Text className="text-caption text-muted-foreground mt-3 text-center">
              Mentoos · v1.0.0 · Prices in INR
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function Divider() {
  return <View className="bg-border ml-3 h-px" />;
}

function Row({
  icon: IconComponent,
  label,
  hint,
  onPress,
  href,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onPress?: () => void;
  href?: string;
}) {
  const content = (
    <Pressable
      onPress={onPress}
      className="h-12 flex-row items-center gap-3 px-3 active:bg-accent">
      <Icon as={IconComponent} size={17} className="text-muted-foreground" />
      <Text className="text-body text-foreground flex-1">{label}</Text>
      {hint ? <Text className="text-caption text-muted-foreground">{hint}</Text> : null}
      <Icon as={ChevronRightIcon} size={16} className="text-muted-foreground" />
    </Pressable>
  );

  if (href) {
    return (
      <Link href={href as never} asChild>
        {content}
      </Link>
    );
  }
  return content;
}

function Tile({
  icon: IconComponent,
  label,
  hint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  href: string;
}) {
  return (
    <Link href={href as never} asChild>
      <Pressable className="border-border flex-1 items-start gap-1 rounded-xl border p-3 active:opacity-80">
        <Icon as={IconComponent} size={18} className="text-foreground" />
        <Text className="text-label text-foreground mt-1 font-semibold">{label}</Text>
        <Text className="text-caption text-muted-foreground">{hint}</Text>
      </Pressable>
    </Link>
  );
}
