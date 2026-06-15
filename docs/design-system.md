# zndi (잔디) 디자인 시스템 — Routiner 매핑

> **브랜드:** 10~20대 갓생러 타겟 · 영크크 감성 미니멀 · **극강 다크모드** · GitHub 잔디식 성취감(회색 → 네온 그린)  
> **스택:** Expo Router + React Native (Compose/Kotlin **아님** — 아래 표는 1:1 대응 참고용)

## 컬러 팔레트

| 토큰 | Hex | 용도 |
|------|-----|------|
| Background / Surface | `#121212` | 앱 배경 |
| Primary | `#22C55E` | 메인 포인트(완료·CTA·토글 ON) |
| Accent | `#4ADE80` | 보조 강조·아웃라인 |
| Surface Container | `#1E1E1E` | 카드·설정 리스트 |
| Surface Container High | `#2A2A2A` | 뮤트 surface |
| Text | `#F1F5F9` | 본문 |

## Compose → Expo/RN 파일 매핑

| Compose (zndi 네이티브) | Routiner (현재) |
|---------------------------|-----------------|
| `core/designsystem/theme/Theme.kt` → `ZndiTheme` | `src/constants/colors.ts` + `src/hooks/useThemeColors.ts` |
| `MaterialTheme.colorScheme.primary` | `colors.dark.primary` |
| `surfaceContainer` | `colors.dark.surfaceSubtle` |
| `SettingCard.kt` | `src/components/Card.tsx` + `SettingSection` / `SettingsList` |
| `SettingRootScreen.kt` | `app/settings.tsx` + `src/components/settings/*` |
| `AlarmSettingContent` | 설정 알림 토글 섹션 (`SettingToggleRow`) |
| 클라우드 동기화 카드 | `SettingAccountSection` |

## UI 원칙 (RN)

1. **테마:** `useThemeColors()`만 사용 — `#121212` 등 하드코딩 금지
2. **다크 기본:** `useSettingsStore.themeMode` 기본값 `dark` (시스템/라이트 선택 가능)
3. **잔디 성취감:** 루틴·할일 완료 체크, 통계 월간 그리드 → `primary` (#22C55E)
4. **설정 카드:** `Card` + `radius.xl`(20dp급) + `surfaceSubtle` 배경
5. **Scaffold:** 화면별 `SafeAreaView` + `ScrollView` + `padding: spacing.screen`

## 클라우드 동기화 UX 문구

| 사용자 표현 | 실제 동작 |
|-------------|-----------|
| 자동 백업 / 자동 동기화 | 로그인 + 토글 ON 시 로컬 변경 → Supabase debounce push |
| 수동 백업·복원 | 설정 버튼으로 즉시 push/pull |
| Supabase DB 스냅샷 | Pro 플랜 기능 — **앱에서 제공하지 않음** |

## 향후 (Phase 1)

- [ ] 통계 탭 전용 GitHub-style contribution grid
- [ ] 라이트 테마 zndi 그린 톤 정리
- [ ] 타이포 스케일(titleLarge 24sp 등) `AppText` variant 확장
