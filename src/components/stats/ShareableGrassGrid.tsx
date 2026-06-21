import { forwardRef } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DAY_LABELS } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { grassCellColors, type DailyGrassActivity } from '@/utils/calendarGrass';
import { toDateStr } from '@/utils/homeDailyBoard';

const CELL_SIZE = 40;
const GAP = 6;

type Props = {
  year: number;
  month: number;
  grassMap: Map<string, DailyGrassActivity>;
};

export const ShareableGrassGrid = forwardRef<View, Props>(function ShareableGrassGrid(
  { year, month, grassMap },
  ref,
) {
  const c = useThemeColors();
  const today = toDateStr(new Date());
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(new Date(year, month, i + 1))),
  ];

  const LEGEND_LEVELS = [0, 1, 2, 3, 4] as const;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        backgroundColor: c.surface,
        padding: 24,
        alignItems: 'center',
        gap: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AppText variant="title" style={{ fontSize: 18, fontWeight: '700', color: c.primary }}>
          zndi
        </AppText>
        <AppText variant="body" style={{ fontWeight: '600' }}>
          {year}년 {month + 1}월
        </AppText>
      </View>

      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: GAP, marginBottom: spacing.xs }}>
          {DAY_LABELS.map((d) => (
            <View key={d} style={{ width: CELL_SIZE, alignItems: 'center' }}>
              <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>
                {d}
              </AppText>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {cells.map((date, i) => {
            if (!date) return <View key={`empty-${i}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
            const isToday = date === today;
            const grass = grassMap.get(date);
            const level = grass?.level ?? 0;
            const colors = grassCellColors(level, c, isToday, false);

            return (
              <View
                key={date}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: CELL_SIZE / 4,
                  borderWidth: isToday ? 1.5 : 1,
                  borderColor: colors.borderColor,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {colors.fill !== 'transparent' && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: colors.fill,
                      opacity: colors.fillOpacity,
                    }}
                  />
                )}
                <AppText
                  variant="caption"
                  tone={isToday ? 'primary' : level > 0 ? 'secondary' : 'disabled'}
                  style={{
                    fontSize: 11,
                    fontWeight: isToday ? '700' : level >= 3 ? '600' : '400',
                    zIndex: 1,
                  }}
                >
                  {new Date(`${date}T00:00:00`).getDate()}
                </AppText>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, alignSelf: 'flex-end' }}>
          <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>적음</AppText>
          {LEGEND_LEVELS.map((level) => {
            const legendColors = grassCellColors(level, c, false, false);
            return (
              <View
                key={level}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: level === 0 ? c.surfaceMuted : legendColors.fill,
                  opacity: level === 0 ? 1 : legendColors.fillOpacity,
                  borderWidth: level === 0 ? 1 : 0,
                  borderColor: c.border,
                }}
              />
            );
          })}
          <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>많음</AppText>
        </View>
      </View>
    </View>
  );
});
