# 잔디 (zndi)

단식·루틴·할 일을 한곳에서 관리하는 React Native (Expo) 앱입니다.

## 개발

```bash
npm install
npm start
```

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm start` | Expo 개발 서버 |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeScript 검사 |
| `scripts/qa-p0.ps1` | P0 로컬 QA (tsc·에셋·bundle id) |

## 환경 변수

`.env.example`을 참고해 `.env` 또는 EAS Secrets에 설정합니다.

| 변수 | 설명 |
|------|------|
| `EXPO_PUBLIC_SENTRY_DSN` | (선택) Sentry DSN — 미설정 시 크래시 리포팅 비활성 |

## 스토어 에셋

`assets/` 폴더의 PNG 파일은 `assets/README.md`를 참고하세요.

## 개인정보

앱 내 **설정 → 개인정보처리방침**에서 확인할 수 있습니다. 모든 데이터는 기기 내부에만 저장됩니다.
