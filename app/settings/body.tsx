import { useState } from 'react';

import { DecimalWheelPicker } from '@/components/settings/DecimalWheelPicker';
import {
  SettingOptionSheet,
  SettingRow,
  SettingSection,
  SettingsScaffold,
} from '@/components/settings';
import { WheelPicker } from '@/components/WheelPicker';
import { GENDER_OPTIONS, getGenderLabel } from '@/constants/settingsOptions';
import { useUserStore } from '@/stores/useUserStore';
import { formatMetric } from '@/utils/formatMetric';

const AGE_VALUES = Array.from({ length: 83 }, (_, i) => i + 10);

type PickerType = 'height' | 'weight' | 'targetWeight' | 'age' | null;

const METRIC_LIMITS = {
  height: { min: 120, max: 220, defaultValue: 170, unit: 'cm', title: '키 선택' },
  weight: { min: 30, max: 180, defaultValue: 70, unit: 'kg', title: '체중 선택' },
  targetWeight: { min: 30, max: 180, defaultValue: 65, unit: 'kg', title: '목표 체중 선택' },
} as const;

export default function SettingsBodyScreen() {
  const { profile, setHeight, setWeight, setTargetWeight, setAge, setIsMale } = useUserStore();
  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [genderSheetVisible, setGenderSheetVisible] = useState(false);

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
    <SettingsScaffold title="신체 정보">
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
        <SettingRow
          label="성별"
          value={getGenderLabel(profile.isMale)}
          unset={profile.isMale == null}
          onPress={() => setGenderSheetVisible(true)}
        />
      </SettingSection>

      <SettingOptionSheet
        visible={genderSheetVisible}
        title="성별"
        options={GENDER_OPTIONS}
        selectedValue={profile.isMale}
        onSelect={setIsMale}
        onClose={() => setGenderSheetVisible(false)}
      />

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
