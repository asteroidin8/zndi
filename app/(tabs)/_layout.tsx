import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/TabBarIcon';
import { AppText } from '@/components/AppText';
import { TAB_LABELS } from '@/constants/copy';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TabNavigationContext, type TabIndex } from '@/contexts/TabNavigationContext';
import { feedbackTabSwitch } from '@/utils/microFeedback';
import { useTodoStore } from '@/stores/useTodoStore';

import HomeScreen from './index';
import RoutineScreen from './routine';
import TodoScreen from './todo';
import StatsScreen from './stats';

const TABS = [
  { key: 'home', title: TAB_LABELS.home, icon: 'Home' },
  { key: 'routine', title: TAB_LABELS.routine, icon: 'CheckSquare' },
  { key: 'todo', title: TAB_LABELS.todo, icon: 'ListTodo' },
  { key: 'stats', title: TAB_LABELS.stats, icon: 'Grid3x3' },
] as const;

const HOME_INDEX = 0;
const TODO_INDEX = 2;

const SCREENS = [HomeScreen, RoutineScreen, TodoScreen, StatsScreen];

export default function TabLayout() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabIndex>(HOME_INDEX as TabIndex);
  const [scrollTick, setScrollTick] = useState<Record<number, number>>({});
  const activeTodoCount = useTodoStore((s) => s.todos.filter((t) => !t.completedAt).length);

  function navigateTo(index: TabIndex) {
    if (activeTab !== index) {
      feedbackTabSwitch();
    }
    setActiveTab(index);
  }

  function scrollToTop(index: TabIndex) {
    setScrollTick((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }));
  }

  function handleTabPress(index: TabIndex) {
    if (activeTab === index) scrollToTop(index);
    else navigateTo(index);
  }

  const ActiveScreen = SCREENS[activeTab];

  return (
    <TabNavigationContext.Provider value={{ navigateTo, scrollTick, scrollToTop }}>
      <View style={{ flex: 1, backgroundColor: c.surface }}>
        <View style={{ flex: 1 }}>
          <ActiveScreen />
        </View>

        <View
          style={{
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: c.borderNeutral,
            backgroundColor: c.surface,
            paddingBottom: Math.max(insets.bottom, 6),
            paddingTop: 4,
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
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 6,
                  borderTopWidth: 2,
                  borderTopColor: isActive ? c.primary : 'transparent',
                }}
              >
                <View style={{ position: 'relative', marginBottom: 2 }}>
                  <TabBarIcon
                    name={tab.icon}
                    size={isHome ? 24 : 22}
                    color={isActive ? (c.primary as string) : (c.inkDisabled as string)}
                  />
                  {i === TODO_INDEX && activeTodoCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -7,
                        backgroundColor: c.primary,
                        borderRadius: 8,
                        minWidth: 14,
                        height: 14,
                        paddingHorizontal: 3,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AppText style={{ fontSize: 9, fontWeight: '700', color: c.onPrimary }}>
                        {activeTodoCount > 99 ? '99+' : String(activeTodoCount)}
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText
                  variant="caption"
                  style={{
                    fontSize: 10,
                    lineHeight: 12,
                    fontWeight: isActive ? '700' : '400',
                    color: isActive ? c.primary : c.inkDisabled,
                  }}
                >
                  {tab.title}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </TabNavigationContext.Provider>
  );
}
