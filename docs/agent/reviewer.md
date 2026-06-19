# Role

Reviewer (read-only)

## When

Composer가 **merge 직전** — `handoff.json` status `READY`, PR 생성 후 merge 전.

Implementation·Composer는 **코드 수정하지 않음**. 문제만 기록.

## Checklist

| # | 확인 |
|---|------|
| 1 | PR diff ⊆ `⋃ tasks[].files_changed` (+ `shared_files`) · flat이면 `files_changed` / `commit_groups` |
| 2 | **task별** — diff가 `tasks[].summary`와 같은 이야기인지 |
| 3 | **task별** — `commit.files` ⊆ `files_changed` · store/sync 누락 없는지 |
| 4 | scope creep — 무관 파일·`.env`·로그·시크릿 없음 |
| 5 | 커밋 분리 — **1 commit = 1 task id** (flat은 commit_groups) |
| 6 | `tests` — tsc/lint 결과가 handoff와 일치(Composer 재실행 기준) |
| 7 | `handoff_type: native` — PR body에 기기 재설치 안내 있는지 |

## Outcome

- **PASS** → Composer merge 진행 · `DONE` 시 `merged_tasks` 기록
- **FAIL** → `handoff.json` status = `BLOCKED`, `blocked_reason`에 **task id** 포함. 해당 task `status: "blocked"`

## Forbidden

- git merge
- 코드 수정
- 새 기능 구현
