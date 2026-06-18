import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ONBOARDING } from '@/constants/copy';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';

const SLIDES = [
  { title: ONBOARDING.slide1Title, body: ONBOARDING.slide1Body },
  { title: ONBOARDING.slide2Title, body: ONBOARDING.slide2Body },
  { title: ONBOARDING.slide3Title, body: ONBOARDING.slide3Body },
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

  const isLast = page === SLIDES.length - 1;

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
            <AppText variant="headline">{slide.title}</AppText>
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
                backgroundColor: i === page ? c.primary : c.surfaceMuted,
              }}
            />
          ))}
        </View>
        <Pressable
          onPress={next}
          accessibilityRole="button"
          accessibilityLabel={isLast ? ONBOARDING.ctaStart : ONBOARDING.ctaNext}
          style={({ pressed }) => ({
            backgroundColor: c.primary,
            borderRadius: radius.lg,
            paddingVertical: spacing.item,
            alignItems: 'center',
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <AppText variant="body" style={{ fontWeight: '700', color: c.onPrimary }}>
            {isLast ? ONBOARDING.ctaStart : ONBOARDING.ctaNext}
          </AppText>
        </Pressable>
        {!isLast && (
          <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel={ONBOARDING.skip}>
            <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
              {ONBOARDING.skip}
            </AppText>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
