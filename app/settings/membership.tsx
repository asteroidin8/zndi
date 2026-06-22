import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useProStore } from '@/stores/useProStore';
import { router } from 'expo-router';

type FeatureRow = {
  label: string;
  free: string | boolean;
  pro: string | boolean;
};

const FEATURES: FeatureRow[] = [
  { label: '루틴 그룹', free: '1개', pro: '무제한' },
  { label: '할일 그룹', free: '1개', pro: '무제한' },
  { label: '보드', free: '1개', pro: '무제한' },
  { label: '잔디 컬러', free: '기본 1종', pro: '전체' },
  { label: '셀 모양', free: '기본 1종', pro: '전체' },
  { label: '셀 애니메이션', free: false, pro: true },
  { label: '클라우드 동기화', free: true, pro: true },
];

function CheckOrText({ value, accent }: { value: string | boolean; accent?: boolean }) {
  const c = useThemeColors();
  if (typeof value === 'boolean') {
    return value ? (
      <AppIcon name="Check" size={16} color={accent ? c.primary : c.inkTertiary} />
    ) : (
      <AppIcon name="Minus" size={16} color={c.inkDisabled} />
    );
  }
  return (
    <AppText variant="caption" style={{ fontWeight: '600', color: accent ? c.primary : c.ink }}>
      {value}
    </AppText>
  );
}

export default function MembershipScreen() {
  const c = useThemeColors();
  const isPro = useProStore((s) => s.isPro);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title="멤버십" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.screen, gap: spacing.section }}
      >
        {isPro && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: `${c.primary}15`,
              borderRadius: radius.lg,
              padding: spacing.card,
            }}
          >
            <AppIcon name="Crown" size={18} color={c.primary} />
            <AppText variant="body" style={{ fontWeight: '700', color: c.primary }}>
              Pro 구독 중이에요
            </AppText>
          </View>
        )}

        <View
          style={{
            backgroundColor: c.surfaceSubtle,
            borderRadius: radius.lg,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.card,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <View style={{ flex: 1 }} />
            <View style={{ width: 72, alignItems: 'center' }}>
              <AppText variant="caption" tone="tertiary" style={{ fontWeight: '700' }}>
                Free
              </AppText>
            </View>
            <View style={{ width: 72, alignItems: 'center' }}>
              <AppText variant="caption" style={{ fontWeight: '700', color: c.primary }}>
                Pro
              </AppText>
            </View>
          </View>

          {FEATURES.map((feat, i) => (
            <View key={feat.label}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.card,
                }}
              >
                <AppText variant="body" style={{ flex: 1 }}>
                  {feat.label}
                </AppText>
                <View style={{ width: 72, alignItems: 'center' }}>
                  <CheckOrText value={feat.free} />
                </View>
                <View style={{ width: 72, alignItems: 'center' }}>
                  <CheckOrText value={feat.pro} accent />
                </View>
              </View>
              {i < FEATURES.length - 1 && (
                <View style={{ height: 1, backgroundColor: c.borderNeutral, marginLeft: spacing.card }} />
              )}
            </View>
          ))}
        </View>

        {!isPro && (
          <View style={{ gap: spacing.md }}>
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: c.ink,
                borderRadius: radius.lg,
                paddingVertical: spacing.item,
                alignItems: 'center',
                opacity: pressed ? 0.88 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel="Pro 구독하기"
            >
              <AppText variant="body" style={{ color: c.surface, fontWeight: '700' }}>
                Pro 구독하기
              </AppText>
            </Pressable>
            <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
              구독은 언제든 해지할 수 있어요
            </AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
