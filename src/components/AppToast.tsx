import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { radius } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { type ToastType, useToastStore } from '@/stores/useToastStore';

const ICONS: Record<ToastType, string> = {
  success: 'Check',
  error: 'AlertCircle',
  info: 'Info',
};

const DURATION = 2500;

export function AppToast() {
  const c = useThemeColors();
  const { visible, message, type, hide } = useToastStore();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-40);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 18 });
      timerRef.current = setTimeout(hide, DURATION);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(-40, { duration: 200 });
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, opacity, translateY, hide]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const iconColor = type === 'error' ? c.danger : type === 'success' ? c.primary : c.inkSecondary;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: c.surfaceSubtle, borderColor: c.borderNeutral },
        style,
      ]}
      pointerEvents="none"
    >
      <AppIcon name={ICONS[type] as never} size={16} color={iconColor} />
      <AppText variant="caption" style={{ flex: 1, color: c.ink }}>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 9999,
    elevation: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
});
