# UX 디테일 작업 체크리스트 (1~4순위)

> 범위: 출시 전 UX 완성도 개선 (5순위 앱 아이콘·개인정보처리방침 제외)  
> 스와이프: **루틴·투두 모두 왼쪽=삭제, 오른쪽=완료**  
> 빌드: 사용자 승인 후에만 진행

---

## 공통 인프라

- [x] `SwipeActions` — 왼쪽 삭제 / 오른쪽 완료
- [x] `AnimatedListItem` — 리스트 입장·퇴장 애니메이션
- [x] `DragItemWrapper` — 드래그 정렬 시각 피드백
- [x] `SpringModal` — 모달 스프링 애니메이션
- [x] `EmptyIllustration` — 빈 상태 미니멀 SVG
- [x] `Coachmark` + `useSettingsStore.seenHints` — 1회 힌트
- [x] `microFeedback` — 완료/삭제/성공 햅틱 통일
- [x] `TabNavigationContext.scrollToTop` — 탭 재탭 맨 위
- [x] `dateFormat` — 마감 긴급도 + 시간대 인사

---

## 1순위 — 움직임의 기본

| # | 항목 | 상태 | 적용 파일 |
|---|------|------|-----------|
| 1 | 루틴·투두 리스트 입장/퇴장 애니메이션 | [x] | `routine.tsx`, `todo.tsx` |
| 2 | 완료/삭제 마이크로 피드백 통일 | [x] | `RoutineItem`, `TodoItem`, `SwipeActions`, `microFeedback` |
| 3 | Undo 후 복귀 애니메이션 | [x] | `AnimatedListItem` (재추가 시 entering) |
| 4 | 드래그 정렬 시각 피드백 | [x] | `routine.tsx`, `todo.tsx` |
| 5 | 모달/바텀시트 스프링 | [x] | `RoutineModal`, `TodoModal`, `TodoEditModal`, `WheelPicker`, `DatePickerModal`, `FastingRecordEditModal`, `stats` DayDetailModal |

---

## 2순위 — 실사용 디테일

| # | 항목 | 상태 | 적용 파일 |
|---|------|------|-----------|
| 6 | 투두 마감 임박/지연 표시 | [x] | `dateFormat.ts`, `TodoItem`, `DailySummaryRow` |
| 7 | 오늘 루틴 전부 완료 상태 | [x] | `routine.tsx`, `DailySummaryRow` |
| 8 | 목표 달성(부스터) 진입 피드백 | [x] | `fasting.tsx` |
| 9 | 탭 재탭 → 맨 위 스크롤 | [x] | `_layout.tsx`, 각 탭 ScrollView |
| 10 | 홈 미리보기 정렬 개선 | [x] | `DailySummaryRow.tsx` |

---

## 3순위 — 톤·온보딩

| # | 항목 | 상태 | 적용 파일 |
|---|------|------|-----------|
| 11 | 빈 상태 미니멀 일러스트 | [x] | `routine.tsx`, `todo.tsx`, `fasting.tsx`, `stats.tsx` |
| 12 | 시간대별 홈 인사 | [x] | `index.tsx` |
| 13 | 통계 빈 상태 안내 | [x] | `stats.tsx` |
| 14 | 첫 사용 힌트 1회 | [x] | `routine.tsx`, `todo.tsx`, `Coachmark` |

---

## 4순위 — 고급 UX

| # | 항목 | 상태 | 적용 파일 |
|---|------|------|-----------|
| 15 | 스와이프 방향 분리 (왼=삭제, 오른=완료) | [x] | `SwipeActions`, `routine.tsx`, `todo.tsx` |
| 16 | 접근성 (라벨·터치 영역) | [x] | `RoutineItem`, `TodoItem`, `_layout.tsx`, `SwipeActions`, `SpringModal` |

---

## 검증

- [x] TypeScript / ESLint 오류 없음
- [x] `todo.tsx` 한글 깨짐 없음
- [x] PR 생성 및 squash merge ([#36](https://github.com/asteroidin8/routiner/pull/36))
- [x] 작업 보고

---

## 진행 로그

| 일시 | 작업 |
|------|------|
| 2026-06-12 | task.md 생성 |
| 2026-06-12 | 1~4순위 UX 디테일 전체 구현 완료 (빌드·PR 대기) |
