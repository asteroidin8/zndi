import { forwardRef } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DAY_LABELS } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { getCellBorderRadius, getCellTransform, getGrassColor } from '@/constants/grassTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { grassCellColors, type DailyGrassActivity } from '@/utils/calendarGrass';
import { toDateStr } from '@/utils/homeDailyBoard';

const CELL_SIZE = 40;
const GAP = 6;

type Props = {
  year: number;
  month: number;
  grassMap: Map<string, DailyGrassActivity>;
  nickname?: string | null;
};

export const ShareableGrassGrid = forwardRef<View, Props>(function ShareableGrassGrid(
  { year, month, grassMap, nickname },
  ref,
) {
  const c = useThemeColors();
  const grassShape = useSettingsStore((s) => s.grassShape);
  const grassHex = getGrassColor(useSettingsStore.getState().grassColor);
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
      <View style={{ alignItems: 'center', gap: 4 }}>
        <AppText variant="body" style={{ fontWeight: '600' }}>
          {year}년 {month + 1}월
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText variant="caption" style={{ fontWeight: '700', color: grassHex }}>
            zndi
          </AppText>
          {nickname ? (
            <AppText variant="caption" tone="tertiary" style={{ fontWeight: '500' }}>
              by {nickname}
            </AppText>
          ) : null}
        </View>
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

            const cellRadius = getCellBorderRadius(grassShape, CELL_SIZE);
            const cellTransform = getCellTransform(grassShape);
            const isDiamond = grassShape === 'diamond';
            const diamondSize = isDiamond ? Math.round(CELL_SIZE * 0.78) : CELL_SIZE;

            return (
              <View key={date} style={{ width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={{
                    width: isDiamond ? diamondSize : CELL_SIZE,
                    height: isDiamond ? diamondSize : CELL_SIZE,
                    borderRadius: cellRadius,
                    borderWidth: isToday ? 1.5 : 1,
                    borderColor: colors.borderColor,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(cellTransform.rotate ? { transform: [{ rotate: cellTransform.rotate }] } : {}),
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
                      fontSize: isDiamond ? 9 : 11,
                      fontWeight: isToday ? '700' : level >= 3 ? '600' : '400',
                      zIndex: 1,
                      ...(cellTransform.rotate ? { transform: [{ rotate: `-${cellTransform.rotate}` }] } : {}),
                    }}
                  >
                    {new Date(`${date}T00:00:00`).getDate()}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, alignSelf: 'flex-end' }}>
          <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>적음</AppText>
          {LEGEND_LEVELS.map((lvl) => {
            const legendColors = grassCellColors(lvl, c, false, false);
            return (
              <View
                key={lvl}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: getCellBorderRadius(grassShape, 10),
                  backgroundColor: lvl === 0 ? c.surfaceMuted : legendColors.fill,
                  opacity: lvl === 0 ? 1 : legendColors.fillOpacity,
                  borderWidth: lvl === 0 ? 1 : 0,
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
