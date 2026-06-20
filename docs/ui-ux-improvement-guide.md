# zndi UI/UX 개선 가이드

> **작성일**: 2026-06-20  
> **대상**: zndi v1.2 기준 (리팩토링 + QA 완료 후)  
> **목적**: 앱 아이덴티티에 기반한 전체 UI/UX 개선 방향 제시

---

## 앱 아이덴티티 요약

| 항목 | 내용 |
|------|------|
| 타겟 | 10~20대 갓생러 (자기계발 중심 Gen-Z) |
| 포지셔닝 | GitHub 잔디 문화 × 루틴/습관 트래킹 |
| 브랜드 키워드 | 극강의 미니멀리즘 · 다크모드 성취감 · Neon Grass Green |
| 핵심 컬러 | Deep Matte Black `#121212` + Neon Grass Green `#22C55E` |
| UX 원칙 | 제자리 행동 · 잔디 퍼스트 · 즉시 피드백 · 부드러운 게이미피케이션 |

---

## 1. 잔디 시각 언어 강화

### 1-1. 홈 주간 잔디 → 인터랙티브 셀

**현재**: 7칸 정적 표시. `full` / `partial` / `empty` / `none` 4단계.

**개선안**:
- 셀 탭 시 해당 날짜의 루틴 완료 상황을 툴팁(말풍선)으로 표시
  - 예: "영어 단어 ✓ · 독서 ✗ · 운동 ✓"
- 전부 완료(`full`) 셀에 미세한 pulse 애니메이션 추가 (Reanimated `withRepeat` + `withSequence`, scale 1.0→1.08→1.0, duration 2s)
- GitHub 스타일 4단계 opacity 도입: 현재는 `full`/`partial` 2단계만 사용 → `partial`을 25%/50%/75% 세분화

**구현 포인트**:
```
HomeWeeklyGrass.tsx — 셀 Pressable 래핑 + 툴팁 상태 관리
calendarGrass.ts — getWeekDayDots에 완료 비율(ratio) 반환 추가
```

### 1-2. 잔디 달력 셀 탭 피드백

**현재**: `StatsMonthGrid`에서 셀 탭 → `StatsDayDetailModal` 표시. 탭 시 시각적 피드백 없음.

**개선안**:
- 셀 탭 시 scale spring (0.9 → 1.0) + 네온 글로우 flash 효과
- 선택된 날짜 셀에 `accent` 컬러 테두리 유지 (모달 열린 동안)

### 1-3. 잔디 성장 애니메이션

**현재**: 체크 완료 → 잔디 색상 즉시 변경. 시각적 전환이 밋밋함.

**개선안**:
- 루틴/할일 체크 완료 시 해당 잔디 셀이 "자라는" 느낌의 마이크로 애니메이션
  - 셀 scale 0 → 1 spring (damping: 12, stiffness: 150)
  - 동시에 opacity 0 → 1 fade
  - 네온 글로우가 순간적으로 `strong`으로 전환 후 `soft`로 감쇠
- 모든 루틴 완료 시 주간 잔디 전체에 순차적 글로우 리플 (셀 0 → 셀 6, 각 50ms 딜레이)

---

## 2. 오늘 탭 밀도 및 계층 개선

### 2-1. 시간대별 인사말

**현재**: `HomeTopBar`에 "zndi" 텍스트만 표시.

**개선안**:
- 시간대별 인사말을 주간 잔디 섹션 상단에 배치
  - 새벽(0-5): "늦은 밤이에요"
  - 아침(6-11): "좋은 아침이에요"
  - 오후(12-17): "좋은 오후예요"
  - 저녁(18-23): "오늘도 수고했어요"
- `AppText variant="caption" tone="tertiary"` — 존재감 최소화, 공간 소비 없음 (기존 "이번 주 잔디" 헤더 옆)
- `dateFormat.ts`의 `getTimeGreeting()` 이미 존재 → 재활용

### 2-2. DailySummaryRow 카드 분리 강화

**현재**: 루틴 카드와 할일 카드가 같은 `gap: spacing.md(12)` 간격. 시각적 구분 약함.

**개선안**:
- 두 카드 사이 간격을 `spacing.section(24)`으로 확대
- 각 카드 헤더에 아이콘 추가: 루틴 → `CheckSquare`, 할일 → `ListTodo` (탭바 아이콘과 일치시켜 학습 부담 감소)
- "오늘 잔디 완료 ✓" 상태일 때 카드 전체에 `glow="soft"` 적용 → 성취감 시각화

### 2-3. 전체 완료 시 축하 마이크로인터랙션

**현재**: 모든 루틴+할일 완료 시 텍스트만 변경 ("오늘 잔디 완료 ✓").

**개선안**:
- 마지막 항목 체크 시 confetti-like 파티클 대신 "잔디 폭발" 효과
  - 주간 잔디 전체가 동시에 scale pulse (1.0 → 1.15 → 1.0)
  - 스트릭 카운터 숫자 bounce
  - `feedbackSuccess()` 햅틱 트리거
- 전체 완료 카드를 `Card glow="strong"`으로 변경

---

## 3. 단식 카드 UX 개선

### 3-1. 프로그레스 바 시각 강화

**현재**: `FastingTimer`의 프로그레스 바가 4px 높이 (`size.progressBar`). 시각적 존재감 약함.

**개선안**:
- 높이를 6~8px로 증가 (`size.progressBar` 토큰 업데이트 또는 로컬 오버라이드)
- 프로그레스 바 끝부분에 글로우 dot (현재 진행 위치 표시)
  - `position: absolute` + `left: ${progress * 100}%` 위치에 10px 원형, neonGlow 색상, 글로우 쉐도우
- 부스터 모드(목표 초과)에서 프로그레스 바 색상이 `c.booster`(빨간색)로 부드럽게 전환되는 gradient 효과

### 3-2. 시작 프리셋 UX

**현재**: `FastingGoalPicker`에서 12/16/18/24h 프리셋 → WheelPicker로 커스텀 선택.

**개선안**:
- 프리셋 버튼에 각 시간의 의미를 한 줄로 표시
  - 12h: "기본 단식"
  - 16h: "16:8 인기"  
  - 18h: "케토시스"
  - 24h: "풀 데이"
- 가장 자주 사용하는 프리셋에 `primary` 테두리 강조 (사용 빈도 기반, `useFastingStore`의 `records`에서 계산)

### 3-3. 단식 카드 idle 상태 개선

**현재**: idle 시 "단식 · 16h · 시작 →" 한 줄 컴팩트.

**개선안**:
- 마지막 단식 기록 요약을 subtly 표시
  - "마지막 단식: 어제 16h 완료" (caption, tertiary tone)
- 오랫동안 단식을 안 했을 때 (7일+) 부드러운 넛지
  - "잔디가 기다리고 있어요" (브랜드 톤 유지, 부담 없는 표현)

---

## 4. 루틴 탭 개선

### 4-1. 오늘/기타 루틴 구분 강화

**현재**: "오늘의 루틴"과 "기타" 섹션이 `SectionHeader` 바 + 리스트로 구분.

**개선안**:
- "오늘의 루틴" 섹션에 완료율 원형 인디케이터 추가 (SectionHeader 우측)
  - 작은 circle progress (16px), `primary` 색상, stroke 기반
  - "3/5" 텍스트는 기존 유지
- 완료된 루틴 항목의 텍스트에 취소선(line-through) + opacity 0.72 적용
- "기타" 섹션은 기본 접힘 처리 (탭하면 펼침) → 화면 밀도 감소

### 4-2. 루틴 순서 변경 피드백

**현재**: `DraggableFlatList`로 드래그 가능. `ScaleDecorator`로 scale 피드백 제공.

**개선안**:
- 드래그 중 아이템에 `neonGlowShadow('soft')` 적용 → 부유감 강화
- 드래그 시작 시 `feedbackTabSwitch()` 대신 더 강한 `Haptics.impactAsync(Medium)` 사용
- 드래그 완료 위치에 순간 글로우 flash

---

## 5. 할일 탭 개선

### 5-1. 그룹 헤더 시각 개선

**현재**: 그룹 이름 + 진행률 (`GrassBar` 컴포넌트).

**개선안**:
- 그룹 헤더에 접기/펼치기 아이콘(ChevronDown/ChevronRight) 회전 애니메이션
  - `Animated.View` + `withTiming` rotation 0→90deg
- 그룹 전체 완료 시 그룹 헤더에 글로우 효과 + "✓" 표시
- `GrassBar`의 잔디 셀에 완료 시 pulse 마이크로 애니메이션

### 5-2. 우선순위 필터링

**현재**: active/completed 탭 필터만 존재.

**개선안**:
- 우선순위 섹션 헤더(높음/보통/낮음)를 탭하면 해당 우선순위만 필터링
- 필터 활성 시 헤더에 `primary` 밑줄 + 다른 섹션 fade (opacity.partial)

### 5-3. 할일 완료 애니메이션

**현재**: `CompletionCheckbox`의 spring 스케일 + `AnimatedListItem`의 FadeOutUp.

**개선안**:
- 완료 시 체크박스에서 잔디색 파티클이 주간 잔디 방향으로 날아가는 효과 (선택적, 고급)
- 대안 (경량): 완료 시 리스트 아이템 전체에 좌→우 녹색 wash 효과 (200ms) 후 FadeOutUp

---

## 6. 잔디 탭 (통계) 개선

### 6-1. Bento 카드 인터랙션

**현재**: `StatsBentoStats` 3카드가 정적 수치만 표시.

**개선안**:
- 각 카드 탭 시 상세 정보 표시 (하단에 슬라이드 인)
  - 연속 → "최장 기록: X일 (Y/M/D)" 
  - 이번 달 → "지난 달: X일"
  - 달성률 → "지난 주: X%"
- 글로우 조건 충족 카드에 미세한 pulse 애니메이션 (scale 1.0 → 1.02 → 1.0, 3s 주기)

### 6-2. 잔디 달력 히트맵 레전드

**현재**: 잔디 달력에 색상 강도 의미를 설명하는 레전드 없음. 힌트 텍스트만 존재.

**개선안**:
- 달력 하단에 GitHub 스타일 레전드 바 추가
  ```
  적음  □ ■ ■ ■ ■  많음
        20% 40% 65% 100%
  ```
- `AppText variant="caption" tone="disabled"` 크기로 최소한의 공간 사용
- 첫 방문 시만 표시, 이후 접기 가능 (`useSettingsStore.seenHints.grassLegend`)

### 6-3. 주간 차트 개선

**현재**: `BarChart`가 지난 7일 단식 시간만 표시.

**개선안**:
- 차트 상단에 세그먼트 컨트롤 추가: "단식" | "루틴" | "할일"
  - 단식: 기존 (시간 단위)
  - 루틴: 완료 개수 / 전체 비율
  - 할일: 완료 개수
- 차트 바에 탭 인터랙션 추가: 바 탭 시 해당 날짜 수치를 바 위에 말풍선으로 표시

---

## 7. 마이 화면 개선

### 7-1. 프로필 영역 강화

**현재**: 이메일 + "X일 연속 · Y잔디" 한 줄 통계.

**개선안**:
- 닉네임을 이메일 위에 크게 표시 (`variant="title"`)
- 이메일은 닉네임 아래 작게 (`variant="caption" tone="tertiary"`)
- 잔디 레벨 뱃지 표시: "Lv.3 잔디밭" + 레벨 아이콘
  - 레벨별 아이콘: 새싹🌱, 풀잎🌿, 잔디밭🏕️, 정원🌳, 숲🌲, 생태계🌍
- 다음 레벨까지 남은 잔디 수 프로그레스 바
  - "잔디밭까지 42잔디 남았어요" (caption)

### 7-2. 설정 카드 접근성

**현재**: 설정 카드의 Row 컴포넌트가 `minHeight: 48`로 터치 영역 확보.

**개선안**:
- Row 아이콘 (좌측)을 추가하여 시각적 스캔 속도 향상
  - 신체 정보 → `User` 아이콘
  - 테마 → `Moon` / `Sun` 아이콘
  - 알림 → `Bell` 아이콘
  - 앱 정보 → `Info` 아이콘
- 로그아웃 / 데이터 초기화의 위험 카드에 `danger` 컬러 좌측 바 (3px, SectionHeader 'bar' 스타일 응용)

---

## 8. 인터랙션 패턴 통일

### 8-1. 스와이프 액션 시각 개선

**현재**: `SwipeActions`에서 삭제(왼쪽 스와이프)는 `c.ink` 배경, 완료(오른쪽)는 `c.primary` 배경. 삭제가 ink(흰색/밝은색)이라 의미 전달 약함.

**개선안**:
- 삭제 배경색을 `c.danger`로 변경 → 빨간색으로 위험 행동 명시
- 아이콘 추가: 삭제 → `Trash2`, 완료 → `Check`
- 텍스트 + 아이콘 수직 배치로 의미 강화

### 8-2. 모달 진입 애니메이션 통일

**현재**: `SheetModal`이 `withTiming` slide-up (260ms 진입, 200ms 퇴장).

**개선안**:
- 모든 모달에 backdrop blur 효과 추가 (현재 반투명 검은 오버레이만 사용)
  - `expo-blur`의 `BlurView` 활용 또는 `backgroundColor: 'rgba(0,0,0,0.6)'` 유지
- 모달 내부 콘텐츠에 stagger 진입 애니메이션 (FadeInUp, 각 섹션 30ms 딜레이)

### 8-3. 빈 상태(Empty State) 개선

**현재**: `EmptyState` + `EmptyIllustration`으로 일러스트 + 메시지 + 액션 링크.

**개선안**:
- 빈 상태 일러스트를 Lottie 애니메이션으로 교체 (씨앗이 자라는 잔디 모션)
- 첫 사용자 온보딩과 연결: "첫 번째 루틴을 심어볼까요?" CTA 버튼

---

## 9. 접근성 (Accessibility)

### 9-1. 현재 상태 (양호)

이미 구현된 접근성 기능:
- `accessibilityRole` ("tab", "button", "checkbox") 전반 적용
- `accessibilityState` ({ selected, checked }) 적용
- `accessibilityLabel` 한국어 텍스트 제공
- `accessibilityHint` 스와이프 액션에 적용
- `hitSlop` 12+ 적용

### 9-2. 추가 개선

- **Dynamic Type 지원**: `AppText`의 fontSize를 `PixelRatio.getFontScale()` 기반으로 스케일링
- **Reduce Motion 지원**: `useReducedMotion()` 훅으로 애니메이션 비활성화 옵션
  - pulse, glow, stagger 애니메이션을 조건부 비활성화
  - `LayoutAnimation` 호출을 조건부로 분기
- **색상 대비**: `inkTertiary`(`#94A3B8`)의 `#121212` 배경 위 대비율이 4.8:1 → WCAG AA 통과하지만 AAA(7:1) 미달. `#A0AEC0`으로 올리면 5.6:1

---

## 10. 디자인 토큰 확장

### 10-1. 타이포그래피 토큰

**현재**: `AppText`에 variant/tone 시스템이 있지만 컴포넌트 레벨에서만 관리.

**개선안** — `src/constants/typography.ts` 신설:
```typescript
export const typography = {
  display:  { fontSize: 48, fontWeight: '300', letterSpacing: -1 },
  headline: { fontSize: 28, fontWeight: '600', lineHeight: 36 },
  title:    { fontSize: 20, fontWeight: '600' },
  body:     { fontSize: 15, fontWeight: '400' },
  caption:  { fontSize: 12, fontWeight: '400' },
  mono:     { fontSize: 15, fontWeight: '400', fontVariant: ['tabular-nums'] },
  stat:     { fontSize: 22, fontWeight: '800', letterSpacing: -1 },
  timer:    { fontSize: 62, fontWeight: '700', letterSpacing: -3 },
} as const;
```
- `AppText` 내부에서 이 토큰 참조 → 일관성 보장
- 디자인 변경 시 단일 파일 수정으로 전체 반영

### 10-2. 애니메이션 토큰

**현재**: 애니메이션 파라미터가 각 컴포넌트에 하드코딩.

**개선안** — `src/constants/motion.ts` 신설:
```typescript
export const motion = {
  spring: {
    gentle:  { damping: 18, stiffness: 120 },
    bouncy:  { damping: 12, stiffness: 150 },
    stiff:   { damping: 20, stiffness: 200 },
  },
  duration: {
    fast:    150,
    normal:  250,
    slow:    400,
  },
  stagger: {
    list:    40,
    maxDelay: 200,
  },
} as const;
```

### 10-3. 그림자 토큰 확장

**현재**: `neonGlowShadow(soft/strong)` + `grassGlowShadow` 3종.

**개선안**: 일반 elevation 쉐도우 추가 (비글로우 용도):
```typescript
export function elevationShadow(level: 1 | 2 | 3): ViewStyle {
  // level 1: subtle card lift
  // level 2: floating element
  // level 3: modal/overlay
}
```

---

## 11. 성능 관련 UX

### 11-1. 스켈레톤 로딩 확장

**현재**: `StatsSummarySkeleton`만 존재 (잔디 탭 통계 카드용).

**개선안**:
- 홈 화면 전체 스켈레톤 (WeeklyGrass + FastingCard + DailySummary 형태)
- 루틴/할일 리스트 스켈레톤
- `Skeleton` 컴포넌트의 shimmer 색상을 `surfaceMuted` → `surfaceSubtle`로 순환하는 애니메이션 추가

### 11-2. 리스트 최적화

**현재**: 루틴/할일 리스트가 `DraggableFlatList` 사용.

**개선안**:
- 할일이 50개 이상일 때 `windowSize` prop 조절 (기본 21 → 11)
- 그룹 접기 시 접힌 항목을 렌더 트리에서 완전 제거 (조건부 렌더링)

---

## 12. 라이트 모드 개선

### 12-1. 현재 문제

다크모드가 "히어로 테마"로 설계되어 라이트모드가 상대적으로 밋밋함:
- 네온 글로우 효과가 라이트에서 거의 안 보임 (`neonGlow: '#4ADE80'`가 흰 배경에서 미약)
- `primaryContainer`가 dark에서는 `#4ADE80`이지만 light에서는 `#22C55E`와 동일

### 12-2. 개선안

- 라이트 모드 전용 글로우 색상 조정: `neonGlow: '#16A34A'` (더 진한 그린으로 대비 확보)
- 잔디 셀 라이트 모드: 배경을 `surfaceSubtle` 대신 `#E8F5E9` (연한 녹색 톤) 사용
- 카드 그림자를 neutral 쉐도우로 대체 (라이트에서 네온 글로우 대신):
  ```
  light 모드: shadowColor: '#000', shadowOpacity: 0.08
  dark 모드: 기존 neonGlow 유지
  ```
- `border` 토큰: light의 `#e5e5e5`가 `surfaceSubtle(#f5f5f5)` 위에서 대비 부족 → `#d4d4d4`로 조정

---

## 13. 온보딩 플로우 개선

### 13-1. 현재 상태

`ONBOARDING` copy가 존재하지만 온보딩 화면의 구현 수준 미확인.

### 13-2. 개선안

- 3스텝 온보딩 (기존 유지) + 인터랙티브 요소 추가:
  1. **환영**: 잔디 셀이 하나씩 자라나는 Lottie/Reanimated 애니메이션
  2. **루틴 설명**: 사용자가 예시 루틴을 직접 체크해보는 인터랙티브 데모
  3. **프로필**: 건너뛸 수 있되, "설정하면 칼로리 계산 가능" 혜택 명시
- 페이지 인디케이터에 잔디 셀 사용 (원형 dot 대신 사각형 잔디 셀)

---

## 14. 우선순위 매트릭스

각 개선안을 **효과(Impact)** × **난이도(Effort)** 기준으로 분류:

### Quick Wins (높은 효과, 낮은 난이도)

| # | 개선안 | 예상 작업량 |
|---|--------|------------|
| 1 | 스와이프 삭제 색상 `c.danger`로 변경 (8-1) | 10분 |
| 2 | DailySummaryRow 카드 간격 확대 (2-2) | 10분 |
| 3 | 시간대별 인사말 적용 (2-1) | 30분 |
| 4 | 잔디 달력 레전드 추가 (6-2) | 1시간 |
| 5 | 마이 화면 설정 Row 아이콘 추가 (7-2) | 1시간 |
| 6 | 완료된 루틴 취소선 + opacity (4-1) | 30분 |
| 7 | 라이트모드 border 대비 조정 (12-2) | 15분 |

### High Impact (높은 효과, 중간 난이도)

| # | 개선안 | 예상 작업량 |
|---|--------|------------|
| 1 | 체크 완료 잔디 성장 애니메이션 (1-3) | 3시간 |
| 2 | 프로그레스 바 글로우 dot (3-1) | 2시간 |
| 3 | 그룹 헤더 접기 애니메이션 (5-1) | 2시간 |
| 4 | 주간 차트 세그먼트 컨트롤 (6-3) | 4시간 |
| 5 | 잔디 레벨 프로그레스 표시 (7-1) | 3시간 |
| 6 | 타이포그래피 토큰 추출 (10-1) | 2시간 |
| 7 | 애니메이션 토큰 정리 (10-2) | 2시간 |

### Strategic (높은 효과, 높은 난이도)

| # | 개선안 | 예상 작업량 |
|---|--------|------------|
| 1 | 주간 잔디 인터랙티브 셀 + 툴팁 (1-1) | 6시간 |
| 2 | 전체 완료 축하 인터랙션 (2-3) | 4시간 |
| 3 | Bento 카드 탭 상세 (6-1) | 4시간 |
| 4 | 온보딩 인터랙티브 데모 (13-2) | 8시간 |
| 5 | Dynamic Type + Reduce Motion 지원 (9-2) | 6시간 |
| 6 | 빈 상태 Lottie 애니메이션 (8-3) | 5시간 |

---

## 부록: 현재 디자인 시스템 인벤토리

### 컬러 토큰 (colors.ts)

| 토큰 | Dark | Light | 용도 |
|------|------|-------|------|
| surface | #121212 | #ffffff | 배경 |
| surfaceSubtle | #1A1A1A | #f5f5f5 | 카드/섹션 배경 |
| surfaceMuted | #262626 | #e8e8e8 | 호버/프레스 상태 |
| surfaceCard | #1E1E1E | #f0f0f0 | elevated 카드 |
| ink | #F1F5F9 | #0a0a0a | 본문 텍스트 |
| inkSecondary | #CBD5E1 | #404040 | 보조 텍스트 |
| inkTertiary | #94A3B8 | #737373 | 3차 텍스트 |
| inkDisabled | #475569 | #a3a3a3 | 비활성 |
| primary | #22C55E | #22C55E | 완료/성취 |
| accent | #4ADE80 | #4ADE80 | 인터랙션 강조 |
| neonGlow | #86EFAC | #4ADE80 | 글로우 쉐도우 |
| danger | #F87171 | #EF4444 | 위험/삭제 |
| warning | #FBBF24 | #F59E0B | 경고 |

### 간격 토큰 (spacing.ts)

| 토큰 | 값 | 용도 |
|------|-----|------|
| screen | 20 | 화면 패딩 |
| section | 24 | 섹션 간격 |
| card | 16 | 카드 내 패딩 |
| item | 14 | 리스트 아이템 간격 |
| md | 12 | 중간 간격 |
| sm | 8 | 작은 간격 |
| xs | 4 | 최소 간격 |

### 글로우 효과 (themeEffects.ts)

| 함수 | 용도 | shadowOpacity | shadowRadius |
|------|------|---------------|-------------|
| neonGlowShadow(soft) | 카드/체크박스 | 0.4 | 6 |
| neonGlowShadow(strong) | 강조 상태 | 0.6 | 12 |
| grassGlowShadow | 잔디 셀 | 0.55 | 5 |

### 텍스트 프리셋 (AppText.tsx)

| variant | size | weight | 특수 |
|---------|------|--------|------|
| display | 48 | 300 | letterSpacing -1, tabular-nums |
| headline | 28 | 600 | lineHeight 36 |
| title | 20 | 600 | — |
| body | 15 | 400 | — |
| caption | 12 | 400 | — |
| mono | 15 | 400 | tabular-nums |
| stat | 22 | 800 | letterSpacing -1, tabular-nums |
| timer | 62 | 700 | letterSpacing -3 |
