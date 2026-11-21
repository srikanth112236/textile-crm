import { Image } from 'expo-image';
import * as React from 'react';
import type { StyleProp, ImageStyle } from 'react-native';

/**
 * expo-image `placeholder` treats a bare string as a remote URI, so a raw
 * blurhash string was being requested as an image (404 → broken icon).
 * It must be passed as `{ blurhash }`.
 */
const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

type Props = {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
  transition?: number;
};

export function SmartImage({ uri, style, contentFit = 'cover', transition = 250 }: Props) {
  return (
    <Image
      source={uri ? { uri } : undefined}
      placeholder={uri ? { blurhash: BLURHASH } : undefined}
      placeholderContentFit="cover"
      style={[{ backgroundColor: 'rgba(148,163,184,0.15)' }, style]}
      contentFit={contentFit}
      transition={transition}
      cachePolicy="memory-disk"
      recyclingKey={uri}
    />
  );
}
