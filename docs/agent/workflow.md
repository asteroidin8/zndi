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

## Auto-trigger (Cursor hook)

`.cursor/hooks.json` — Windows는 **`powershell -File`** 로 실행 (`.ps1` 직접 경로만으로는 실패할 수 있음).

| Event | 동작 |
|-------|------|
| `sessionStart` | 채팅 시작 시 `READY` → Git Manager 안내 주입 |
| `postToolUse` (Write) | `handoff.json` 저장 직후 컨텍스트 주입 |
| `stop` | 턴 종료 시 `READY` → **followup_message**로 Composer 자동 실행 |

**자동 실행이 안 될 때**

1. Cursor **Settings → Hooks** 에서 hook 로드 확인 (저장 후 **Cursor 재시작**)
2. `stop` hook은 **에이전트 턴이 끝날 때만** 동작 — handoff만 저장하고 채팅을 닫으면 follow-up 없을 수 있음
3. Implementation이 **다른 채팅/외부**에서 handoff를 쓰면, **새 메시지** 또는 `sessionStart`로 처리
4. Hooks **Output** 채널에서 스크립트 오류 확인

세션 **시작** 시에도 `handoff.json`을 먼저 읽고, `READY`면 Implementation 생략 → Composer 우선.
