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
| 2026-06-12 | UI 디테일 폴리시 (아이콘·스플래시 제외) |

---

## UI 디테일 (앱 아이콘·스플래시 제외)

> 범위: 출시 전 시각·터치·토큰 통일  
> 제외: 앱 아이콘, 스플래시 스크린  
> 빌드: 사용자 승인 후에만 진행

### 공통 인프라

- [x] `spacing.ts` / `colors.ts` — danger·warning·booster·priority 토큰
- [x] `Card` — 카드 스타일 + 터치 피드백
- [x] `SectionHeader` — bar / caption 변형
- [x] `SettingGroup` — 설정 그룹 카드
- [x] `Skeleton` + `useAppHydrated` — persist 로딩 스켈레톤

### 체감 큰 항목

| # | 항목 | 상태 | 적용 파일 |
|---|------|------|-----------|
| 1 | 디자인 토큰 + Card/SectionHeader 공통화 | [x] | `stats.tsx`, `FastingCard.tsx` |
| 2 | 탭바 활성 인디케이터 + 햅틱 + 터치 스케일 | [x] | `_layout.tsx`, `microFeedback.ts` |
| 3 | 홈 FastingCard ↔ 단식 화면 스타일 통일 | [x] | `FastingCard.tsx` |
| 4 | 버튼/카드 터치 피드백 통일 | [x] | `Card.tsx`, `_layout.tsx`, `settings.tsx` |
| 5 | 섹션 헤더 통일 | [x] | `stats.tsx`, `settings.tsx` |
| 6 | 탭 라벨 `투두` → `할일` | [x] | `_layout.tsx` |

### 미니멀 톤

| # | 항목 | 상태 | 적용 파일 |
|---|------|------|-----------|
| 7 | 하드코딩 색 → `colors.ts` 토큰 | [x] | `dateFormat.ts`, `TodoItem`, `todo.tsx`, modals, `fasting.tsx` |
| 8 | Divider 간격 | [x] | `Divider.tsx` |
| 9 | 설정 화면 그룹 카드형 | [x] | `settings.tsx`, `SettingGroup.tsx` |
| 10 | EmptyIllustration 선 두께 통일 | [x] | `EmptyIllustration.tsx` |

### v1 이후 (아이콘·스플래시 제외 진행)

| # | 항목 | 상태 | 적용 파일 |
|---|------|------|-----------|
| 11 | 스켈레톤 로딩 | [x] | `stats.tsx`, `Skeleton.tsx`, `useAppHydrated.ts` |
| 12 | 화면 전환 애니메이션 (PagerView) | [ ] | v1.1 후보 |
| 13 | 차트 디테일 (오늘 강조·빈 값 `-`) | [x] | `BarChart.tsx`, `stats.tsx` |
| 14 | 통계 화면 한글 복구 | [x] | `stats.tsx` |

### 제외 (사용자 요청)

- [ ] 앱 아이콘
- [ ] 스플래시 스크린

### UI 디테일 검증

- [x] TypeScript 오류 없음
- [ ] PR 생성 및 squash merge
- [ ] 작업 보고
