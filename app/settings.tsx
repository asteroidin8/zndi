import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { InfoBanner } from '@/components/InfoBanner';
import {
  DecimalWheelPicker,
  SettingChoiceRow,
  SettingDestructiveRow,
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
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { type ThemeMode, useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { formatMetric } from '@/utils/formatMetric';
import { requestNotificationPermission } from '@/utils/notificationPermission';
import { isProfileIncomplete } from '@/utils/profile';
import { cancelNotificationsByPrefix, NOTIFICATION_ID } from '@/utils/notifications';

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

  const isProfileBannerVisible = isProfileIncomplete(profile);

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
              useRoutineCompletionStore.persist.clearStorage(),
            ]);
            await cancelNotificationsByPrefix(NOTIFICATION_ID.routinePrefix);
            await cancelNotificationsByPrefix(NOTIFICATION_ID.todoPrefix);
            await Notifications.dismissNotificationAsync(NOTIFICATION_ID.fasting).catch(() => {});
            useFastingStore.setState({ status: 'idle', startedAt: null, records: [], goalHours: 16 });
            useRoutineStore.setState({ routines: [] });
            useTodoStore.setState({ todos: [], lastArchiveDate: null });
            useRoutineCompletionStore.setState({ completions: {} });
            useUserStore.setState({
              profile: {
                heightCm: null,
                weightKg: null,
                targetWeightKg: null,
                ageYears: null,
                isMale: null,
              },
            });
            useSettingsStore.setState({
              foregroundServiceEnabled: true,
              themeMode: 'system',
              routineNotificationsEnabled: false,
              todoNotificationsEnabled: false,
              onboardingCompleted: false,
              seenHints: {},
            });
          },
        },
      ],
    );
  }

  const decimalPicker = getDecimalPickerProps();
  const isAgePicker = pickerType === 'age';
  const isDecimalPicker =
    pickerType === 'height' || pickerType === 'weight' || pickerType === 'targetWeight';

  async function handleRoutineNotifications(enabled: boolean) {
    if (enabled && !(await requestNotificationPermission())) return;
    setRoutineNotifications(enabled);
  }

  async function handleTodoNotifications(enabled: boolean) {
    if (enabled && !(await requestNotificationPermission())) return;
    setTodoNotifications(enabled);
  }

  async function handleForegroundServiceToggle() {
    if (!foregroundServiceEnabled && !(await requestNotificationPermission())) return;
    toggleForegroundService();
  }

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
        {isProfileBannerVisible && (
          <InfoBanner
            title="프로필을 완성해 주세요"
            description="키·체중·나이·성별을 입력하면 단식 칼로리 계산이 가능해요."
          />
        )}

        <SettingSection title="신체 정보">
          <SettingRow
            label="키"
            value={formatMetric(profile.heightCm, 'cm')}
            unset={profile.heightCm == null}
            onPress={() => setPickerType('height')}
          />
          <SettingRow
            label="체중"
            value={formatMetric(profile.weightKg, 'kg')}
            unset={profile.weightKg == null}
            onPress={() => setPickerType('weight')}
          />
          <SettingRow
            label="목표 체중"
            value={formatMetric(profile.targetWeightKg, 'kg')}
            unset={profile.targetWeightKg == null}
            onPress={() => setPickerType('targetWeight')}
          />
          <SettingRow
            label="나이"
            value={profile.ageYears != null ? `${profile.ageYears}세` : '미설정'}
            unset={profile.ageYears == null}
            onPress={() => setPickerType('age')}
          />
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
        </SettingSection>

        <SettingSection title="알림">
          <SettingToggleRow
            label="단식 알림바"
            description="단식 중 알림 바에 진행 상황을 표시해요"
            value={foregroundServiceEnabled}
            onToggle={() => {
              handleForegroundServiceToggle();
            }}
          />
          <SettingToggleRow
            label="루틴 리마인더"
            description="루틴에 설정된 시간에 알림을 보내드려요"
            value={routineNotificationsEnabled}
            onToggle={handleRoutineNotifications}
          />
          <SettingToggleRow
            label="할일 마감 알림"
            description="마감일 당일 오전 9시에 알려드려요"
            value={todoNotificationsEnabled}
            onToggle={handleTodoNotifications}
          />
        </SettingSection>

        <SettingSection
          title="데이터"
          footer="단식·루틴·할 일 기록과 프로필, 앱 설정이 모두 삭제됩니다."
        >
          <SettingDestructiveRow label="전체 데이터 초기화" onPress={handleDataReset} />
        </SettingSection>

        <SettingSection title="앱 정보">
          <SettingRow label="이용약관" onPress={() => router.push('/terms')} />
          <SettingRow label="개인정보처리방침" onPress={() => router.push('/privacy')} />
          <SettingRow
            label="문의하기"
            onPress={() =>
              Linking.openURL('mailto:asteroidin8@gmail.com?subject=Routiner%20문의')
            }
          />
          <SettingRow
            label="버전"
            value={Constants.expoConfig?.version ?? '1.0.0'}
            showChevron={false}
          />
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
