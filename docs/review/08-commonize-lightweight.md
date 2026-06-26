# 공통화 + 코드 경량화 검토

> 검토 일자: 2026-06-26

---

## 개선 항목 (우선순위순)

### 높음 — 중복 코드 제거, 즉시 효과

#### C-1. `toDateStr` → `localDateStr` 통합

| 파일 | 사용 |
|------|------|
| `src/utils/homeDailyBoard.ts:18-20` | `toDateStr` = `localDateStr`의 단순 래퍼 |
| 8개 이상 파일에서 import | `toDateStr`과 `localDateStr` 혼용 |

**문제:** 같은 함수가 두 이름으로 존재. import 혼란.
**개선:** `toDateStr` 제거, 모든 곳에서 `localDateStr` 직접 사용.
**절감:** ~10줄 + import 정리

#### C-2. `getMonday` / `getPeriodRange` 중복 추출

| 파일 | 함수 |
|------|------|
| `app/stats/routine.tsx:29-54` | `getMonday()` 8줄 + `getPeriodRange()` 16줄 |
| `app/stats/todo.tsx:22-47` | 동일 코드 복사 |

**개선:** `src/utils/periodRange.ts`로 추출.
**절감:** ~25줄

#### C-3. TodoModal + TodoEditModal 병합

| 파일 | 줄 수 |
|------|-------|
| `src/components/TodoModal.tsx` | 71줄 |
| `src/components/TodoEditModal.tsx` | 72줄 |

**문제:** 거의 동일한 구조. form state 초기화만 다름.
**개선:** `mode: 'create' | 'edit'` prop으로 단일 컴포넌트화.
**절감:** ~30줄

### 중간 — 구조 개선

#### C-4. 모달 애니메이션 훅 추출

| 파일 | 중복 |
|------|------|
| `StatsDayDetailModal.tsx` | `useSharedValue` + `withTiming` + `useAnimatedStyle` |
| `FastingDayDetailModal.tsx` | 동일 패턴 |

**개선:** `useModalAnimation()` 훅으로 추출.
**절감:** ~20줄/파일

#### C-5. TodoItem / RoutineItem 기반 컴포넌트

| 파일 | 줄 수 |
|------|-------|
| `TodoItem.tsx` | 96줄 |
| `RoutineItem.tsx` | 67줄 |

**중복:** Pressable 컨테이너, CompletionCheckbox 연동, 완료 피드백, flex 레이아웃.
**개선:** `ItemRow` 기반 컴포넌트 추출.
**절감:** ~35줄

#### C-6. `FastingRecordEditModal` 유틸 분리

`formatDatetime()`, `formatDuration()` → `fastingFormat.ts`로 이동.
**절감:** ~15줄

### 낮음 — 선택적

#### C-7. 인라인 스타일 상수화

`flexDirection: 'row', alignItems: 'center'` 패턴이 15곳 이상 반복.
현재 구조에서는 StyleSheet보다 인라인이 RN 최적화에 유리하므로 우선순위 낮음.

---

## 요약

| 순서 | 항목 | 절감 | 노력 |
|------|------|------|------|
| **1** | toDateStr → localDateStr 통합 | ~10줄 | 낮음 |
| **2** | 기간 계산 유틸 추출 | ~25줄 | 낮음 |
| **3** | TodoModal/EditModal 병합 | ~30줄 | 낮음 |
| **4** | 모달 애니메이션 훅 | ~40줄 | 낮음 |
| **5** | ItemRow 기반 컴포넌트 | ~35줄 | 중간 |
| **6** | FastingRecordEditModal 유틸 | ~15줄 | 낮음 |

**총 절감 예상: ~155줄**

1~3번이 노력 대비 효과가 가장 크고 위험이 낮습니다.
