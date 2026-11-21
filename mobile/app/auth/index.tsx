import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeftIcon, MailIcon, PhoneIcon, ShieldCheckIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Mode = 'signin' | 'signup' | 'otp';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { signIn, signUp, requestOtp, verifyOtp } = useAuth();

  const [mode, setMode] = React.useState<Mode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [referralCode, setReferralCode] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [debugCode, setDebugCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const finish = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  };

  const run = async (action: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
      finish();
    } catch (cause) {
      const apiError = cause instanceof ApiError ? cause : null;
      const details = apiError?.details?.length ? `\n${apiError.details.join('\n')}` : '';
      setError((apiError?.message ?? (cause as Error).message ?? 'Something went wrong') + details);
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }
    void run(() =>
      mode === 'signup'
        ? signUp({
            email: email.trim().toLowerCase(),
            password,
            name: name.trim() || undefined,
            referralCode: referralCode.trim() || undefined,
          })
        : signIn(email.trim().toLowerCase(), password)
    );
  };

  const sendCode = () => {
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      setError('Enter a 10-digit mobile number.');
      return;
    }
    void run(async () => {
      const result = await requestOtp(digits);
      setOtpSent(true);
      setDebugCode(result.debugCode ?? null);
      setError(null);
    });
  };

  const submitOtp = () => {
    if (code.trim().length < 4) {
      setError('Enter the code we sent you.');
      return;
    }
    void run(() =>
      verifyOtp({
        phone: phone.replace(/\D/g, '').slice(-10),
        code: code.trim(),
        name: name.trim() || undefined,
      })
    );
  };

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center justify-between px-4">
        <Pressable
          accessibilityLabel="Close"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent">
          <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
        </Pressable>
        <Text className="text-h2 text-foreground tracking-[3px]">MENTOOS</Text>
        <View className="h-9 w-9" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text className="text-h1 text-foreground mt-2">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </Text>
        <Text className="text-label text-muted-foreground mt-1">
          {mode === 'signup'
            ? 'Save your bag, track orders and earn reward points.'
            : 'Sign in to sync your bag, orders and rewards.'}
        </Text>

        {/* Mode switch */}
        <View className="bg-muted mt-5 flex-row rounded-full p-1">
          {(
            [
              { id: 'signin', label: 'Email' },
              { id: 'signup', label: 'Sign up' },
              { id: 'otp', label: 'Phone' },
            ] as Array<{ id: Mode; label: string }>
          ).map((option) => {
            const active = option.id === mode;
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  setMode(option.id);
                  setError(null);
                }}
                className={`h-9 flex-1 items-center justify-center rounded-full ${
                  active ? 'bg-background' : ''
                }`}>
                <Text className={`text-label ${active ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View className="border-destructive/30 bg-destructive/5 mt-4 rounded-lg border px-3 py-2">
            <Text className="text-caption text-destructive">{error}</Text>
          </View>
        ) : null}

        {mode === 'otp' ? (
          <View className="mt-5 gap-3">
            <Field label="Mobile number" icon={PhoneIcon}>
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="98765 43210"
                keyboardType="phone-pad"
                maxLength={14}
                editable={!otpSent}
                className="h-12 pl-10"
              />
            </Field>

            {otpSent ? (
              <>
                <Field label="Verification code" icon={ShieldCheckIcon}>
                  <Input
                    value={code}
                    onChangeText={setCode}
                    placeholder="6-digit code"
                    keyboardType="number-pad"
                    maxLength={6}
                    className="h-12 pl-10"
                  />
                </Field>
                {debugCode ? (
                  <Text className="text-caption text-muted-foreground">
                    Dev mode code: <Text className="text-caption text-foreground font-semibold">{debugCode}</Text>
                  </Text>
                ) : null}
                <Button className="h-12" disabled={busy} onPress={submitOtp}>
                  <Text>{busy ? 'Verifying…' : 'Verify & continue'}</Text>
                </Button>
                <Pressable onPress={() => setOtpSent(false)} hitSlop={6}>
                  <Text className="text-caption text-muted-foreground text-center underline">
                    Use a different number
                  </Text>
                </Pressable>
              </>
            ) : (
              <Button className="h-12" disabled={busy || phone.replace(/\D/g, '').length < 10} onPress={sendCode}>
                <Text>{busy ? 'Sending…' : 'Send code'}</Text>
              </Button>
            )}
          </View>
        ) : (
          <View className="mt-5 gap-3">
            {mode === 'signup' ? (
              <Field label="Name">
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  autoCapitalize="words"
                  className="h-12"
                />
              </Field>
            ) : null}

            <Field label="Email" icon={MailIcon}>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="h-12 pl-10"
              />
            </Field>

            <Field label="Password">
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                className="h-12"
              />
            </Field>

            {mode === 'signup' ? (
              <Field label="Referral code (optional)">
                <Input
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="FRIEND500"
                  autoCapitalize="characters"
                  className="h-12"
                />
              </Field>
            ) : null}

            <Button className="mt-1 h-12" disabled={busy} onPress={submitEmail}>
              <Text>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</Text>
            </Button>

            <Pressable
              onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              hitSlop={6}
              className="mt-1">
              <Text className="text-caption text-muted-foreground text-center">
                {mode === 'signup' ? 'Already have an account? ' : 'New to Mentoos? '}
                <Text className="text-caption text-foreground font-semibold underline">
                  {mode === 'signup' ? 'Sign in' : 'Create one'}
                </Text>
              </Text>
            </Pressable>
          </View>
        )}

        <Text className="text-caption text-muted-foreground mt-8 text-center">
          By continuing you agree to our Terms and Privacy Policy.
        </Text>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  icon: IconComponent,
  children,
}: {
  label: string;
  icon?: typeof MailIcon;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-label text-foreground font-medium">{label}</Text>
      <View className="justify-center">
        {IconComponent ? (
          <View className="absolute left-3 z-10">
            <Icon as={IconComponent} size={16} className="text-muted-foreground" />
          </View>
        ) : null}
        {children}
      </View>
    </View>
  );
}
