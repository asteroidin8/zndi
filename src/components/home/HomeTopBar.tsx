import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { getRoutineStreakDays } from '@/utils/homeDailyBoard';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getCompactDateLabel() {
  const now = new Date();
  return `${now.getMonth() + 1}월 ${now.getDate()}일 · ${WEEKDAYS[now.getDay()]}`;
}

export function HomeTopBar() {
  const c = useThemeColors();
  const { routines } = useRoutineStore();
  const { isCompleted } = useRoutineCompletionStore();
  const streak = getRoutineStreakDays(routines, isCompleted);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 72 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            backgroundColor: c.primary,
          }}
        />
        <AppText variant="body" style={{ fontWeight: '800', letterSpacing: -0.5 }}>
          zndi
        </AppText>
      </View>

      <AppText variant="caption" tone="secondary" style={{ flex: 1, textAlign: 'center' }}>
        {getCompactDateLabel()}
      </AppText>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {streak > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <AppIcon name="Flame" size={14} color={c.primary} />
            <AppText variant="caption" tone="secondary" style={{ fontWeight: '700' }}>
              {streak}
            </AppText>
          </View>
        )}
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="설정"
        >
          <AppIcon name="Settings" size={20} color={c.inkTertiary} />
        </Pressable>
      </View>
    </View>
  );
}
