# Agent 워크플로

작업마다 **역할에 맞는 문서**를 연다.

## Flow

```
planner → claude → handoff(READY) → composer → reviewer → squash merge → DONE
```

## Docs

| 파일 | 역할 | 언제 |
|------|------|------|
| [planner.md](./planner.md) | 시작 체크리스트 | 세션·handoff 전 |
| [claude.md](./claude.md) | Implementation | 기능·버그·리팩터 |
| [composer.md](./composer.md) | Git Manager | `READY` handoff |
| [reviewer.md](./reviewer.md) | Read-only 검토 | merge 직전 |
| [workflow.md](./workflow.md) | status · schema · native | 참조 |

## handoff.json

- 위치: 프로젝트 루트 (Git 제외 — `.gitignore`)
- status: `READY` · `DONE` · `BLOCKED` · `PARTIAL`
- **`READY` 갱신 시:** `.cursor/hooks/check-handoff.ps1` → Git Manager 자동 follow-up

## Project

- 로드맵: `task.md`
- 코드 규칙: `.cursor/rules/project-conventions.mdc`
- Expo v56: https://docs.expo.dev/versions/v56.0.0/
