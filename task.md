# 잔디 (zndi) 출시·로드맵

> **브랜드:** `docs/design-system.md` · `docs/copy-guide.md` · `docs/home-dashboard.md`  
> **최종 갱신:** 2026-06-16

---

## 완성도

| 구분 | % | 상태 |
|------|---|------|
| v1 로컬 | ~96% | 홈·통계 UI [x] |
| Supabase MVP | ~85% | [x] |
| 출시 통합 | ~83% | EAS [⏸] |

---

## 우선순위

```
P1 [x] privacy · 홈/통계 역할 분리 · 카피 가이드
P2 [x] Settings UI (1-8) · CI lint (1-6)
P3 [~] a11y (1-7) · Sentry DSN (1-5)
[⏸] EAS · dev APK (zndi package) · 실기 QA
```

---

## Phase 2 — Supabase MVP [x]

2-1 ~ 2-10 완료 (자동 sync · privacy 조항 포함)

---

## Phase 1 — v1 polish

| # | 작업 | 상태 |
|---|------|------|
| 1-4 | zndi UI·카피 | [x] |
| 1-5 | Sentry DSN | [~] 코드·`docs/sentry-setup.md` · Dashboard DSN [ ] |
| 1-6 | CI lint | [x] |
| 1-7 | a11y | [~] 홈·섹션 헤더 보강 (#98) · 탭·모달 추가 [ ] |
| 1-8 | Settings UI | [x] |

---

## Phase 0 — 출시 게이트 [⏸]

- EAS Android 할당량 7/1
- dev APK 재빌드 (`com.asteroidin8.zndi` + 새 아이콘)
- iOS credentials · 실기 QA

---

## 누락·수동 확인

| 항목 | 상태 |
|------|------|
| Supabase Dashboard SQL·Redirect `zndi://` | 사용자 확인 |
| Google Cloud 패키지 `com.asteroidin8.zndi` | 사용자 확인 |
| Sentry `EXPO_PUBLIC_SENTRY_DSN` | `.env` 설정 필요 |
| eslint warning 7건 | 비차단 |

---

## 진행 로그

| 일시 | 작업 |
|------|------|
| 2026-06-16 | a11y 홈 라벨 (#98) · stats 캘린더 잔디 (#97) · 홈 TopBar (#96) · 할일 배지 (#95) |
| 2026-06-16 | Settings Card · CI lint · 홈/통계 (#94) |
| 2026-06-16 | zndi 아이콘 (#93) · privacy (#91) |
