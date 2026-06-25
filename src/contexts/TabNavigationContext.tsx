import { createContext, useContext, useEffect, type RefObject } from 'react';

export type TabIndex = 0 | 1 | 2 | 3 | 4;

type ScrollTarget = { scrollTo: (opts: { y: number; animated?: boolean }) => void };

interface TabNavigationContextValue {
  navigateTo: (index: TabIndex) => void;
  scrollToTop: (index: TabIndex) => void;
  setTabBarVisible: (visible: boolean) => void;
}

const scrollHandlers = new Map<TabIndex, () => void>();

export function registerTabScrollHandler(index: TabIndex, handler: () => void): () => void {
  scrollHandlers.set(index, handler);
  return () => {
    scrollHandlers.delete(index);
  };
}

export function invokeTabScrollToTop(index: TabIndex): void {
  scrollHandlers.get(index)?.();
}

export const TabNavigationContext = createContext<TabNavigationContextValue>({
  navigateTo: () => {},
  scrollToTop: () => {},
  setTabBarVisible: () => {},
});

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}

export function useTabScrollToTop(
  tabIndex: TabIndex,
  scrollRef: RefObject<ScrollTarget | null>,
) {
  useEffect(() => {
    return registerTabScrollHandler(tabIndex, () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [tabIndex, scrollRef]);
}
