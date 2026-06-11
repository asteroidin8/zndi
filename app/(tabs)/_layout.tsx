import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { TabBarIcon } from '@/components/TabBarIcon';
import { colors } from '@/constants/colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? colors.dark.surface : colors.light.surface;
  const border = isDark ? colors.dark.border : colors.light.border;
  const active = isDark ? colors.dark.ink : colors.light.ink;
  const inactive = isDark ? colors.dark.inkDisabled : colors.light.inkDisabled;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="fasting"
        options={{
          title: '단식',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="Timer" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: '루틴',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="CheckSquare" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="Home" color={color} size={26} />
          ),
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: '투두',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="ListTodo" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="BarChart2" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
