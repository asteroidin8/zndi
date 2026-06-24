# 데이터 무결성 정책

> 최종 갱신: 2026-06-24

## 원칙

- 삭제된 항목이 과거 통계를 소급 변경하지 않아야 한다
- 특정 날짜의 통계는 그 날짜에 존재했던 항목을 기준으로 계산한다
- `deletedAt` 기준으로 활성 여부를 판단한다:
  ```
  item.createdAt <= date && (!item.deletedAt || item.deletedAt > date)
  ```

---

## Soft Delete 대상

### 1. 개인 루틴

| 항목 | 현재 | 변경 |
|------|------|------|
| 저장소 | AsyncStorage (useRoutineStore) | 동일 |
| 삭제 방식 | 배열에서 제거 | `deletedAt: number` 필드 추가 |
| 타입 변경 | — | `Routine.deletedAt?: number` |
| 활성 필터 | 없음 | `r.deletedAt == null` |
| 통계 포함 | routines 배열 순회 | deletedAt 기준 날짜별 필터 |

**영향 범위:**
- `useRoutineStore.removeRoutine()` → `deletedAt` 설정으로 변경
- `useRoutineStore.removeRoutines()` → 동일
- 홈/루틴 탭: `deletedAt == null` 필터 추가
- 통계 (stats, contributionGrid, homeDailyBoard): 날짜별 활성 루틴 필터
- `getStreak()`: 삭제된 루틴도 과거 스케줄 참조 가능

### 2. 할일

| 항목 | 현재 | 변경 |
|------|------|------|
| 저장소 | AsyncStorage (useTodoStore) | 동일 |
| 삭제 방식 | 배열에서 제거 | `deletedAt: number` 필드 추가 |
| 타입 변경 | — | `Todo.deletedAt?: number` |
| 활성 필터 | 없음 | `t.deletedAt == null` |
| 통계 포함 | todos 배열 순회 | deletedAt 기준 날짜별 필터 |

**영향 범위:**
- `useTodoStore.removeTodo()` → `deletedAt` 설정으로 변경
- `useTodoStore.removeTodos()` → 동일
- 홈/할일 탭: `deletedAt == null` 필터 추가
- 통계 (calendarGrass, stats): 날짜별 활성 할일 필터

### 3. 공동 루틴

| 항목 | 현재 | 변경 |
|------|------|------|
| 저장소 | Supabase (board_routines) | 동일 |
| 삭제 방식 | DB row 삭제 | `deleted_at` 컬럼 추가 (timestamptz) |
| 로컬 스토어 | useBoardStore.routines | `deletedAt` 포함하여 fetch |
| 활성 필터 | 없음 | `deleted_at IS NULL` (활성 목록) |
| 통계 포함 | boardRoutines 순회 | deletedAt 기준 날짜별 필터 |

**영향 범위:**
- `deleteBoardRoutine()` → UPDATE `deleted_at` = now()
- 보드 상세 화면: `deleted_at IS NULL` 필터
- 통계 (boardRoutineStats): 날짜별 활성 공동 루틴 필터
- 인증 로그: 삭제된 루틴의 과거 로그 유지

---

## Soft Delete 비대상

### 단식 기록

삭제해도 다른 기록의 통계가 왜곡되지 않음 (각 기록이 독립적 데이터 포인트). 현재 영구 삭제 유지.

---

## 완료 기록 보존 기간

| 항목 | 현재 | 변경 |
|------|------|------|
| `COMPLETION_RETENTION_DAYS` | 30 | **400** |
| `MAX_STREAK_DAYS` | 365 | 365 (유지) |

- 연간 통계를 위해 최소 365일 + 여유분 필요
- 400일로 설정하여 1년 + 35일 버퍼

---

## Soft Delete 보존 기간

| 대상 | 보존 기간 | 이후 |
|------|-----------|------|
| 개인 루틴 | 400일 | 완전 삭제 (completions와 동일 주기) |
| 할일 | 400일 | 완전 삭제 |
| 공동 루틴 | 서버 유지 (별도 정리 배치 가능) | — |

- 개인 데이터(루틴/할일)는 `COMPLETION_RETENTION_DAYS`와 동일 주기로 정리
- `clearOldCompletions()` 실행 시 보존 기간 초과한 soft-deleted 항목도 함께 정리
- 완료 기록과 루틴/할일 메타데이터가 동시에 정리되어 고아 데이터 방지

---

## 보드 탈퇴 시 로컬 캐시

- 보드 탈퇴/추방 시 해당 보드의 과거 기록을 로컬에 별도 보존
- 보존 대상: 공동 루틴 목록, 인증 로그 (통계 계산에 필요한 최소 데이터)
- 보존 기간: 400일 (개인 데이터와 동일)
- 통계 계산 시 로컬 캐시 데이터 포함

---

## Soft Delete 부수 효과

### 알림 정리

- 루틴 soft delete 시 해당 루틴의 예약된 알림(reminderTime) 취소
- 안 하면 삭제한 루틴의 알림이 계속 울림

### 위젯 데이터

- soft-deleted 항목은 홈 화면 위젯에서도 제외
- 위젯 데이터 브릿지에서 `deletedAt == null` 필터 적용

### 그룹 내 카운트

- soft-deleted 항목은 그룹 진행률 바, 그룹 내 개수 표시에서 제외
- 그룹 헤더의 "n/m" 카운트에 반영

### Undo 상호작용

- 기존 3초 undo 메커니즘은 soft delete와 자연스럽게 호환
- undo = `deletedAt` 필드를 다시 `undefined`로 설정
- undo 시 알림도 재등록

---

## 클라우드 동기화

- 개인 루틴/할일의 `deletedAt` 필드도 클라우드 동기화 대상
- `pushLocalToCloud` / `pullCloudToLocal` 시 `deletedAt` 포함
- 기기 간 soft delete 상태가 동기화되어야 통계 일관성 유지
- 공동 루틴은 Supabase `deleted_at` 컬럼으로 서버에서 관리 (별도 동기화 불필요)
- Supabase의 `routines`/`todos` 테이블에도 `deleted_at` 컬럼 추가 필요 (미적용 시 다른 기기에서 pull할 때 삭제 항목이 부활)

---

## 통계 계산 기준 요약

```
특정 날짜(D)의 통계:

개인 루틴:
  분모 = D에 스케줄된 루틴 중 createdAt <= D && (!deletedAt || deletedAt > D)
  분자 = 분모 중 isCompleted(id, D) == true

할일:
  분모 = D에 존재한 할일 중 createdAt <= D && (!deletedAt || deletedAt > D)
  분자 = 분모 중 completedAt이 D인 할일

공동 루틴:
  분모 = D에 활성인 공동 루틴 (created_at <= D && (!deleted_at || deleted_at > D))
  분자 = D에 인증 로그가 있는 공동 루틴
```

---

## 예시

```
루틴 7개, 6/24에 "물 마시기" 삭제:

6/23: 분모 7개 (물 마시기 포함), 완료 5/7 = 71%
6/24: 분모 6개 (물 마시기 제외), 완료 4/6 = 67%
6/25: 분모 6개 기준 계속

보드 "우리집" 공동 루틴 3개 중 1개 6/24 삭제:
6/23: 개인 6 + 공동 3 = 9개 기준
6/24: 개인 6 + 공동 2 = 8개 기준

보드 탈퇴 (6/24):
6/23: 개인 6 + 공동 2 = 8개 기준 (로컬 캐시에서 계산)
6/24: 개인 6개 기준 (공동 제외)
```
