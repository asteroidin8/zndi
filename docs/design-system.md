# zndi (잔디) 디자인 시스템

> **브랜드:** 10~20대 갓생러 타겟 · 영크크 감성 미니멀 · **극강 다크모드** · GitHub 잔디식 성취감(회색 → 네온 그린)  
> **스택:** Expo Router + React Native

## 컬러 팔레트

| 토큰 | Hex | 용도 |
|------|-----|------|
| Background / Surface | `#121212` | 앱 배경 |
| Primary | `#22C55E` | 메인 포인트(완료·CTA·토글 ON) |
| Accent | `#4ADE80` | 보조 강조·아웃라인 |
| Surface Container | `#1E1E1E` | 카드·설정 리스트 |
| Surface Container High | `#2A2A2A` | 뮤트 surface |
| Text | `#F1F5F9` | 본문 |

## Expo/RN 파일 매핑

| 역할 | 경로 |
|------|------|
| 테마 토큰 | `src/constants/colors.ts` + `src/hooks/useThemeColors.ts` |
| Primary | `colors.dark.primary` |
| surfaceContainer | `colors.dark.surfaceSubtle` |
| 설정 카드 | `src/components/Card.tsx` + `SettingSection` |
| 설정 화면 | `app/settings.tsx` + `src/components/settings/*` |
| 클라우드 동기화 | `SettingAccountSection` |

## UI 원칙 (RN)

1. **테마:** `useThemeColors()`만 사용 — `#121212` 등 하드코딩 금지
2. **다크 기본:** `useSettingsStore.themeMode` 기본값 `dark`
3. **잔디 성취감:** 루틴·할일 완료 체크, 통계 월간 그리드 → `primary` (#22C55E)
4. **설정 카드:** `Card` + `radius.xl`(20dp급) + `surfaceSubtle` 배경

## 클라우드 UX (설정)

| 사용자 행동 | 동작 |
|-------------|------|
| 로그인 안 함 | 로컬만 (암묵적) |
| 로그인 | 자동 sync 항상 ON — 설정 토글 없음 |
| 문제 시 | 설정 → **클라우드 데이터로 덮어쓰기** (안전장치) |

## 앱 식별자

| 항목 | 값 |
|------|-----|
| 표시명 | 잔디 |
| slug / scheme | `zndi` |
| Android package | `com.asteroidin8.zndi` |
| OAuth redirect | `zndi://auth/callback` |
