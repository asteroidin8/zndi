import { useCallback, useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { QRCode } from './QRCode';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { appAlert } from '@/stores/useAlertStore';
import { feedbackShare } from '@/utils/microFeedback';

const ENTER = { duration: 200 };
const EXIT = { duration: 150 };

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
  const qrRef = useRef<View>(null);

  const backdropOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.97);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, ENTER);
      cardOpacity.value = withTiming(1, ENTER);
      cardScale.value = withTiming(1, ENTER);
    } else {
      backdropOpacity.value = withTiming(0, EXIT);
      cardOpacity.value = withTiming(0, EXIT);
      cardScale.value = withTiming(0.97, EXIT);
    }
  }, [visible, backdropOpacity, cardOpacity, cardScale]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const handleShare = useCallback(async () => {
    if (!qrRef.current) return;
    try {
      const uri = await captureRef(qrRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        feedbackShare();
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'QR 코드 공유' });
      }
    } catch {
      appAlert('공유 실패', '이미지를 생성하는 중 문제가 발생했어요.');
    }
  }, []);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', pointerEvents: 'box-none' }}>
        <Animated.View
          style={[
            {
              backgroundColor: c.surface,
              borderRadius: radius.xl,
              width: '82%',
              maxWidth: 320,
              borderWidth: 1,
              borderColor: c.border,
              overflow: 'hidden',
            },
            cardStyle,
          ]}
        >
          <View style={{ padding: spacing.screen, gap: spacing.md, alignItems: 'center' }}>
            <AppText variant="body" style={{ fontWeight: '700' }}>
              {title}
            </AppText>

            {subtitle && (
              <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
                {subtitle}
              </AppText>
            )}

            <View
              ref={qrRef}
              collapsable={false}
              style={{
                backgroundColor: '#fff',
                borderRadius: radius.lg,
                padding: spacing.card,
              }}
            >
              <QRCode value={value} size={180} />
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

          <View style={{ height: 1, backgroundColor: c.surfaceMuted }} />

          <Pressable
            onPress={onClose}
            style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
          >
            {({ pressed }) => (
              <AppText variant="body" style={{ fontWeight: '700', color: c.primary, opacity: pressed ? 0.5 : 1 }}>
                닫기
              </AppText>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
