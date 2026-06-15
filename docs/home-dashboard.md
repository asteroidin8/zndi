# 홈 대시보드 UI — zndi (잔디)

> `docs/design-system.md` 토큰 기준 · Expo Router `app/(tabs)/index.tsx`

## 레이아웃 (Top → Bottom)

1. **TopBar** — zndi · 오늘 날짜 · 스트릭 · 설정
2. **ContributionGrid** — 7×6 GitHub 스타일 (최근 ~42일)
3. **Today** — 오늘 루틴 카드 + 완료 애니메이션
4. **Bento** — Streak / 이번 달 완료일 / 완료율
5. **FastingCard** — 단식 (보조)

## ContributionGrid

| 상태 | 색 |
|------|-----|
| 루틴 없음 | 투명 |
| 미완료 | `#1E1E1E` |
| 부분 완료 | `#4ADE80` @ 50% |
| 전체 완료 | `#22C55E` + glow |
| 오늘 | border + scale 1.12 |

## Empty

루틴·완료 기록 거의 없음 → 「아직 잔디가 없네요 🌱 오늘부터 시작해볼까요?」

## 컴포넌트

| 파일 | 역할 |
|------|------|
| `src/utils/contributionGrid.ts` | 그리드·월간 통계 |
| `src/components/ContributionGrid.tsx` | 잔디 그리드 |
| `src/components/home/HomeTopBar.tsx` | 상단 바 |
| `src/components/home/HomeTodayRoutines.tsx` | 오늘 루틴 |
| `src/components/home/HomeBentoStats.tsx` | 요약 카드 |
