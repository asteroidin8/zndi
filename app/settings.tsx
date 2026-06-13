import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import {
  DecimalWheelPicker,
  SettingChoiceRow,
  SettingDestructiveRow,
  SettingInsetDivider,
  SettingRow,
  SettingSection,
  SettingSegmentTrack,
  SettingToggleRow,
} from '@/components/settings';
import { Divider } from '@/components/Divider';
import { WheelPicker } from '@/components/WheelPicker';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { type ThemeMode, useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { formatMetric } from '@/utils/formatMetric';

const AGE_VALUES = Array.from({ length: 83 }, (_, i) => i + 10);

type PickerType = 'height' | 'weight' | 'targetWeight' | 'age' | null;

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: 'Monitor' | 'Sun' | 'Moon' }[] = [
  { mode: 'system', label: '시스템', icon: 'Monitor' },
  { mode: 'light', label: '라이트', icon: 'Sun' },
  { mode: 'dark', label: '다크', icon: 'Moon' },
];

const METRIC_LIMITS = {
  height: { min: 120, max: 220, defaultValue: 170, unit: 'cm', title: '키 선택' },
  weight: { min: 30, max: 180, defaultValue: 70, unit: 'kg', title: '체중 선택' },
  targetWeight: { min: 30, max: 180, defaultValue: 65, unit: 'kg', title: '목표 체중 선택' },
} as const;

export default function SettingsScreen() {
  const c = useThemeColors();
  const { profile, setHeight, setWeight, setTargetWeight, setAge, setIsMale } = useUserStore();
  const {
    foregroundServiceEnabled,
    toggleForegroundService,
    themeMode,
    setThemeMode,
    routineNotificationsEnabled,
    setRoutineNotifications,
    todoNotificationsEnabled,
    setTodoNotifications,
  } = useSettingsStore();
  const [pickerType, setPickerType] = useState<PickerType>(null);

  const isProfileIncomplete =
    profile.heightCm == null || profile.weightKg == null || profile.ageYears == null || profile.isMale == null;

  function getDecimalPickerProps() {
    switch (pickerType) {
      case 'height':
        return { ...METRIC_LIMITS.height, selected: profile.heightCm ?? METRIC_LIMITS.height.defaultValue };
      case 'weight':
        return { ...METRIC_LIMITS.weight, selected: profile.weightKg ?? METRIC_LIMITS.weight.defaultValue };
      case 'targetWeight':
        return {
          ...METRIC_LIMITS.targetWeight,
          selected: profile.targetWeightKg ?? METRIC_LIMITS.targetWeight.defaultValue,
        };
      default:
        return { ...METRIC_LIMITS.height, selected: METRIC_LIMITS.height.defaultValue };
    }
  }

  function handleDecimalConfirm(value: number) {
    switch (pickerType) {
      case 'height':
        setHeight(value);
        break;
      case 'weight':
        setWeight(value);
        break;
      case 'targetWeight':
        setTargetWeight(value);
        break;
    }
    setPickerType(null);
  }

  function handleAgeConfirm(value: number) {
    setAge(value);
    setPickerType(null);
  }

  function handleDataReset() {
    Alert.alert(
      '데이터 전체 초기화',
      '모든 단식 기록, 루틴, 투두, 설정이 삭제됩니다.\n이 작업은 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            await Promise.all([
              useFastingStore.persist.clearStorage(),
              useRoutineStore.persist.clearStorage(),
              useTodoStore.persist.clearStorage(),
              useUserStore.persist.clearStorage(),
              useSettingsStore.persist.clearStorage(),
            ]);
            useFastingStore.setState({ status: 'idle', startedAt: null, records: [], goalHours: 16 });
            useRoutineStore.setState({ routines: [] });
            useTodoStore.setState({ todos: [], lastArchiveDate: null });
            useUserStore.setState({
              profile: {
                heightCm: null,
                weightKg: null,
                targetWeightKg: null,
                ageYears: null,
                isMale: null,
              },
            });
            useSettingsStore.setState({ foregroundServiceEnabled: true, themeMode: 'system' });
          },
        },
      ],
    );
  }

  const decimalPicker = getDecimalPickerProps();
  const isAgePicker = pickerType === 'age';
  const isDecimalPicker =
    pickerType === 'height' || pickerType === 'weight' || pickerType === 'targetWeight';

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
          accessibilityLabel="닫기"
        >
          <AppIcon name="X" size={20} color={c.ink} />
        </Pressable>
        <AppText variant="title" style={{ flex: 1 }}>
          설정
        </AppText>
      </View>

      <Divider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.screen,
          gap: spacing.section,
          paddingBottom: spacing.section * 2,
        }}
      >
        {isProfileIncomplete && (
          <Card
            style={{
              borderLeftWidth: 3,
              borderLeftColor: c.inkTertiary,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <AppIcon name="UserCircle" size={18} color={c.inkTertiary} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <AppText variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
                  프로필을 완성해 주세요
                </AppText>
                <AppText variant="caption" tone="tertiary" style={{ lineHeight: 17 }}>
                  키·체중·나이·성별을 입력하면 단식 칼로리 계산이 가능해요.
                </AppText>
              </View>
            </View>
          </Card>
        )}

        <SettingSection title="신체 정보">
          <SettingRow
            label="키"
            value={formatMetric(profile.heightCm, 'cm')}
            unset={profile.heightCm == null}
            onPress={() => setPickerType('height')}
          />
          <SettingInsetDivider />
          <SettingRow
            label="체중"
            value={formatMetric(profile.weightKg, 'kg')}
            unset={profile.weightKg == null}
            onPress={() => setPickerType('weight')}
          />
          <SettingInsetDivider />
          <SettingRow
            label="목표 체중"
            value={formatMetric(profile.targetWeightKg, 'kg')}
            unset={profile.targetWeightKg == null}
            onPress={() => setPickerType('targetWeight')}
          />
          <SettingInsetDivider />
          <SettingRow
            label="나이"
            value={profile.ageYears != null ? `${profile.ageYears}세` : '미설정'}
            unset={profile.ageYears == null}
            onPress={() => setPickerType('age')}
          />
          <SettingInsetDivider />
          <SettingChoiceRow
            label="성별"
            allowDeselect
            value={profile.isMale}
            onChange={setIsMale}
            options={[
              { label: '남성', value: true },
              { label: '여성', value: false },
            ]}
          />
        </SettingSection>

        <SettingSection title="테마">
          <View style={{ padding: spacing.card }}>
            <SettingSegmentTrack
              layout="full"
              value={themeMode}
              onChange={(mode) => {
                if (mode) setThemeMode(mode);
              }}
              options={THEME_OPTIONS.map((opt) => ({
                value: opt.mode,
                label: opt.label,
                icon: opt.icon,
              }))}
            />
          </View>
        </SettingSection>

        <SettingSection title="알림">
          <SettingToggleRow
            label="단식 알림바"
            description="단식 중 알림 바에 진행 상황을 표시해요"
            value={foregroundServiceEnabled}
            onToggle={(enabled) => {
              if (enabled !== foregroundServiceEnabled) toggleForegroundService();
            }}
          />
          <SettingInsetDivider />
          <SettingToggleRow
            label="루틴 리마인더"
            description="루틴에 설정된 시간에 알림을 보내드려요"
            value={routineNotificationsEnabled}
            onToggle={setRoutineNotifications}
          />
          <SettingInsetDivider />
          <SettingToggleRow
            label="할일 마감 알림"
            description="마감일 당일 오전 9시에 알려드려요"
            value={todoNotificationsEnabled}
            onToggle={setTodoNotifications}
          />
        </SettingSection>

        <SettingSection
          title="데이터"
          bare
          footer="단식·루틴·할 일 기록과 프로필, 앱 설정이 모두 삭제됩니다."
        >
          <SettingDestructiveRow label="전체 데이터 초기화" onPress={handleDataReset} />
        </SettingSection>
      </ScrollView>

      <DecimalWheelPicker
        visible={isDecimalPicker}
        min={decimalPicker.min}
        max={decimalPicker.max}
        selectedValue={decimalPicker.selected}
        unit={decimalPicker.unit}
        title={decimalPicker.title}
        onConfirm={handleDecimalConfirm}
        onClose={() => setPickerType(null)}
      />

      <WheelPicker
        visible={isAgePicker}
        title="나이 선택"
        values={AGE_VALUES}
        selectedValue={profile.ageYears ?? 30}
        unit="세"
        onConfirm={handleAgeConfirm}
        onClose={() => setPickerType(null)}
      />
    </SafeAreaView>
  );
}
