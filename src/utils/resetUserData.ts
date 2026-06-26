import { useBoardStore } from '@/stores/useBoardStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { useFollowStore } from '@/stores/useFollowStore';
import { useProStore } from '@/stores/useProStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';

export async function resetUserData() {
  await Promise.all([
    useFastingStore.persist.clearStorage(),
    useRoutineStore.persist.clearStorage(),
    useTodoStore.persist.clearStorage(),
    useUserStore.persist.clearStorage(),
    useRoutineCompletionStore.persist.clearStorage(),
    useProStore.persist.clearStorage(),
  ]);

  useFastingStore.setState({
    status: 'idle',
    startedAt: null,
    records: [],
    goalHours: 16,
  });
  useRoutineStore.setState({ routines: [], groups: [] });
  useTodoStore.setState({ todos: [], groups: [], lastArchiveDate: null });
  useRoutineCompletionStore.setState({ completions: {} });
  useUserStore.setState({
    profile: {
      heightCm: null,
      weightKg: null,
      targetWeightKg: null,
      ageYears: null,
      isMale: null,
      nickname: null,
    },
  });
  useProStore.setState({
    isPro: false,
    purchasedColors: [],
    purchasedShapes: [],
  });
  useBoardStore.getState().reset();
  useFollowStore.getState().reset();
}
