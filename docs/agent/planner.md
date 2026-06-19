# 작업 시작 (Planner)

Implementation·Composer **공통** — 세션/ handoff 처리 전에 확인한다.

## Checklist

1. **`task.md`** — P0 → P1 → P2 순서, 이번 작업이 로드맵과 맞는지
2. **`git fetch origin`** — 원격 최신화
3. **브랜치** — `origin/main`에서 분기 (`docs/agent/composer.md` 네이밍)
4. **배치 범위** — 이번 handoff `batch_id`를 한 문장으로 정의
5. **역할 문서** — 구현 → [claude.md](./claude.md) · Git → [composer.md](./composer.md) · merge 전 → [reviewer.md](./reviewer.md)

## Handoff 구조

| 상황 | handoff 형식 |
|------|----------------|
| 로드맵 항목 1개 | `tasks[]` 1개 (또는 legacy flat) |
| 로드맵 항목 2+ (같은 PR) | **`tasks[]` N개** — task마다 files/commit 분리 |
| 서로 다른 PR | handoff 배치를 나누거나 `batch_id` 분리 |

## Task 분리 기준

**task 1개**에 아래가 **2개 이상** 섞이면 `tasks[]`를 **쪼갠다**:

- bug fix vs feature vs refactor vs docs
- area (settings / auth / home / native)
- JS/UI vs `app.json`·prebuild·APK

같은 파일을 여러 task가 수정하면 `depends_on`으로 커밋 순서를 명시한다.

## Native 작업

`app.json` package/scheme/icon, `prebuild`, dev APK 재빌드 → `handoff_type: "native"` ([workflow.md](./workflow.md)).
