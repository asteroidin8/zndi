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
  closeIcon?: 'X' | 'ChevronLeft';
};

export function SettingsScaffold({ title, children, closeIcon = 'ChevronLeft' }: Props) {
  const c = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.screen,
          paddingVertical: spacing.item,
          gap: spacing.item,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={closeIcon === 'X' ? '닫기' : '뒤로'}
        >
          <AppIcon name={closeIcon} size={20} color={c.ink} />
        </Pressable>
        <AppText variant="title" style={{ flex: 1 }}>
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
