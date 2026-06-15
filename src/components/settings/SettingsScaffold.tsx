import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  title: string;
  children: ReactNode;
  /** false면 메인 설정처럼 타이틀만 (모달 스와이프·뒤로로 닫기) */
  showBackButton?: boolean;
};

export function SettingsScaffold({ title, children, showBackButton = true }: Props) {
  const c = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.screen,
          paddingTop: showBackButton ? spacing.item : spacing.section,
          paddingBottom: spacing.item,
          gap: spacing.item,
        }}
      >
        {showBackButton && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="뒤로"
          >
            <AppIcon name="ChevronLeft" size={20} color={c.ink} />
          </Pressable>
        )}
        <AppText
          variant="title"
          style={{
            flex: 1,
            fontSize: showBackButton ? undefined : 28,
            lineHeight: showBackButton ? undefined : 34,
          }}
        >
          {title}
        </AppText>
      </View>

      <Divider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.screen,
          paddingBottom: spacing.settingsSection * 2,
        }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
