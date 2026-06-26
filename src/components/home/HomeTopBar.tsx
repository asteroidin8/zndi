import { router } from 'expo-router';
import { Image, Pressable, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { getRoutineStreakDays } from '@/utils/homeDailyBoard';

const ZNDI_SYMBOL = require('../../../assets/zndi-check-symbol.png');

export function HomeTopBar() {
  const c = useThemeColors();
  const routines = useRoutineStore((s) => s.routines);
  useRoutineCompletionStore((s) => s.completions);
  const { isCompleted } = useRoutineCompletionStore.getState();
  const streak = getRoutineStreakDays(routines, isCompleted);

  return (
    <View style={{ height: 40, justifyContent: 'center' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <AppText
          variant="body"
          style={{ fontWeight: '800', letterSpacing: 1, color: c.primary }}
        >
          zndi
        </AppText>
      </View>

      <View
        style={{
          position: 'absolute',
          left: 0,
          height: '100%',
          flexDirection: 'row',
          alignItems: 'center',
        }}
        accessibilityLabel={streak > 0 ? `연속 ${streak}일` : '잔디 심볼'}
      >
        {streak > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <AppIcon name="Flame" size={14} color={c.accent} />
            <AppText
              variant="caption"
              style={{ fontWeight: '700', color: c.accent }}
            >
              {streak}
            </AppText>
          </View>
        ) : (
          <Image source={ZNDI_SYMBOL} style={{ width: 24, height: 24 }} resizeMode="contain" />
        )}
      </View>

      <View
        style={{
          position: 'absolute',
          right: 0,
          height: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="설정"
          style={{ padding: spacing.xs }}
        >
          <AppIcon name="Settings" size={20} color={c.inkTertiary} />
        </Pressable>
      </View>
    </View>
  );
}
