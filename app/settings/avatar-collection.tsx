import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { PageHeader } from '@/components/settings/MyScreenUI';
import {
  AVATARS,
  AVATAR_TIERS,
  getAcquireLabel,
  type AvatarDef,
  type AvatarTier,
} from '@/constants/avatars';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAvatarStore } from '@/stores/useAvatarStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { useAuth } from '@/contexts/AuthProvider';
import { updateAvatarInCloud } from '@/services/sync/cloudSync';
import { computeQuestValue } from '@/utils/questUnlock';

function AvatarCell({ avatar, owned, equipped, questCurrent, onPress }: {
  avatar: AvatarDef;
  owned: boolean;
  equipped: boolean;
  questCurrent?: number;
  onPress: () => void;
}) {
  const c = useThemeColors();

  function getBottomLabel(): string {
    if (owned) return avatar.nameEn;
    if (avatar.acquire !== 'quest' || !avatar.questCondition) return getAcquireLabel(avatar);
    const q = avatar.questCondition;
    if (q.type === 'dateEvent') return q.label;
    const cur = Math.min(Math.floor(questCurrent ?? 0), q.target);
    return `${cur}/${q.target}${q.unit}`;
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        gap: 4,
        padding: 8,
        borderRadius: radius.lg,
        backgroundColor: c.surfaceCard,
        borderWidth: equipped ? 2 : 0,
        borderColor: equipped ? AVATAR_TIERS[avatar.tier].color : 'transparent',
        opacity: owned ? 1 : 0.5,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: owned ? avatar.bgColor : c.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {owned ? (
          <AppText style={{ fontSize: 28 }}>{avatar.emoji}</AppText>
        ) : (
          <AppIcon name="HelpCircle" size={24} color={c.inkDisabled} />
        )}
      </View>
      <AppText
        variant="caption"
        style={{ fontWeight: '600', fontSize: 11, textAlign: 'center' }}
        numberOfLines={1}
      >
        {owned ? avatar.name : '???'}
      </AppText>
      <AppText variant="caption" tone="disabled" style={{ fontSize: 9 }} numberOfLines={1}>
        {getBottomLabel()}
      </AppText>
      {equipped && (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: AVATAR_TIERS[avatar.tier].color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="Check" size={10} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

function TierSection({ tier, avatars, ownedIds, equippedId, questProgressMap, onSelect }: {
  tier: AvatarTier;
  avatars: AvatarDef[];
  ownedIds: string[];
  equippedId: string | null;
  questProgressMap: Map<string, number>;
  onSelect: (avatar: AvatarDef) => void;
}) {
  const c = useThemeColors();
  const info = AVATAR_TIERS[tier];
  const ownedCount = avatars.filter((a) => ownedIds.includes(a.id)).length;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 12,
            backgroundColor: info.color,
          }}
        >
          <AppText variant="caption" style={{ color: '#fff', fontWeight: '700', fontSize: 10, letterSpacing: 1 }}>
            {info.badge}
          </AppText>
        </View>
        <AppText variant="body" style={{ fontWeight: '700' }}>{info.label}</AppText>
        <AppText variant="caption" tone="tertiary" style={{ marginLeft: 'auto' }}>
          {ownedCount}/{avatars.length}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {avatars.map((avatar) => (
          <View key={avatar.id} style={{ width: '23%' }}>
            <AvatarCell
              avatar={avatar}
              owned={ownedIds.includes(avatar.id)}
              equipped={equippedId === avatar.id}
              questCurrent={questProgressMap.get(avatar.id)}
              onPress={() => onSelect(avatar)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AvatarCollectionScreen() {
  const c = useThemeColors();
  const { ownedIds, equippedId, equip } = useAvatarStore();
  const { user } = useAuth();
  const equipped = equippedId;

  const completions = useRoutineCompletionStore((s) => s.completions);
  const todos = useTodoStore((s) => s.todos);
  const fastingRecords = useFastingStore((s) => s.records);

  const questProgressMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const avatar of AVATARS) {
      if (avatar.acquire !== 'quest' || !avatar.questCondition) continue;
      const { type, datePattern } = avatar.questCondition;
      map.set(avatar.id, computeQuestValue(type, datePattern));
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completions, todos, fastingRecords]);

  const grouped = useMemo(() => {
    const map: Record<AvatarTier, AvatarDef[]> = { sprout: [], flower: [], tree: [] };
    for (const a of AVATARS) map[a.tier].push(a);
    return map;
  }, []);

  const totalOwned = ownedIds.length;

  function handleSelect(avatar: AvatarDef) {
    if (!ownedIds.includes(avatar.id)) return;
    const newId = equippedId === avatar.id ? '' : avatar.id;
    equip(newId);
    if (user?.id) {
      void updateAvatarInCloud(user.id, newId || null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title="식물 도감" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.screen, gap: spacing.section }}
      >
        {/* 수집 현황 요약 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.md,
            padding: spacing.card,
            borderRadius: radius.lg,
            backgroundColor: c.surfaceCard,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <AppText variant="title" style={{ fontWeight: '800', color: c.primary }}>
              {totalOwned}
            </AppText>
            <AppText variant="caption" tone="tertiary">수집</AppText>
          </View>
          <View style={{ width: 1, height: 28, backgroundColor: c.borderNeutral }} />
          <View style={{ alignItems: 'center' }}>
            <AppText variant="title" style={{ fontWeight: '800' }}>
              {AVATARS.length}
            </AppText>
            <AppText variant="caption" tone="tertiary">전체</AppText>
          </View>
          <View style={{ width: 1, height: 28, backgroundColor: c.borderNeutral }} />
          <View style={{ alignItems: 'center' }}>
            <AppText variant="title" style={{ fontWeight: '800', color: c.accent }}>
              {Math.round((totalOwned / AVATARS.length) * 100)}%
            </AppText>
            <AppText variant="caption" tone="tertiary">완성도</AppText>
          </View>
        </View>

        {/* 범례 */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            paddingHorizontal: 4,
          }}
        >
          {[
            { color: '#6B8E5A', label: '무료' },
            { color: '#C07830', label: '퀘스트' },
            { color: '#E07040', label: '스트릭' },
            { color: '#5B8BD0', label: '시즌' },
          ].map(({ color, label }) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              <AppText variant="caption" tone="tertiary" style={{ fontSize: 11 }}>
                {label}
              </AppText>
            </View>
          ))}
        </View>

        {/* 티어별 그리드 */}
        {(['sprout', 'flower', 'tree'] as AvatarTier[]).map((tier) => (
          <TierSection
            key={tier}
            tier={tier}
            avatars={grouped[tier]}
            ownedIds={ownedIds}
            equippedId={equipped}
            questProgressMap={questProgressMap}
            onSelect={handleSelect}
          />
        ))}

        {/* 획득 가이드 */}
        <View
          style={{
            padding: spacing.card,
            borderRadius: radius.lg,
            backgroundColor: c.surfaceCard,
            gap: spacing.sm,
          }}
        >
          <AppText variant="body" style={{ fontWeight: '700' }}>획득 방법</AppText>
          <View style={{ gap: 6 }}>
            <AppText variant="caption" tone="secondary">
              🔥 스트릭 — 연속 달성일 마일스톤에서 자동 해금
            </AppText>
            <AppText variant="caption" tone="secondary">
              🎯 퀘스트 — 루틴·할일·단식 누적 달성 시 자동 해금
            </AppText>
            <AppText variant="caption" tone="secondary">
              🗓️ 이벤트 — 특정 날짜에 앱을 열면 자동 해금
            </AppText>
            <AppText variant="caption" tone="secondary">
              🌸 시즌 — 해당 계절에만 한정 등장
            </AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
