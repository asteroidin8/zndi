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
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" tone="tertiary">
        {title}
      </AppText>
      <SettingsList>{children}</SettingsList>
      {footer && (
        <AppText variant="caption" tone="tertiary" style={{ lineHeight: 17, paddingTop: spacing.xs }}>
          {footer}
        </AppText>
      )}
    </View>
  );
}
