import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/TabBarIcon';
import { AppText } from '@/components/AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TabNavigationContext, type TabIndex } from '@/contexts/TabNavigationContext';
import { feedbackTabSwitch } from '@/utils/microFeedback';
import { useTodoStore } from '@/stores/useTodoStore';

import FastingScreen from './fasting';
import RoutineScreen from './routine';
import HomeScreen from './index';
import TodoScreen from './todo';
import StatsScreen from './stats';

const TABS = [
  { key: 'fasting', title: '단식', icon: 'Timer' },
  { key: 'routine', title: '루틴', icon: 'CheckSquare' },
  { key: 'home', title: '홈', icon: 'Home' },
  { key: 'todo', title: '할일', icon: 'ListTodo' },
  { key: 'stats', title: '통계', icon: 'BarChart2' },
] as const;

const HOME_INDEX = 2;
const TODO_INDEX = 3;

export default function TabLayout() {
  const c = useThemeColors();
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState<TabIndex>(HOME_INDEX);
  const [scrollTick, setScrollTick] = useState<Record<number, number>>({});
  const activeTodoCount = useTodoStore((s) => s.todos.filter((t) => !t.completedAt).length);

  function navigateTo(index: TabIndex) {
    pagerRef.current?.setPage(index);
    setActiveTab(index);
  }

  function scrollToTop(index: TabIndex) {
    setScrollTick((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }));
  }

  function handleTabPress(index: TabIndex) {
    if (activeTab === index) scrollToTop(index);
    else {
      feedbackTabSwitch();
      navigateTo(index);
    }
  }

  return (
    <TabNavigationContext.Provider value={{ navigateTo, scrollTick, scrollToTop }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['bottom']}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={HOME_INDEX}
          onPageSelected={(e) => setActiveTab(e.nativeEvent.position as TabIndex)}
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
                onPress={() => handleTabPress(i as TabIndex)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${tab.title} 탭`}
                style={({ pressed }) => ({
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                })}
              >
                <View style={{ position: 'relative', alignItems: 'center' }}>
                  <TabBarIcon
                    name={tab.icon}
                    size={isHome ? 26 : 22}
                    color={isActive ? (c.ink as string) : (c.inkDisabled as string)}
                  />
                  {isActive && (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: c.ink,
                        marginTop: 3,
                      }}
                    />
                  )}
                  {i === TODO_INDEX && activeTodoCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -3,
                        right: -8,
                        backgroundColor: c.ink,
                        borderRadius: 8,
                        minWidth: 14,
                        height: 14,
                        paddingHorizontal: 3,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AppText style={{ fontSize: 9, fontWeight: '700', color: c.surface }}>
                        {activeTodoCount > 99 ? '99+' : String(activeTodoCount)}
                      </AppText>
                    </View>
                  )}
                </View>
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
