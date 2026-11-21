import { Icon } from '@/components/ui/icon';
import { useCart } from '@/lib/cart';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Tabs } from 'expo-router';
import { HouseIcon, LayoutGridIcon, SearchIcon, ShoppingBagIcon, UserRoundIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'light'];
  const { itemCount } = useCart();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          // Height/padding must include the safe area once an explicit height is set,
          // otherwise the labels clip on devices with a home indicator.
          height: 66 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 12 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon as={HouseIcon} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <Icon as={LayoutGridIcon} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Icon as={SearchIcon} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Bag',
          tabBarIcon: ({ color }) => (
            <View>
              <Icon as={ShoppingBagIcon} size={22} color={color} />
              {itemCount > 0 ? (
                <View className="bg-destructive absolute -right-2 -top-1 h-4 min-w-4 items-center justify-center rounded-full px-1">
                  <Text className="text-[10px] font-semibold text-white">{itemCount}</Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Icon as={UserRoundIcon} size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
