# 최근 작업분 검토 (PR #253~#271)

> 검토 일자: 2026-06-27

---

## 발견 항목

### R-1. `StreakMilestoneModal` — `useModalAnimation` 미사용

**문제:** 동일한 backdrop+scale 애니메이션 패턴을 `useModalAnimation` 훅으로 추출했는데, 새로 만든 `StreakMilestoneModal`에서는 사용하지 않고 직접 구현.
**개선:** `useModalAnimation` 적용으로 ~10줄 절감.
**노력:** 낮음

### R-2. `ConfettiCelebration` — 40개 `Animated.View` 동시 생성

**문제:** `PARTICLE_COUNT = 40`개의 파티클을 각각 별도 `Animated.View`로 생성. 각각 `useSharedValue` + `useAnimatedStyle`을 사용하여 Reanimated 워크렛 40개 동시 실행.
**근본 원인:** 파티클 기반 축하 애니메이션은 네이티브 성능이 필요하지만, RN Animated View 40개는 과도.
**개선:** 파티클 수를 20개로 줄이거나, `visible=false`일 때 조기 return으로 불필요한 훅 실행 방지 (이미 적용됨, 현재 OK).
**노력:** 낮음

### R-3. `Dimensions.get('window')` 모듈 레벨 사용 — 6곳

**문제:** 화면 크기를 모듈 로딩 시 1회만 계산. 멀티윈도우/회전 시 갱신 안 됨.
**파일:** ConfettiCelebration, SheetModal, FastingDayDetailModal, StatsDayDetailModal, StatsMonthGrid, stats/fasting.
**개선:** `useWindowDimensions()` 훅 사용.
**노력:** 낮음이지만 파일 6개 수정 필요. 현재 앱이 portrait 고정이므로 실질 영향 없어 우선순위 낮음.

### R-4. `dirtyTracker` — `reorderRoutines`에서 전체 루틴 dirty 마킹

**문제:** `useRoutineStore.reorderRoutines`에서 `for (const r of ordered) markDirty('routines', r.id)` — 전체 루틴이 dirty로 마킹되어 row 단위 증분 push의 효과가 사라짐.
**근본 원인:** 순서 변경 시 모든 row의 `sort_order`가 바뀌므로 전체 upsert가 맞음. 하지만 `toggleGroupCollapsed`에서도 `markDirty('routine_groups', id)` 호출 — collapsed 변경은 서버에 push할 필요 없음.
**개선:** `collapsed`는 로컬 전용 UI 상태이므로 `toggleGroupCollapsed`에서 `markDirty` 제거.
**노력:** 낮음

### R-5. `useTodoStore` — 한 줄 mutation 가독성 저하

**문제:** dirty tracking 추가로 mutation이 한 줄로 압축되어 가독성이 떨어짐:
```typescript
addTodo: (todo) => { markDirty('todos', todo.id); set((s) => ({ todos: [...s.todos, todo] })); },
```
**개선:** 여러 줄로 포맷팅 (기능 변경 없음, 가독성만).
**노력:** 낮음이지만 linter가 다시 압축할 수 있음. 스킵.

---

## 개선 우선순위

| 순서 | 항목 | 효과 | 노력 |
|------|------|------|------|
| **1** | R-4. collapsed markDirty 제거 | 불필요 push 방지 | 낮음 |
| **2** | R-1. StreakMilestoneModal → useModalAnimation | ~10줄 절감 | 낮음 |
| **3** | R-2. ConfettiCelebration 파티클 수 감소 | 성능 | 낮음 |
