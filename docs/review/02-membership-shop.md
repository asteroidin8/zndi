# 화면 검토: 멤버십 / 테마 상점

**검토 범위:** `app/settings/membership.tsx`, `app/settings/theme-shop.tsx`, `src/stores/useProStore.ts`, `src/hooks/useProGating.ts`, `src/components/CloudSyncBridge.tsx`

---

## 1. 보안 (최우선)

### 1-1. Pro 상태가 클라이언트 로컬에만 저장됨 — 심각도: 치명적

**문제:** `useProStore`의 `isPro` 값이 `AsyncStorage`에 저장된다. 서버 측 검증이 없으므로:
- 사용자가 AsyncStorage를 직접 수정하면 Pro 기능을 무료로 사용 가능
- 앱 디버그 빌드에서 `useProStore.setState({ isPro: true })` 한 줄로 우회 가능
- `purchasedColors`, `purchasedShapes`, `purchasedAnimations`도 동일하게 조작 가능

**이유:** 현재 구독 기능이 "준비 중"이므로 실제 결제는 아직 없다. 하지만 Pro 게이팅이 이미 여러 화면에서 기능을 제한하고 있어, 출시 전에 반드시 서버 검증 구조를 마련해야 한다.

**개선:**
1. **단기 (출시 전 필수):** Supabase에 `subscriptions` 테이블 생성, 앱 시작 시 서버에서 Pro 상태 조회
2. **중기:** RevenueCat 또는 `expo-in-app-purchases`로 실제 IAP 연동. 서버 측 영수증 검증 (RevenueCat webhook → Supabase)
3. Pro 게이트 체크를 서버 API에서도 수행 (예: 그룹 생성 시 서버에서 현재 그룹 수 + Pro 여부 확인)

```
[App] ──purchase──→ [App Store / Play Store]
                          │
                     webhook/receipt
                          ↓
              [RevenueCat / 서버 검증]
                          │
                     subscription status
                          ↓
              [Supabase subscriptions 테이블]
                          │
                     앱 시작 시 조회
                          ↓
              [useProStore.setPro(serverValue)]
```

**예상 효과:** Pro 기능 우회 불가, 실제 결제 수익 보호

### 1-2. 관리자 이메일 하드코딩 — 심각도: 중간

**문제:** `CloudSyncBridge.tsx:8`에 `ADMIN_EMAILS = ['asteroidin8@gmail.com']`이 소스 코드에 하드코딩되어 있다.

**이유:**
- 앱 빌드에 포함되므로 디컴파일 시 관리자 이메일 노출
- 관리자 추가/변경 시 앱 업데이트 필요

**개선:**
- Supabase에 `admin_users` 테이블 또는 `profiles.role` 컬럼 추가
- 서버 측 RPC로 관리자 여부 확인: `supabase.rpc('is_admin')`
- 또는 Supabase custom claims (JWT)에 role 추가

**예상 효과:** 관리자 목록 비노출, 서버 측 관리 가능

### 1-3. Pro 제한 검증이 클라이언트에만 존재 — 심각도: 높음

**문제:** `useProGating.ts`의 `FREE_LIMITS`와 `PRO_LIMITS` 값이 클라이언트에만 존재한다. 보드 생성, 그룹 생성 등의 제한이 서버 RLS/트리거로 강제되지 않으면 API를 직접 호출해 제한을 우회할 수 있다.

**개선:**
- Supabase에 `before insert` 트리거 또는 RPC 함수에서 현재 보드 수 / 그룹 수를 체크하여 제한 초과 시 에러 반환
- 제한 값은 서버 config 테이블에서 관리

**예상 효과:** API 직접 호출로 제한 우회 불가

---

## 2. 비용 효율성

### 2-1. 현재는 비용 이슈 없음

멤버십 화면은 순수 UI이고, 테마 상점도 로컬 상태만 변경한다. 결제 연동 후 RevenueCat 등의 API 호출 비용이 추가될 수 있으나, 현 시점에서는 해당 없음.

---

## 3. UX

### 3-1. 멤버십 구독 버튼이 동작하지 않음 — 현재 의도적

**현황:** `appAlert('준비 중', '구독 기능은 곧 출시될 예정이에요!')`로 처리. 출시 전까지는 괜찮으나, 사용자가 가격표를 보고 플랜을 선택한 뒤 "준비 중"을 보면 실망할 수 있다.

**개선 제안:**
- 구독 미출시 시 가격 표시 대신 "Pro 출시 알림 받기" 이메일 수집 UI 제공
- 또는 멤버십 화면 자체를 "곧 출시" 배너로 단순화

### 3-2. 테마 상점 — 잠금 아이템 프리뷰 불가

**문제:** 잠긴 아이템을 터치하면 바로 ProLockModal이 뜬다. 사용자가 어떤 느낌인지 미리 볼 수 없어 구매 동기가 떨어진다.

**개선:** 잠긴 아이템 선택 시 3초간 프리뷰 적용 → "이 테마를 사용하려면 Pro가 필요해요" 안내

**예상 효과:** 전환율 향상

---

## 4. 속도/성능

현재 화면은 정적 UI + Zustand 로컬 상태만 사용하므로 성능 이슈 없음.

---

## 추가 검토 필요

- **보드 화면**: `FREE_LIMITS.boards`와 `FREE_LIMITS.boardMembers`가 서버에서도 강제되는지 확인 필요
- **루틴/할일 화면**: `FREE_LIMITS.routineGroups`, `FREE_LIMITS.todoGroups` 서버 검증 여부

---

## 요약

| # | 항목 | 심각도 | 노력 | 우선 |
|---|------|--------|------|------|
| 1-1 | Pro 상태 서버 검증 | 치명적 | 높음 | **출시 전 필수** |
| 1-3 | 제한값 서버 강제 | 높음 | 중간 | **출시 전 필수** |
| 1-2 | 관리자 이메일 하드코딩 | 중간 | 낮음 | 단기 |
| 3-2 | 잠금 아이템 프리뷰 | 낮음 | 중간 | 중기 |
| 3-1 | 미출시 구독 UX | 낮음 | 낮음 | 단기 |
