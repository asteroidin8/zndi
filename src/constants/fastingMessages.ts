export type FastingPhase = {
  minHours: number;
  maxHours: number;
  message: string;
};

export const FASTING_PHASES: FastingPhase[] = [
  { minHours: 0, maxHours: 4, message: '소화 중 · 혈당이 안정되고 있어요' },
  { minHours: 4, maxHours: 8, message: '글리코겐 소모 중 · 저장 에너지를 사용합니다' },
  { minHours: 8, maxHours: 12, message: '지방 연소 시작 · 케톤 생성이 시작됩니다' },
  { minHours: 12, maxHours: 16, message: '케토시스 진입 중 · 지방이 주요 연료예요' },
  { minHours: 16, maxHours: 24, message: '자가포식 활성화 · 세포가 스스로 정화됩니다' },
  { minHours: 24, maxHours: Infinity, message: '깊은 단식 · 강력한 세포 재생 단계입니다' },
];

export function getFastingMessage(elapsedMs: number): string {
  const hours = elapsedMs / 3_600_000;
  const phase = FASTING_PHASES.find((p) => hours >= p.minHours && hours < p.maxHours);
  return phase?.message ?? FASTING_PHASES[FASTING_PHASES.length - 1].message;
}

// 해리스-베네딕트 공식 기반 단순 칼로리 소모 추산 (kcal)
export function estimateCaloriesBurned({
  weightKg,
  heightCm,
  ageYears,
  isMale,
  elapsedMs,
}: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  isMale: boolean;
  elapsedMs: number;
}): number {
  const bmr = isMale
    ? 88.36 + 13.4 * weightKg + 5.0 * heightCm - 5.7 * ageYears
    : 447.6 + 9.25 * weightKg + 3.1 * heightCm - 4.3 * ageYears;
  const hours = elapsedMs / 3_600_000;
  return Math.round((bmr / 24) * hours);
}
