const AVATAR_PALETTE = [
  '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
] as const;

const ADJECTIVES = [
  '초록', '작은', '푸른', '하얀', '빛나는',
  '고요한', '싱그런', '새벽', '은빛', '달빛',
];
const NOUNS = [
  '나무', '이끼', '잔디', '새싹', '풀잎',
  '숲', '이슬', '바람', '돌멩이', '연못',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getAvatarColor(userId: string): string {
  return AVATAR_PALETTE[hashStr(userId) % AVATAR_PALETTE.length];
}

export function generateRandomNickname(userId: string): string {
  const h = hashStr(userId);
  const adj = ADJECTIVES[h % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(h / ADJECTIVES.length) % NOUNS.length];
  const num = (h % 900) + 100;
  return `${adj}${noun}#${num}`;
}

export function getDisplayName(
  nickname: string | null | undefined,
  fallbackUserId?: string,
): string {
  if (nickname?.trim()) return nickname.trim();
  if (fallbackUserId) return generateRandomNickname(fallbackUserId);
  return '잔디 사용자';
}

export function getInitial(displayName: string): string {
  return displayName[0] ?? '?';
}
