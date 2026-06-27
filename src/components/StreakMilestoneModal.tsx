import { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { ConfettiCelebration } from './ConfettiCelebration';
import { radius, spacing } from '@/constants/spacing';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { useThemeColors } from '@/hooks/useThemeColors';

const MILESTONES = [7, 14, 30, 60, 100, 200, 365] as const;

export type StreakMilestone = (typeof MILESTONES)[number];

const MILESTONE_INFO: Record<number, { emoji: string; title: string; sub: string }> = {
  7: { emoji: '🌱', title: '첫 번째 잔디밭!', sub: '7일 연속 달성' },
  14: { emoji: '🌿', title: '2주의 기적!', sub: '14일 연속 달성' },
  30: { emoji: '🌳', title: '한 달의 습관!', sub: '30일 연속 달성' },
  60: { emoji: '🔥', title: '불꽃 60일!', sub: '60일 연속 달성' },
  100: { emoji: '💎', title: '100일의 기록!', sub: '100일 연속 달성' },
  200: { emoji: '🏆', title: '200일 마스터!', sub: '200일 연속 달성' },
  365: { emoji: '👑', title: '1년의 왕관!', sub: '365일 연속 달성' },
};

export function getUnseenMilestone(
  streak: number,
  celebrated: number[],
): StreakMilestone | null {
  for (const m of MILESTONES) {
    if (streak >= m && !celebrated.includes(m)) return m;
  }
  return null;
}

type Props = {
  milestone: StreakMilestone;
  streak: number;
  visible: boolean;
  onClose: () => void;
};

export function StreakMilestoneModal({ milestone, streak, visible, onClose }: Props) {
  const c = useThemeColors();
  const info = MILESTONE_INFO[milestone];

  const { backdropOpacity, backdropStyle: rawBackdropStyle, contentStyle: cardStyle } = useModalAnimation({
    scaleFrom: 0.6,
    spring: { damping: 14, stiffness: 160 },
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.6,
  }));

  const emojiScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      emojiScale.value = withDelay(
        300,
        withSequence(
          withSpring(1.3, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 12, stiffness: 150 }),
        ),
      );
    } else {
      emojiScale.value = 0;
    }
  }, [visible, emojiScale]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  if (!visible || !info) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: '#000',
            },
            backdropStyle,
          ]}
        />

        <ConfettiCelebration visible={visible} onFinish={() => {}} />

        <Animated.View
          style={[
            {
              backgroundColor: c.surfaceCard,
              borderRadius: radius.xl,
              padding: spacing.section + 4,
              alignItems: 'center',
              gap: spacing.md,
              marginHorizontal: 40,
              minWidth: 260,
            },
            cardStyle,
          ]}
        >
          <Animated.View style={emojiStyle}>
            <AppText style={{ fontSize: 56 }}>{info.emoji}</AppText>
          </Animated.View>

          <AppText variant="title" style={{ fontWeight: '800', textAlign: 'center' }}>
            {info.title}
          </AppText>

          <AppText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
            {info.sub}
          </AppText>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: spacing.sm,
            }}
          >
            <AppIcon name="Flame" size={20} color={c.accent} />
            <AppText variant="title" style={{ fontWeight: '800', color: c.accent }}>
              {streak}
            </AppText>
            <AppText variant="body" tone="tertiary">일 연속</AppText>
          </View>

          <Pressable
            onPress={onClose}
            style={{
              marginTop: spacing.sm,
              paddingHorizontal: spacing.section,
              paddingVertical: spacing.sm + 2,
              borderRadius: radius.xl,
              backgroundColor: c.primary,
            }}
          >
            <AppText variant="body" style={{ color: '#fff', fontWeight: '700' }}>
              계속하기
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
