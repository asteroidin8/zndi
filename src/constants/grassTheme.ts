export type GrassColorId = 'green' | 'cherry' | 'ocean' | 'lavender' | 'sunset' | 'flame' | 'gold';
export type GrassCellShape = 'default' | 'pixel' | 'circle' | 'diamond';

export type GrassColorPreset = {
  id: GrassColorId;
  name: string;
  hex: string;
  price: number | null;
};

export type GrassCellSkin = {
  id: GrassCellShape;
  name: string;
  desc: string;
  price: number | null;
};

export const GRASS_COLORS: GrassColorPreset[] = [
  { id: 'green',    name: '기본',    hex: '#22C55E', price: null },
  { id: 'cherry',   name: '벚꽃',    hex: '#F472B6', price: 300 },
  { id: 'ocean',    name: '오션',    hex: '#38BDF8', price: 300 },
  { id: 'lavender', name: '라벤더',  hex: '#A78BFA', price: 300 },
  { id: 'sunset',   name: '선셋',    hex: '#FB923C', price: 300 },
  { id: 'flame',    name: '불꽃',    hex: '#EF4444', price: 500 },
  { id: 'gold',     name: '골드',    hex: '#EAB308', price: 500 },
];

export const GRASS_CELL_SKINS: GrassCellSkin[] = [
  { id: 'default', name: '기본',    desc: '네온 글로우',       price: null },
  { id: 'pixel',   name: '픽셀',    desc: '8bit 깜빡임',      price: 500 },
  { id: 'circle',  name: '서클',    desc: '펄스 애니메이션',   price: 500 },
  { id: 'diamond', name: '다이아',  desc: '반짝임 효과',       price: 500 },
];

export function getGrassColor(id: GrassColorId): string {
  return GRASS_COLORS.find((c) => c.id === id)?.hex ?? '#22C55E';
}

export function getGrassNeonGlow(hex: string): string {
  return `${hex}80`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

export type GrassDerivedColors = {
  primary: string;
  primaryContainer: string;
  accent: string;
  neonGlow: string;
  border: string;
  borderStrong: string;
};

export function deriveThemeColors(id: GrassColorId, isDark: boolean): GrassDerivedColors | null {
  if (id === 'green') return null;
  const hex = getGrassColor(id);
  const [r, g, b] = hexToRgb(hex);
  const accent = lighten(hex, 0.3);
  const neonGlow = isDark ? lighten(hex, 0.4) : rgbToHex(r * 0.8, g * 0.8, b * 0.8);
  return {
    primary: hex,
    primaryContainer: isDark ? accent : hex,
    accent,
    neonGlow,
    border: isDark ? `rgba(${r}, ${g}, ${b}, 0.15)` : `rgba(${r}, ${g}, ${b}, 0.25)`,
    borderStrong: isDark ? `rgba(${r}, ${g}, ${b}, 0.3)` : `rgba(${r}, ${g}, ${b}, 0.4)`,
  };
}

export type GrassAnimationId = 'none' | 'glow' | 'pulse' | 'sparkle' | 'wave';

export type GrassAnimation = {
  id: GrassAnimationId;
  name: string;
  desc: string;
  price: number | null;
};

export const GRASS_ANIMATIONS: GrassAnimation[] = [
  { id: 'none',    name: '없음',     desc: '효과 없이 색만 채워져요',           price: null },
  { id: 'glow',    name: '네온 글로우', desc: '완료 시 칸이 은은하게 빛나요',   price: 300 },
  { id: 'pulse',   name: '펄스',     desc: '완료 시 칸이 부드럽게 박동해요',     price: 500 },
  { id: 'sparkle', name: '반짝임',   desc: '완료 시 칸 위에 별이 반짝여요',      price: 500 },
  { id: 'wave',    name: '웨이브',   desc: '완료 시 물결이 퍼져나가요',          price: 800 },
];

export const GRASS_OPACITY = [0, 0.2, 0.4, 0.65, 1.0] as const;

export function getCellBorderRadius(shape: GrassCellShape, size: number): number {
  switch (shape) {
    case 'pixel':   return 2;
    case 'circle':  return size / 2;
    case 'diamond': return size / 6;
    default:        return size / 4;
  }
}

export function getCellTransform(shape: GrassCellShape): { rotate?: string; scale?: number } {
  if (shape === 'diamond') return { rotate: '45deg' };
  return {};
}
