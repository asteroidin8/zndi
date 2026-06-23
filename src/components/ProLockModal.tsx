import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { motion } from '@/constants/motion';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onGoToShop?: () => void;
};

export function ProLockModal({ visible, onClose, onGoToShop }: Props) {
  const c = useThemeColors();
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, motion.spring.gentle);
      translateY.value = withSpring(0, motion.spring.gentle);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 160 });
      scale.value = withTiming(0.9, { duration: 160 });
      translateY.value = withTiming(20, { duration: 160 });
    }
  }, [visible, backdropOpacity, scale, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="닫기" />
      </Animated.View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', pointerEvents: 'box-none' }}>
        <Animated.View
          style={[
            {
              backgroundColor: c.surface,
              borderRadius: radius.xl,
              paddingVertical: spacing.section,
              paddingHorizontal: spacing.screen,
              marginHorizontal: spacing.screen * 2,
              alignItems: 'center',
              gap: spacing.md,
              borderWidth: 1,
              borderColor: c.border,
            },
            cardStyle,
          ]}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: `${c.primary}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="Lock" size={22} color={c.primary} />
          </View>

          <AppText variant="body" style={{ fontWeight: '700', textAlign: 'center' }}>
            Pro 기능이에요
          </AppText>

          <AppText variant="caption" tone="secondary" style={{ textAlign: 'center', lineHeight: 20 }}>
            구독으로 잠금 해제할 수 있어요
          </AppText>

          {onGoToShop && (
            <Pressable
              onPress={() => {
                onClose();
                onGoToShop();
              }}
              style={({ pressed }) => ({
                backgroundColor: c.ink,
                borderRadius: radius.lg,
                paddingVertical: spacing.item,
                paddingHorizontal: spacing.section,
                opacity: pressed ? 0.88 : 1,
                marginTop: spacing.sm,
              })}
              accessibilityRole="button"
              accessibilityLabel="상점으로 이동"
            >
              <AppText variant="body" style={{ color: c.surface, fontWeight: '700' }}>
                상점 보기
              </AppText>
            </Pressable>
          )}

          <Pressable onPress={onClose} hitSlop={12} style={{ marginTop: spacing.xs }}>
            <AppText variant="caption" tone="tertiary">
              닫기
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
