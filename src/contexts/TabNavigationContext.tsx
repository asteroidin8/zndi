import { createContext, useContext } from 'react';

export type TabIndex = 0 | 1 | 2 | 3 | 4;

interface TabNavigationContextValue {
  navigateTo: (index: TabIndex) => void;
}

export const TabNavigationContext = createContext<TabNavigationContextValue>({
  navigateTo: () => {},
});

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}
