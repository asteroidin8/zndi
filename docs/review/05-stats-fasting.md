# 화면 검토: 통계 / 단식

**검토 범위:** `app/(tabs)/stats.tsx`, `app/stats/fasting.tsx`, `app/stats/routine.tsx`, `app/stats/todo.tsx`, `app/stats/weight.tsx`, `src/stores/useFastingStore.ts`, `src/components/FastingCard.tsx`, `src/components/fasting/FastingTimer.tsx`

---

## 1. 보안

### 1-1. `deleteCloudRecord` 직접 호출 — 심각도: 중간 (01 문서에서 이미 식별)

**문제:** `stats.tsx:444`와 `fasting.tsx:162`에서 `deleteCloudRecord('fasting_records', id)` 호출. 01 문서의 1-2에서 제안한 타입 안전성 개선이 여기에도 적용됨.

### 1-2. 단식 기록 조작 가능 — 심각도: 낮음

**문제:** `useFastingStore`에서 `updateRecord`로 시작/종료 시간, 결과를 자유롭게 수정 가능. 로컬 앱이므로 당연하지만, 보드의 daily progress에 반영된다면 다른 사용자에게 허위 데이터 표시 가능.

**현재 평가:** 단식은 개인 기록이고 보드 루틴과 별개이므로 현재는 문제없음. 향후 단식을 소셜 기능과 연동할 경우 서버 검증 필요.

---

## 2. 비용 효율성

### 2-1. 통계 화면 — 모든 store 데이터를 매 렌더에 구독 — 심각도: 중간

**문제:** `stats.tsx`에서 6개의 store를 동시 구독:
- `useFastingStore` (records)
- `useRoutineStore` (routines)
- `useTodoStore` (todos)
- `useRoutineCompletionStore` (completions)
- `useUserStore` (profile)
- `useBoardStore` (routines, logs)

어떤 store든 변경되면 전체 통계 화면이 리렌더링된다. 홈에서 루틴 체크만 해도 통계 탭이 재계산.

**개선:**
- Zustand의 selector를 더 세분화: `(s) => s.records.length` 등 필요한 값만 구독
- 또는 통계 계산을 별도 `useStatsData` 훅으로 분리하고 내부에서 `useMemo` 최적화

**예상 효과:** 불필요한 리렌더링 50~70% 감소

### 2-2. `buildMonthGrassMap` — 매 렌더에 호출 — 심각도: 낮음

**문제:** `stats.tsx:229`에서 `buildMonthGrassMap`이 `useMemo` 없이 렌더 시마다 호출된다.

**개선:** `useMemo`로 감싸기:
```typescript
const grassMap = useMemo(
  () => buildMonthGrassMap(viewYear, viewMonth, allRoutines, isCompleted, allTodos, boardData),
  [viewYear, viewMonth, allRoutines, completions, allTodos, boardData],
);
```

**예상 효과:** 불필요한 캘린더 재계산 방지

---

## 3. UX

### 3-1. 단식 기록 상세 — 전체 기록을 한 번에 렌더링

**문제:** `stats/fasting.tsx:104-125`에서 모든 단식 기록을 `summaries.map()`으로 한 번에 렌더. 기록이 수백 개가 되면 스크롤 성능 저하.

**개선:** `FlatList`로 전환 + 아이템 고정 높이 설정 (`getItemLayout`)

**예상 효과:** 대량 기록 시 스크롤 성능 유지

### 3-2. 단식 타이머 — 앱 종료 후 복귀 시 동작

**현재 평가:** `startedAt` 타임스탬프 기반이므로 앱 종료 후 복귀해도 정확하게 계산됨. `useLiveElapsed` 훅이 매초 갱신. 잘 구현되어 있음.

### 3-3. 공유 버튼 3개 — 반복 스타일

**문제:** `stats.tsx:332-383`에서 Instagram/카카오톡/공유 버튼 3개가 동일한 스타일을 인라인으로 반복.

**개선:** `ShareButton` 컴포넌트로 추출:
```typescript
function ShareButton({ icon, label, onPress }) { ... }
```

**예상 효과:** 코드 ~30줄 절감, 유지보수성

### 3-4. `Dimensions.get('window').width` 정적 사용

**문제:** `stats/fasting.tsx:25`에서 `SCREEN_WIDTH`를 모듈 레벨에서 한 번만 계산. 화면 회전이나 멀티윈도우 시 업데이트 안 됨.

**개선:** `useWindowDimensions()` 훅 사용.

---

## 4. 속도/성능

### 4-1. `groupFastingByDay` 중복 호출

**문제:** `stats.tsx:123-131`과 `stats/fasting.tsx:34-42`에서 동일한 `groupFastingByDay` 변환을 각각 수행. 통계 메인에서 단식 상세로 이동할 때 이미 계산된 데이터를 재활용하지 않음.

**현재 평가:** 단식 기록이 보통 수백 개 이내이므로 성능 영향 미미. 다만 통계 메인에서는 `useMemo`로 감싸는 것이 좋음.

### 4-2. `ShareableGrassGrid` 상시 마운트

**문제:** `stats.tsx:413-421`에서 공유용 그리드를 `position: absolute, left: -9999`로 화면 밖에 상시 렌더링. 공유 버튼을 누를 때만 필요한 컴포넌트.

**개선:** 공유 시에만 마운트하고 캡처 후 언마운트:
```typescript
const [capturing, setCapturing] = useState(false);
// 공유 시: setCapturing(true) → 캡처 → setCapturing(false)
{capturing && <ShareableGrassGrid ref={gridRef} ... />}
```

**예상 효과:** 통계 화면 초기 렌더링 비용 절감

---

## 요약

| # | 항목 | 심각도 | 노력 | 우선 |
|---|------|--------|------|------|
| 2-2 | grassMap useMemo 추가 | 중간 | 낮음 | **즉시** |
| 2-1 | store 구독 최적화 | 중간 | 중간 | 단기 |
| 3-1 | 단식 기록 FlatList 전환 | 낮음 | 낮음 | 단기 |
| 4-2 | ShareableGrassGrid 지연 마운트 | 낮음 | 낮음 | 단기 |
| 3-3 | 공유 버튼 컴포넌트 추출 | 낮음 | 낮음 | 단기 |
| 3-4 | useWindowDimensions 전환 | 낮음 | 낮음 | 단기 |
