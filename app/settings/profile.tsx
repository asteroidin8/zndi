import { useState } from 'react';

import { DecimalWheelPicker } from '@/components/settings/DecimalWheelPicker';
import {
  SettingChoiceRow,
  SettingRow,
  SettingSection,
  SettingsScaffold,
} from '@/components/settings';
import { WheelPicker } from '@/components/WheelPicker';
import { useUserStore } from '@/stores/useUserStore';
import { formatMetric } from '@/utils/formatMetric';

const AGE_VALUES = Array.from({ length: 83 }, (_, i) => i + 10);

type PickerType = 'height' | 'weight' | 'targetWeight' | 'age' | null;

const METRIC_LIMITS = {
  height: { min: 120, max: 220, defaultValue: 170, unit: 'cm', title: '키 선택' },
  weight: { min: 30, max: 180, defaultValue: 70, unit: 'kg', title: '체중 선택' },
  targetWeight: { min: 30, max: 180, defaultValue: 65, unit: 'kg', title: '목표 체중 선택' },
} as const;

export default function SettingsProfileScreen() {
  const { profile, setHeight, setWeight, setTargetWeight, setAge, setIsMale } = useUserStore();
  const [pickerType, setPickerType] = useState<PickerType>(null);

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

  const decimalPicker = getDecimalPickerProps();
  const isAgePicker = pickerType === 'age';
  const isDecimalPicker =
    pickerType === 'height' || pickerType === 'weight' || pickerType === 'targetWeight';

  return (
    <SettingsScaffold title="프로필">
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
    </SettingsScaffold>
  );
}
