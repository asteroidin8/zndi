import { useCallback, useEffect } from 'react';
import { Modal, Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { QRCode } from './QRCode';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

const ENTER = { duration: 200 };
const EXIT = { duration: 150 };

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  value: string;
  copyLabel?: string;
};

export function QRModal({ visible, onClose, title, subtitle, value, copyLabel }: Props) {
  const c = useThemeColors();

  const backdropOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.97);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, ENTER);
      cardOpacity.value = withTiming(1, ENTER);
      cardScale.value = withTiming(1, ENTER);
    } else {
      backdropOpacity.value = withTiming(0, EXIT);
      cardOpacity.value = withTiming(0, EXIT);
      cardScale.value = withTiming(0.97, EXIT);
    }
  }, [visible, backdropOpacity, cardOpacity, cardScale]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const handleShare = useCallback(async () => {
    await Share.share({ message: copyLabel ?? value });
  }, [value, copyLabel]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', pointerEvents: 'box-none' }}>
        <Animated.View
          style={[
            {
              backgroundColor: c.surface,
              borderRadius: radius.xl,
              width: '82%',
              maxWidth: 320,
              borderWidth: 1,
              borderColor: c.border,
              overflow: 'hidden',
            },
            cardStyle,
          ]}
        >
          <View style={{ padding: spacing.screen, gap: spacing.md, alignItems: 'center' }}>
            <AppText variant="body" style={{ fontWeight: '700' }}>
              {title}
            </AppText>

            {subtitle && (
              <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
                {subtitle}
              </AppText>
            )}

            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: radius.lg,
                padding: spacing.card,
              }}
            >
              <QRCode value={value} size={180} />
            </View>

            {copyLabel && (
              <Pressable
                onPress={handleShare}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  paddingHorizontal: spacing.card,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: c.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <AppText variant="body" style={{ fontWeight: '700', letterSpacing: 2 }}>
                  {copyLabel}
                </AppText>
                <AppIcon name="Share2" size={16} color={c.inkTertiary} />
              </Pressable>
            )}
          </View>

          <View style={{ height: 1, backgroundColor: c.surfaceMuted }} />

          <Pressable
            onPress={onClose}
            style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
          >
            {({ pressed }) => (
              <AppText variant="body" style={{ fontWeight: '700', color: c.primary, opacity: pressed ? 0.5 : 1 }}>
                닫기
              </AppText>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
