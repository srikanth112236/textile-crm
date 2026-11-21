import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
};

/**
 * Bottom sheet for filters / variants / forms. Native modal + press-outside,
 * safe-area aware, capped at 88% height so the sheet never covers the page title.
 */
export function Sheet({ open, onClose, title, subtitle, children, footer, scroll = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Close sheet"
          onPress={onClose}
          className="absolute inset-0 bg-black/50"
        />
        <View
          className="bg-background rounded-t-3xl"
          style={{ maxHeight: '88%', paddingBottom: Math.max(insets.bottom, 12) }}>
          <View className="items-center pt-2">
            <View className="bg-border h-1 w-10 rounded-full" />
          </View>

          {title ? (
            <View className="flex-row items-start justify-between gap-4 px-4 pb-2 pt-3">
              <View className="flex-1">
                <Text className="text-h2 text-foreground">{title}</Text>
                {subtitle ? (
                  <Text className="text-label text-muted-foreground mt-0.5">{subtitle}</Text>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={onClose}
                hitSlop={10}
                className="bg-muted h-8 w-8 items-center justify-center rounded-full active:opacity-70">
                <Icon as={XIcon} size={16} className="text-foreground" />
              </Pressable>
            </View>
          ) : null}

          {scroll ? (
            <ScrollView
              className="px-4"
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : (
            <View className="px-4 pt-2">{children}</View>
          )}

          {footer ? <View className="border-border border-t px-4 pt-3">{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}
