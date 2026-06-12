import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingGroup } from '@/components/SettingGroup';
import { WheelPicker } from '@/components/WheelPicker';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { type ThemeMode, useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';

const HEIGHT_VALUES = Array.from({ length: 101 }, (_, i) => i + 120);
const WEIGHT_VALUES = Array.from({ length: 151 }, (_, i) => i + 30);
const AGE_VALUES = Array.from({ length: 83 }, (_, i) => i + 10);

type PickerType = 'height' | 'weight' | 'targetWeight' | 'age' | null;

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: '시스템' },
  { mode: 'light', label: '라이트' },
  { mode: 'dark', label: '다크' },
];

function SettingRow({
  label,
  value,
  onPress,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.card,
        paddingVertical: spacing.item,
        opacity: pressed && onPress ? 0.7 : 1,
      })}
    >
      <AppText variant="body" tone={danger ? 'tertiary' : 'primary'} style={danger ? { color: c.danger } : {}}>
        {label}
      </AppText>
      {value !== undefined && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText variant="body" tone="tertiary">
            {value}
          </AppText>
          {onPress && <AppIcon name="ChevronRight" size={16} color={c.inkTertiary} />}
        </View>
      )}
    </Pressable>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
}) {
  const c = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.card,
        paddingVertical: 12,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <AppText variant="body">{label}</AppText>
        {description && (
          <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
            {description}
          </AppText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: c.surfaceMuted, true: c.ink }}
        thumbColor={c.surface}
      />
    </View>
  );
}

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

  function getPickerProps() {
    switch (pickerType) {
      case 'height':
        return { values: HEIGHT_VALUES, selected: profile.heightCm ?? 170, unit: 'cm', title: '키 선택' };
      case 'weight':
        return { values: WEIGHT_VALUES, selected: profile.weightKg ?? 70, unit: 'kg', title: '체중 선택' };
      case 'targetWeight':
        return { values: WEIGHT_VALUES, selected: profile.targetWeightKg ?? 65, unit: 'kg', title: '목표 체중 선택' };
      case 'age':
        return { values: AGE_VALUES, selected: profile.ageYears ?? 30, unit: '세', title: '나이 선택' };
      default:
        return { values: HEIGHT_VALUES, selected: 170, unit: '', title: '' };
    }
  }

  function handlePickerConfirm(value: number) {
    switch (pickerType) {
      case 'height': setHeight(value); break;
      case 'weight': setWeight(value); break;
      case 'targetWeight': setTargetWeight(value); break;
      case 'age': setAge(value); break;
    }
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

  const { values, selected, unit, title } = getPickerProps();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.screen,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <AppIcon name="X" size={20} />
        </Pressable>
        <AppText variant="title">설정</AppText>
      </View>

      <Divider />

      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionHeader title="신체 정보" variant="caption" />
        <SettingGroup>
          <SettingRow
            label="키"
            value={profile.heightCm ? `${profile.heightCm} cm` : '미설정'}
            onPress={() => setPickerType('height')}
          />
          <Divider />
          <SettingRow
            label="체중"
            value={profile.weightKg ? `${profile.weightKg} kg` : '미설정'}
            onPress={() => setPickerType('weight')}
          />
          <Divider />
          <SettingRow
            label="목표 체중"
            value={profile.targetWeightKg ? `${profile.targetWeightKg} kg` : '미설정'}
            onPress={() => setPickerType('targetWeight')}
          />
          <Divider />
          <SettingRow
            label="나이"
            value={profile.ageYears ? `${profile.ageYears}세` : '미설정'}
            onPress={() => setPickerType('age')}
          />
          <Divider />
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.card,
              paddingVertical: spacing.item,
            }}
          >
            <AppText variant="body">성별</AppText>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([{ label: '남성', value: true }, { label: '여성', value: false }] as const).map(({ label, value }) => (
                <Pressable
                  key={label}
                  onPress={() => setIsMale(value)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: profile.isMale === value ? c.ink : c.border,
                    backgroundColor: profile.isMale === value ? c.surfaceSubtle : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <AppText
                    variant="caption"
                    tone={profile.isMale === value ? 'primary' : 'tertiary'}
                    style={profile.isMale === value ? { fontWeight: '700' } : {}}
                  >
                    {label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </SettingGroup>

        <SectionHeader title="화면" variant="caption" />
        <SettingGroup>
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              paddingHorizontal: spacing.card,
              paddingVertical: 12,
            }}
          >
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.mode}
                onPress={() => setThemeMode(opt.mode)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: themeMode === opt.mode ? c.ink : c.border,
                  backgroundColor: themeMode === opt.mode ? c.surfaceSubtle : 'transparent',
                  alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <AppText
                  variant="caption"
                  tone={themeMode === opt.mode ? 'primary' : 'tertiary'}
                  style={themeMode === opt.mode ? { fontWeight: '700' } : {}}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </SettingGroup>

        <SectionHeader title="알림" variant="caption" />
        <SettingGroup>
          <ToggleRow
            label="단식 알림바"
            description="단식 중 알림 바에 진행 상황을 표시해요"
            value={foregroundServiceEnabled}
            onToggle={toggleForegroundService}
          />
          <Divider />
          <ToggleRow
            label="루틴 리마인더"
            description="루틴에 설정된 시간에 알림을 보내드려요"
            value={routineNotificationsEnabled}
            onToggle={() => setRoutineNotifications(!routineNotificationsEnabled)}
          />
          <Divider />
          <ToggleRow
            label="할일 마감 알림"
            description="마감일 당일 오전 9시에 알려드려요"
            value={todoNotificationsEnabled}
            onToggle={() => setTodoNotifications(!todoNotificationsEnabled)}
          />
        </SettingGroup>

        <SectionHeader title="데이터" variant="caption" />
        <SettingGroup>
          <SettingRow label="전체 데이터 초기화" onPress={handleDataReset} danger />
        </SettingGroup>

        <View style={{ height: 40 }} />
      </ScrollView>

      <WheelPicker
        visible={pickerType !== null}
        title={title}
        values={values}
        selectedValue={selected}
        unit={unit}
        onConfirm={handlePickerConfirm}
        onClose={() => setPickerType(null)}
      />
    </SafeAreaView>
  );
}
