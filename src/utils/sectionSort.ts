const SECTION_TIME_ORDER: Record<string, number> = {
  '새벽': 0, '아침': 1, '오전': 2, '점심': 3, '오후': 4, '저녁': 5, '밤': 6,
};

export function sectionSortKey(section: string | null): number {
  if (!section) return 999;
  return SECTION_TIME_ORDER[section] ?? 500;
}

export function compareBySectionThenOrder(
  a: { section?: string | null; order?: number | null },
  b: { section?: string | null; order?: number | null },
): number {
  const ka = sectionSortKey(a.section ?? null);
  const kb = sectionSortKey(b.section ?? null);
  if (ka !== kb) return ka - kb;
  if (ka === 500 && a.section !== b.section)
    return (a.section ?? '').localeCompare(b.section ?? '');
  return (a.order ?? 0) - (b.order ?? 0);
}
