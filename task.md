# Routiner 출시·로드맵

> **비전:** 단순하고 꾸준히 쓰기 좋은 한국형 습관 트래커 (단식·루틴·할일)  
> **v1 출시 목표:** 로컬 앱 + **Supabase 무료 티어 (로그인·Realtime)**  
> **v1.1+:** Freemium IAP · 고급 통계 · 위젯  
> **스택:** Expo 56 · RN · Expo Router · Zustand · Supabase (Auth·Postgres·Realtime)  
> **최종 갱신:** 2026-06-12

---

## Supabase 무료 티어 (출시 전 적용 범위)

| 항목 | 무료 한도 (참고) | Routiner 적용 |
|------|------------------|---------------|
| Auth MAU | ~50,000 | Email OTP(매직링크) 1차, Google/Kakao 2차 |
| Database | 500 MB | 루틴·할일·단식·프로필 JSON |
| Realtime | 포함 | 루틴 완료·할일 변경 다기기 반영 |
| Bandwidth | 2 GB/월 | 초기 충분, 오래된 기록 정리(3-8) |

**출시 전 MVP (Supabase):**

1. **로그인** — Email OTP (OAuth는 2차)
2. **동기화** — 로그인 시 로컬 ↔ 클라oud upsert (offline-first 유지)
3. **Realtime** — `routines`, `todos`, `routine_completions` 구독
4. **RLS** — `auth.uid()` 기준 전 행 격리

**Freemium은 출시 직후:** v1 출시 시 **로그인+동기화+Realtime은 무료**로 열고, Premium은 무제한·고급 통계·위젯으로 분리 (3-B).

---

## 완성도 평가

| 구분 | 완성도 | 설명 |
|------|--------|------|
| **v1 로컬만** | **~89%** | EAS·실기 QA 잔여 |
| **v1 + Supabase MVP** | **~40%** | Auth·스키마·동기화·Realtime 미구현 |
| **출시 통합 목표** | **~65%** | 로컬 완성 + Supabase·법적 보완 필요 |

> `[x]` 완료 · `[~]` 부분 · `[ ]` 미착수 · `[⏸]` 외부 블로cker

---

## Freemium (v1.1+, 출시 후)

| 티어 | v1 출시 | v1.1+ |
|------|---------|-------|
| **무료** | 로컬 + **클라우드 로그인·동기화·Realtime** | 루틴 10~15개 상한 검토 |
| **Premium** | — | 고급 통계·무제한·위젯·IAP |

---

# Phase 0 — v1 출시 블로커

| # | 작업 | 상태 |
|---|------|------|
| 0-1~0-5 | 에셋·법적·버그·로컬 QA | [x] |

| 출시 게이트 | 상태 | 비고 |
|-------------|------|------|
| EAS Android | [⏸] | 쿼터 7/1 리셋 |
| EAS iOS | [⏸] | credentials interactive |
| 실기 QA | [⏸] | dev/production APK |
| **Supabase 프로젝트** | [ ] | URL + anon key 필요 (**사용자**) |

---

# Phase 1 — dev APK (로컬 polish)

| # | 작업 | 상태 |
|---|------|------|
| 1-1~1-4 | 온보딩·typography·a11y·dead code | [x] |
| 1-5 | Sentry DSN | [~] |
| 1-6 | CI lint | [ ] |
| 1-7 | 통계·할일 a11y | [ ] |

---

# Phase 2 — Supabase MVP (출시 전 필수로 승격)

> **P0와 병행.** dev APK + Expo Go/Dev Client로 Auth·Realtime 검증 가능.

### 2-A. 인프라 (코드 선행 가능 / 키 필요 시 연동)

| # | 작업 | 상태 | 지금 가능? |
|---|------|------|-----------|
| 2-A-1 | `@supabase/supabase-js` + client + env | [ ] | ✅ 코드만 |
| 2-A-2 | SQL 스키마·RLS (`supabase/migrations/`) | [ ] | ✅ SQL 파일 |
| 2-A-3 | Email OTP 로그인 UI + 세션 (`expo-secure-store`) | [ ] | ✅ UI·훅 |
| 2-A-4 | 설정 «계정» 섹션 (로그인/로그아웃/동기화) | [ ] | ✅ |
| 2-A-5 | Sync 서비스 (Zustand → Supabase upsert) | [ ] | ✅ 오프라인 큐 |
| 2-A-6 | Realtime 구독 → Zustand 반영 | [ ] | ✅ 키 있으면 테스트 |
| 2-A-7 | 로컬→클라우드 최초 업로드 UX | [ ] | ✅ |
| 2-A-8 | 개인정보·약관 Supabase 항목 | [ ] | ✅ 문서 |
| 2-A-9 | Google / Kakao OAuth | [ ] | ⏸ OAuth 클라이언트 ID |

### 2-B. Realtime 대상 (MVP)

| 테이블 | 이벤트 | 로컬 store |
|--------|--------|------------|
| `routines` | INSERT/UPDATE/DELETE | `useRoutineStore` |
| `todos` | INSERT/UPDATE/DELETE | `useTodoStore` |
| `routine_completions` | UPSERT | `useRoutineCompletionStore` |
| `fasting_records` | INSERT/UPDATE/DELETE | `useFastingStore` (2차) |

---

# Phase 3 — 출시 polish (병행 가능)

| # | 작업 | 상태 | 지금 가능? |
|---|------|------|-----------|
| 3-1 | 통계·할일 a11y | [ ] | ✅ dev APK |
| 3-2 | lint CI | [ ] | ✅ |
| 3-3 | Deep Link | [ ] | ✅ |
| 3-4 | E2E Maestro (로그인·루틴) | [ ] | ✅ Supabase 후 |

---

# Phase 4 — v1.1 Freemium·확장

| # | 작업 | 상태 |
|---|------|------|
| 4-1 | IAP / RevenueCat | [ ] |
| 4-2 | 루틴 수 제한·Premium 게이트 | [ ] |
| 4-3 | 고급 통계·인사이트 | [~] |
| 4-4 | 홈 위젯 | [ ] |
| 4-5 | 카테고리·프리셋 | [ ] |

---

# 작업 우선순위 (출시 전 실행 순)

```
[지금]  S-1  Supabase 클라이언트·스키마·RLS SQL
[지금]  S-2  Email OTP 로그인 UI + 세션
[지금]  S-3  Sync 레이어 (offline-first)
[지금]  S-4  Realtime → Zustand (루틴·할일)
[지금]  S-5  개인정보·약관 Supabase 조항
[병행]  P1   통계·할일 a11y
[병행]  P1   Sentry DSN (값 필요)
[대기]  P0   EAS 빌드 (7/1) · iOS credentials
[대기]  P0   실기 QA
[출시후] F-1  Freemium IAP · 루틴 상한
```

---

## 진행 로그

| 일시 | 작업 |
|------|------|
| 2026-06-12 | v1 P0/P1, 로드맵 #81 |
| 2026-06-12 | **Supabase 무료 티어 출시 전 MVP로 Phase 2 승격** |
