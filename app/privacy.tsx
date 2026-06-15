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
    title: '1. 수집하는 정보',
    body: '잔디는 아래 정보를 기기 내부(AsyncStorage)에 저장합니다. 로그인 시 Supabase 클라우드에 백업·동기화할 수 있습니다.\n\n· 신체 정보(키, 체중, 목표 체중, 나이, 성별)\n· 단식 기록, 루틴, 할 일\n· 앱 설정(테마, 알림 설정 등)',
  },
  {
    title: '2. 정보 이용 목적',
    body: '· 단식 타이머 및 통계 제공\n· 루틴·할 일 관리 및 알림\n· 칼로리 계산 등 개인 맞춤 기능 제공',
  },
  {
    title: '3. 보관 및 전송',
    body: '로그인하지 않으면 모든 데이터는 기기에만 저장됩니다. 클라우드 동기화는 로그인 사용자가 선택한 경우에만 Supabase에 저장됩니다.',
  },
  {
    title: '4. 알림',
    body: '알림 기능 사용 시 OS 알림 권한이 필요합니다. 권한을 거부해도 앱의 핵심 기능은 이용할 수 있습니다.',
  },
  {
    title: '5. 데이터 삭제',
    body: '설정 > 데이터 > 전체 데이터 초기화를 통해 저장된 모든 데이터를 삭제할 수 있습니다. 앱 삭제 시 기기에 저장된 데이터도 함께 삭제됩니다.',
  },
  {
    title: '6. 문의',
    body: '개인정보 관련 문의는 앱 스토어 페이지 또는 개발자 연락처로 문의해 주세요.',
  },
  {
    title: '7. 시행일',
    body: '본 방침은 2026년 6월 12일부터 적용됩니다.',
  },
] as const;

export default function PrivacyScreen() {
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
          개인정보처리방침
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
