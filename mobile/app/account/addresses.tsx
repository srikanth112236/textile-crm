import { Sheet } from '@/components/sheet';
import { EmptyState, ErrorState, RowsSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { profileApi } from '@/lib/api/endpoints';
import type { Address } from '@/lib/api/types';
import { qk } from '@/lib/query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeftIcon, MapPinIcon, PlusIcon, Trash2Icon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMPTY: Address = { street: '', city: '', state: '', zip: '', country: 'India', isDefault: false };

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Address>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);

  const addresses = useQuery({
    queryKey: qk.addresses,
    queryFn: async () => (await profileApi.addresses()).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.addresses });

  const save = useMutation({
    mutationFn: async (address: Address) =>
      address._id ? profileApi.updateAddress(address._id, address) : profileApi.createAddress(address),
    onSuccess: async () => {
      setOpen(false);
      setDraft(EMPTY);
      await invalidate();
    },
    onError: (cause) => setError((cause as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => profileApi.deleteAddress(id),
    onSuccess: invalidate,
    onError: (cause) => setError((cause as Error).message),
  });

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
        <Text className="text-h2 text-foreground flex-1">Addresses</Text>
        <Pressable
          onPress={() => {
            setDraft(EMPTY);
            setError(null);
            setOpen(true);
          }}
          hitSlop={8}
          className="flex-row items-center gap-1 active:opacity-60">
          <Icon as={PlusIcon} size={14} className="text-foreground" />
          <Text className="text-caption text-foreground font-medium">Add</Text>
        </Pressable>
      </View>

      {addresses.isLoading ? (
        <View className="px-4 pt-4">
          <RowsSkeleton rows={2} />
        </View>
      ) : addresses.error ? (
        <ErrorState error={addresses.error} onRetry={() => void addresses.refetch()} />
      ) : (addresses.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={MapPinIcon}
          title="No saved addresses"
          message="Add an address so checkout takes seconds."
          actionLabel="Add address"
          onAction={() => setOpen(true)}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}>
          {addresses.data?.map((address) => (
            <View key={address._id} className="border-border rounded-2xl border p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-body text-foreground font-medium">{address.street}</Text>
                  <Text className="text-caption text-muted-foreground mt-0.5">
                    {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                  </Text>
                  <Text className="text-caption text-muted-foreground">{address.country}</Text>
                  {address.isDefault ? (
                    <Text className="text-caption text-success mt-1 font-medium">Default</Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel="Delete address"
                  onPress={() => address._id && remove.mutate(address._id)}
                  hitSlop={8}
                  className="active:opacity-60">
                  <Icon as={Trash2Icon} size={16} className="text-muted-foreground" />
                </Pressable>
              </View>
              <View className="mt-3 flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onPress={() => {
                    setDraft(address);
                    setError(null);
                    setOpen(true);
                  }}>
                  <Text>Edit</Text>
                </Button>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={draft._id ? 'Edit address' : 'Add address'}
        footer={
          <View className="flex-row gap-2 pb-1">
            <Button variant="outline" className="flex-1" onPress={() => setOpen(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button
              className="flex-1"
              disabled={save.isPending}
              onPress={() => {
                setError(null);
                if ([draft.street, draft.city, draft.state, draft.zip].some((value) => !String(value).trim())) {
                  setError('Street, city, state and PIN code are required.');
                  return;
                }
                save.mutate({ ...draft, country: draft.country || 'India' });
              }}>
              <Text>{save.isPending ? 'Saving…' : 'Save'}</Text>
            </Button>
          </View>
        }>
        <View className="gap-3">
          {error ? <Text className="text-caption text-destructive">{error}</Text> : null}
          <Field label="Street / house no." value={draft.street} onChange={(street) => setDraft({ ...draft, street })} />
          <Field label="City" value={draft.city} onChange={(city) => setDraft({ ...draft, city })} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="State" value={draft.state} onChange={(state) => setDraft({ ...draft, state })} />
            </View>
            <View className="flex-1">
              <Field
                label="PIN code"
                value={draft.zip}
                keyboardType="number-pad"
                maxLength={6}
                onChange={(zip) => setDraft({ ...draft, zip })}
              />
            </View>
          </View>
          <Field label="Country" value={draft.country} onChange={(country) => setDraft({ ...draft, country })} />
          <Pressable
            onPress={() => setDraft({ ...draft, isDefault: !draft.isDefault })}
            className="flex-row items-center gap-2 py-1">
            <View
              className={`h-4 w-4 items-center justify-center rounded border ${
                draft.isDefault ? 'border-primary bg-primary' : 'border-border'
              }`}>
              {draft.isDefault ? <Text className="text-[9px] text-primary-foreground">✓</Text> : null}
            </View>
            <Text className="text-label text-foreground">Set as default address</Text>
          </Pressable>
        </View>
      </Sheet>
    </View>
  );
}

function Field({
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
        placeholder={label}
        className="h-11"
      />
    </View>
  );
}
