import { View } from 'react-native';

import { AppText } from '../AppText';
import { SettingsList } from './SettingsList';
import { spacing } from '@/constants/spacing';

type Props = {
  title: string;
  footer?: string;
  children: React.ReactNode;
};

export function SettingSection({ title, footer, children }: Props) {
  return (
    <View style={{ gap: spacing.settingsTitle, marginBottom: spacing.settingsSection }}>
      <AppText
        variant="caption"
        tone="tertiary"
        style={{ fontSize: 13, fontWeight: '500', paddingHorizontal: 2 }}
      >
        {title}
      </AppText>
      <SettingsList>{children}</SettingsList>
      {footer && (
        <AppText variant="caption" tone="tertiary" style={{ fontSize: 13, lineHeight: 17 }}>
          {footer}
        </AppText>
      )}
    </View>
  );
}
