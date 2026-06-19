import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Linking, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  const c = useThemeColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 52, paddingHorizontal: spacing.screen,
        backgroundColor: pressed && onPress ? c.surfaceMuted : 'transparent',
      })}>
      <AppText variant="body">{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {value != null && <AppText variant="body" tone="tertiary">{value}</AppText>}
        {onPress && <AppIcon name="ChevronRight" size={16} color={c.inkTertiary} />}
      </View>
    </Pressable>
  );
}

function Separator() {
  const c = useThemeColors();
  return <View style={{ height: 1, backgroundColor: c.borderNeutral, marginHorizontal: spacing.screen }} />;
}

export default function AboutScreen() {
  const c = useThemeColors();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.item, paddingBottom: spacing.sm, gap: spacing.item }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="뒤로">
          <AppIcon name="ChevronLeft" size={20} color={c.ink} />
        </Pressable>
        <AppText variant="title">앱 정보</AppText>
      </View>
      <Row label="이용약관" onPress={() => router.push('/terms')} />
      <Separator />
      <Row label="개인정보처리방침" onPress={() => router.push('/privacy')} />
      <Separator />
      <Row label="문의하기" onPress={() => Linking.openURL('mailto:asteroidin8@gmail.com?subject=%EC%9E%94%EB%94%94%20%EB%AC%B8%EC%9D%98')} />
      <Separator />
      <Row label="버전" value={`v${version}`} />
    </SafeAreaView>
  );
}
