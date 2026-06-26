import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Linking, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupCard, InsetDivider, PageHeader, Row } from '@/components/settings/MyScreenUI';
import { CONTACT_EMAIL } from '@/constants/app';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function AboutScreen() {
  const c = useThemeColors();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title="앱 정보" onBack={() => router.back()} />

      <View style={{ padding: spacing.screen }}>
        <GroupCard>
          <Row label="이용약관" onPress={() => router.push('/terms')} />
          <InsetDivider />
          <Row label="개인정보처리방침" onPress={() => router.push('/privacy')} />
          <InsetDivider />
          <Row label="문의하기" onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=%EC%9E%94%EB%94%94%20%EB%AC%B8%EC%9D%98`)} />
          <InsetDivider />
          <Row label="버전" value={`v${version}`} />
        </GroupCard>
      </View>
    </SafeAreaView>
  );
}
