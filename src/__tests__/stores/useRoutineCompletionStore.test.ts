import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import type { Weekday } from '@/types';
import { toDateStr } from '@/utils/homeDailyBoard';

beforeEach(() => {
  useRoutineCompletionStore.setState({ completions: {} });
});

describe('useRoutineCompletionStore', () => {
  describe('toggleCompletion', () => {
    it('adds a completion', () => {
      useRoutineCompletionStore.getState().toggleCompletion('r1', '2026-06-20');
      expect(useRoutineCompletionStore.getState().isCompleted('r1', '2026-06-20')).toBe(true);
    });

    it('removes a completion on second toggle', () => {
      const { toggleCompletion } = useRoutineCompletionStore.getState();
      toggleCompletion('r1', '2026-06-20');
      toggleCompletion('r1', '2026-06-20');
      expect(useRoutineCompletionStore.getState().isCompleted('r1', '2026-06-20')).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('returns false for non-existent completion', () => {
      expect(useRoutineCompletionStore.getState().isCompleted('r1', '2026-06-20')).toBe(false);
    });
  });

  describe('getCompletedIds', () => {
    it('returns ids completed on a given date', () => {
      const state = useRoutineCompletionStore.getState();
      state.toggleCompletion('r1', '2026-06-20');
      state.toggleCompletion('r2', '2026-06-20');
      state.toggleCompletion('r3', '2026-06-19');

      const ids = useRoutineCompletionStore.getState().getCompletedIds('2026-06-20');
      expect(ids).toContain('r1');
      expect(ids).toContain('r2');
      expect(ids).not.toContain('r3');
    });
  });

  describe('getStreak', () => {
    it('returns 0 when no completions', () => {
      const routine = { id: 'r1', name: '', repeatType: 'weekly' as const, repeatDays: [1, 3, 5] as (0|1|2|3|4|5|6)[], monthDates: [], reminderTime: null, createdAt: 0, order: 0, groupId: null };
      const streak = useRoutineCompletionStore.getState().getStreak('r1', routine);
      expect(streak).toBe(0);
    });

    it('counts consecutive completed days', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-20T12:00:00'));

      const state = useRoutineCompletionStore.getState();
      const now = new Date();
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(now.getDate() - 1);
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);

      const asStoreDate = (d: Date) => {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return toDateStr(x);
      };

      state.toggleCompletion('r1', asStoreDate(oneDayAgo));
      state.toggleCompletion('r1', asStoreDate(threeDaysAgo));

      const repeatDays = Array.from(
        new Set([oneDayAgo.getDay(), threeDaysAgo.getDay()]),
      ) as Weekday[];

      const routine = {
        id: 'r1',
        name: '',
        repeatType: 'weekly' as const,
        repeatDays,
        monthDates: [],
        reminderTime: null,
        createdAt: 0,
        order: 0,
        groupId: null,
      };
      const streak = useRoutineCompletionStore.getState().getStreak('r1', routine);
      expect(streak).toBe(2);

      jest.useRealTimers();
    });
  });

  describe('clearOldCompletions', () => {
    it('removes completions older than retention period', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-20T12:00:00'));

      useRoutineCompletionStore.setState({
        completions: {
          '2026-06-20:r1': Date.now(),
          '2025-04-01:r1': Date.now(),
        },
      });

      useRoutineCompletionStore.getState().clearOldCompletions();

      const { completions } = useRoutineCompletionStore.getState();
      expect(completions['2026-06-20:r1']).toBeTruthy();
      expect(completions['2025-04-01:r1']).toBeUndefined();

      jest.useRealTimers();
    });
  });
});
