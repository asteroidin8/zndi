import { View } from 'react-native';

import { AppText } from '../AppText';
import { SettingSegmentTrack, type SegmentOption } from './SettingSegmentTrack';
import { settingRowStyle } from './settingStyles';

type Props<T extends string | boolean> = {
  label: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  allowDeselect?: boolean;
};

/** 리스트 row — 라벨 + 세그먼트 (신체 정보·성별) */
export function SettingChoiceRow<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
  allowDeselect = false,
}: Props<T>) {
  return (
    <View style={settingRowStyle()} accessibilityLabel={label}>
      <AppText variant="body" style={{ flexShrink: 0 }}>
        {label}
      </AppText>
      <SettingSegmentTrack
        layout="inline"
        options={options}
        value={value}
        onChange={onChange}
        allowDeselect={allowDeselect}
      />
    </View>
  );
}
