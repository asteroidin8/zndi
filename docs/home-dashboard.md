# 홈 대시보드 UI — zndi (잔디)

> `docs/design-system.md` · `docs/copy-guide.md`

## 홈 탭 = 오늘 요약

1. **TopBar** — 잔디 심볼(0일) / 🔥 연속(1일+) · zndi(중앙) · 설정
2. **단식 카드**
3. **DailySummaryRow** — 오늘의 루틴 · 오늘의 할 일
4. **이번 주 잔디** — 7칸 (맨 아래)

## 통계 탭 = 회고

1. **Bento** — 연속 · 이번 달 · 달성률
2. 단식·루틴·할일 요약 카드
3. **월간 잔디** — 캘린더 셀 색 농도 (루틴·할일 완료량)

## 컴포넌트

| 파일 | 탭 |
|------|-----|
| `HomeTopBar` · `DailySummaryRow` · `HomeWeeklyGrass` | 잔디 |
| `StatsBentoStats` · `MonthGrid`(stats.tsx) | 통계 |
