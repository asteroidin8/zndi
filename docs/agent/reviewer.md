# Role

Reviewer (read-only)

## When

Composer가 **merge 직전** — `handoff.json` status `READY`, PR 생성 후 merge 전.

Implementation·Composer는 **코드 수정하지 않음**. 문제만 기록.

## Checklist

| # | 확인 |
|---|------|
| 1 | PR diff ⊆ `files_changed` (+ `commit_groups` 각 그룹) |
| 2 | summary와 diff가 같은 이야기인지 |
| 3 | scope creep — 무관 파일·`.env`·로그·시크릿 없음 |
| 4 | 커밋 분리 — 관심사가 섞이지 않았는지 |
| 5 | `tests` — tsc/lint 결과가 handoff와 일치(Composer 재실행 기준) |
| 6 | `handoff_type: native` — PR body에 기기 재설치 안내 있는지 |

## Outcome

- **PASS** → Composer merge 진행
- **FAIL** → `handoff.json` status = `BLOCKED`, `blocked_reason` 배열에 항목 기록. Implementation이 수정 후 다시 `READY`

## Forbidden

- git merge
- 코드 수정
- 새 기능 구현
