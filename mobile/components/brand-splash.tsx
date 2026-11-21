import { BrandMark } from '@/components/brand-mark';
import { Wordmark } from '@/components/wordmark';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/**
 * Branded launch screen shown while the session and first paint settle.
 * Same navy as the native splash, so the hand-off is seamless.
 *
 * Layout uses explicit styles: NativeWind classes on Animated.View proved
 * unreliable for flex alignment, which left the mark pinned to the corner.
 */
export function BrandSplash({ visible }: { visible: boolean }) {
  const opacity = React.useRef(new Animated.Value(1)).current;
  const logoScale = React.useRef(new Animated.Value(0.92)).current;
  const [mounted, setMounted] = React.useState(true);

  React.useEffect(() => {
    Animated.timing(logoScale, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [logoScale]);

  React.useEffect(() => {
    if (visible) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [opacity, visible]);

  if (!mounted) return null;

  return (
    <Animated.View
      testID="brand-splash"
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, styles.root, { opacity }]}>
      <Animated.View style={{ transform: [{ scale: logoScale }], alignItems: 'center' }}>
        <BrandMark size={104} radius={26} />
        <View style={styles.brandBlock}>
          <Wordmark size="lg" inverted />
          <Text className="text-[10px] font-semibold uppercase tracking-[4px] text-white/45">
            Modern menswear
          </Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.track}>
          <View style={styles.progress} />
        </View>
        <Text className="text-[9px] uppercase tracking-[3px] text-white/30">Designed in India</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBlock: {
    marginTop: 18,
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 64,
    alignItems: 'center',
    gap: 12,
  },
  track: {
    height: 2,
    width: 64,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progress: {
    height: 2,
    width: '50%',
    borderRadius: 2,
    backgroundColor: '#f59e0b',
  },
});
