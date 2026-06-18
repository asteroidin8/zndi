import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { SectionHeader } from '@/components/SectionHeader';
import { HOME_COPY } from '@/constants/copy';
import { spacing } from '@/constants/spacing';
import { grassGlowShadow } from '@/constants/themeEffects';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { getWeekDayDots, toDateStr, type DayDotStatus } from '@/utils/homeDailyBoard';

function cellColor(status: DayDotStatus, c: ReturnType<typeof useThemeColors>) {
  switch (status) {
    case 'full':
      return { bg: c.primary, border: c.primary, glow: true };
    case 'partial':
      return { bg: c.primary, border: c.borderStrong, glow: false };
    case 'empty':
      return { bg: c.surfaceSubtle, border: c.borderStrong, glow: false };
    default:
      return { bg: 'transparent', border: c.border, glow: false };
  }
}

/** 홈 — 이번 주 7칸 잔디 */
export function HomeWeeklyGrass() {
  const c = useThemeColors();
  const { routines } = useRoutineStore();
  const { isCompleted } = useRoutineCompletionStore();

  const todayStr = toDateStr(new Date());
  const weekDots = getWeekDayDots(routines, isCompleted);
  const activeDays = weekDots.filter((d) => d.status !== 'none');
  const fullDays = weekDots.filter((d) => d.status === 'full').length;
  const weekSummary =
    activeDays.length > 0 ? `${fullDays}/${activeDays.length}일` : '이번 주 기록 없음';

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title={HOME_COPY.weekSection} />
        <AppText variant="caption" tone="tertiary">
          {weekSummary}
        </AppText>
      </View>

      <View
        style={{
          backgroundColor: c.surfaceSubtle,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.border,
          paddingHorizontal: spacing.item,
          paddingVertical: spacing.card,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {weekDots.map((dot) => {
            const isToday = dot.dateStr === todayStr;
            const colors = cellColor(dot.status, c);
            const size = isToday ? 16 : 14;
            const partial = dot.status === 'partial';
            const statusA11y =
              dot.status === 'full'
                ? '전체 완료'
                : dot.status === 'partial'
                  ? '일부 완료'
                  : dot.status === 'empty'
                    ? '미완료'
                    : '기록 없음';
            return (
              <View
                key={dot.dateStr}
                style={{ flex: 1, alignItems: 'center', gap: 6 }}
                accessibilityLabel={`${dot.weekdayLabel} ${statusA11y}`}
              >
                <View
                  style={{
                    width: size,
                    height: size,
                    borderRadius: 4,
                    backgroundColor: colors.bg,
                    opacity: partial ? 0.45 : 1,
                    borderWidth: dot.status === 'none' || dot.status === 'empty' ? 1 : 0,
                    borderColor: colors.border,
                    transform: [{ scale: isToday ? 1.15 : 1 }],
                    ...(colors.glow ? grassGlowShadow(c) : {}),
                  }}
                />
                <AppText
                  variant="caption"
                  tone={isToday ? 'secondary' : 'tertiary'}
                  style={{ fontWeight: isToday ? '600' : '400' }}
                >
                  {dot.weekdayLabel}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
