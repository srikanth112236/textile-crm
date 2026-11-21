import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { router } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, updateProfile, signOut } = useAuth();
  const [name, setName] = React.useState(profile?.name ?? '');
  const [phone, setPhone] = React.useState(profile?.phone ?? '');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(profile?.name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile?.name, profile?.phone]);

  const save = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await updateProfile({ name: name.trim() || undefined, phone: phone.trim() || undefined });
      setMessage('Saved');
      setTimeout(() => setMessage(null), 2000);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

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
        <Text className="text-h2 text-foreground flex-1">Personal details</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 14 }}
        keyboardShouldPersistTaps="handled">
        <View className="gap-1.5">
          <Text className="text-label text-foreground font-medium">Email</Text>
          <Input value={profile?.email ?? user?.email ?? ''} editable={false} className="h-12 opacity-60" />
        </View>

        <View className="gap-1.5">
          <Text className="text-label text-foreground font-medium">Full name</Text>
          <Input value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" className="h-12" />
        </View>

        <View className="gap-1.5">
          <Text className="text-label text-foreground font-medium">Phone</Text>
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="98765 43210"
            keyboardType="phone-pad"
            className="h-12"
          />
        </View>

        {error ? <Text className="text-caption text-destructive">{error}</Text> : null}
        {message ? <Text className="text-caption text-success">{message}</Text> : null}

        <Button className="mt-2 h-12" disabled={busy} onPress={() => void save()}>
          <Text>{busy ? 'Saving…' : 'Save changes'}</Text>
        </Button>

        <Button variant="outline" className="h-11" onPress={() => void signOut()}>
          <Text className="text-destructive">Sign out</Text>
        </Button>
      </ScrollView>
    </View>
  );
}
