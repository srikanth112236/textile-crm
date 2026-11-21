import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { MoonStarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';

const ICONS = { light: SunIcon, dark: MoonStarIcon };

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button
      accessibilityLabel="Toggle colour scheme"
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="rounded-full">
      <Icon as={ICONS[colorScheme ?? 'light']} size={20} className="text-foreground" />
    </Button>
  );
}
