import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/TabBarIcon';
import { AppText } from '@/components/AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TabNavigationContext, type TabIndex } from '@/contexts/TabNavigationContext';

import FastingScreen from './fasting';
import RoutineScreen from './routine';
import HomeScreen from './index';
import TodoScreen from './todo';
import StatsScreen from './stats';

const TABS = [
  { key: 'fasting', title: '단식', icon: 'Timer' },
  { key: 'routine', title: '루틴', icon: 'CheckSquare' },
  { key: 'home', title: '홈', icon: 'Home' },
  { key: 'todo', title: '투두', icon: 'ListTodo' },
  { key: 'stats', title: '통계', icon: 'BarChart2' },
] as const;

const HOME_INDEX = 2;

export default function TabLayout() {
  const c = useThemeColors();
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(HOME_INDEX);

  function navigateTo(index: TabIndex) {
    pagerRef.current?.setPage(index);
    setActiveTab(index);
  }

  return (
    <TabNavigationContext.Provider value={{ navigateTo }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['bottom']}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={HOME_INDEX}
        onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
        overdrag
      >
        <View key="fasting" style={{ flex: 1 }}>
          <FastingScreen />
        </View>
        <View key="routine" style={{ flex: 1 }}>
          <RoutineScreen />
        </View>
        <View key="home" style={{ flex: 1 }}>
          <HomeScreen />
        </View>
        <View key="todo" style={{ flex: 1 }}>
          <TodoScreen />
        </View>
        <View key="stats" style={{ flex: 1 }}>
          <StatsScreen />
        </View>
      </PagerView>

      {/* 커스텀 탭 바 */}
      <View
        style={{
          flexDirection: 'row',
          height: 56,
          borderTopWidth: 1,
          borderTopColor: c.border,
          backgroundColor: c.surface,
        }}
      >
        {TABS.map((tab, i) => {
          const isActive = activeTab === i;
          const isHome = i === HOME_INDEX;
          return (
            <Pressable
              key={tab.key}
              onPress={() => navigateTo(i)}
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <TabBarIcon
                name={tab.icon}
                size={isHome ? 26 : 22}
                color={isActive ? (c.ink as string) : (c.inkDisabled as string)}
              />
              <AppText
                variant="caption"
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? '700' : '400',
                  color: isActive ? c.ink : c.inkDisabled,
                }}
              >
                {tab.title}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
    </TabNavigationContext.Provider>
  );
}
