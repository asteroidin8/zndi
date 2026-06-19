# Role

Implementation Engineer

## Before coding

[planner.md](./planner.md) checklist.

## Responsibilities

- Feature development
- Bug fixes
- Refactoring
- Tests
- **`task.md` 갱신** — 완료 항목 `[x]`, 진행 로그 1줄

## Forbidden

- git commit
- git push
- merge

## Completion

1. Run lint: `npx tsc --noEmit`, `npm run lint`
2. Run tests (if any)
3. Update **`task.md`** (각 task의 `task_md` 반영)
4. Write **`handoff.json`** at project root, `status: "READY"`

---

## handoff 작성 — `tasks[]` (기본)

한 handoff = **한 배치**. 로드맵에서 묶어 처리할 작업마다 **`tasks[]`에 블록 하나**.

### Batch-level

| Field | 작성 |
|-------|------|
| `batch_id` | slug (`v1.2-todo-groups`) |
| `branch_hint` | Composer용 (`feat/v1.2-todo-groups`) |
| `handoff_type` | `app` \| `native` |
| `tests` | tsc/lint 결과 |
| `shared_files` | `task.md` 등 여러 task가 공유하는 파일 |

### Task-level (각 작업마다)

| Field | 작성 |
|-------|------|
| `id` | `task.md` 항목과 1:1 (`v1.2-1`) |
| `title` | 한 줄 |
| `summary` | 무엇을 했는지 — diff와 1:1 대응 |
| `task_md` | `task.md` 체크 한 줄 |
| `files_changed` | **이 task가 건드린 모든 파일** (UI + store + sync + types) |
| `commit` | `{ "message", "files" }` — Composer 1 task = 1 commit |

### Rules

- **task 1개 = 관심사 1개** (feat / fix / refactor / area 구분)
- **store·sync·types** 는 UI task의 `files_changed`에 **반드시 포함** — Composer가 추측하지 않게
- 같은 파일을 두 task가 건드리면 → `depends_on`으로 순서 명시 · 가능하면 task 분리 재검토
- `commit.files` ⊆ `files_changed` · 누락 금지

### Example

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
      "summary": "GroupHeader, 인라인 생성, 그룹별 할일",
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
      "summary": "TodoModal/EditModal HomePinHeaderButton 제거",
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
    "task.md": "tasks[].task_md 반영"
  }
}
```

---

## Legacy flat (단일 task만)

**관심사 1개·파일 적을 때**만 root `files_changed` + `commit_groups` 허용.

2개 이상 관심사 → **`tasks[]` 필수** ([workflow.md](./workflow.md)).

See [workflow.md](./workflow.md) · [composer.md](./composer.md).
