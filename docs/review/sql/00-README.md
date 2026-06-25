# Supabase SQL 마이그레이션

Supabase 대시보드 → SQL Editor에서 **순서대로** 실행하세요.

| 순서 | 파일 | 내용 |
|------|------|------|
| 1 | `01-admin-role.sql` | profiles에 role 컬럼 추가, `is_admin()`, `get_pro_status()` RPC |
| 2 | `02-board-limits-server.sql` | `app_limits` 테이블, 보드/그룹 제한 트리거, 초대코드 서버 생성 |

## 실행 후 클라이언트 변경

SQL 실행 후 앱 코드가 자동으로 새 RPC를 사용합니다:
- `CloudSyncBridge`: 하드코딩 이메일 → `get_pro_status()` RPC 조회
- `boardService.createBoard`: 클라이언트 제한 체크 유지 + 서버에서도 이중 체크
- `boardService.refreshInviteCode`: 서버에서 코드 생성 (클라이언트 생성 제거 가능)
