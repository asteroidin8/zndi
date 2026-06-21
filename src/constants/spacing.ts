/** 화면·컴포넌트 간격 토큰 */
export const spacing = {
  screen: 20,
  section: 24,
  card: 16,
  item: 14,
  sm: 8,
  gap: 10,
  md: 12,
  xs: 4,
  /** 설정 화면 섹션 간격 */
  settingsSection: 32,
  /** 설정 제목 ↔ 카드 */
  settingsTitle: 12,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  sheet: 24,
} as const;

/** 재사용 가능한 크기 토큰 */
export const size = {
  touchTarget: 48,
  checkboxSm: 18,
  checkboxMd: 24,
  progressBar: 4,
  iconSm: 14,
  iconMd: 18,
  iconLg: 24,
} as const;

/** 재사용 가능한 불투명도 토큰 */
export const opacity = {
  completed: 0.72,
  partial: 0.45,
  disabled: 0.38,
  pressed: 0.88,
  ghost: 0.15,
} as const;
