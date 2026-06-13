# Routiner 출시 작업 계획

> 기준: 토스 UI/UX — 설정 기능 = 실제 동작, 신뢰·법적·브랜드 요건 충족  
> 목표: 스토어 출시 가능 상태

---

## Phase 0 — 출시 블로커 (1~2주)

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 1 | 아이콘·스플래시·스토어 에셋 | [x] | `assets/*.png` |
| 2 | 개인정보처리방침 + 설정 링크 | [x] | `app/privacy.tsx`, 설정 앱 정보 |
| 3 | iOS bundleIdentifier, 알림 plugin·권한 문구 | [x] | `app.json` |
| 4 | 루틴 리마인더 — 시간 picker 또는 토글 제거 | [x] | `TimePickerModal`, `RoutineModal` |
| 5 | 알림 버그 (cancelAll, 할일 잔존 알림) | [x] | `src/utils/notifications.ts` |
| 6 | 데이터 초기화 완전화 | [x] | `settings.tsx` |
| 7 | stats 시간 표시 `?` 버그 | [x] | `stats.tsx` |

**완료 기준:** EAS production 빌드 성공 + P0 QA 통과

---

## Phase 1 — 출시 직전/동시 (1주)

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 8 | 설정 하단 — 버전·문의·약관 | [x] | 설정 앱 정보 섹션 |
| 9 | 알림 권한 거부 시 인앱 안내 | [x] | `notificationPermission.ts` |
| 10 | 홈·설정 프로필 배너 조건 통일 | [x] | `profile.ts`, `InfoBanner` |
| 11 | 탭 4화면 spacing/typography 토큰 통일 | [x] | `spacing.*` 토큰 적용 |
| 12 | Sentry 등 크래시 리포팅 | [x] | `sentry.ts`, `AppErrorBoundary` |
| 13 | SQLite 미사용 레이어 정리 | [x] | `src/db/` 제거 |

---

## Phase 2 — 출시 후 1~2개월

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 14 | 온보딩 2~3스텝 | [x] | `app/onboarding.tsx` |
| 15 | 목표 체중 활용 또는 입력 제거 | [x] | 통계 체중 목표 카드 |
| 16 | 핵심 플로우 E2E + CI | [x] | `.github/workflows/ci.yml` |
| 17 | 긴 리스트 가상화·성능 | [x] | 완료 할일 `FlatList` |
| 18 | 접근성 전수 점검 | [x] | Hold/Swipe/Undo 라벨 |

---

## 진행 로그

| 일시 | 작업 |
|------|------|
| 2026-06-13 | P0 #2~7 머지 (#52–#58) |
| 2026-06-14 | P0~P2 전체 구현 및 머지 |
