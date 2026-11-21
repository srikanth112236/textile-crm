import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api/client';
import { shipmentApi } from '@/lib/api/endpoints';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeftIcon, PackageSearchIcon, TruckIcon } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Scalar = string | number | boolean;

function flatten(value: unknown, path = '', out: Array<[string, Scalar]> = []): Array<[string, Scalar]> {
  if (value === null || value === undefined) return out;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (path) out.push([path, value]);
    return out;
  }
  if (Array.isArray(value)) return out;
  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      flatten(entry, path ? `${path} · ${key}` : key, out);
    }
  }
  return out;
}

export default function TrackOrderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ number?: string }>();
  const [number, setNumber] = React.useState(params.number ?? '');
  const [data, setData] = React.useState<unknown>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const search = async () => {
    const value = number.trim().toUpperCase();
    if (!value) {
      setError('Enter your order number.');
      return;
    }
    setBusy(true);
    setError(null);
    setData(null);
    try {
      const response = await shipmentApi.track(value);
      setData((response as { data?: unknown }).data ?? response);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'We couldn’t find that order yet. Tracking appears once it ships.'
      );
    } finally {
      setBusy(false);
    }
  };

  React.useEffect(() => {
    if (params.number) void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = flatten(data).filter(([key]) => !/id$/i.test(key)).slice(0, 14);

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
        <Text className="text-h2 text-foreground flex-1">Track your order</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
        keyboardShouldPersistTaps="handled">
        <Text className="text-label text-muted-foreground">
          Enter the order number from your confirmation email (for example MNT-2026-00123).
        </Text>

        <View className="flex-row gap-2">
          <Input
            value={number}
            onChangeText={setNumber}
            placeholder="Order number"
            autoCapitalize="characters"
            autoCorrect={false}
            className="h-11 flex-1"
          />
          <Button disabled={busy} onPress={() => void search()}>
            <Text>{busy ? 'Checking…' : 'Track'}</Text>
          </Button>
        </View>

        {busy ? (
          <View className="items-center py-10">
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View className="border-destructive/30 bg-destructive/5 items-center gap-2 rounded-2xl border p-5">
            <Icon as={PackageSearchIcon} size={22} className="text-destructive" />
            <Text className="text-label text-destructive text-center">{error}</Text>
          </View>
        ) : data ? (
          <View className="border-border gap-3 rounded-2xl border p-4">
            <View className="flex-row items-center gap-2">
              <Icon as={TruckIcon} size={18} className="text-foreground" />
              <Text className="text-label text-foreground font-semibold">Shipment status</Text>
            </View>
            {rows.length === 0 ? (
              <Text className="text-label text-muted-foreground">
                No tracking events yet. Check back once the courier scans your parcel.
              </Text>
            ) : (
              rows.map(([key, value]) => (
                <View key={key} className="flex-row justify-between gap-4">
                  <Text className="text-caption text-muted-foreground flex-1 capitalize">
                    {key.replace(/_/g, ' ').replace(/ · /g, ' · ')}
                  </Text>
                  <Text className="text-caption text-foreground flex-1 text-right">
                    {String(value)}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
