export function formatElapsed(ms: number) {
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatOverElapsed(ms: number) {
  return `+${formatElapsed(ms)}`;
}

export function formatRelativeDate(ts: number, timeFormat: '12h' | '24h' = '12h'): { timeLabel: string; dayLabel: string } {
  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateMidnight = new Date(date);
  dateMidnight.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dateMidnight.getTime() - today.getTime()) / 86_400_000);

  const h = date.getHours();
  const min = date.getMinutes();
  let timeLabel: string;
  if (timeFormat === '24h') {
    timeLabel = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  } else {
    const ampm = h < 12 ? '오전' : '오후';
    timeLabel = `${ampm} ${h % 12 || 12}:${String(min).padStart(2, '0')}`;
  }

  let dayLabel: string;
  if (diffDays === 0) dayLabel = '오늘';
  else if (diffDays === 1) dayLabel = '내일';
  else if (diffDays === 2) dayLabel = '모레';
  else dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;

  return { timeLabel, dayLabel };
}
