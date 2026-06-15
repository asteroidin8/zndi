# Routiner 출시·로드맵

> **브랜드:** zndi (잔디) — 미니멀 다크 + 네온 그린 `#22C55E` · `docs/design-system.md`  
> **아키텍처:** 로컬(AsyncStorage/Zustand) = **1차 저장** · Supabase = **클라우드 백업 + Realtime**  
> **로그인:** Google 주 · Email OTP 보조  
> **Realtime:** 1차 다기기 · 2차 공유(추후)  
> **최종 갱신:** 2026-06-16

---

## 완성도

| 구분 | % | 상태 |
|------|---|------|
| v1 로컬 | ~90% | EAS·실기 QA [⏸] |
| Supabase MVP | ~78% | 자동 sync [x] · 대시보드 [~] |
| 출시 통합 | ~78% | |

---

## 아키텍처

```
[앱] Zustand persist (AsyncStorage)  ← 항상 1차
        ↕ auto push (debounce) + 수동 push/pull
[Supabase] Postgres + RLS + Realtime
        ↕ Google OAuth / Email OTP
```

| 데이터 | 로컬 | 클라우드 |
|--------|------|----------|
| 프로필·루틴·할일·완료·단식 | [x] | [x] upsert |
| Realtime | — | [x] routines/todos/completions |
| 자동 sync | [x] | debounce push (토글 ON, 기본 ON) |
| 오프라인 | [x] | 로그인 시 로컬 비어 있으면 pull |

---

## Phase 0 — 출시 게이트 [⏸]

- EAS Android (7/1) · iOS credentials · 실기 QA

---

## Phase 2 — Supabase MVP

| # | 작업 | 상태 |
|---|------|------|
| 2-1 | client + SecureStore | [x] |
| 2-2 | SQL·RLS migration | [x] 파일 · [~] Dashboard |
| 2-3 | Google OAuth | [x] 코드 · [x] 동작 확인 |
| 2-4 | Email OTP | [x] |
| 2-5 | 설정 «계정·클라우드» | [x] |
| 2-6 | push/pull sync | [x] |
| 2-7 | Realtime → Zustand | [x] |
| 2-8 | OAuth 가이드 | [x] |
| 2-9 | 개인정보 Supabase 조항 | [ ] |
| 2-10 | 자동 push (변경 시) | [x] |

---

## Phase 1 — v1 polish

| # | 작업 | 상태 |
|---|------|------|
| 1-4 | zndi 컬러·잔디 UI | [~] 팔레트·완료 그린 · GitHub grid [ ] |
| 1-5 | Sentry DSN | [~] |
| 1-6 | CI lint | [ ] |
| 1-7 | a11y | [ ] |
| 1-8 | Settings UI 안정화 | [~] |

---

## Phase 3 — v1.1+

Freemium IAP · 루틴 상한 · 고급 통계 · 위젯 · Realtime 공유(2차)

---

## 우선순위

```
[앱]     privacy 조항 · Settings UI · GitHub 잔디 그리드
[⏸]     EAS 빌드 · 실기 QA
```

---

## 진행 로그

| 일시 | 작업 |
|------|------|
| 2026-06-16 | zndi 팔레트 · 자동 sync · design-system.md |
| 2026-06-13 | Supabase Auth·Sync·Realtime·설정 계정 (#83–#84) |
