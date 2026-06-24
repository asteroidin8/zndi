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

## 시작 (매 세션)

1. [planner.md](./planner.md) checklist
2. 역할 문서:

| 역할 | 문서 |
|------|------|
| 구현 | [claude.md](./claude.md) |
| Git | [composer.md](./composer.md) |
| merge 전 검토 | [reviewer.md](./reviewer.md) |

**매 턴** `handoff.json`을 먼저 읽는다. `READY`이면 Composer부터. (hook 실패 시에도 동일)

## Docs location

`docs/agent/`

| 파일 | 역할 |
|------|------|
| [planner.md](./planner.md) | 작업 시작 체크리스트 |
| [claude.md](./claude.md) | Implementation |
| [composer.md](./composer.md) | Git Manager |
| [reviewer.md](./reviewer.md) | merge 전 read-only 검토 |
| [workflow.md](./workflow.md) | 이 문서 — status · schema · hooks |

## handoff.json status

| status | 의미 | 다음 행동 |
|--------|------|-----------|
| `READY` | Composer 처리 대기 | 검증 → **tasks[] 순 커밋** → PR → Reviewer → **squash merge** ([composer.md](./composer.md)) |
| `DONE` | merge 완료 | 없음 |
| `BLOCKED` | merge 불가 | Implementation 수정 → `READY` |
| `PARTIAL` | 일부 task만 merge | `pending` task 수정 또는 새 handoff |

## 필수 규칙

- **Implementation:** commit/push/merge 금지 · `task.md` 갱신 · handoff는 **`tasks[]`** (2+ 관심사) · task마다 `files_changed`+`commit`
- **Composer:** pre-merge validation · **1 task = 1 commit** · 무관 파일 제외 · **squash merge**
- **Reviewer:** read-only · FAIL → `BLOCKED` (task id)
- **`handoff_type: native`:** PR에 기기 재설치 체크리스트 (아래 § native)

---

## Schema — `tasks[]` (기본)

**한 handoff = 한 배치(batch)**. 실제 작업 단위는 **`tasks[]` 안에 각각** 기록한다.

```json
{
  "status": "READY",
  "handoff_type": "app",
  "batch_id": "v1.2-todo-groups",
  "branch_hint": "feat/v1.2-todo-groups",
  "tests": ["tsc --noEmit: 통과", "expo lint: 에러 0"],
  "tasks": [
    {
      "id": "v1.2-1",
      "title": "할일 그룹 UI",
      "summary": "GroupHeader, 인라인 그룹 생성, 그룹별 할일 표시",
      "task_md": "v1.2 #1: 할일 그룹 기능 [x]",
      "files_changed": [
        "app/(tabs)/todo.tsx",
        "src/stores/useTodoStore.ts",
        "src/hooks/useRealtimeSync.ts",
        "src/services/sync/cloudSync.ts"
      ],
      "commit": {
        "message": "feat(todo): 할일 그룹 UI — 생성/접기/이름변경/삭제",
        "files": [
          "app/(tabs)/todo.tsx",
          "src/stores/useTodoStore.ts",
          "src/hooks/useRealtimeSync.ts",
          "src/services/sync/cloudSync.ts"
        ]
      }
    },
    {
      "id": "v1.2-4",
      "title": "홈 Pin UI 제거",
      "summary": "TodoModal/EditModal HomePin 제거",
      "task_md": "v1.2 #4: 기존 홈 고정(Pin) 기능 제거 [x]",
      "files_changed": [
        "src/components/TodoModal.tsx",
        "src/components/TodoEditModal.tsx"
      ],
      "commit": {
        "message": "refactor(todo): 홈 고정(Pin) UI 제거 — 그룹 도입으로 대체",
        "files": [
          "src/components/TodoModal.tsx",
          "src/components/TodoEditModal.tsx"
        ]
      },
      "depends_on": ["v1.2-1"]
    }
  ],
  "shared_files": {
    "task.md": "tasks[].task_md 항목 반영 (Implementation이 직접 수정)"
  }
}
```

### Batch-level fields

| Field | Required | Notes |
|-------|----------|-------|
| `status` | **필수** | `READY` \| `DONE` \| `BLOCKED` \| `PARTIAL` |
| `handoff_type` | 권장 | `app` (default) \| `native` |
| `batch_id` | 권장 | 로드맵·PR 추적용 slug (`v1.2-todo-groups`) |
| `branch_hint` | 권장 | Composer 브랜치 힌트 |
| `tests` | 권장 | 배치 전체 검증 결과 |
| `tasks` | **필수** | 작업 단위 배열 (1개 이상) |
| `shared_files` | 선택 | 여러 task가 공유하는 파일 (`task.md` 등) |
| `blocked_reason` | BLOCKED 시 | Reviewer/Composer가 작성 |

### Task-level fields

| Field | Required | Notes |
|-------|----------|-------|
| `id` | **필수** | `task.md` 항목과 1:1 (`v1.2-1`, `settings-theme`) |
| `title` | **필수** | 한 줄 제목 |
| `summary` | **필수** | 무엇을 했는지 (Composer·Reviewer diff 대조용) |
| `task_md` | 권장 | `task.md`에 쓸 체크·로그 한 줄 |
| `files_changed` | **필수** | **이 task가 건드린 모든 파일** (store·sync 포함) |
| `commit` | **필수** | `{ "message", "files" }` — Composer 1 task = 1 commit |
| `depends_on` | 선택 | 선행 task `id` (커밋 순서) |
| `status` | PARTIAL 시 | `pending` \| `merged` \| `blocked` |

### Composer / Reviewer가 읽는 규칙

| 규칙 | 설명 |
|------|------|
| 허용 staged 범위 | `⋃ tasks[].files_changed` + `shared_files` 키 |
| 커밋 순서 | `tasks[]` 순서 · `depends_on` 있으면 선행 먼저 |
| 1 task = 1 commit | `tasks[].commit.message` / `commit.files` |
| 검증 | staged ⊆ 허용 범위 · 각 commit.files ⊆ 해당 task |

---

## Legacy flat (단일 task만)

**작업 1개·파일 적을 때**만 아래 flat 허용. **2개 이상 관심사면 `tasks[]` 필수.**

```json
{
  "status": "READY",
  "handoff_type": "app",
  "summary": ["..."],
  "files_changed": ["..."],
  "commit_groups": [
    { "message": "fix(theme): …", "files": ["src/hooks/useThemeColors.ts"] }
  ],
  "tests": ["tsc --noEmit: 통과"],
  "task_md_updates": ["Phase Settings: … [x]"]
}
```

Composer는 flat을 **tasks 1개짜리 handoff**로 취급한다.

---

### handoff_type: native

`app.json`, 아이콘 에셋, `expo prebuild`, dev APK 등 — batch 또는 해당 task에 표시.

Composer PR body **필수 문구**:

```markdown
## Native / 기기
- [ ] 기존 dev client(routiner 등) 삭제
- [ ] 새 APK 설치 후 `npx expo start --dev-client`
- [ ] Metro URL `exp+zndi://` 확인
```

### DONE

```json
{
  "status": "DONE",
  "pr": 122,
  "batch_id": "v1.2-todo-groups",
  "merged_tasks": ["v1.2-1", "v1.2-4"]
}
```

### BLOCKED

```json
{
  "status": "BLOCKED",
  "batch_id": "v1.2-todo-groups",
  "blocked_reason": ["v1.2-1: files_changed에 useTodoStore 누락"],
  "tasks": [
    { "id": "v1.2-1", "status": "blocked" },
    { "id": "v1.2-4", "status": "pending" }
  ]
}
```

### PARTIAL

```json
{
  "status": "PARTIAL",
  "pr": 122,
  "batch_id": "v1.2-todo-groups",
  "merged_tasks": ["v1.2-1"],
  "tasks": [
    { "id": "v1.2-1", "status": "merged" },
    { "id": "v1.2-4", "status": "pending", "summary": "Pin UI — 다음 handoff" }
  ]
}
```

---

## Git conventions

- **Branch:** `feat/scope-slug` · `fix/scope-slug` · `docs/slug` · `chore/slug`
- **PR 제목:** `batch_id` 또는 tasks title 묶음 (한국어 한 줄)
- **Merge:** **Squash merge** only (`.cursor/rules/project-conventions.mdc`)

## Auto-trigger (Cursor hooks)

`.cursor/hooks.json` — Windows는 **`powershell -File`** 로 실행 (`.ps1` 직접 경로만으로는 실패할 수 있음).

| Hook | 시점 |
|------|------|
| `sessionStart` | 채팅/세션 시작 → `additional_context` |
| `postToolUse` | `handoff.json` Write/Edit/StrReplace 후 |
| `stop` | Implementation 턴 종료 → `followup_message` |

| status | 동작 |
|--------|------|
| `READY` | Git Manager follow-up / context (완전 무인 실행은 Cursor 설정·턴 종료에 의존) |
| `DONE` / `BLOCKED` | 없음 |

Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File ...` 필수.

### 자동 실행이 안 될 때

1. **Cursor Settings → Hooks** 활성화 여부 확인 (`hooks.json` 저장 후 **Cursor 재시작**)
2. **stop hook**은 Implementation **에이전트 턴이 끝날 때만** 동작 — handoff 파일만 저장하고 턴이 안 끝나면 follow-up 없음
3. **followup_message** = 다음 턴 **제안** — Always Allow / Auto-run 설정에 따라 수동 승인 필요할 수 있음
4. **새 채팅**을 열면 `sessionStart`만 동작 — 이전 세션 stop follow-up은 해당 세션에만 적용
5. **Output → Hooks** 채널에서 스크립트 실패(exit 1, cwd 오류) 확인
6. hook 실패 시: **매 턴 `handoff.json` 먼저 읽기** (위 § 시작)

세션 **시작**·**매 사용자 메시지** 시 `READY`면 Implementation 생략 → Composer 우선.
