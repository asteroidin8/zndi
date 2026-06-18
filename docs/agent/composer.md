# Role

Git Manager

## Before processing

[planner.md](./planner.md) — confirm on **`origin/main`**, branch naming.

## Responsibilities

- Pre-merge validation
- Commit (minimal units)
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
2. **`git fetch origin`** · branch from latest `origin/main` if needed
3. **Pre-merge validation** (below) — fail → `BLOCKED`, stop
4. Stage only `files_changed` / `commit_groups` — exclude unrelated local files
5. **Split commits** per `commit_groups` or [Commit splitting](#commit-splitting-required)
6. Push · create PR (title = feature summary, Korean)
7. **[reviewer.md](./reviewer.md)** checklist (self-apply if no Reviewer agent)
8. **Squash merge** PR
9. Set handoff: `DONE` (+ optional `pr` number). If only part merged → `PARTIAL`

If status == `DONE`: do nothing.

If status == `BLOCKED`: do nothing until Implementation sets `READY` again.

## Pre-merge validation (required)

| Check | Fail action |
|-------|-------------|
| Every staged file ∈ `files_changed` or some `commit_groups[].files` | `BLOCKED` |
| No `.env`, secrets, `*.log`, `*.apk`, `node_modules/` | `BLOCKED` |
| Re-run `npx tsc --noEmit` (and `npm run lint` if quick) | `BLOCKED` if errors |
| `handoff_type: native` → PR body includes native checklist ([workflow.md](./workflow.md)) | add before merge |
| 2+ concerns in diff but no `commit_groups` | split commits anyway; note in PR |

Record failures in `handoff.json` → `blocked_reason`.

## Branch & PR naming

| Type | Branch | PR title |
|------|--------|------------|
| feature | `feat/settings-inline-controls` | `feat(settings): …` |
| fix | `fix/theme-dark-fallback` | `fix(theme): …` |
| docs | `docs/agent-workflow` | `docs: …` |
| chore | `chore/dev-client-config` | `chore: …` |

- lowercase, hyphen-separated slug
- PR title ≈ first commit or overall feature (one line, Korean)

## Merge

**Squash merge only** — aligns with `project-conventions.mdc`.

Do **not** use merge commit or rebase merge unless user explicitly requests.

## Commit splitting (required)

One commit = **one concern**. Split when any differ: **type**, **area**, **behavior**.

### Rules

- Prefer **`commit_groups`** from handoff when present.
- Review **actual diff**. Single theme (e.g. brand colors) → one commit OK.
- **Forbidden:** settings + auth + docs + `app.json` in one commit.
- **Unrelated unstaged files:** never add.
- **One PR, several commits:** OK for ordered steps; squash merges them on GitHub.

### Split example

```
commit 1  refactor(settings): profile/notifications 라우트 제거
commit 2  feat(settings): index 섹션 재구성
commit 3  fix(settings): 계정 카드 이중 SettingsList 제거
```

### When `commit_message` is too broad

Use split messages; document in PR body.
