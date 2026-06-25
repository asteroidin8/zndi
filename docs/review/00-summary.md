# 코드 리뷰 종합 요약

> 검토 일자: 2026-06-25
> 검토 대상: zndi 앱 전체 (5개 화면 그룹)

---

## 검토 문서 목록

| # | 화면 | 문서 |
|---|------|------|
| 1 | 인증 / 온보딩 / 설정(로그인) | [01-auth-onboarding.md](./01-auth-onboarding.md) |
| 2 | 멤버십 / 테마 상점 | [02-membership-shop.md](./02-membership-shop.md) |
| 3 | 보드(소셜) / 친구 | [03-board-social.md](./03-board-social.md) |
| 4 | 홈 / 루틴 / 할일 | [04-home-routine-todo.md](./04-home-routine-todo.md) |
| 5 | 통계 / 단식 | [05-stats-fasting.md](./05-stats-fasting.md) |

---

## 최우선 조치 항목 (출시 전 필수)

### 보안 — 치명적/높음

| 항목 | 화면 | 설명 |
|------|------|------|
| **Pro 상태 서버 검증** | 멤버십 | `isPro`가 AsyncStorage에만 저장, 조작 가능. 서버 검증 구조 필수 |
| **Pro 제한값 서버 강제** | 멤버십 | 보드/그룹 수 제한이 클라이언트에만 존재, API 우회 가능 |
| **OTP Rate Limit** | 인증 | 클라이언트 쿨다운 없음, 무제한 요청 가능 |

### 비용 — 즉시 절감 가능

| 항목 | 화면 | 설명 |
|------|------|------|
| **보드 데이터 중복 fetch** | 홈/보드 | 홈+보드 탭 이동 시 동일 API 중복 호출. stale-while-revalidate |
| **fetchMyBoards 병렬화** | 보드 | 보드별 순차 fetch → Promise.all로 병렬화 |
| **pullCloudToLocal 최적화** | 인증 | 로그인 시 8개 테이블 전체 pull → 범위 필터 + 증분 동기화 |

---

## 전체 발견 사항 — 우선순위별

### 즉시 (낮은 노력, 높은 효과)

1. OTP 60초 쿨다운 + 시도 횟수 제한 (보안)
2. `fetchMyBoards` 병렬화 (비용/속도)
3. `hasVerified` → Set 기반 O(1) 최적화 (속도)
4. 이미지 EXIF 메타데이터 제거 — `exif: false` (프라이버시)
5. `buildMonthGrassMap` useMemo 추가 (속도)
6. `Date.now()` ID → `expo-crypto` UUID (보안)
7. 자정 이후 날짜 갱신 로직 (UX)
8. 보드 이름 `maxLength={30}` (UX)
9. `deleteCloudRecord` 타입 안전성 (보안)

### 단기 (1~2주)

10. 닉네임 길이/문자 검증 (보안)
11. AuthProvider 딥링크 중복 제거 (속도)
12. 관리자 이메일 하드코딩 → 서버 조회 (보안)
13. 통계 store 구독 최적화 (비용)
14. OTP UX 개선 — 재전송, 자동 인증 (UX)
15. `insertSystemMessage` 타입 제한 (보안)
16. 소프트 삭제 보존 기간 400일 → 90~180일 (비용)
17. dragItems completions 의존성 분리 (속도)
18. ShareableGrassGrid 지연 마운트 (속도)

### 중기 (출시 후)

19. Pro 상태 서버 검증 + IAP 연동 (보안, 필수)
20. Pro 제한값 서버 트리거 강제 (보안, 필수)
21. push 증분 동기화 — dirty flag 추적 (비용)
22. 루틴/할일 공통 코드 추출 (유지보수)
23. 친구 progress batch API (비용)
24. 피드 무한 스크롤 (UX)
25. QR 초대 코드 도입 (보안)
26. 백그라운드 Realtime 해제 (비용)
27. 초대 코드 서버 생성 (보안)

---

## 아키텍처 관찰

### 잘된 점
- **SecureStore 청크 어댑터**: 하드웨어 보안을 포기하지 않으면서 토큰 저장 문제 해결
- **cloudSyncGuard**: Realtime echo 억제로 push/pull 중 무한 루프 방지
- **소프트 삭제**: 로컬 + 클라우드 동기화에서 데이터 무결성 보장
- **RPC 함수 활용**: 보드 CRUD에 서버 로직 캡슐화 (create_board, leave_board_v2 등)

### 구조적 리스크
- **클라이언트 신뢰 모델**: Pro 상태, 제한값, 초대 코드 생성이 모두 클라이언트에 의존. 출시 전 서버 검증으로 전환 필수
- **동기화 비효율**: 전체 push/pull 방식. 사용자/데이터 증가 시 비용 급증 예상
- **코드 중복**: 루틴/할일 화면의 그룹 드래그 로직이 사실상 복사본
