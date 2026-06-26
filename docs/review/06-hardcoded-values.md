# 하드코딩 값 검토

> 검토 일자: 2026-06-26

---

## 조치 필요 항목 (우선순위순)

### 높음 — 보안/유지보수 위험

#### H-1. 연락처 이메일 중복 하드코딩

| 파일 | 값 |
|------|-----|
| `app/terms.tsx:38` | `asteroidin8@gmail.com` |
| `app/settings/about.tsx:24` | `asteroidin8@gmail.com` |

**문제:** 이메일 변경 시 두 곳 동시 수정 필요. 누락 위험.
**개선:** `constants/copy.ts` 또는 `constants/app.ts`에 `CONTACT_EMAIL` 상수 추출.
**노력:** 낮음

#### H-2. 위젯 그룹 ID — 패키지명과 수동 동기화

| 파일 | 값 |
|------|-----|
| `src/widgets/widgetDataBridge.ts:5` | `group.com.asteroidin8.zndi` |
| `app.json:18,27` | `com.asteroidin8.zndi` |

**문제:** 패키지명 변경 시 위젯 그룹 ID도 수동 수정 필요. 불일치 시 위젯 데이터 공유 실패.
**개선:** `app.json`에서 `expo.extra.widgetGroup`으로 설정, `Constants.expoConfig.extra`로 읽기.
**노력:** 낮음

#### H-3. Expo Push URL 두 곳 중복

| 파일 | 값 |
|------|-----|
| `supabase/functions/send-board-push/index.ts:3` | `https://exp.host/--/api/v2/push/send` |
| `supabase/functions/inactive-board-warning/index.ts:3` | 동일 |

**문제:** Expo가 URL을 변경하면 두 곳 수정 필요.
**개선:** 공유 모듈 `supabase/functions/_shared/constants.ts`로 추출. 또는 Supabase Secrets에 환경변수로 관리.
**노력:** 낮음

#### H-4. 딥링크 스킴 `zndi://` 분산

| 파일 | 사용처 |
|------|--------|
| `app/board/[id].tsx:790` | 보드 초대 QR |
| `app/settings/index.tsx:499` | 프로필 QR |
| `src/widgets/FastingWidget.tsx:37` | 위젯 클릭 |
| `src/services/auth/authSession.ts:10` | `makeRedirectUri({ scheme: 'zndi' })` |

**문제:** 스킴 변경 시 4곳 수정 필요. `app.json`의 `scheme: "zndi"`와 수동 동기화.
**개선:** `constants/app.ts`에 `APP_SCHEME` 상수, 또는 `Constants.expoConfig.scheme`에서 읽기.
**노력:** 낮음

### 중간 — 비즈니스 로직 경직

#### M-1. 데이터 보존 기간

| 파일 | 값 | 용도 |
|------|-----|------|
| `useRoutineStore.ts:9` | `DELETED_RETENTION_DAYS = 180` | 소프트 삭제 보존 |
| `useTodoStore.ts:13` | `DELETED_RETENTION_DAYS = 180` | 소프트 삭제 보존 |
| `useRoutineCompletionStore.ts:10` | `COMPLETION_RETENTION_DAYS = 400` | 완료 기록 보존 |
| `useRoutineCompletionStore.ts:9` | `MAX_STREAK_DAYS = 365` | 스트릭 계산 범위 |

**문제:** 보존 정책이 코드에 흩어져 있음. `DELETED_RETENTION_DAYS`는 두 store에서 동일 값을 각각 선언.
**개선:** `constants/dataRetention.ts`로 통합.
**노력:** 낮음

#### M-2. 홈 화면 표시 제한

| 파일 | 값 |
|------|-----|
| `DailySummaryRow.tsx:22` | `MAX_ROUTINES = 5` |
| `DailySummaryRow.tsx:23` | `MAX_TODOS = 4` |

**문제:** UI 표시 제한이 컴포넌트에 매직 넘버로 존재.
**개선:** 파일 상단 상수로 이미 추출되어 있어 현재도 나쁘지 않음. 필요 시 `constants/ui.ts`로 이동.
**노력:** 낮음 (선택적)

#### M-3. 동기화 타이밍 값

| 파일 | 값 | 용도 |
|------|-----|------|
| `useAutoCloudSync.ts:13` | `PUSH_DEBOUNCE_MS = 2500` | 클라우드 push 디바운스 |
| `useRealtimeSync.ts` | `MIN_BACKGROUND_MS = 5000` | 포그라운드 복귀 쓰로틀 |
| `useBoardProgressSync.ts:78` | `500` (인라인) | 보드 진행도 디바운스 |
| `useWidgetSync.ts:130,148` | `1000`, `60000` (인라인) | 위젯 업데이트 주기 |

**문제:** 타이밍 값이 파일마다 흩어져 있어 조정 어려움.
**개선:** `constants/timing.ts`로 통합.
**노력:** 낮음

### 낮음 — 현재 문제 없지만 개선 가능

#### L-1. SecureStore 청크 크기
`supabase.ts:23` — `chunkSize = 1800`. 2048 제한 대응으로 적절. 변경 필요 없음.

#### L-2. 단식 단계 경계값
`fastingMessages.ts` — 이미 constants에 정리되어 있음. 현재 구조 적절.

#### L-3. 잔디 레벨 구간
`grassLevel.ts` — 레벨 변경 가능성 낮고, 이미 한 파일에 집중. 현재 구조 적절.

#### L-4. 아바타/테마 가격
`avatars.ts`, `grassTheme.ts` — 이미 constants에 정리. IAP 연동 시 서버 관리로 전환 예정.

---

## 조치 우선순위 요약

| 순서 | 항목 | 심각도 | 노력 |
|------|------|--------|------|
| 1 | H-1. 연락처 이메일 상수화 | 높음 | 낮음 |
| 2 | H-4. 딥링크 스킴 상수화 | 높음 | 낮음 |
| 3 | H-2. 위젯 그룹 ID config 연동 | 높음 | 낮음 |
| 4 | H-3. Expo Push URL 공유 모듈 | 높음 | 낮음 |
| 5 | M-1. 데이터 보존 기간 통합 | 중간 | 낮음 |
| 6 | M-3. 동기화 타이밍 통합 | 중간 | 낮음 |
| 7 | M-2. 홈 표시 제한 | 중간 | 낮음 (선택) |
