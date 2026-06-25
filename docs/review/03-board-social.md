# 화면 검토: 보드(소셜) / 친구

**검토 범위:** `app/(tabs)/board.tsx`, `app/board/[id].tsx`, `app/board/create.tsx`, `app/board/join.tsx`, `app/board/friend.tsx`, `app/board/search.tsx`, `src/services/board/boardService.ts`, `src/services/board/boardRoutineService.ts`, `src/services/social/followService.ts`

---

## 1. 보안

### 1-1. 초대 코드 생성이 `Math.random()` 사용 — 심각도: 중간

**문제:** `boardService.ts:6-12`에서 `Math.random()`으로 6자리 초대 코드를 생성한다. `Math.random()`은 암호학적으로 안전하지 않아 패턴 예측이 이론적으로 가능하다.

**이유:** 6자리 코드 자체의 공간이 작기 때문에(31^6 ≈ 8.9억), 무차별 대입보다는 예측이 더 효율적인 공격 벡터가 될 수 있다. 다만 현재 `create_board` RPC가 서버에서 실행되므로, 클라이언트에서 생성한 코드를 서버로 전달하는 구조.

**개선:**
- **권장:** 초대 코드를 서버(Supabase RPC) 내부에서 `gen_random_uuid()` 기반으로 생성. 클라이언트에서 코드를 보내지 않음
- **대안:** `expo-crypto`의 `getRandomValues()`로 대체

```typescript
// 서버 측 (PostgreSQL RPC 내부)
v_invite_code := upper(substr(encode(gen_random_bytes(4), 'base32'), 1, 6));
```

**예상 효과:** 초대 코드 예측 불가, 보안 강화

### 1-2. 보드 이름 입력에 길이 제한 없음 — 심각도: 낮음

**문제:** `board/create.tsx`의 보드 이름 `TextInput`에 `maxLength` 없음. 극단적으로 긴 이름이 DB에 저장되고 다른 멤버의 UI를 깨뜨릴 수 있다.

**개선:** `maxLength={30}` 추가 (루틴 이름에는 이미 적용됨)

**예상 효과:** UI 깨짐 방지, 일관성

### 1-3. `insertSystemMessage` 타입 파라미터 미검증 — 심각도: 낮음

**문제:** `boardService.ts:264`에서 `type: string`으로 시스템 메시지 타입을 받는다. 올바른 타입 enum 검증이 없다.

**개선:** `BoardSystemMessage['type']`으로 타입 제한:
```typescript
export async function insertSystemMessage(
  boardId: string,
  type: BoardSystemMessage['type'],  // 'routine_created' | 'member_joined' | ...
  ...
)
```

**예상 효과:** 컴파일 타임 안전성

### 1-4. 사진 업로드 — 파일 확장자 기반 MIME 판별 — 심각도: 낮음

**문제:** `boardRoutineService.ts:128-129`에서 URI의 확장자로 MIME 타입을 결정한다. `expo-image-picker`가 반환하는 URI는 대부분 안전하지만, 확장자가 없거나 변조된 경우를 고려하지 않는다.

**현재 평가:** `expo-image-picker`의 `mediaTypes: ['images']` 제한 + Supabase Storage 정책으로 충분히 방어됨. 추가 검증은 과도.

### 1-5. `deleteVerification` — 사진 삭제 후 DB 삭제 순서 — 심각도: 낮음

**문제:** `boardRoutineService.ts:199-208`에서 Storage 삭제 → DB 삭제 순서. Storage 삭제 성공 후 DB 삭제 실패 시 고아 레코드가 남지는 않지만, 반대로 사진 파일만 삭제되고 DB 레코드가 남을 수 있다.

**개선:** DB 삭제를 먼저 수행하고, 성공 시 Storage 삭제. DB 삭제 실패 시 사진도 그대로 유지되어 데이터 무결성 보존.

---

## 2. 비용 효율성

### 2-1. `fetchMyBoards` — 보드별 순차 API 호출 — 심각도: 중간

**문제:** `boardService.ts:310-313`에서 보드 목록을 가져온 뒤, 각 보드에 대해 순차적으로 `fetchBoardMembers` + `fetchBoardProgress`를 호출한다. 보드가 7개면 최소 15회 API 호출.

**이유:** 각 호출이 순차적(`await`)이라 네트워크 지연이 누적된다. Supabase 읽기 비용도 비례 증가.

**개선:**
```typescript
// 병렬화
await Promise.all(
  boards.map(async (board) => {
    await Promise.all([
      fetchBoardMembers(board.id),
      fetchBoardProgress(board.id),
    ]);
  }),
);
```

**예상 효과:** 보드 탭 초기 로딩 시간 50~70% 단축, API 호출 수는 동일하나 총 대기 시간 감소

### 2-2. 친구 탭 — 전체 팔로잉에 대해 개별 progress 호출

**문제:** `board.tsx:48-53`에서 friends 탭 전환 시 모든 팔로잉에 대해 개별 `fetchFriendProgress` 호출.

**개선:** 서버 RPC로 한 번에 여러 사용자의 progress를 가져오는 batch API 도입

**예상 효과:** API 호출 N회 → 1회로 절감

### 2-3. Supabase Storage — 이미지 리사이즈 없음

**문제:** `quality: 0.7`로 압축하지만 해상도 제한이 없다. 고해상도 카메라(4K+)에서 촬영하면 큰 파일이 업로드된다.

**개선:** `expo-image-picker`의 `allowsEditing: true` + `aspect: [1, 1]`이 이미 적용되어 있으나, 명시적 `maxWidth: 1080` 추가 권장.

```typescript
const result = await ImagePicker.launchCameraAsync({
  quality: 0.7,
  allowsEditing: true,
  aspect: [1, 1],
  // 추가
  exif: false,  // EXIF 메타데이터 제거 (위치 정보 등 프라이버시)
});
```

**예상 효과:** Storage 비용 절감, 사용자 위치 정보 유출 방지 (프라이버시 보너스)

---

## 3. UX

### 3-1. 보드 상세 진입 시 로딩 표시 없음

**문제:** `board/[id].tsx`에서 4개의 fetch (`fetchBoardMembers`, `fetchBoardRoutines`, `fetchVerificationLogs`, `fetchSystemMessages`)가 동시 실행되지만 로딩 상태가 없다. 데이터가 도착하기 전에 빈 화면이 보인다.

**개선:** `isLoading` 상태 추가, Skeleton UI 표시

**예상 효과:** 체감 로딩 속도 개선

### 3-2. 보드 나가기 — 보드 데이터 캐싱 의도 불명

**문제:** `board/[id].tsx:297-306`에서 나가기 전에 AsyncStorage에 보드 데이터를 캐싱하지만, 이 캐시를 다시 사용하는 코드가 없다.

**개선:** 사용하지 않는 캐시 저장 코드를 제거하거나, "최근 나간 보드 다시 참가" 기능 구현

### 3-3. 피드 무한스크롤 / 페이지네이션 없음

**문제:** `fetchVerificationLogs`가 `limit(50)`으로 고정. 50개 이상의 인증 기록이 있으면 과거 기록을 볼 수 없다.

**개선:** 무한 스크롤 + cursor 기반 페이지네이션

---

## 4. 속도/성능

### 4-1. `hasVerified` — O(n) 반복 검색

**문제:** `board/[id].tsx:245-249`에서 `hasVerified`가 `logs.some()`으로 O(n) 검색. `memberStats` 계산 시 멤버 × 루틴 × 주간일수 = 최대 15×1×7 = 105회 호출. logs가 50개면 5,250회 비교.

**개선:** `useMemo`로 `Set<string>` 사전 생성:
```typescript
const verifiedSet = useMemo(() => {
  const set = new Set<string>();
  for (const l of logs) {
    set.add(`${l.userId}:${l.routineId}:${localDateStr(new Date(l.createdAt))}`);
  }
  return set;
}, [logs]);

function hasVerified(userId: string, routineId: string, date: string) {
  return verifiedSet.has(`${userId}:${routineId}:${date}`);
}
```

**예상 효과:** O(n) → O(1) 조회, 대규모 보드에서 렌더링 성능 개선

### 4-2. 보드 목록 — 모든 보드의 멤버 + progress 사전 로딩

**문제:** 보드 탭에 진입하면 모든 보드의 상세 데이터를 미리 로딩한다. 보드가 많아지면 초기 로딩이 느려진다.

**개선:** 보드 목록에서는 최소 정보(이름, 멤버 수)만 표시하고, 보드 상세 진입 시 나머지 로딩 (이미 `[id].tsx`에서 하고 있으므로 중복)

---

## 요약

| # | 항목 | 심각도 | 노력 | 우선 |
|---|------|--------|------|------|
| 2-1 | fetchMyBoards 병렬화 | 중간 | 낮음 | **즉시** |
| 4-1 | hasVerified Set 최적화 | 중간 | 낮음 | **즉시** |
| 1-1 | 초대 코드 서버 생성 | 중간 | 중간 | 단기 |
| 2-3 | 이미지 EXIF 제거 | 중간 | 낮음 | **즉시** |
| 2-2 | 친구 progress batch API | 중간 | 중간 | 중기 |
| 3-1 | 보드 상세 로딩 UI | 낮음 | 낮음 | 단기 |
| 3-3 | 피드 페이지네이션 | 낮음 | 중간 | 중기 |
| 1-2 | 보드 이름 maxLength | 낮음 | 낮음 | 즉시 |
| 1-5 | 삭제 순서 수정 | 낮음 | 낮음 | 단기 |
| 3-2 | 사용하지 않는 캐시 제거 | 낮음 | 낮음 | 즉시 |
