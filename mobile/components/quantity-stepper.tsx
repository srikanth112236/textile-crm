import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MinusIcon, PlusIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
};

/**
 * Quantity stepper. 36pt targets (44pt with hitSlop) — meets the tap-target
 * minimum without dominating the row.
 */
export function QuantityStepper({ value, onChange, min = 1, max = 10, size = 'md' }: Props) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <View className="border-border flex-row items-center rounded-md border">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={value <= min}
        onPress={() => onChange(value - 1)}
        hitSlop={8}
        className={`${box} items-center justify-center active:bg-accent ${value <= min ? 'opacity-40' : ''}`}>
        <Icon as={MinusIcon} size={14} className="text-foreground" />
      </Pressable>
      <Text className="text-label text-foreground min-w-7 text-center font-medium">{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
        hitSlop={8}
        className={`${box} items-center justify-center active:bg-accent ${value >= max ? 'opacity-40' : ''}`}>
        <Icon as={PlusIcon} size={14} className="text-foreground" />
      </Pressable>
    </View>
  );
}
