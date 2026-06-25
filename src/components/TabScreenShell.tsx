import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

/** 탭 레이아웃에서 상단 safe area를 한 번만 처리 — 화면마다 SafeAreaView remount 방지 */
export function TabScreenShell({ children }: { children: ReactNode }) {
  const c = useThemeColors();
  return <View style={{ flex: 1, backgroundColor: c.surface }}>{children}</View>;
}
