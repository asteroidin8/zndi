# 잔디 (zndi) 출시·로드맵

> **브랜드:** `docs/design-system.md` · `docs/copy-guide.md` · `docs/home-dashboard.md`  
> **최종 갱신:** 2026-06-16

---

## 완성도

| 구분 | % | 상태 |
|------|---|------|
| v1 로컬 | ~96% | UI visual pass 진행 |
| Supabase MVP | ~85% | [x] |
| 출시 통합 | ~83% | EAS [⏸] |

---

## 우선순위

```
P1 [x] privacy · 홈/통계 · 카피
P2 [x] Settings Card · CI lint
P3 [~] a11y · Sentry DSN (로컬 [x])
UI [~] zndi visual pass (아래 Phase UI)
[⏸] EAS · dev APK · 실기 QA
```

---

## Phase UI — zndi visual pass

> **원칙:** `colors.ts` + `useThemeColors()` 단일 토큰 · Tailwind 이중화 없음 · 레이아웃 유지

| # | 작업 | 상태 |
|---|------|------|
| UI-1 | `themeEffects.ts` · `surfaceCard` · radius 20 | [ ] |
| UI-2 | `Card` elevated/glow · Settings 섹션·토글·세gment | [ ] |
| UI-3 | `CompletionCheckbox` · Routine/Todo · Swipe neon | [ ] |
| UI-4 | Empty illustration accent | [ ] |

**제외:** Tailwind/global.css 이중 테마 · SettingCard 신규 · 클라oud sync 토글

---

## Phase 2 — Supabase MVP [x]

2-1 ~ 2-10 완료

---

## Phase 1 — v1 polish

| # | 작업 | 상태 |
|---|------|------|
| 1-4 | zndi UI·카피 | [x] |
| 1-5 | Sentry DSN | [x] 로컬 · EAS [ ] |
| 1-6 | CI lint | [x] |
| 1-7 | a11y | [~] 홈 (#98) · 탭·모달 [ ] |
| 1-8 | Settings UI | [x] → Phase UI-2에서 visual pass |

---

## Phase 0 — 출시 게이트 [⏸]

- EAS Android 할당량 7/1
- dev APK 재빌드 (`com.asteroidin8.zndi` + 새 아이콘)
- iOS credentials · 실기 QA

---

## 누락·수동 확인

| 항목 | 상태 |
|------|------|
| Supabase Redirect `zndi://` | 사용자 확인 |
| Google Cloud `com.asteroidin8.zndi` | 사용자 확인 |
| Sentry EAS env | [ ] |
| eslint warning 7건 | 비차단 |

---

## 진행 로그

| 일시 | 작업 |
|------|------|
| 2026-06-16 | Phase UI visual pass 시작 |
| 2026-06-16 | sentry-setup 제거 · .env.example 제거 (#100) |
| 2026-06-16 | a11y (#98) · stats (#97) · TopBar (#96) · 할일 (#95) |
