import { useCallback } from 'react';
import { Pressable, Share, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { QRCode } from './QRCode';
import { SheetModal } from './SheetModal';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  value: string;
  copyLabel?: string;
};

export function QRModal({ visible, onClose, title, subtitle, value, copyLabel }: Props) {
  const c = useThemeColors();

  const handleShare = useCallback(async () => {
    await Share.share({ message: copyLabel ?? value });
  }, [value, copyLabel]);

  return (
    <SheetModal visible={visible} onClose={onClose} title={title}>
      <View style={{ alignItems: 'center', gap: spacing.section }}>
        {subtitle && (
          <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
            {subtitle}
          </AppText>
        )}

        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: radius.lg,
            padding: spacing.section,
          }}
        >
          <QRCode value={value} size={200} />
        </View>

        {copyLabel && (
          <Pressable
            onPress={handleShare}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.card,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: c.surfaceSubtle,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <AppText variant="body" style={{ fontWeight: '700', letterSpacing: 2 }}>
              {copyLabel}
            </AppText>
            <AppIcon name="Share2" size={16} color={c.inkTertiary} />
          </Pressable>
        )}
      </View>
    </SheetModal>
  );
}
