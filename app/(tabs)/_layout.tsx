import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, ToastAndroid, View } from 'react-native';
import { usePathname } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useStableTopInset } from '@/hooks/useStableTopInset';
import {
  invokeTabScrollToTop,
  TabNavigationContext,
  type TabIndex,
} from '@/contexts/TabNavigationContext';
import { feedbackTabSwitch } from '@/utils/microFeedback';

import BoardTabScreen from './board';
import HomeScreen from './index';
import RoutineScreen from './routine';
import TodoScreen from './todo';
import StatsScreen from './stats';

const HOME_INDEX = 2 as TabIndex;

const SCREENS = [BoardTabScreen, RoutineScreen, HomeScreen, TodoScreen, StatsScreen] as const;
const TAB_KEYS = ['board', 'routine', 'home', 'todo', 'stats'] as const;

export default function TabLayout() {
  const c = useThemeColors();
  const topInset = useStableTopInset();
  const [activeTab, setActiveTab] = useState<TabIndex>(HOME_INDEX);
  const [mountedTabs, setMountedTabs] = useState<Set<TabIndex>>(() => new Set([HOME_INDEX]));
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const pathname = usePathname();
  const backPressedOnce = useRef(false);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const tabPaths = ['/', '/board', '/routine', '/todo', '/stats'];
      if (!tabPaths.includes(pathname)) return false;

      if (activeTabRef.current !== HOME_INDEX) {
        setActiveTab(HOME_INDEX);
        return true;
      }
      if (!backPressedOnce.current) {
        backPressedOnce.current = true;
        ToastAndroid.show('한 번 더 누르면 종료돼요', ToastAndroid.SHORT);
        setTimeout(() => {
          backPressedOnce.current = false;
        }, 2000);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [pathname]);

  const mountTab = useCallback((index: TabIndex) => {
    setMountedTabs((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const navigateTo = useCallback(
    (index: TabIndex) => {
      mountTab(index);
      setActiveTab((prev) => {
        if (prev !== index) feedbackTabSwitch();
        return index;
      });
    },
    [mountTab],
  );

  const scrollToTop = useCallback((index: TabIndex) => {
    invokeTabScrollToTop(index);
  }, []);

  const handleTabPress = useCallback(
    (index: TabIndex) => {
      mountTab(index);
      if (activeTabRef.current === index) {
        invokeTabScrollToTop(index);
        return;
      }
      feedbackTabSwitch();
      setActiveTab(index);
    },
    [mountTab],
  );

  const contextValue = useMemo(
    () => ({ navigateTo, scrollToTop, setTabBarVisible }),
    [navigateTo, scrollToTop],
  );

  return (
    <TabNavigationContext.Provider value={contextValue}>
      <View style={{ flex: 1, backgroundColor: c.surface }}>
        <View style={{ flex: 1, paddingTop: topInset }}>
          {SCREENS.map((Screen, i) => {
            const index = i as TabIndex;
            if (!mountedTabs.has(index)) return null;
            const isActive = activeTab === index;
            return (
              <View
                key={TAB_KEYS[i]}
                style={[StyleSheet.absoluteFill, { opacity: isActive ? 1 : 0 }]}
                pointerEvents={isActive ? 'auto' : 'none'}
                collapsable={false}
                removeClippedSubviews={false}
              >
                <Screen />
              </View>
            );
          })}
        </View>

        {tabBarVisible && <TabBar activeTab={activeTab} onPress={handleTabPress} />}
      </View>
    </TabNavigationContext.Provider>
  );
}
