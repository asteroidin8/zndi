import { Dimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import {
  buildContributionGrid,
  getMonthRoutineStats,
  hasMinimalContribution,
} from '@/utils/contributionGrid';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = spacing.screen * 2;
const GAP = 4;
const COLS = 7;
const CELL = Math.floor((SCREEN_WIDTH - H_PADDING - GAP * (COLS - 1)) / COLS);

function cellBackground(
  cell: ReturnType<typeof buildContributionGrid>[number],
  c: ReturnType<typeof useThemeColors>,
) {
  if (!cell.dateStr || cell.total === 0) return 'transparent';
  if (cell.isFull) return c.primary;
  if (cell.rate > 0) return c.accent;
  return c.surfaceSubtle;
}

export function ContributionGrid() {
  const c = useThemeColors();
  const { routines } = useRoutineStore();
  const { isCompleted } = useRoutineCompletionStore();

  const cells = buildContributionGrid(routines, isCompleted);
  const monthStats = getMonthRoutineStats(routines, isCompleted);
  const showEmpty = !hasMinimalContribution(cells);

  const summary =
    monthStats.daysWithRoutines > 0
      ? `이번 달 ${Math.round(monthStats.rate * 100)}% (${monthStats.daysFullyComplete}/${monthStats.daysWithRoutines})`
      : '루틴을 추가하면 잔디가 자라요';

  return (
    <View style={{ gap: spacing.sm, minHeight: SCREEN_WIDTH * 0.38 }}>
      <AppText variant="caption" tone="tertiary">
        나의 잔디
      </AppText>

      {showEmpty ? (
        <View
          style={{
            flex: 1,
            minHeight: 120,
            justifyContent: 'center',
            paddingVertical: spacing.card,
          }}
        >
          <AppText variant="body" tone="secondary" style={{ textAlign: 'center', lineHeight: 22 }}>
            아직 잔디가 없네요 🌱{'\n'}오늘부터 시작해볼까요?
          </AppText>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {cells.map((cell, index) => {
            if (!cell.dateStr) {
              return (
                <View
                  key={`pad-${index}`}
                  style={{ width: CELL, height: CELL, borderRadius: 4 }}
                />
              );
            }

            const bg = cellBackground(cell, c);
            const glow = cell.isFull;

            return (
              <View
                key={cell.dateStr}
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: 4,
                  backgroundColor: bg,
                  opacity: cell.rate > 0 && !cell.isFull ? 0.55 : 1,
                  borderWidth: cell.isToday ? 1.5 : 0,
                  borderColor: cell.isToday ? c.accent : 'transparent',
                  transform: [{ scale: cell.isToday ? 1.12 : 1 }],
                  ...(glow
                    ? {
                        shadowColor: c.primary,
                        shadowOpacity: 0.55,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 4,
                      }
                    : {}),
                }}
                accessibilityLabel={`${cell.dateStr} 루틴 ${cell.completed}/${cell.total}`}
              />
            );
          })}
        </View>
      )}

      <AppText variant="caption" tone="tertiary">
        {summary}
      </AppText>
    </View>
  );
}
