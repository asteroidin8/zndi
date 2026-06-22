import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from './AppText';
import { motion } from '@/constants/motion';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { type AlertButton, useAlertStore } from '@/stores/useAlertStore';

export function AppAlert() {
  const c = useThemeColors();
  const { visible, title, message, buttons, hide } = useAlertStore();

  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const translateY = useSharedValue(16);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 180 });
      scale.value = withSpring(1, motion.spring.gentle);
      translateY.value = withSpring(0, motion.spring.gentle);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 140 });
      scale.value = withTiming(0.92, { duration: 140 });
      translateY.value = withTiming(16, { duration: 140 });
    }
  }, [visible, backdropOpacity, scale, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!visible) return null;

  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const actionBtns = buttons.filter((b) => b.style !== 'cancel');

  function handlePress(btn: AlertButton) {
    hide();
    btn.onPress?.();
  }

  const hasDanger = actionBtns.some((b) => b.style === 'destructive');

  return (
    <Modal visible transparent animationType="none" onRequestClose={hide}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={hide} accessibilityLabel="닫기" />
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
          <View style={{ padding: spacing.screen, gap: spacing.sm }}>
            <AppText variant="body" style={{ fontWeight: '700' }}>
              {title}
            </AppText>
            {message ? (
              <AppText variant="caption" tone="secondary" style={{ lineHeight: 20 }}>
                {message}
              </AppText>
            ) : null}
          </View>

          <View style={{ height: 1, backgroundColor: c.borderNeutral }} />

          <View
            style={{
              flexDirection: actionBtns.length > 1 ? 'column' : 'row',
              ...(actionBtns.length <= 1 ? {} : {}),
            }}
          >
            {actionBtns.length <= 1 ? (
              <>
                {cancelBtn && (
                  <Pressable
                    onPress={() => handlePress(cancelBtn)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: spacing.item,
                      alignItems: 'center',
                      opacity: pressed ? 0.6 : 1,
                      borderRightWidth: actionBtns.length > 0 ? 1 : 0,
                      borderRightColor: c.borderNeutral,
                    })}
                  >
                    <AppText variant="body" tone="tertiary" style={{ fontWeight: '600' }}>
                      {cancelBtn.text}
                    </AppText>
                  </Pressable>
                )}
                {actionBtns.map((btn, i) => (
                  <Pressable
                    key={i}
                    onPress={() => handlePress(btn)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: spacing.item,
                      alignItems: 'center',
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <AppText
                      variant="body"
                      style={{
                        fontWeight: '700',
                        color: btn.style === 'destructive' ? c.danger : c.primary,
                      }}
                    >
                      {btn.text}
                    </AppText>
                  </Pressable>
                ))}
                {!cancelBtn && actionBtns.length === 0 && (
                  <Pressable
                    onPress={hide}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: spacing.item,
                      alignItems: 'center',
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <AppText variant="body" style={{ fontWeight: '700', color: c.primary }}>
                      확인
                    </AppText>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                {actionBtns.map((btn, i) => (
                  <View key={i}>
                    <Pressable
                      onPress={() => handlePress(btn)}
                      style={({ pressed }) => ({
                        paddingVertical: spacing.item,
                        alignItems: 'center',
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <AppText
                        variant="body"
                        style={{
                          fontWeight: '600',
                          color: btn.style === 'destructive' ? c.danger : c.ink,
                        }}
                      >
                        {btn.text}
                      </AppText>
                    </Pressable>
                    <View style={{ height: 1, backgroundColor: c.borderNeutral }} />
                  </View>
                ))}
                {cancelBtn && (
                  <Pressable
                    onPress={() => handlePress(cancelBtn)}
                    style={({ pressed }) => ({
                      paddingVertical: spacing.item,
                      alignItems: 'center',
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <AppText variant="body" tone="tertiary" style={{ fontWeight: '600' }}>
                      {cancelBtn.text}
                    </AppText>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
