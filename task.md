# Routiner 출시·로드맵

> **비전:** 단순하고 꾸준히 쓰기 좋은 한국형 습관 트래커 (단식·루틴·할일)  
> **v1 기준:** 토스형 UI/UX — 설정 = 실제 동작, 로컬 저장(AsyncStorage)  
> **v2 목표:** Supabase + Freemium → 상용 경쟁력 (클라우드·고급 통계)  
> **스택:** Expo 56 · React Native · Expo Router · Zustand · (v2+) Supabase  
> **최종 갱신:** 2026-06-12

---

## 피드백 반영 메모

외부 제안은 **Kotlin Compose + Room + Hilt** 전제였으나, 본 프로젝트는 **Expo/RN**이다. 아래는 동등 목표로 재매핑했다.

| 제안 (Android Native) | Routiner 대응 |
|----------------------|---------------|
| Room + Repository | Zustand persist → v2 Supabase Repository |
| Compose Navigation | Expo Router + PagerView 탭 |
| Hilt DI | hooks + stores 모듈 분리 (현행) |
| Firebase Crashlytics | Sentry (`EXPO_PUBLIC_SENTRY_DSN`) |
| Material 3 Dynamic Color | `useThemeColors` light/dark/system → Android 위젯만 Material You 검토 |
| ProGuard | EAS production 빌드 (RN 기본 난독화 수준) |

---

## 완성도 평가

| 구분 | 완성도 | 설명 |
|------|--------|------|
| **v1 로컬 앱 (스토어 1차 출시)** | **~89%** | 기능·법적·에셋 v1 완료, EAS·실기 QA만 잔여 |
| **포트폴리오 / 개인용** | **~90%** | 현재도 시연·일상 사용 가능 |
| **상용 (Freemium + Supabase)** | **~55%** | 동기화·결제·고급 통계·위젯·Analytics 미구현 |
| **글로벌 상용 (i18n·E2E·ASO)** | **~45%** | 영어·자동 테스트·스토어 최적화 미착수 |

> `[x]` 완료 · `[~]` 부분 · `[ ]` 미착수

---

## Freemium 전략 (v2 목표)

| 티어 | 포함 | 제한 |
|------|------|------|
| **무료** | 단식·루틴·할일 CRUD, 로컬 저장, 기본 알림, 간단 통계 | 루틴 **10~15개** 상한, 클라우드·고급 통계 없음 |
| **Premium** | Supabase 동기화·다중 기기, 고급 통계/인사이트, 무제한 루틴, 홈 위젯·고급 알람, 광고 제거 | — |

**가격 제안:** 일회성 ₩4,900~9,900 또는 구독 (7~14일 트라이얼) — `expo-in-app-purchases` / RevenueCat 검토.

---

# Phase 0 — v1 출시 블로커

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 0-1 | 스토어 에셋 | [x] | #73 R 마크 v1, `generate-assets.ps1` |
| 0-2 | 개인정보·이용약관 | [x] | #69·#70 |
| 0-3 | `app.json` (bundle·알림) | [x] | #74 암호화 선언 |
| 0-4 | 알림·초기화·stats 버그 | [x] | |
| 0-5 | 로컬 QA | [x] | `scripts/qa-p0.ps1` |

**출시 게이트 (미완):**

| 항목 | 상태 |
|------|------|
| EAS Android production | [ ] Free plan 쿼터 → **7/1 리셋** |
| EAS iOS production | [ ] `eas credentials` interactive |
| 실기 QA | [ ] 알림 3종·온보딩·초기화·통계 |

---

# Phase 1 — v1 출시 직전 (dev APK 검증)

| # | 작업 | 상태 | PR |
|---|------|------|-----|
| 1-1 | 온보딩 마이그레이션 | [x] | #76 |
| 1-2 | typography 토큰 | [x] | #77 |
| 1-3 | 단식 접근성 | [x] | #78 |
| 1-4 | dead code 정리 | [x] | #79 |
| 1-5 | Sentry DSN | [~] | `.env.example`(#79), EAS Secret 필요 |
| 1-6 | CI lint | [ ] | 기존 ~28건 |
| 1-7 | 통계·할일 a11y | [ ] | P2 잔여 |

---

# Phase 2 — v1 출시 후 (로컬 앱 polish)

| # | 작업 | 상태 | 우선 |
|---|------|------|------|
| 2-1 | E2E (Maestro) | [ ] | 중 |
| 2-2 | 리스트 가상화·성능 | [~] | 완료 할일 FlatList만 |
| 2-3 | Empty State·motion polish | [ ] | Lottie/Reanimated 검토 |
| 2-4 | Deep Link (`expo-linking`) | [ ] | 루틴/할일 상세 |
| 2-5 | Localization (en) | [ ] | i18n 구조 도입 |
| 2-6 | Font Scaling·Contrast a11y | [ ] | |
| 2-7 | NativeWind 정리 | [ ] | 미사용 의존 제거 |

---

# Phase 3 — Supabase + Freemium (상용 핵심)

> **최우선 추천 기능.** 무료 티어로 Auth·동기화·Realtime 검증 후 Premium 게이트.

### 3-A. 인프라

| # | 작업 | 상태 | 메모 |
|---|------|------|------|
| 3-1 | Supabase 프로젝트·RLS | [ ] | user_id 기준 Row Level Security |
| 3-2 | Auth (Email / Google / Kakao) | [ ] | `expo-auth-session` + Supabase Auth |
| 3-3 | 스키마 설계 | [ ] | routines, todos, fasting_records, profiles |
| 3-4 | Repository 레이어 | [ ] | Zustand ↔ Supabase, **offline-first** |
| 3-5 | 충돌 해결 | [ ] | last-write-wins 또는 field-level merge |
| 3-6 | Realtime 구독 | [ ] | 루틴 완료·할일 변경 다기기 반영 |
| 3-7 | 마이그레이션 UX | [ ] | 로컬 → 클라우드 업로드, opt-in |
| 3-8 | 데이터 정리 | [ ] | 오래된 기록 아카이브, 무료 DB 용량 관리 |

### 3-B. Freemium 게이트

| # | 작업 | 상태 |
|---|------|------|
| 3-9 | 무료 루틴 수 제한 (10~15) | [ ] |
| 3-10 | Premium 플래그 (IAP/RevenueCat) | [ ] |
| 3-11 | 고급 통계 Premium 잠금 | [ ] |
| 3-12 | 이용약관·개인정보 Supabase 항목 추가 | [ ] |

---

# Phase 4 — 기능 확장 (우선순위)

| 순위 | 기능 | 티어 | 상태 | 스택 메모 |
|------|------|------|------|-----------|
| 1 | **클라우드 백업·다기기 동기화** | Premium | [ ] | Phase 3 |
| 2 | **통계/인사이트 대시보드** (스트릭·주/월·motivational) | Premium | [~] | v1 기본 통계 있음, 인사이트·유료 차별화 필요 |
| 3 | **홈스크린 위젯** (오늘 루틴·Quick Add) | Premium | [ ] | `expo-widgets` / Android Material You |
| 4 | **Realtime** (타 기기 즉시 반영) | Premium | [ ] | Supabase Realtime |
| 5 | **루틴 카테고리·태그·프리셋** | Free(일부) | [ ] | 운동·학습 템플릿 |
| 6 | **고급 알람** (위치·음성·Pomodoro) | Premium | [ ] | v1: 시간 알림만 |
| 7 | **소셜/공유** (템플릿·챌린지) | 선택 | [ ] | v3+ |

---

# UI/UX 로드맵

> v1은 **토스형 iOS Settings** 기조 유지. Android 위젯·Dynamic Color는 Phase 4.

| 영역 | v1 현황 | 개선 방향 | Phase |
|------|---------|-----------|-------|
| Visual polish | spacing·설정 리스트 통일 | Empty State·마이크로 애니메이션 | 2 |
| Typography·Icon | AppText 토큰(#77), Lucide | 잔여 inline 제거 | 1~2 |
| Navigation | PagerView 5탭 | Deep Link, 온보딩 강화 | 2 |
| UX Flow | swipe·홀드·드래그 | 루틴 추가 단순화 | 2 |
| Accessibility | 루틴·할일·단식 일부 | TalkBack 전수·Contrast·Font Scale | 1~2 |
| Performance | 완료 할일 FlatList | LazyList·startup·error state | 2 |
| Localization | 한국어 only | en 추가 | 2 |
| Dark mode | system/light/dark | 대비·위젯 테마 | 1~2 |

---

# 상용 출시 체크리스트 (통합)

### v1 (로컬) — 진행 중

| 항목 | 상태 |
|------|------|
| 앱 아이콘·스플래시 | [x] v1 |
| 개인정보·약관 | [x] |
| Sentry | [~] DSN |
| CI (`tsc`) | [x] |
| EAS production 빌드 | [ ] |
| 실기 QA | [ ] |
| Play/App Store 스크린샷·ASO | [ ] |

### v2 (Supabase + Freemium)

| 항목 | 상태 |
|------|------|
| Supabase Auth + RLS | [ ] |
| Offline-first 동기화 | [ ] |
| Realtime | [ ] |
| IAP / 구독 | [ ] |
| Analytics (Sentry + 행동 이벤트) | [ ] |
| Unit/E2E 테스트 | [ ] |
| GitHub Actions (lint·tsc·test) | [~] tsc만 |
| App Signing (EAS) | [~] Android keystore remote |
| 데이터 암호화 (전송 TLS, at-rest Supabase) | [ ] |
| AdMob (선택) | [ ] |
| 리뷰·A/B·ASO | [ ] |

---

# 작업 우선순위 (실행 순서)

```
P0  EAS 빌드 + 실기 QA          ← v1 출시 (인프라 블로cker)
P1  lint·잔여 a11y·Sentry DSN   ← v1 polish (dev APK)
P2  E2E·Deep Link·i18n          ← v1.1
P3  Supabase Auth·동기화·RLS    ← v2 상용 핵심
P4  Freemium IAP·고급 통계      ← v2 monetization
P5  위젯·Realtime·카테고리      ← v2.1+
P6  소셜·고급 알람              ← v3 선택
```

---

## 진행 로그

| 일시 | 작업 |
|------|------|
| 2026-06-12 | v1 P0 #68–#75, P1 #76–#79 |
| 2026-06-12 | **로드맵 갱신** — Supabase/Freemium·UI/UX·상용 체크리스트 통합 |
