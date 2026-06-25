# 화면 검토: 홈 / 루틴 / 할일

**검토 범위:** `app/(tabs)/index.tsx`, `app/(tabs)/routine.tsx`, `app/(tabs)/todo.tsx`, `src/stores/useRoutineStore.ts`, `src/stores/useTodoStore.ts`, `src/hooks/useRealtimeSync.ts`, `src/services/sync/cloudSync.ts`

---

## 1. 보안

### 1-1. ID 생성에 `Date.now()` 사용 — 심각도: 중간

**문제:** 루틴과 할일 생성 시 `id: String(Date.now())`로 ID를 만든다 (`routine.tsx:165`, `todo.tsx:252`). 밀리초 기반이라:
- 같은 밀리초에 두 번 생성하면 ID 충돌
- 다기기 동기화 시 충돌 가능성 높음
- ID가 생성 시각을 노출 (프라이버시)

**이유:** 현재 로컬-우선 구조에서는 드물게 발생하지만, Realtime 동기화가 활성화되면 다기기 충돌이 현실적인 문제가 된다.

**개선:**
```typescript
import { randomUUID } from 'expo-crypto';
// 또는
const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
```

`expo-crypto`의 `randomUUID()`가 가장 안전. 이미 expo 프로젝트이므로 추가 의존성 없음.

**예상 효과:** ID 충돌 불가, 다기기 동기화 안정성

### 1-2. Realtime 채널 필터 — RLS 의존 — 심각도: 낮음

**문제:** `useRealtimeSync.ts:24`에서 `filter: \`user_id=eq.${user.id}\``로 본인 데이터만 구독하지만, 이 필터는 클라이언트 힌트일 뿐이다. 실제 데이터 접근 보호는 Supabase RLS에 의존.

**현재 평가:** Supabase Realtime은 RLS를 기본 적용하므로 올바른 구현. 다만 RLS 정책이 올바르게 설정되어 있는지 Supabase 대시보드에서 확인 필요:
- `routines`, `todos`, `routine_completions` 테이블에 `auth.uid() = user_id` RLS 필수

---

## 2. 비용 효율성

### 2-1. 홈 화면 — 보드 데이터 중복 fetch — 심각도: 중간

**문제:** `(tabs)/index.tsx:36-45`에서 홈 화면 진입 시 `fetchMyBoards(user.id)` + 모든 보드의 `fetchBoardRoutines` + `fetchVerificationLogs`를 호출한다. 보드 탭에서도 동일한 호출이 발생하므로 탭 이동 시마다 중복 API 호출.

**이유:** Supabase 읽기 비용이 누적되고, 네트워크 대역폭이 낭비된다.

**개선:**
- `useBoardStore`에 `lastFetchedAt` 타임스탬프 추가
- 최근 N분 이내 fetch했으면 재요청 스킵 (stale-while-revalidate 패턴)
- 또는 Realtime으로 보드 변경을 감지하여 pull 불필요

```typescript
const STALE_MS = 60_000; // 1분
const lastFetched = useBoardStore.getState().lastFetchedAt ?? 0;
if (Date.now() - lastFetched < STALE_MS) return;
```

**예상 효과:** 보드 관련 API 호출 50~80% 절감

### 2-2. Realtime 채널 — 3개 테이블 구독 상시 유지 — 심각도: 낮음

**문제:** `useRealtimeSync`가 앱 활성 시 3개 테이블(routines, todos, routine_completions)의 Realtime 구독을 상시 유지한다. Supabase Realtime은 동시 접속 수 기반 과금.

**현재 평가:** 무료 티어에서 동시 200 connections까지 지원. 현재 사용자 규모에서는 문제없지만, 사용자가 늘면 비용 증가.

**장기 개선:** 앱이 백그라운드로 전환되면 채널 해제, 포그라운드 복귀 시 재구독 + delta pull

### 2-3. 소프트 삭제 보존 기간 400일 — 심각도: 낮음

**문제:** `useRoutineStore.ts:9`, `useTodoStore.ts:13`에서 `DELETED_RETENTION_DAYS = 400`. 삭제된 항목을 400일간 로컬에 보관하므로, 오래 사용하면 store 크기가 비대해진다.

**개선:** 90~180일로 단축. 클라우드 동기화가 있으므로 로컬 보존 기간이 짧아도 복구 가능.

**예상 효과:** AsyncStorage 사용량 감소, 앱 시작 속도 개선

---

## 3. UX

### 3-1. 루틴/할일 — 코드 중복이 많음 (유지보수 UX)

**문제:** `routine.tsx`와 `todo.tsx`가 거의 동일한 구조:
- 같은 `ListItem` 타입 정의
- 같은 `GroupHeader`, `GroupEmpty` 렌더링 로직
- 같은 드래그 앤 드롭 핸들러 패턴
- 같은 `sortBySection`, `sectionSortKey` 유틸리티 (두 파일에 복붙)

**이유:** 직접적인 사용자 UX 문제는 아니지만, 기능 추가/버그 수정 시 두 곳을 동시에 수정해야 해서 불일치 위험이 높다.

**개선:**
- `sortBySection`, `sectionSortKey`, `SECTION_TIME_ORDER`를 공유 유틸로 추출
- 그룹 드래그 로직을 커스텀 훅 `useGroupDrag`로 추출
- `GroupedDraggableList` 공통 컴포넌트 도입

**예상 효과:** 코드 유지보수성 향상, 루틴/할일 동작 일관성 보장

### 3-2. 할일 완료 탭 — 완료 취소 시 즉시 사라짐

**문제:** 완료 탭에서 할일을 "되돌리기"하면 해당 항목이 즉시 리스트에서 사라진다 (활성 탭으로 이동). 사용자가 실수로 되돌렸는지 확인할 방법이 없다.

**개선:** UndoSnackbar와 동일하게 "되돌리기 취소" 옵션 제공

### 3-3. `todayDate = useMemo(() => new Date(), [])`

**문제:** `routine.tsx:101`에서 `todayDate`가 컴포넌트 마운트 시 고정된다. 자정을 넘기면 "오늘" 루틴 목록이 갱신되지 않는다.

**개선:** 자정 타이머 또는 앱 포그라운드 복귀 시 날짜 재계산:
```typescript
const [todayDate, setTodayDate] = useState(() => new Date());
useEffect(() => {
  const handler = () => setTodayDate(new Date());
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') handler();
  });
  return () => sub.remove();
}, []);
```

**예상 효과:** 자정 이후에도 정확한 오늘 루틴 표시

---

## 4. 속도/성능

### 4-1. 루틴 화면 — 과도한 `useMemo` 체인

**문제:** `routine.tsx`에서 8개 이상의 `useMemo`가 체인으로 연결되어 있다. 각 memo가 이전 memo의 결과에 의존하므로, 상위 상태 변경 시 연쇄 재계산 발생.

**현재 평가:** 루틴 수가 보통 10~30개이므로 실측 성능 문제는 없을 것. 다만 `dragItems` memo의 의존성 배열에 `completions`가 포함되어 있어, 체크박스 토글마다 전체 리스트가 재계산된다.

**개선:** `completions`를 `dragItems` 의존성에서 제거하고, 개별 항목 렌더링 시 `isCompleted`를 조회하도록 분리.

**예상 효과:** 체크박스 토글 시 불필요한 리스트 재계산 방지

### 4-2. 홈 화면 `unverifiedCount` — 보드 탭과 동일한 `logs.some()` 문제

**문제:** `(tabs)/index.tsx:47-62`에서 모든 보드의 루틴 × 로그를 순회. 보드/루틴이 많아지면 O(보드 × 루틴 × 로그) 비용.

**개선:** 보드 검토(03)에서 제안한 `Set` 기반 최적화 동일 적용.

---

## 요약

| # | 항목 | 심각도 | 노력 | 우선 |
|---|------|--------|------|------|
| 2-1 | 보드 데이터 중복 fetch 제거 | 중간 | 낮음 | **즉시** |
| 1-1 | UUID로 ID 생성 변경 | 중간 | 낮음 | **즉시** |
| 3-3 | 자정 이후 날짜 갱신 | 중간 | 낮음 | **즉시** |
| 3-1 | 루틴/할일 공통 코드 추출 | 중간 | 중간 | 중기 |
| 4-1 | dragItems completions 의존성 분리 | 낮음 | 낮음 | 단기 |
| 2-3 | 소프트 삭제 보존 기간 단축 | 낮음 | 낮음 | 단기 |
| 4-2 | unverifiedCount Set 최적화 | 낮음 | 낮음 | 단기 |
| 2-2 | 백그라운드 Realtime 해제 | 낮음 | 중간 | 중기 |
