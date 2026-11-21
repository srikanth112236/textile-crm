import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api/client';
import { API_BASE, USING_WEB_PROXY } from '@/lib/config';
import { router } from 'expo-router';
import { CloudOffIcon, RefreshCcwIcon } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

export function ErrorState({
  error,
  onRetry,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const apiError = error instanceof ApiError ? error : null;
  const message =
    apiError?.message ??
    (error as Error)?.message ??
    'Something went wrong. Please try again in a moment.';
  const network = apiError?.isNetwork ?? false;

  return (
    <View className={`items-center justify-center gap-3 ${compact ? 'py-10' : 'flex-1 px-8 py-16'}`}>
      <View className="bg-muted h-14 w-14 items-center justify-center rounded-full">
        <Icon as={CloudOffIcon} size={22} className="text-muted-foreground" />
      </View>
      <Text className="text-h2 text-foreground text-center">
        {network ? 'Can’t reach the store' : 'Couldn’t load this'}
      </Text>
      <Text className="text-label text-muted-foreground text-center">{message}</Text>

      {network && USING_WEB_PROXY ? (
        <Text className="text-caption text-muted-foreground text-center">
          Browser preview talks to the API through the local CORS proxy. Run{' '}
          <Text className="text-caption text-foreground font-semibold">npm run dev:web</Text> (or{' '}
          <Text className="text-caption text-foreground font-semibold">npm run proxy</Text> in a second
          terminal).
        </Text>
      ) : null}

      {__DEV__ ? (
        <Text className="text-caption text-muted-foreground/70 text-center">{API_BASE}</Text>
      ) : null}

      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-1" onPress={onRetry}>
          <Icon as={RefreshCcwIcon} size={14} className="text-foreground" />
          <Text>Try again</Text>
        </Button>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-8 py-16">
      <View className="bg-muted h-16 w-16 items-center justify-center rounded-full">
        <Icon as={icon} size={26} className="text-muted-foreground" />
      </View>
      <Text className="text-h2 text-foreground mt-2 text-center">{title}</Text>
      <Text className="text-label text-muted-foreground text-center">{message}</Text>
      {actionLabel && onAction ? (
        <Button className="mt-3" onPress={onAction}>
          <Text>{actionLabel}</Text>
        </Button>
      ) : null}
    </View>
  );
}

export function SignedOut({
  title = 'Sign in to continue',
  message = 'Your account keeps orders, returns and invoices in one place.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <Text className="text-h2 text-foreground text-center">{title}</Text>
      <Text className="text-label text-muted-foreground text-center">{message}</Text>
      <Button className="mt-1" onPress={() => router.push('/auth')}>
        <Text>Sign in or create account</Text>
      </Button>
    </View>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View className="gap-5">
      {Array.from({ length: Math.ceil(count / 2) }).map((_, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-3">
          {Array.from({ length: 2 }).map((__, columnIndex) => (
            <View key={columnIndex} className="flex-1">
              <Skeleton className="rounded-xl" style={{ width: '100%', aspectRatio: 0.78 }} />
              <Skeleton className="mt-2 h-3 w-1/2 rounded" />
              <Skeleton className="mt-1.5 h-3.5 w-5/6 rounded" />
              <Skeleton className="mt-1.5 h-3.5 w-1/3 rounded" />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} className="flex-row items-center gap-3">
          <Skeleton style={{ width: 72, height: 88, borderRadius: 10 }} />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
            <Skeleton className="h-3.5 w-1/4 rounded" />
          </View>
        </View>
      ))}
    </View>
  );
}
