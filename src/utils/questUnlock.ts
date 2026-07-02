import { AVATARS, type AvatarDef, type QuestType } from '@/constants/avatars';
import { useAvatarStore } from '@/stores/useAvatarStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useFastingStore } from '@/stores/useFastingStore';

export function computeQuestValue(type: QuestType, datePattern?: string): number {
  switch (type) {
    case 'routineCount':
      return Object.keys(useRoutineCompletionStore.getState().completions).length;
    case 'todoCount':
      return useTodoStore.getState().todos.filter((t) => t.completedAt && !t.deletedAt).length;
    case 'fastingCount':
      return useFastingStore.getState().records.filter((r) => r.endedAt != null).length;
    case 'fastingHours':
      return useFastingStore
        .getState()
        .records.filter((r) => r.endedAt != null)
        .reduce((sum, r) => sum + (r.endedAt! - r.startedAt) / 3_600_000, 0);
    case 'dateEvent': {
      const today = new Date().toISOString().slice(5, 10); // 'MM-DD'
      return today === datePattern ? 1 : 0;
    }
    default:
      return 0;
  }
}

/** 조건 충족된 미보유 퀘스트 아바타를 해금하고 새로 해금된 목록을 반환 */
export function checkAndUnlockQuestAvatars(): AvatarDef[] {
  const { ownedIds, own } = useAvatarStore.getState();
  const newlyUnlocked: AvatarDef[] = [];

  for (const avatar of AVATARS) {
    if (avatar.acquire !== 'quest' || !avatar.questCondition) continue;
    if (ownedIds.includes(avatar.id)) continue;

    const { type, target, datePattern } = avatar.questCondition;
    const current = computeQuestValue(type, datePattern);
    const done = type === 'dateEvent' ? current === 1 : current >= target;

    if (done) {
      own(avatar.id);
      newlyUnlocked.push(avatar);
    }
  }

  return newlyUnlocked;
}
