# 잔디 (zndi) 출시·로드맵

> **브랜드:** zndi (잔디) — `docs/design-system.md` · `docs/home-dashboard.md`  
> **아키텍처:** 로컬 1차 · Supabase 자동 sync (로그인 시) · Realtime  
> **최종 갱신:** 2026-06-16

---

## 완성도

| 구분 | % | 상태 |
|------|---|------|
| v1 로컬 | ~92% | 홈 잔디 UI [x] |
| Supabase MVP | ~85% | privacy [x] · Dashboard [~] |
| 출시 통합 | ~82% | EAS [⏸] |

---

## 우선순위 (재선정)

```
P1 [x] privacy Supabase 조항 (2-9)
P1 [x] 홈 Contribution Grid + 대시보드 (1-4)
P2 [ ] Settings UI 마무리 (1-8) — 섹션 카드 톤 통일
P2 [ ] CI lint (1-6)
P3 [ ] a11y (1-7) · Sentry DSN (1-5)
[⏸] EAS 빌드 · 실기 QA (Phase 0)
```

---

## Phase 2 — Supabase MVP

| # | 작업 | 상태 |
|---|------|------|
| 2-1 ~ 2-8 | Auth·sync·Realtime·가이드 | [x] |
| 2-9 | 개인정보 Supabase 조항 | [x] |
| 2-10 | 자동 push | [x] |

---

## Phase 1 — v1 polish

| # | 작업 | 상태 |
|---|------|------|
| 1-4 | zndi 컬러·잔디 UI | [x] 홈 그리드 · 통계 탭 grid [~] |
| 1-5 | Sentry DSN | [~] |
| 1-6 | CI lint | [ ] |
| 1-7 | a11y | [ ] |
| 1-8 | Settings UI 안정화 | [~] |

---

## Phase 0 — 출시 게이트 [⏸]

EAS Android (7/1) · iOS credentials · 실기 QA · dev APK 재빌드 (zndi package)

---

## Phase 3 — v1.1+

Freemium IAP · 루틴 상한 · Realtime 공유(2차) · 위젯

---

## 진행 로그

| 일시 | 작업 |
|------|------|
| 2026-06-16 | privacy 2-9 · 홈 ContributionGrid · home-dashboard.md |
| 2026-06-16 | 클라oud 설정 A안 (#90) · zndi rename (#89) |
| 2026-06-16 | zndi 팔레트 · 자동 sync (#88) |
