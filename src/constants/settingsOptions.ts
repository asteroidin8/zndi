import type { ThemeMode } from '@/stores/useSettingsStore';

export const THEME_OPTIONS = [
  { mode: 'system' as const, label: '시스템', icon: 'Monitor' as const },
  { mode: 'light' as const, label: '라이트', icon: 'Sun' as const },
  { mode: 'dark' as const, label: '다크', icon: 'Moon' as const },
];

export const THEME_LABELS: Record<ThemeMode, string> = {
  system: '시스템',
  light: '라이트',
  dark: '다크',
};

export const NOTIFICATION_COPY = {
  fastingBar: {
    label: '단식 알림바',
    description: '단식 중 알림 바에 진행을 표시해요',
  },
  routine: {
    label: '루틴 리마인더',
    description: '설정된 시간에 알려드려요',
  },
  todo: {
    label: '할일 마감 알림',
    description: '마감일 당일 오전 9시에 알려드려요',
  },
} as const;
