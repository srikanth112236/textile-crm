import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { profileApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { router } from 'expo-router';
import { ChevronLeftIcon, DownloadIcon, ShieldAlertIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, isSignedIn } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState('');
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const exportData = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await profileApi.exportData();
      await Share.share({
        title: 'Mentoos account data',
        message: JSON.stringify(data, null, 2).slice(0, 20000),
      });
      setMessage('Your data export is ready to save.');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (confirm.trim().toUpperCase() !== 'DELETE') {
      setError('Type DELETE to confirm.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await profileApi.deleteAccount();
      await signOut();
      router.replace('/');
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
        <Text className="text-h2 text-foreground flex-1">Account settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
        keyboardShouldPersistTaps="handled">
        <View className="border-border overflow-hidden rounded-xl border">
          <View className="h-12 flex-row items-center justify-between px-3">
            <Text className="text-body text-foreground">Appearance</Text>
            <ThemeToggle />
          </View>
          <View className="bg-border ml-3 h-px" />
          <Pressable
            onPress={() => router.push('/content/privacy')}
            className="h-12 flex-row items-center justify-between px-3 active:bg-accent">
            <Text className="text-body text-foreground">Privacy policy</Text>
            <Text className="text-caption text-muted-foreground">Read</Text>
          </Pressable>
          <View className="bg-border ml-3 h-px" />
          <Pressable
            onPress={() => router.push('/content/terms')}
            className="h-12 flex-row items-center justify-between px-3 active:bg-accent">
            <Text className="text-body text-foreground">Terms of service</Text>
            <Text className="text-caption text-muted-foreground">Read</Text>
          </Pressable>
        </View>

        {isSignedIn ? (
          <>
            <View className="border-border gap-3 rounded-xl border p-4">
              <Text className="text-label text-foreground font-semibold">Your data</Text>
              <Text className="text-caption text-muted-foreground">
                Download everything we store about your account — profile, addresses and order history.
              </Text>
              {message ? <Text className="text-caption text-success">{message}</Text> : null}
              {error && !confirmOpen ? <Text className="text-caption text-destructive">{error}</Text> : null}
              <Button variant="outline" disabled={busy} onPress={() => void exportData()}>
                <Icon as={DownloadIcon} size={15} className="text-foreground" />
                <Text>{busy ? 'Preparing…' : 'Export my data'}</Text>
              </Button>
            </View>

            <View className="border-destructive/30 bg-destructive/5 gap-3 rounded-xl border p-4">
              <View className="flex-row items-center gap-2">
                <Icon as={ShieldAlertIcon} size={16} className="text-destructive" />
                <Text className="text-label text-destructive font-semibold">Delete account</Text>
              </View>
              <Text className="text-caption text-muted-foreground">
                This anonymises your profile and revokes access. Orders stay on record for tax compliance.
              </Text>

              {confirmOpen ? (
                <>
                  <Input
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Type DELETE"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    className="h-11"
                  />
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onPress={() => void deleteAccount()}>
                    <Text>{busy ? 'Deleting…' : 'Permanently delete'}</Text>
                  </Button>
                  <Pressable onPress={() => setConfirmOpen(false)} hitSlop={6}>
                    <Text className="text-caption text-muted-foreground text-center underline">Cancel</Text>
                  </Pressable>
                </>
              ) : (
                <Button variant="outline" onPress={() => setConfirmOpen(true)}>
                  <Text className="text-destructive">Delete my account</Text>
                </Button>
              )}
            </View>
          </>
        ) : (
          <Button onPress={() => router.push('/auth')}>
            <Text>Sign in to manage your data</Text>
          </Button>
        )}

        <Text className="text-caption text-muted-foreground text-center">
          Mentoos · v1.0.0 · Prices in INR
        </Text>
      </ScrollView>
    </View>
  );
}
