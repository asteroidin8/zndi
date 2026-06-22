import { createContext, useContext, useEffect } from 'react';

export type TabIndex = 0 | 1 | 2 | 3 | 4;

interface TabNavigationContextValue {
  navigateTo: (index: TabIndex) => void;
  scrollTick: Record<number, number>;
  scrollToTop: (index: TabIndex) => void;
}

export const TabNavigationContext = createContext<TabNavigationContextValue>({
  navigateTo: () => {},
  scrollTick: {},
  scrollToTop: () => {},
});

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}

export function useTabScrollToTop(
  tabIndex: TabIndex,
  scrollRef: React.RefObject<{ scrollTo: (opts: { y: number; animated?: boolean }) => void } | null>,
) {
  const { scrollTick } = useTabNavigation();
  const tick = scrollTick[tabIndex] ?? 0;

  useEffect(() => {
    if (tick > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [tick, tabIndex, scrollRef]);
}
