# 모달 리렌더링 + 발열 근본 원인 분석

## 화면 이름
루틴/할일 화면 → 생성/편집 모달, 전체 앱

## 문제점 요약
- 루틴/할일 모달을 열면 간헐적으로 화면이 리렌더링됨
- 앱 사용 중 지속적 발열

## 근본 원인 분석

### 연쇄 반응 폭포 (Cascade Reaction Waterfall)

루틴이나 할일을 하나 추가/수정하면, 다음 **5개의 독립적인 반응**이 동시에 트리거됩니다:

```
store 변경 (예: useRoutineStore.setState)
    ├─ 1. useAutoCloudSync     → schedulePush → 2.5초 후 pushLocalToCloud
    ├─ 2. useBoardProgressSync → 500ms 후 computeDailyProgress (365일 순회 가능)
    ├─ 3. useWidgetSync        → 1초 후 syncWidgets + pushUpdate (Android)
    ├─ 4. useRoutineNotifications → 2초 후 알림 전체 재등록
    └─ 5. Realtime echo       → push 후 echo → store setState → 1~4 다시 트리거
```

**문제 1: 모든 subscriber가 store의 모든 변경에 반응**

`useRoutineStore.subscribe(debouncedSync)` — store의 어떤 필드가 바뀌든 전부 반응합니다.
예: 그룹 접기/펼치기(collapsed 변경)만 해도 push + 진행도 계산 + 위젯 갱신 + 알림 재등록이 모두 실행됩니다.

**문제 2: 알림 재등록이 매우 무거움**

`useRoutineNotifications`(99줄)가 `routines` 배열이 변경될 때마다:
1. 모든 기존 알림 취소
2. 모든 루틴의 알림 재등록 (루틴 × 반복요일 수 만큼 API 호출)

루틴 30개 × 평균 3요일 = **90회** `Notifications.scheduleNotificationAsync` 호출.
이게 2초 debounce로 반복됩니다.

**문제 3: push → echo 잔여 루프**

completions의 전체 DELETE+INSERT는 수정했지만, routines/todos push 후 Realtime echo가 de-dupe를 통과하면 store가 갱신되어 1~4가 다시 트리거됩니다.

### 모달이 리렌더링되는 이유

모달이 열려 있는 상태에서 위 연쇄 반응이 store를 갱신하면, 모달이 subscribe하고 있는 store가 변경되어 리렌더링됩니다.

## 개선 제안

### 1. subscribe를 세분화하여 불필요한 반응 차단

**수정 전 (useAutoCloudSync):**
```typescript
useRoutineStore.subscribe(() => schedulePush('routines'))
```

**수정 후:**
```typescript
useRoutineStore.subscribe((state, prev) => {
  if (state.routines !== prev.routines || state.groups !== prev.groups) {
    schedulePush('routines');
  }
})
```

**수정 전 (useBoardProgressSync):**
```typescript
useRoutineStore.subscribe(debouncedSync)
```

**수정 후:**
```typescript
useRoutineStore.subscribe((state, prev) => {
  if (state.routines !== prev.routines) debouncedSync();
})
```

### 2. 알림 재등록을 실질적 변경 시에만 실행

**수정 전 (useRoutineNotifications):**
```typescript
useEffect(() => { ... }, [routines, routineNotificationsEnabled]);
```

routines 배열 참조가 바뀔 때마다 실행. Realtime echo로 routines가 갱신되면 알림도 재등록.

**수정 후:** 알림에 영향을 주는 필드(name, reminderTime, repeatDays, deletedAt)만 비교하는 fingerprint 기반:
```typescript
const routineFingerprint = useMemo(() =>
  routines.filter(r => !r.deletedAt && r.reminderTime)
    .map(r => `${r.id}:${r.reminderTime}:${r.repeatDays?.join(',')}:${r.repeatType}`)
    .join('|'),
  [routines]
);
useEffect(() => { ... }, [routineFingerprint, routineNotificationsEnabled]);
```

### 3. 위젯 sync도 실질 변경 시에만

**수정 전:**
```typescript
useRoutineStore.subscribe(debouncedSync)
useTodoStore.subscribe(debouncedSync)
```

**수정 후:** 이전 위젯 데이터와 비교하여 변경 시에만 push:
```typescript
let lastWidgetKey = '';
const debouncedSync = () => {
  debounceRef.current = setTimeout(() => {
    const data = buildWidgetData(...);
    const key = `${data.routineCompleted}/${data.routineTotal}:${data.todoCompleted}/${data.todoTotal}`;
    if (key === lastWidgetKey) return;
    lastWidgetKey = key;
    pushUpdate(data);
  }, WIDGET_DEBOUNCE_MS);
};
```

## 예상 효과
- 루틴 1개 수정 시: push 1회 + (필요 시) 진행도 1회. 알림/위젯 갱신 0회
- 그룹 접기만 했을 때: push 1회. 진행도/알림/위젯 0회
- 발열 원인인 불필요한 연쇄 반응 80%+ 차단

## 재발 방지
- store subscribe 시 반드시 `(state, prev)` 비교를 사용
- 전체 store가 아닌 관심 있는 slice만 비교
