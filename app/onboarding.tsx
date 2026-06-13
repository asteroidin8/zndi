import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';

const SLIDES = [
  {
    title: 'Routiner에 오신 것을\n환영해요',
    body: '단식·루틴·할 일을 한곳에서 관리하세요.',
  },
  {
    title: '습관을 쌓아가요',
    body: '루틴 완료와 단식 기록을 추적하고, 통계로 변화를 확인해요.',
  },
  {
    title: '프로필은 선택이에요',
    body: '키·체중을 입력하면 칼로리 계산이 가능해요. 설정에서 언제든 변경할 수 있어요.',
  },
] as const;

export default function OnboardingScreen() {
  const c = useThemeColors();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted);

  function finish() {
    setOnboardingCompleted(true);
    router.replace('/');
  }

  function next() {
    if (page < SLIDES.length - 1) {
      pagerRef.current?.setPage(page + 1);
      return;
    }
    finish();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.title}
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: spacing.screen,
              gap: spacing.section,
            }}
          >
            <AppText variant="title" style={{ fontSize: 28, lineHeight: 36 }}>
              {slide.title}
            </AppText>
            <AppText variant="body" tone="secondary" style={{ lineHeight: 22 }}>
              {slide.body}
            </AppText>
          </View>
        ))}
      </PagerView>

      <View style={{ padding: spacing.screen, gap: spacing.item }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? c.ink : c.border,
              }}
            />
          ))}
        </View>
        <Card pressable onPress={next} accessibilityRole="button" accessibilityLabel={page < SLIDES.length - 1 ? '다음' : '시작하기'}>
          <AppText variant="body" style={{ textAlign: 'center', fontWeight: '600' }}>
            {page < SLIDES.length - 1 ? '다음' : '시작하기'}
          </AppText>
        </Card>
        {page < SLIDES.length - 1 && (
          <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="건너뛰기">
            <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
              건너뛰기
            </AppText>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
