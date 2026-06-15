import { View } from 'react-native';

import { AppText } from '../AppText';
import { SettingsList } from './SettingsList';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  title: string;
  footer?: string;
  children: React.ReactNode;
};

export function SettingSection({ title, footer, children }: Props) {
  const c = useThemeColors();

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 }}>
        <View
          style={{
            width: 3,
            height: 12,
            borderRadius: 2,
            backgroundColor: c.primary,
          }}
        />
        <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600', letterSpacing: 0.2 }}>
          {title}
        </AppText>
      </View>
      <SettingsList>{children}</SettingsList>
      {footer && (
        <AppText variant="caption" tone="tertiary" style={{ lineHeight: 17, paddingTop: spacing.xs }}>
          {footer}
        </AppText>
      )}
    </View>
  );
}
