import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

const SECTIONS = [
  {
    title: '1. 목적',
    body: '본 약관은 Routiner(이하 "앱")의 이용 조건과 이용자와 개발자 간의 권리·의무를 정합니다.',
  },
  {
    title: '2. 서비스 내용',
    body: '앱은 단식 타이머, 루틴·할 일 관리, 통계 등 습관 관리 기능을 제공합니다. 모든 데이터는 이용자 기기에 저장됩니다.',
  },
  {
    title: '3. 이용자의 의무',
    body: '· 앱을 불법 목적으로 사용하지 않습니다.\n· 타인의 권리를 침해하지 않습니다.\n· 앱의 정상적인 운영을 방해하지 않습니다.',
  },
  {
    title: '4. 면책',
    body: '앱에서 제공하는 단식·칼로리 정보는 참고용이며, 의료·건강 상담을 대체하지 않습니다. 건강 상태에 따라 전문가와 상담하세요.',
  },
  {
    title: '5. 데이터 및 알림',
    body: '데이터는 기기 내부에만 저장됩니다. 알림 기능은 OS 권한에 따르며, 권한 거부 시에도 핵심 기능은 이용할 수 있습니다.',
  },
  {
    title: '6. 약관 변경',
    body: '약관은 앱 업데이트 또는 공지를 통해 변경될 수 있습니다. 변경 후 앱을 계속 이용하면 변경에 동의한 것으로 봅니다.',
  },
  {
    title: '7. 문의',
    body: '약관 관련 문의는 설정 > 앱 정보 > 문의하기 또는 asteroidin8@gmail.com 으로 연락해 주세요.',
  },
  {
    title: '8. 시행일',
    body: '본 약관은 2026년 6월 12일부터 적용됩니다.',
  },
] as const;

export default function TermsScreen() {
  const c = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top', 'bottom']}>
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
          accessibilityLabel="닫기"
        >
          <AppIcon name="X" size={20} color={c.ink} />
        </Pressable>
        <AppText variant="title" style={{ flex: 1 }}>
          이용약관
        </AppText>
      </View>
      <Divider />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.screen,
          gap: spacing.section,
          paddingBottom: spacing.section * 2,
        }}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ gap: spacing.sm }}>
            <AppText variant="body" style={{ fontWeight: '600' }}>
              {section.title}
            </AppText>
            <AppText variant="caption" tone="secondary" style={{ lineHeight: 20 }}>
              {section.body}
            </AppText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
