import { View } from 'react-native';

import { AppText } from '../AppText';
import { SettingSegmentTrack, type SegmentOption } from './SettingSegmentTrack';
import {
  settingCompactRowStyle,
  settingRowLabelStyle,
  settingRowTrailingStyle,
} from './settingStyles';

type Props<T extends string | boolean> = {
  label: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  allowDeselect?: boolean;
};

export function SettingChoiceRow<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
  allowDeselect = false,
}: Props<T>) {
  return (
    <View style={settingCompactRowStyle()} accessibilityLabel={label}>
      <AppText variant="body" style={settingRowLabelStyle()} numberOfLines={1}>
        {label}
      </AppText>
      <View style={settingRowTrailingStyle()}>
        <SettingSegmentTrack
          layout="inline"
          options={options}
          value={value}
          onChange={onChange}
          allowDeselect={allowDeselect}
        />
      </View>
    </View>
  );
}
