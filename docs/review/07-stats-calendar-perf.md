# 통계 월간 달력 성능 검토

> 검토 일자: 2026-06-26

---

## 병목 분석

### 핵심 경로: `buildMonthGrassMap` → 31일 × 루틴/할일 순회

`buildMonthGrassMap`이 매일(31일)에 대해:
1. `getRoutineProgressForDate` → 모든 루틴을 순회하며 `isRoutineScheduledForDate` 호출 (날짜 계산 포함)
2. `countTodosCompletedOnDate` → **모든 할일**을 `.filter()`로 순회하며 `localDateStr(new Date(t.completedAt))` 호출

**총 비용:** 31일 × (루틴 N개 + 할일 M개) = O(31 × (N + M))

### 개선 항목 (우선순위순)

#### 1. `countTodosCompletedOnDate` — 매일 전체 할일 순회 + Date 객체 반복 생성 — 심각도: 높음

**문제:** 할일 100개 × 31일 = 3,100회 반복. 매번 `new Date(t.completedAt)`와 `localDateStr()` 호출로 Date 객체 + 문자열 변환이 발생.

**개선:** 사전에 `completedAt → dateStr` Map을 한 번 생성, 날짜별 개수를 미리 집계.

```typescript
// Before: O(todos × days)
// After: O(todos) 한 번 + O(1) × days
function buildTodoCompletionMap(todos: Todo[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of todos) {
    if (!t.completedAt || t.deletedAt) continue;
    const dateStr = localDateStr(new Date(t.completedAt));
    map.set(dateStr, (map.get(dateStr) ?? 0) + 1);
  }
  return map;
}
```

**효과:** 할일 100개 기준 3,100회 → 100회. Date 생성 3,100회 → 100회.
**노력:** 낮음

#### 2. `isRoutineScheduledForDate` 반복 — Date 객체 매번 생성 — 심각도: 중간

**문제:** `getRoutineProgressForDate`에서 `new Date(dateStr + 'T12:00:00')`로 매번 Date 생성. `buildMonthGrassMap`에서 이미 `new Date(year, month, day)`로 Date를 만들었지만 전달하지 않고 dateStr만 전달.

**개선:** `buildMonthGrassMap`에서 Date 객체를 `getDailyGrassActivity`에 직접 전달하여 중복 생성 방지.

**효과:** Date 생성 31회 절감.
**노력:** 낮음

#### 3. `StatsMonthGrid` — 셀마다 `new Date()` 3회 호출 — 심각도: 중간

**문제:** 렌더링 시 각 셀에서:
- `new Date(\`${date}T00:00:00\`).getDate() - 1` (staggerDelay)
- `new Date(\`${date}T00:00:00\`).getDate()` (텍스트 표시)
- 같은 Date를 2번 파싱

**개선:** dateStr에서 직접 일(day) 추출: `parseInt(date.slice(8), 10)`

**효과:** Date 생성 ~62회 절감 (31일 × 2).
**노력:** 낮음

#### 4. `grassCellColors`에서 매번 `useSettingsStore.getState()` 호출 — 심각도: 낮음

**문제:** 31개 셀 + 5개 범례 = 36회 `getState()` 호출. 비용은 미미하지만 불필요.

**개선:** `StatsMonthGrid`에서 `grassColor`를 이미 구독하므로, `colorOverride`로 전달 중이 아닌 경우 상위에서 한 번 읽어서 전달.

**효과:** 미미. 코드 정리 수준.
**노력:** 낮음

#### 5. `Animated.View` + `FadeIn` 31개 — 심각도: 중간

**문제:** 각 셀에 `Animated.View` + `FadeIn.delay(stagger)` 적용. 월 변경 시 31개 셀의 Reanimated 애니메이션이 동시 시작. JS↔Native 브릿지 비용.

**개선:** 셀 자체는 일반 `View`로 렌더하고, 전체 그리드를 하나의 `Animated.View`로 감싸 `FadeIn` 1회만 적용.

**효과:** Reanimated 워크렛 31개 → 1개. 월 변경 시 체감 속도 대폭 개선.
**노력:** 낮음

---

## 요약

| 순서 | 항목 | 심각도 | 노력 | 효과 |
|------|------|--------|------|------|
| **1** | 할일 완료 Map 사전 집계 | 높음 | 낮음 | Date 생성 97% 절감 |
| **2** | 셀 애니메이션 31개→1개 | 중간 | 낮음 | 월 변경 체감 속도 |
| **3** | Date 문자열 직접 파싱 | 중간 | 낮음 | Date 생성 62회 절감 |
| **4** | Date 객체 전달 (중복 방지) | 중간 | 낮음 | Date 생성 31회 절감 |
| **5** | grassCellColors getState 1회 | 낮음 | 낮음 | 미미 |
