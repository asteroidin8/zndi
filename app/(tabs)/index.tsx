import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { DailySummaryRow } from '@/components/DailySummaryRow';
import { FastingCard } from '@/components/FastingCard';
import { useTabNavigation, useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getTimeGreeting } from '@/utils/dateFormat';
import { useUserStore } from '@/stores/useUserStore';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TAB_INDEX = 2 as const;

function getTodayLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const day = WEEKDAYS[now.getDay()];
  return `${year}년 ${month}월 ${date}일 ${day}요일`;
}

export default function HomeScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { navigateTo } = useTabNavigation();
  const { profile } = useUserStore();
  const isProfileIncomplete = !profile.heightCm || !profile.weightKg;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="title">{getTimeGreeting()}</AppText>
            <AppText variant="caption" tone="tertiary">
              {getTodayLabel()}
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="설정"
          >
            <AppIcon name="Settings" size={20} color={c.inkTertiary} />
          </Pressable>
        </View>

        {isProfileIncomplete && (
          <Pressable
            onPress={() => router.push('/settings')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: c.surfaceSubtle,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="프로필 설정하기"
          >
            <AppIcon name="UserCircle" size={18} color={c.inkTertiary} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
                프로필을 설정하면 칼로리 계산이 가능해요
              </AppText>
              <AppText variant="caption" tone="tertiary">
                키, 몸무게 입력하기 →
              </AppText>
            </View>
          </Pressable>
        )}

        <FastingCard onPress={() => navigateTo(0)} />

        <DailySummaryRow
          onRoutinePress={() => navigateTo(1)}
          onTodoPress={() => navigateTo(3)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
