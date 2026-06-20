import { Dimensions, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DAY_LABELS } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { grassCellColors, type DailyGrassActivity } from '@/utils/calendarGrass';
import { toDateStr } from '@/utils/homeDailyBoard';
import type { DailyFastingSummary } from '@/utils/statsHelper';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40 - 6 * 6) / 7);

type Props = {
  year: number;
  month: number;
  summaries: DailyFastingSummary[];
  grassMap: Map<string, DailyGrassActivity>;
  onSelect: (s: DailyFastingSummary) => void;
};

export function StatsMonthGrid({ year, month, summaries, grassMap, onSelect }: Props) {
  const c = useThemeColors();
  const dateMap = new Map(summaries.map((s) => [s.date, s]));
  const today = toDateStr(new Date());
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(new Date(year, month, i + 1))),
  ];

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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {cells.map((date, i) => {
          if (!date) return <View key={`empty-${i}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
          const summary = dateMap.get(date);
          const isToday = date === today;
          const hasFasting = !!summary;
          const grass = grassMap.get(date);
          const level = grass?.level ?? 0;
          const colors = grassCellColors(level, c, isToday, hasFasting);
          const a11yParts = [
            `${new Date(`${date}T00:00:00`).getDate()}일`,
            grass && grass.routineTotal > 0
              ? `루틴 ${grass.routineCompleted}/${grass.routineTotal}`
              : null,
            grass && grass.todosCompleted > 0 ? `할일 ${grass.todosCompleted}개 완료` : null,
            hasFasting ? '단식 기록 있음' : null,
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <Pressable
              key={date}
              onPress={() => summary && onSelect(summary)}
              accessibilityRole="button"
              accessibilityLabel={a11yParts}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: CELL_SIZE / 4,
                borderWidth: isToday ? 1.5 : 1,
                borderColor: colors.borderColor,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                ...(colors.glow
                  ? {
                      shadowColor: c.neonGlow,
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
                  fontSize: 11,
                  fontWeight: isToday ? '700' : level >= 3 ? '600' : '400',
                  zIndex: 1,
                }}
              >
                {new Date(`${date}T00:00:00`).getDate()}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
