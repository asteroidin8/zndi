export type AvatarTier = 'sprout' | 'flower' | 'tree';
export type AvatarAcquireType = 'free' | 'shop' | 'streak' | 'season';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type AvatarDef = {
  id: string;
  name: string;
  nameEn: string;
  tier: AvatarTier;
  acquire: AvatarAcquireType;
  price: number | null;
  streakDays: number | null;
  season: Season | null;
  bgColor: string;
  emoji: string;
};

export const AVATAR_TIERS: Record<AvatarTier, { label: string; badge: string; color: string }> = {
  sprout: { label: '새싹', badge: 'COMMON', color: '#6B8E5A' },
  flower: { label: '꽃', badge: 'RARE', color: '#C06090' },
  tree: { label: '나무', badge: 'EPIC', color: '#7B5EA7' },
};

export const AVATARS: AvatarDef[] = [
  // ── 새싹 (Common) ──
  { id: 'clover', name: '클로버', nameEn: 'Clover', tier: 'sprout', acquire: 'free', price: null, streakDays: null, season: null, bgColor: '#E8F5E2', emoji: '☘️' },
  { id: 'sprout', name: '새싹', nameEn: 'Sprout', tier: 'sprout', acquire: 'free', price: null, streakDays: null, season: null, bgColor: '#F1F8E9', emoji: '🌱' },
  { id: 'dandelion', name: '민들레', nameEn: 'Dandelion', tier: 'sprout', acquire: 'shop', price: 300, streakDays: null, season: null, bgColor: '#FFFDE7', emoji: '🌾' },
  { id: 'succulent', name: '다육이', nameEn: 'Succulent', tier: 'sprout', acquire: 'shop', price: 300, streakDays: null, season: null, bgColor: '#E8F5E9', emoji: '🪴' },
  { id: 'moss', name: '이끼', nameEn: 'Moss', tier: 'sprout', acquire: 'streak', price: null, streakDays: 7, season: null, bgColor: '#E0F2E0', emoji: '🟢' },
  { id: 'foxtail', name: '강아지풀', nameEn: 'Foxtail', tier: 'sprout', acquire: 'streak', price: null, streakDays: 14, season: null, bgColor: '#F9FBE7', emoji: '🌿' },
  { id: 'cactus', name: '선인장', nameEn: 'Cactus', tier: 'sprout', acquire: 'shop', price: 300, streakDays: null, season: null, bgColor: '#FFF8E1', emoji: '🌵' },
  { id: 'fern', name: '고사리', nameEn: 'Fern', tier: 'sprout', acquire: 'shop', price: 300, streakDays: null, season: null, bgColor: '#E8F5E9', emoji: '🌿' },

  // ── 꽃 (Rare) ──
  { id: 'cherry-blossom', name: '벚꽃', nameEn: 'Cherry Blossom', tier: 'flower', acquire: 'season', price: null, streakDays: null, season: 'spring', bgColor: '#FFF0F5', emoji: '🌸' },
  { id: 'sunflower', name: '해바라기', nameEn: 'Sunflower', tier: 'flower', acquire: 'streak', price: null, streakDays: 30, season: null, bgColor: '#FFF9C4', emoji: '🌻' },
  { id: 'rose', name: '장미', nameEn: 'Rose', tier: 'flower', acquire: 'shop', price: 500, streakDays: null, season: null, bgColor: '#FFEBEE', emoji: '🌹' },
  { id: 'lavender', name: '라벤더', nameEn: 'Lavender', tier: 'flower', acquire: 'shop', price: 500, streakDays: null, season: null, bgColor: '#F3E5F5', emoji: '💜' },
  { id: 'tulip', name: '튤립', nameEn: 'Tulip', tier: 'flower', acquire: 'shop', price: 500, streakDays: null, season: null, bgColor: '#FFF3E0', emoji: '🌷' },
  { id: 'lotus', name: '연꽃', nameEn: 'Lotus', tier: 'flower', acquire: 'streak', price: null, streakDays: 60, season: null, bgColor: '#FCE4EC', emoji: '🪷' },
  { id: 'hydrangea', name: '수국', nameEn: 'Hydrangea', tier: 'flower', acquire: 'season', price: null, streakDays: null, season: 'summer', bgColor: '#E8EAF6', emoji: '💠' },
  { id: 'cosmos', name: '코스모스', nameEn: 'Cosmos', tier: 'flower', acquire: 'season', price: null, streakDays: null, season: 'autumn', bgColor: '#FFF0F5', emoji: '🌼' },

  // ── 나무 (Epic) ──
  { id: 'ginkgo', name: '은행나무', nameEn: 'Ginkgo', tier: 'tree', acquire: 'season', price: null, streakDays: null, season: 'autumn', bgColor: '#FFF9C4', emoji: '🍂' },
  { id: 'bamboo', name: '대나무', nameEn: 'Bamboo', tier: 'tree', acquire: 'shop', price: 1000, streakDays: null, season: null, bgColor: '#E8F5E9', emoji: '🎋' },
  { id: 'baobab', name: '바오밥', nameEn: 'Baobab', tier: 'tree', acquire: 'shop', price: 1000, streakDays: null, season: null, bgColor: '#FFF3E0', emoji: '🌳' },
  { id: 'pine', name: '소나무', nameEn: 'Pine', tier: 'tree', acquire: 'streak', price: null, streakDays: 100, season: null, bgColor: '#E8F5E9', emoji: '🌲' },
  { id: 'palm', name: '야자나무', nameEn: 'Palm', tier: 'tree', acquire: 'shop', price: 1000, streakDays: null, season: null, bgColor: '#E0F7FA', emoji: '🌴' },
  { id: 'maple', name: '단풍나무', nameEn: 'Maple', tier: 'tree', acquire: 'season', price: null, streakDays: null, season: 'autumn', bgColor: '#FBE9E7', emoji: '🍁' },
  { id: 'sequoia', name: '세쿼이아', nameEn: 'Sequoia', tier: 'tree', acquire: 'streak', price: null, streakDays: 365, season: null, bgColor: '#EFEBE9', emoji: '🏔️' },
  { id: 'world-tree', name: '세계수', nameEn: 'World Tree', tier: 'tree', acquire: 'streak', price: null, streakDays: Infinity, season: null, bgColor: '#E8F5E9', emoji: '✨' },
];

export function getAvatarById(id: string): AvatarDef | undefined {
  return AVATARS.find((a) => a.id === id);
}

export function getAcquireLabel(avatar: AvatarDef): string {
  switch (avatar.acquire) {
    case 'free': return '무료';
    case 'shop': return `${avatar.price}원`;
    case 'streak':
      return avatar.streakDays === Infinity ? '전체 달성' : `${avatar.streakDays}일 스트릭`;
    case 'season': {
      const labels: Record<Season, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
      return `${labels[avatar.season!]} 한정`;
    }
  }
}
