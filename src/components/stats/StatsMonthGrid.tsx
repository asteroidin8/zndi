import { Dimensions, Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { DAY_LABELS } from '@/constants/statsLabels';
import { getCellBorderRadius, getCellTransform, getGrassColor } from '@/constants/grassTheme';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { grassCellColors, type DailyGrassActivity } from '@/utils/calendarGrass';
import { toDateStr } from '@/utils/homeDailyBoard';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_BORDER = 4;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - SCREEN_BORDER - 40 - 6 * 6) / 7);

type Props = {
  year: number;
  month: number;
  grassMap: Map<string, DailyGrassActivity>;
  hasFastingRecord: (date: string) => boolean;
  onSelectDate: (date: string) => void;
};

export function StatsMonthGrid({ year, month, grassMap, hasFastingRecord, onSelectDate }: Props) {
  const c = useThemeColors();
  const grassShape = useSettingsStore((s) => s.grassShape);
  const grassHex = getGrassColor(useSettingsStore((s) => s.grassColor));
  const today = toDateStr(new Date());
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(new Date(year, month, i + 1))),
  ];

  const LEGEND_LEVELS = [0, 1, 2, 3, 4] as const;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.xs }}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={{ width: CELL_SIZE, alignItems: 'center' }}>
            <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>
              {d}
            </AppText>
          </View>
        ))}
      </View>
      <Animated.View
        key={`${year}-${month}`}
        entering={FadeIn.duration(200)}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
      >
        {cells.map((date, i) => {
          if (!date) return <View key={`empty-${i}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
          const dayNum = parseInt(date.slice(8), 10);
          const isToday = date === today;
          const hasFasting = hasFastingRecord(date);
          const grass = grassMap.get(date);
          const level = grass?.level ?? 0;
          const colors = grassCellColors(level, c, isToday, hasFasting, grassHex);
          const a11yParts = [
            `${dayNum}일`,
            grass && grass.routineTotal > 0
              ? `루틴 ${grass.routineCompleted}/${grass.routineTotal}`
              : null,
            grass && grass.todosCompleted > 0 ? `할일 ${grass.todosCompleted}개 완료` : null,
            hasFasting ? '단식 기록 있음' : null,
          ]
            .filter(Boolean)
            .join(', ');

          const cellRadius = getCellBorderRadius(grassShape, CELL_SIZE);
          const cellTransform = getCellTransform(grassShape);
          const isDiamond = grassShape === 'diamond';
          const diamondSize = isDiamond ? Math.round(CELL_SIZE * 0.78) : CELL_SIZE;

          return (
            <View key={date} style={{ width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <Pressable
              onPress={() => onSelectDate(date)}
              accessibilityRole="button"
              accessibilityLabel={a11yParts}
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
                ...(colors.glow
                  ? {
                      shadowColor: colors.neonGlow,
                      shadowOpacity: 0.5,
                      shadowRadius: 5,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 4,
                    }
                  : {}),
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
                tone={isToday ? 'primary' : level > 0 ? 'secondary' : hasFasting ? 'secondary' : 'disabled'}
                style={{
                  fontSize: isDiamond ? 9 : 11,
                  fontWeight: isToday ? '700' : level >= 3 ? '600' : '400',
                  zIndex: 1,
                  ...(cellTransform.rotate ? { transform: [{ rotate: `-${cellTransform.rotate}` }] } : {}),
                }}
              >
                {dayNum}
              </AppText>
            </Pressable>
            </View>
          );
        })}
      </Animated.View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, alignSelf: 'flex-end' }}>
        <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>적음</AppText>
        {LEGEND_LEVELS.map((lvl) => {
          const legendColors = grassCellColors(lvl, c, false, false, grassHex);
          const legendRadius = getCellBorderRadius(grassShape, 10);
          return (
            <View
              key={lvl}
              style={{
                width: 10,
                height: 10,
                borderRadius: legendRadius,
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
  );
}
