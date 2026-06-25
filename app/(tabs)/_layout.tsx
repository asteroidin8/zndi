import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, ToastAndroid, View } from 'react-native';
import { usePathname } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useThemeColors } from '@/hooks/useThemeColors';
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

export default function TabLayout() {
  const c = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabIndex>(HOME_INDEX);
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

  const navigateTo = useCallback((index: TabIndex) => {
    setActiveTab((prev) => {
      if (prev !== index) feedbackTabSwitch();
      return index;
    });
  }, []);

  const scrollToTop = useCallback((index: TabIndex) => {
    invokeTabScrollToTop(index);
  }, []);

  const handleTabPress = useCallback((index: TabIndex) => {
    if (activeTabRef.current === index) {
      invokeTabScrollToTop(index);
      return;
    }
    feedbackTabSwitch();
    setActiveTab(index);
  }, []);

  const contextValue = useMemo(
    () => ({ navigateTo, scrollToTop, setTabBarVisible }),
    [navigateTo, scrollToTop],
  );

  const ActiveScreen = SCREENS[activeTab];

  return (
    <TabNavigationContext.Provider value={contextValue}>
      <View style={{ flex: 1, backgroundColor: c.surface }}>
        <View style={{ flex: 1 }}>
          <ActiveScreen />
        </View>
        {tabBarVisible && <TabBar activeTab={activeTab} onPress={handleTabPress} />}
      </View>
    </TabNavigationContext.Provider>
  );
}
