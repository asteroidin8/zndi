# Sentry (선택)

1. [sentry.io](https://sentry.io)에서 React Native 프로젝트 생성
2. DSN 복사 → `.env`에 추가:

```env
EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

3. Metro 재시작 — `src/utils/sentry.ts`의 `initSentry()`가 `_layout`에서 자동 호출

DSN 없으면 Sentry는 비활성(크래시만 로컬 로그).
