# 작업 시작 (Planner)

Implementation·Composer **공통** — 세션/ handoff 처리 전에 확인한다.

## Checklist

1. **`task.md`** — P0 → P1 → P2 순서, 이번 작업이 로드맵과 맞는지
2. **`git fetch origin`** — 원격 최신화
3. **브랜치** — `origin/main`에서 분기 (`docs/agent/composer.md` 네이밍)
4. **관심사 1개** — 이번 handoff/PR에 넣을 범위를 한 문장으로 정의
5. **역할 문서** — 구현 → [claude.md](./claude.md) · Git → [composer.md](./composer.md) · merge 전 → [reviewer.md](./reviewer.md)

## Handoff 분리 기준

아래가 **2개 이상**이면 handoff(또는 `commit_groups`)를 **나눈다**:

- bug fix vs feature vs refactor vs docs
- area (settings / auth / home / native)
- JS/UI vs `app.json`·prebuild·APK

## Native 작업

`app.json` package/scheme/icon, `prebuild`, dev APK 재빌드 → `handoff_type: "native"` ([workflow.md](./workflow.md)).
