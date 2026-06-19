import { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type SheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** true면 children을 ScrollView로 감싸지 않음 (DatePicker 등 자체 스크롤 컴포넌트용) */
  scrollable?: boolean;
};

export function SheetModal({ visible, onClose, title, headerRight, footer, children, scrollable = true }: SheetModalProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(280);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, { duration: 260 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 160 });
      sheetTranslateY.value = withTiming(280, { duration: 200 });
    }
  }, [visible, backdropOpacity, sheetTranslateY]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }, backdropStyle]}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          />
        </Animated.View>

        <Animated.View style={sheetStyle}>
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.sheet,
              borderTopRightRadius: radius.sheet,
              paddingTop: spacing.card,
              paddingBottom: Math.max(insets.bottom, spacing.card),
            }}
          >
            {title || headerRight ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.screen,
                  marginBottom: spacing.card,
                  gap: spacing.sm,
                }}
              >
                {title ? (
                  <AppText variant="title" style={{ flex: 1 }}>
                    {title}
                  </AppText>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                {headerRight}
              </View>
            ) : null}

            {scrollable ? (
              <ScrollView
                style={{ maxHeight: '60%' }}
                contentContainerStyle={{ paddingHorizontal: spacing.screen }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            ) : (
              <View style={{ paddingHorizontal: spacing.screen }}>{children}</View>
            )}

            {footer ? (
              <View
                style={{
                  marginTop: spacing.card,
                  paddingTop: spacing.card,
                  paddingHorizontal: spacing.screen,
                  borderTopWidth: 1,
                  borderTopColor: c.border,
                  gap: spacing.xs,
                }}
              >
                {footer}
              </View>
            ) : null}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function SheetPrimaryButton({ label, onPress, disabled }: ButtonProps) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? c.surfaceMuted : c.ink,
        borderRadius: radius.lg,
        paddingVertical: spacing.item,
        alignItems: 'center',
      }}
    >
      <AppText
        variant="body"
        style={{ color: disabled ? c.inkDisabled : c.surface, fontWeight: '700' }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function SheetDangerButton({ label, onPress }: Omit<ButtonProps, 'disabled'>) {
  const c = useThemeColors();
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: spacing.sm, alignItems: 'center' }}>
      <AppText variant="body" style={{ color: c.danger }}>
        {label}
      </AppText>
    </Pressable>
  );
}
