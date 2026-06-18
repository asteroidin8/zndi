# Agent workflow

```
[planner.md] 작업 시작
        ↓
Implementation (claude.md)
        ↓
  handoff.json (READY)
        ↓
Git Manager (composer.md) — 검증 · 커밋 · PR
        ↓
Reviewer (reviewer.md) — merge 전 (선택·권장)
        ↓
  Squash merge
        ↓
  handoff.json (DONE | PARTIAL | BLOCKED)
```

## Docs location

`docs/agent/`

| 파일 | 역할 |
|------|------|
| [planner.md](./planner.md) | 작업 시작 체크리스트 |
| [claude.md](./claude.md) | Implementation |
| [composer.md](./composer.md) | Git Manager |
| [reviewer.md](./reviewer.md) | merge 전 read-only 검토 |
| [workflow.md](./workflow.md) | 이 문서 |

## handoff.json status

| status | 의미 | 다음 행동 |
|--------|------|-----------|
| `READY` | Composer 처리 대기 | composer.md |
| `DONE` | merge 완료 | 없음 |
| `BLOCKED` | merge 불가 | Implementation 수정 → `READY` |
| `PARTIAL` | 일부만 merge됨 | 남은 work 새 handoff |

## Schema (READY)

```json
{
  "status": "READY",
  "handoff_type": "app",
  "summary": ["..."],
  "files_changed": ["..."],
  "commit_groups": [
    { "message": "fix(theme): …", "files": ["src/hooks/useThemeColors.ts"] },
    { "message": "feat(settings): …", "files": ["app/settings/index.tsx"] }
  ],
  "tests": ["tsc --noEmit: 통과", "expo lint: 에러 0"],
  "commit_message": "feat(settings): …",
  "task_md_updates": ["Phase Settings: 인라인 segment 적용 [x]"]
}
```

### Fields

| Field | Required | Notes |
|-------|----------|-------|
| `handoff_type` | 권장 | `app` (default) \| `native` |
| `commit_groups` | **권장** | 관심사 2개 이상이면 **필수**. Composer 커밋 분리 기준 |
| `commit_message` | 예 | 단일 커밋일 때만 사용 |
| `task_md_updates` | 권장 | `task.md`에 반영할 체크·로그 (Implementation이 직접 수정) |
| `blocked_reason` | BLOCKED 시 | Reviewer/Composer가 작성 |

### handoff_type: native

`app.json`, 아이콘 에셋, `expo prebuild`, dev APK 등.

Composer PR body **필수 문구**:

```markdown
## Native / 기기
- [ ] 기존 dev client(routiner 등) 삭제
- [ ] 새 APK 설치 후 `npx expo start --dev-client`
- [ ] Metro URL `exp+zndi://` 확인
```

### DONE

```json
{ "status": "DONE", "pr": 123 }
```

### BLOCKED

```json
{
  "status": "BLOCKED",
  "blocked_reason": ["files_changed에 없는 app.json이 diff에 포함됨"],
  "pr": 123
}
```

### PARTIAL

```json
{
  "status": "PARTIAL",
  "merged_commits": ["fix(theme): …"],
  "remaining_summary": ["settings segment — 다음 handoff"],
  "pr": 123
}
```

## Git conventions

- **Branch:** `feat/scope-slug` · `fix/scope-slug` · `docs/slug` · `chore/slug`
- **PR 제목:** 첫 커밋 또는 feature 한 줄 (한국어)
- **Merge:** **Squash merge** only (`project-conventions.mdc`)

## Auto-trigger (Cursor hooks)

`.cursor/hooks.json` — Windows는 **`powershell -File`** 로 실행 (`.ps1` 직접 경로만으로는 실패할 수 있음).

| Hook | 시점 |
|------|------|
| `sessionStart` | 채팅/세션 시작 → `additional_context` |
| `postToolUse` | `handoff.json` Write/Edit/StrReplace 후 |
| `stop` | Implementation 턴 종료 → `followup_message` |

Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File ...` 필수.

### 자동 실행이 안 될 때

1. **Cursor Settings → Hooks** 활성화 여부 확인 (`hooks.json` 저장 후 **Cursor 재시작**)
2. **stop hook**은 Implementation **에이전트 턴이 끝날 때만** 동작 — handoff 파일만 저장하고 턴이 안 끝나면 follow-up 없음
3. **followup_message** = 다음 턴 **제안** — Always Allow / Auto-run 설정에 따라 수동 승인 필요할 수 있음
4. **새 채팅**을 열면 `sessionStart`만 동작 — 이전 세션 stop follow-up은 해당 세션에만 적용
5. **Output → Hooks** 채널에서 스크립트 실패(exit 1, cwd 오류) 확인
6. hook 실패 시: 에이전트 규칙(`agent-workflow.mdc`) — **매 턴 `handoff.json` 먼저 읽기**

세션 **시작**·**매 사용자 메시지** 시 `READY`면 Implementation 생략 → Composer 우선.
