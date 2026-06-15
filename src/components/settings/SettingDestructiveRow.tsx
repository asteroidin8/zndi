import { Pressable } from 'react-native';

import { AppText } from '../AppText';
import { settingCompactRowStyle } from './settingStyles';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  label: string;
  onPress: () => void;
};

/** 설정 리스트 — 평소 중립, 확인 다이얼로그에서만 destructive */
export function SettingDestructiveRow({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        ...settingCompactRowStyle(),
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppText variant="body" tone="primary" style={{ fontWeight: '500' }} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}
