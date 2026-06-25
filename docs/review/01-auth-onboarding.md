# 화면 검토: 인증 / 온보딩 / 설정(로그인)

**검토 범위:** `app/auth/callback.tsx`, `app/onboarding.tsx`, `app/index.tsx`, `app/_layout.tsx`, `app/settings/index.tsx`, `src/services/auth/authSession.ts`, `src/contexts/AuthProvider.tsx`, `src/lib/supabase.ts`, `src/services/sync/cloudSync.ts`

---

## 1. 보안 (최우선)

### 1-1. OTP 브루트포스 방어 없음 — 심각도: 높음

**문제:** `settings/index.tsx`의 이메일 OTP 인증에 클라이언트 측 Rate Limit이 없다. "인증 코드 받기" 버튼을 무제한 누를 수 있고, 6자리 OTP 입력도 시도 횟수 제한이 없다.

**이유:** Supabase 서버 측에 기본 Rate Limit이 있지만 (시간당 30회), 클라이언트에서 무의미한 요청을 계속 보내면 서버 비용이 올라가고, 사용자가 혼란스러운 에러 메시지를 받는다.

**개선:**
- 클라이언트: OTP 전송 후 60초 쿨다운 타이머 추가
- 클라이언트: OTP 입력 실패 3~5회 시 재전송 유도 + 일정 시간 잠금
- Supabase 대시보드: Auth Rate Limit 확인/강화

**예상 효과:** 불필요한 API 호출 방지, 서버 비용 절감, 사용자에게 명확한 피드백

### 1-2. `deleteCloudRecord`에 테이블 이름 직접 전달 — 심각도: 중간

**문제:** `cloudSync.ts:168-177`에서 `table` 파라미터를 문자열로 받아 `supabase.from(table).delete()` 호출. 현재는 내부적으로만 사용되지만, 허용 테이블 검증이 없어 실수로 잘못된 테이블을 삭제할 수 있다.

**이유:** 방어적 프로그래밍. 코드가 확장되면서 의도치 않은 테이블 접근 위험이 커진다.

**개선:**
```typescript
const ALLOWED_TABLES = ['routines', 'todos', 'fasting_records', 'routine_completions', 'weight_records', 'routine_groups', 'todo_groups'] as const;
type AllowedTable = typeof ALLOWED_TABLES[number];

export async function deleteCloudRecord(table: AllowedTable, id: string) {
  // ...
}
```

**예상 효과:** 컴파일 타임에 잘못된 테이블 접근 차단, RLS가 마지막 방어선이 아닌 첫 번째 방어선 역할

### 1-3. QR 코드에 user.id 노출 — 심각도: 중간

**문제:** `settings/index.tsx:449`에서 `zndi://follow?userId=${user.id}`로 Supabase UUID를 QR에 직접 노출한다.

**이유:** UUID 자체는 추측 불가하지만, 한번 노출되면 해당 사용자의 공개 데이터(보드 등)에 접근할 수 있는 영구적인 식별자가 된다.

**개선 제안:**
- 단기: 현재 구조로도 RLS가 보호하므로 당장의 위험은 낮음. UUID 대신 짧은 코드(8자)를 서버에서 생성/만료 관리하면 이상적
- 장기: 팔로우 요청 전용 초대 코드 도입 (TTL 포함)

**예상 효과:** 사용자 식별자 유출 범위 최소화

### 1-4. 닉네임 입력 XSS/인젝션 검증 없음 — 심각도: 낮음

**문제:** `settings/index.tsx:64-79`에서 닉네임을 `trim()`만 하고 길이/문자 제한 없이 저장한다.

**이유:** React Native에서 직접적인 XSS는 어렵지만, 닉네임이 보드에서 다른 사용자에게 표시되므로 극단적으로 긴 문자열이나 특수문자가 UI를 깨뜨릴 수 있다.

**개선:**
```typescript
const NICKNAME_MAX = 16;
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;

function validateNickname(name: string): string | null {
  if (name.length > NICKNAME_MAX) return `${NICKNAME_MAX}자 이하로 입력해주세요`;
  if (!NICKNAME_PATTERN.test(name)) return '한글, 영문, 숫자, _만 사용할 수 있어요';
  return null;
}
```

**예상 효과:** UI 깨짐 방지, 보드에서 안전한 렌더링

---

## 2. 비용 효율성

### 2-1. `pullCloudToLocal` — 8개 테이블 동시 풀 쿼리

**문제:** `cloudSync.ts:185-194`에서 로그인 시 8개 테이블을 `select('*')`로 동시에 풀 쿼리한다. 데이터가 많아지면 전송량과 Supabase 읽기 비용이 급증한다.

**이유:** 루틴 완료 기록(completions)은 시간이 지나면 수천~수만 행이 될 수 있다. 매 로그인마다 전체를 가져올 필요 없다.

**개선:**
- `routine_completions`과 `fasting_records`에 날짜 범위 필터 추가 (최근 90일 등)
- `select('*')` 대신 필요한 컬럼만 지정
- 증분 동기화: `sync_state.last_pulled_at` 이후 변경분만 가져오기

**예상 효과:** Supabase 읽기 비용 50~80% 절감 (사용 기간에 비례), 로그인 속도 개선

### 2-2. `pushLocalToCloud` — 전체 데이터 upsert

**문제:** 매번 모든 데이터를 upsert한다. 변경된 항목만 보내는 로직이 없다.

**개선:**
- Zustand store에 `dirtyIds` 추적 추가
- push 시 dirty 항목만 upsert
- 성공 후 dirty 플래그 클리어

**예상 효과:** Supabase 쓰기 비용 대폭 절감, 네트워크 사용량 감소

---

## 3. UX

### 3-1. OTP 입력 UX 미흡

**문제:** 이메일 OTP 코드 입력 시:
- 재전송 버튼 없음 (코드를 못 받았을 때 대처 불가)
- 남은 시간 표시 없음
- 코드 입력 후 자동 인증 없음 (6자리 채우면 바로 검증)

**개선:**
- 재전송 버튼 + 쿨다운 카운터 (60초)
- 6자리 입력 완료 시 자동 `handleVerifyOtp` 호출
- `maxLength={6}` 추가

**예상 효과:** 인증 완료율 향상, 이탈률 감소

### 3-2. 로그인 로딩 상태 불명확

**문제:** `auth/callback.tsx`에서 로딩 스피너만 보여주고, 얼마나 걸리는지, 실패하면 어떻게 되는지 안내가 없다.

**개선:**
- 타임아웃(10초) 후 "다시 시도" 버튼 표시
- 실패 시 설정 화면으로 자동 이동 + 에러 메시지

**예상 효과:** 사용자 불안감 해소, 무한 로딩 방지

### 3-3. 온보딩 스킵 시 확인 없음

**문제:** "건너뛰기" 누르면 즉시 메인 화면으로 이동. 실수로 누를 수 있다.

**현재 평가:** 온보딩은 3페이지로 가볍고, 재진입 경로만 있으면 문제없다. 확인 다이얼로그보다는 설정에서 "온보딩 다시 보기" 옵션 추가가 더 나은 접근.

---

## 4. 속도/성능

### 4-1. AuthProvider 중복 딥링크 처리

**문제:** `AuthProvider.tsx`에서 `Linking.addEventListener`와 `Linking.getInitialURL`을 둘 다 처리하고, `auth/callback.tsx`에서도 동일한 로직을 실행한다. 같은 콜백이 2번 호출될 수 있다.

**이유:** `handled` ref로 callback 화면에서는 중복 방지하지만, AuthProvider와 callback 화면 간의 경합은 없다. AuthProvider에서 이미 세션이 있으면 스킵하므로 실제 문제는 드물지만, 불필요한 `getSession()` 호출이 2회 발생한다.

**개선:** AuthProvider의 딥링크 처리를 제거하고, `auth/callback` 화면에서만 콜백 처리 담당. AuthProvider는 `onAuthStateChange`로 세션 변경만 감지.

**예상 효과:** 콜드 스타트 시 불필요한 API 호출 1회 절감, 코드 단순화

### 4-2. SecureStore 청크 I/O

**문제:** `supabase.ts`의 `ExpoSecureStoreAdapter`가 세션 토큰을 청크 단위로 읽고 쓴다. 읽기 시 n+1번의 `getItemAsync` 호출 (청크 수 조회 1회 + 청크별 1회).

**현재 평가:** SecureStore 2048바이트 제한 때문에 필요한 구현. 청크 수는 보통 2~3개이므로 성능 영향은 미미. 다만 `aes-256-cbc` 등으로 직접 암호화 후 `AsyncStorage`에 저장하는 방식도 대안이지만, SecureStore의 하드웨어 보안(Keychain/Keystore)을 포기하게 되므로 현재 구현이 더 안전하다.

---

## 추가 검토 필요

- **멤버십/결제 화면** (`settings/membership.tsx`): Pro 상태 검증, 결제 보안
- **보드 화면** (`board/[id].tsx`, `boardService.ts`): 다른 사용자 데이터 접근 시 RLS 의존도, 입력값 검증
- **실시간 동기화** (`useRealtimeSync.ts`): Realtime 채널 인증, 데이터 무결성

---

## 요약 (우선순위 매트릭스)

| # | 항목 | 심각도 | 노력 | 우선 |
|---|------|--------|------|------|
| 1-1 | OTP Rate Limit | 높음 | 낮음 | **즉시** |
| 2-1 | pull 쿼리 최적화 | 중간 | 중간 | 단기 |
| 2-2 | push 증분 동기화 | 중간 | 높음 | 중기 |
| 1-2 | deleteCloudRecord 타입 안전성 | 중간 | 낮음 | 단기 |
| 3-1 | OTP UX 개선 | 중간 | 낮음 | 단기 |
| 1-4 | 닉네임 검증 | 낮음 | 낮음 | 단기 |
| 4-1 | 딥링크 중복 제거 | 낮음 | 낮음 | 단기 |
| 1-3 | QR 초대 코드 | 중간 | 높음 | 중기 |
| 3-2 | 콜백 타임아웃 | 낮음 | 낮음 | 단기 |
