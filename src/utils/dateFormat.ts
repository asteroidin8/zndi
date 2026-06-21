import type { ThemeColors } from '@/constants/colors';

export type DueUrgency = 'normal' | 'soon' | 'today' | 'overdue';

export function formatDueDate(dueDate: string): {
  label: string;
  isOverdue: boolean;
  urgency: DueUrgency;
} {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [dy, dm, dd] = dueDate.split('-').map(Number);

  const todayEpoch = Date.UTC(ty, tm - 1, td);
  const dueEpoch = Date.UTC(dy, dm - 1, dd);

  const diffDays = Math.round((dueEpoch - todayEpoch) / 86_400_000);

  if (diffDays === 0) return { label: '오늘', isOverdue: false, urgency: 'today' };
  if (diffDays === 1) return { label: '내일', isOverdue: false, urgency: 'soon' };
  if (diffDays === 2) return { label: '모레', isOverdue: false, urgency: 'soon' };
  if (diffDays > 1 && diffDays <= 3) {
    return { label: `D-${diffDays}`, isOverdue: false, urgency: 'soon' };
  }
  if (diffDays > 3) return { label: `D-${diffDays}`, isOverdue: false, urgency: 'normal' };
  return { label: `D+${Math.abs(diffDays)}`, isOverdue: true, urgency: 'overdue' };
}

export function getDueDateColor(urgency: DueUrgency, c: ThemeColors): string | undefined {
  if (urgency === 'overdue') return c.danger;
  if (urgency === 'today') return c.warning;
  if (urgency === 'soon') return c.warningDark;
  return undefined;
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '늦은 밤이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '오늘도 수고했어요';
}

export function getPriorityColor(
  priority: 'high' | 'mid' | 'low',
  c: ThemeColors,
): string {
  return { high: c.priorityHigh, mid: c.priorityMid, low: c.priorityLow }[priority];
}

export function formatTimeDisplay(time: string, format: '12h' | '24h'): string {
  if (format === '24h') return time;
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const period = h < 12 ? '오전' : '오후';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${displayH}:${mStr}`;
}
