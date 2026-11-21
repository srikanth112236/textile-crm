import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { StarIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type Props = {
  rating?: number;
  totalReviews?: number;
  size?: number;
  showCount?: boolean;
};

export function Rating({ rating = 0, totalReviews = 0, size = 11, showCount = true }: Props) {
  const rounded = Math.round(rating ?? 0);

  return (
    <View className="flex-row items-center gap-1">
      <View className="flex-row items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((step) => (
          <Icon
            key={step}
            as={StarIcon}
            size={size}
            className={step <= rounded ? 'fill-sale text-sale' : 'text-border fill-border'}
          />
        ))}
      </View>
      <Text className="text-caption text-muted-foreground">
        {(rating ?? 0).toFixed(1)}
        {showCount && totalReviews ? ` · ${totalReviews}` : ''}
      </Text>
    </View>
  );
}
