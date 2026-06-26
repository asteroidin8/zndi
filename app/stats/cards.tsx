import { Pressable, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { type StatsCardEntry, type StatsCardId, useStatsCardStore } from '@/stores/useStatsCardStore';

const CARD_META: Record<StatsCardId, { icon: string; label: string }> = {
  insights: { icon: 'Lightbulb', label: '분석' },
  fasting: { icon: 'Timer', label: '단식' },
  routine: { icon: 'RotateCcw', label: '루틴' },
  todo: { icon: 'ListTodo', label: '할일' },
  weight: { icon: 'Scale', label: '체중 목표' },
};

export default function StatsCardsEditScreen() {
  const c = useThemeColors();
  const { cards, setCards, toggleCard, resetCards } = useStatsCardStore();

  function handleDragEnd({ data }: { data: StatsCardEntry[] }) {
    setCards(data);
  }

  function renderItem({ item, drag }: RenderItemParams<StatsCardEntry>) {
    const meta = CARD_META[item.id];
    return (
      <ScaleDecorator activeScale={1.02}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surfaceSubtle,
            borderRadius: radius.md,
            padding: spacing.card,
            marginBottom: spacing.sm,
            marginHorizontal: spacing.screen,
            gap: spacing.md,
          }}
        >
          <Pressable onLongPress={drag} hitSlop={8} style={{ padding: 4 }}>
            <AppIcon name="GripVertical" size={18} color={c.inkDisabled} />
          </Pressable>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: c.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name={meta.icon as never} size={18} color={c.primary} />
          </View>
          <AppText variant="body" style={{ flex: 1, fontWeight: '600' }}>
            {meta.label}
          </AppText>
          <Switch
            value={item.visible}
            onValueChange={() => toggleCard(item.id)}
            trackColor={{ false: c.surfaceMuted, true: c.primary }}
            thumbColor="#fff"
          />
        </View>
      </ScaleDecorator>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title="카드 편집" onBack={() => router.back()} />

      <AppText
        variant="caption"
        tone="tertiary"
        style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.md }}
      >
        길게 눌러 순서를 변경하고, 토글로 표시 여부를 설정하세요
      </AppText>

      <DraggableFlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        containerStyle={{ flex: 1 }}
      />

      <View style={{ padding: spacing.screen, paddingBottom: spacing.section }}>
        <Pressable
          onPress={resetCards}
          style={{
            alignItems: 'center',
            paddingVertical: 12,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <AppText variant="body" tone="secondary">
            기본값으로 초기화
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
