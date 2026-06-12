/** 통계 화면 한글 라벨 (인코딩 손상 방지용 분리) */
export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const WEEKDAY_SHORT = DAY_LABELS;

export const STATS_LABELS = {
  title: '통계',
  emptyBodyLine1: '기록이 쌓이면',
  emptyBodyLine2: '나만의 패턴을 볼 수 있어요',
  emptyCaption: '단식을 시작하거나 루틴·할일을 추가해보세요',
  sectionFasting: '단식',
  sectionRoutine: '루틴',
  sectionTodo: '할일',
  totalRecords: '전체 기록',
  completed: '완료',
  avgDuration: '평균 시간',
  chartTitle: '최근 7일 단식 시간',
  totalRoutines: '전체 루틴',
  todayRoutines: '오늘 루틴',
  maxStreak: '연속 달성',
  completionRate: '완료율',
  importantTodos: '중요한 일',
  today: '오늘',
  noFastingThisMonth: '단식 기록이 없어요',
  timesUnit: '회',
  countUnit: '개',
  dayUnit: '일',
  yearSuffix: '년',
  monthSuffix: '월',
  resultCompleted: '완료',
  resultAbandoned: '중도 포기',
  summaryPrefix: '총',
  summarySuffix: '회',
  deleteAlertTitle: '기록 삭제',
  deleteAlertMessage: '이 기록을 삭제할까요?',
  cancel: '취소',
  delete: '삭제',
} as const;
