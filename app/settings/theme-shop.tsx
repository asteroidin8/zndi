import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { ProLockModal } from '@/components/ProLockModal';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { GRASS_COLORS, GRASS_CELL_SKINS, getCellBorderRadius, getCellTransform } from '@/constants/grassTheme';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useProStore } from '@/stores/useProStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function ThemeShopScreen() {
  const c = useThemeColors();
  const { grassColor, setGrassColor, grassShape, setGrassShape } = useSettingsStore();
  const { isColorUnlocked, isShapeUnlocked } = useProStore();
  const [proLockVisible, setProLockVisible] = useState(false);

  const activeHex = GRASS_COLORS.find((p) => p.id === grassColor)?.hex ?? '#22C55E';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title="테마 상점" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.screen, gap: spacing.section }}
      >
        {/* 컬러 */}
        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>컬러</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {GRASS_COLORS.map((preset) => {
              const selected = grassColor === preset.id;
              const locked = !isColorUnlocked(preset.id);
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => {
                    if (locked) { setProLockVisible(true); return; }
                    setGrassColor(preset.id);
                  }}
                  style={{
                    alignItems: 'center',
                    gap: 4,
                    padding: 6,
                    borderRadius: radius.md,
                    borderWidth: selected ? 2 : 0,
                    borderColor: selected ? preset.hex : 'transparent',
                    opacity: locked ? 0.4 : 1,
                  }}
                >
                  <View style={{ position: 'relative' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: preset.hex }} />
                    {locked && (
                      <View style={{ position: 'absolute', top: -4, right: -4 }}>
                        <AppIcon name="Lock" size={12} color={c.inkTertiary} />
                      </View>
                    )}
                  </View>
                  <AppText variant="caption" tone={selected ? 'secondary' : 'tertiary'} style={{ fontSize: 10, fontWeight: selected ? '700' : '400' }}>
                    {preset.name}
                  </AppText>
                  {preset.price != null && locked && (
                    <AppText variant="caption" tone="disabled" style={{ fontSize: 8 }}>
                      {preset.price.toLocaleString()}
                    </AppText>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 셀 모양 */}
        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>셀 모양</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {GRASS_CELL_SKINS.map((skin) => {
              const selected = grassShape === skin.id;
              const locked = !isShapeUnlocked(skin.id);
              const previewSize = 28;
              const previewRadius = getCellBorderRadius(skin.id, previewSize);
              const transform = getCellTransform(skin.id);
              const displaySize = skin.id === 'diamond' ? 20 : previewSize;
              return (
                <Pressable
                  key={skin.id}
                  onPress={() => {
                    if (locked) { setProLockVisible(true); return; }
                    setGrassShape(skin.id);
                  }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: spacing.md,
                    borderRadius: radius.md,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? activeHex : c.border,
                    backgroundColor: selected ? `${activeHex}10` : 'transparent',
                    opacity: locked ? 0.4 : 1,
                  }}
                >
                  <View style={{ width: previewSize, height: previewSize, alignItems: 'center', justifyContent: 'center' }}>
                    <View
                      style={{
                        width: displaySize,
                        height: displaySize,
                        borderRadius: previewRadius,
                        backgroundColor: activeHex,
                        ...(transform.rotate ? { transform: [{ rotate: transform.rotate }] } : {}),
                      }}
                    />
                    {locked && (
                      <View style={{ position: 'absolute', top: -4, right: -6 }}>
                        <AppIcon name="Lock" size={12} color={c.inkTertiary} />
                      </View>
                    )}
                  </View>
                  <AppText variant="caption" style={{ fontSize: 10, fontWeight: selected ? '700' : '400', color: selected ? activeHex : c.inkTertiary }}>
                    {skin.name}
                  </AppText>
                  {skin.price != null && locked && (
                    <AppText variant="caption" tone="disabled" style={{ fontSize: 8 }}>
                      {skin.price.toLocaleString()}
                    </AppText>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

      </ScrollView>

      <ProLockModal
        visible={proLockVisible}
        onClose={() => setProLockVisible(false)}
        onGoToShop={() => router.push('/settings/membership')}
      />
    </SafeAreaView>
  );
}
