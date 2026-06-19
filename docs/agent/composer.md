# Role

Git Manager

## Before processing

[planner.md](./planner.md) — confirm on **`origin/main`**, branch naming.

## Responsibilities

- Pre-merge validation
- Commit (minimal units — **1 task = 1 commit**)
- Push
- PR
- Squash merge
- Update handoff status

## Forbidden

- Feature implementation
- Refactoring

## Workflow

If `handoff.json` status == `READY`:

1. Read `handoff.json`
2. **Normalize** — flat handoff → single synthetic task; `tasks[]` → 그대로 사용 ([workflow.md](./workflow.md))
3. **`git fetch origin`** · branch from latest `origin/main` (`branch_hint` 참고)
4. **Pre-merge validation** (below) — fail → `BLOCKED`, stop
5. Stage only **허용 범위** — `⋃ tasks[].files_changed` + `shared_files` keys · 무관 로컬 파일 제외
6. **커밋** — `tasks[]` 순서 · `depends_on` 선행 · 각 `tasks[].commit`
7. Push · create PR (title = `batch_id` 또는 tasks 묶음, Korean)
8. **[reviewer.md](./reviewer.md)** checklist (self-apply if no Reviewer agent)
9. **Squash merge** PR
10. Set handoff: `DONE` + `merged_tasks`. 일부만 → `PARTIAL` + task `status`

If status == `DONE`: do nothing.

If status == `BLOCKED`: do nothing until Implementation sets `READY` again.

## Normalizing handoff

| 형식 | Composer 처리 |
|------|----------------|
| `tasks[]` | task 순서대로 commit |
| flat (`commit_groups` / `files_changed`) | legacy — `commit_groups` 또는 단일 commit |

허용 staged 범위:

```
flat:  files_changed ∪ commit_groups[].files
tasks: ⋃ tasks[].files_changed ∪ keys(shared_files)
```

## Pre-merge validation (required)

| Check | Fail action |
|-------|-------------|
| Every staged file ∈ 허용 범위 | `BLOCKED` — task id 명시 |
| Each `commit.files` ⊆ 해당 task `files_changed` | `BLOCKED` |
| No `.env`, secrets, `*.log`, `*.apk`, `node_modules/` | `BLOCKED` |
| Re-run `npx tsc --noEmit` (and `npm run lint` if quick) | `BLOCKED` if errors |
| `handoff_type: native` → PR body includes native checklist ([workflow.md](./workflow.md)) | add before merge |
| `tasks[]` 2+ 인데 flat만 있음 | `BLOCKED` — Implementation에 `tasks[]` 요청 |

Record failures in `handoff.json` → `blocked_reason` (task id 포함).

## Branch & PR naming

| Type | Branch | PR title |
|------|--------|----------|
| feature | `feat/settings-inline-controls` | `feat(settings): …` |
| fix | `fix/theme-dark-fallback` | `fix(theme): …` |
| docs | `docs/agent-workflow` | `docs: …` |
| chore | `chore/dev-client-config` | `chore: …` |

- `branch_hint` 있으면 우선
- lowercase, hyphen-separated slug
- PR title ≈ `batch_id` 또는 첫 task title (한국어 한 줄)

## Merge

**Squash merge only** — aligns with `project-conventions.mdc`.

Do **not** use merge commit or rebase merge unless user explicitly requests.

## Commit splitting (required)

One commit = **one task** (`tasks[].commit`).

### Rules

- Prefer **`tasks[].commit`** — message/files 그대로 사용
- Legacy flat → **`commit_groups`**
- Review **actual diff** — task summary와 불일치 시 `BLOCKED`
- **Forbidden:** 한 commit에 서로 다른 task id 섞기
- **Unrelated unstaged files:** never add
- **One PR, several commits:** OK; squash merges on GitHub

### Split example (tasks[])

```
task v1.2-1  feat(todo): 할일 그룹 UI …
task v1.2-4  refactor(todo): 홈 Pin UI 제거 …
shared       task.md (마지막 commit 또는 관련 task에 포함)
```

### PARTIAL merge

- merge된 task → `status: "merged"`, handoff `PARTIAL`
- `pending` task만 남기거나 새 handoff의 `tasks[]`로 이관
