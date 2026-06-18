import { View } from 'react-native';

import { AppText } from '../AppText';
import { SettingsList } from './SettingsList';
import { spacing } from '@/constants/spacing';

type Props = {
  title: string;
  footer?: string;
  children: React.ReactNode;
};

export function SettingSectionTitle({ title }: { title: string }) {
  if (!title) return null;

  return (
    <AppText
      variant="caption"
      tone="tertiary"
      style={{ fontSize: 13, fontWeight: '500', paddingHorizontal: 2 }}
    >
      {title}
    </AppText>
  );
}

export function SettingSection({ title, footer, children }: Props) {
  return (
    <View
      style={{
        gap: title ? spacing.settingsTitle : 0,
        marginBottom: spacing.settingsSection,
      }}
    >
      <SettingSectionTitle title={title} />
      <SettingsList>{children}</SettingsList>
      {footer ? (
        <AppText
          variant="caption"
          tone="tertiary"
          style={{ fontSize: 13, lineHeight: 17, paddingHorizontal: 2, marginTop: spacing.xs }}
        >
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}
