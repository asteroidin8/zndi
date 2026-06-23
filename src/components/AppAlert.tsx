import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from './AppText';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { type AlertButton, useAlertStore } from '@/stores/useAlertStore';

const ENTER = { duration: 200 };
const EXIT = { duration: 150 };

export function AppAlert() {
  const c = useThemeColors();
  const { visible, title, message, buttons, prompt, hide } = useAlertStore();
  const [promptText, setPromptText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const backdropOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.97);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, ENTER);
      cardOpacity.value = withTiming(1, ENTER);
      cardScale.value = withTiming(1, ENTER);
      if (prompt) {
        setPromptText(prompt.defaultValue);
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    } else {
      backdropOpacity.value = withTiming(0, EXIT);
      cardOpacity.value = withTiming(0, EXIT);
      cardScale.value = withTiming(0.97, EXIT);
    }
  }, [visible, backdropOpacity, cardOpacity, cardScale, prompt]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  if (!visible) return null;

  function handlePress(btn: AlertButton) {
    hide();
    btn.onPress?.();
  }

  function handlePromptSubmit() {
    const trimmed = promptText.trim();
    if (!trimmed) return;
    hide();
    prompt?.onSubmit(trimmed);
  }

  // ── Prompt mode ──
  if (prompt) {
    return (
      <Modal visible transparent animationType="none" onRequestClose={hide}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={hide} />
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
            <View style={{ padding: spacing.screen, gap: spacing.md }}>
              <AppText variant="body" style={{ fontWeight: '700' }}>
                {title}
              </AppText>
              <TextInput
                ref={inputRef}
                value={promptText}
                onChangeText={setPromptText}
                placeholder={prompt.placeholder}
                placeholderTextColor={c.inkDisabled}
                returnKeyType="done"
                onSubmitEditing={handlePromptSubmit}
                style={{
                  borderWidth: 1,
                  borderColor: c.borderNeutral,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  color: c.ink,
                  fontSize: 15,
                }}
              />
            </View>

            <View style={{ height: 1, backgroundColor: c.borderNeutral }} />

            <View style={{ flexDirection: 'row' }}>
              <Pressable
                onPress={hide}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <AppText variant="body" tone="tertiary">취소</AppText>
              </Pressable>

              <View style={{ width: 1, backgroundColor: c.borderNeutral }} />

              <Pressable
                onPress={handlePromptSubmit}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <AppText variant="body" style={{ fontWeight: '700', color: c.primary }}>확인</AppText>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  // ── Alert mode ──
  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const actionBtns = buttons.filter((b) => b.style !== 'cancel');
  const isSideBySide = actionBtns.length <= 1;

  return (
    <Modal visible transparent animationType="none" onRequestClose={hide}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={hide} />
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

          {isSideBySide ? (
            <View style={{ flexDirection: 'row', minHeight: 48 }}>
              {cancelBtn ? (
                <Pressable
                  onPress={() => handlePress(cancelBtn)}
                  style={({ pressed }) => ({
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <AppText variant="body" tone="tertiary">
                    {cancelBtn.text}
                  </AppText>
                </Pressable>
              ) : null}
              {cancelBtn && actionBtns.length > 0 ? (
                <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: c.borderNeutral }} />
              ) : null}
              {actionBtns.map((btn, i) => (
                <Pressable
                  key={i}
                  onPress={() => handlePress(btn)}
                  style={({ pressed }) => ({
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: pressed ? 0.5 : 1,
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
              {!cancelBtn && actionBtns.length === 0 ? (
                <Pressable
                  onPress={hide}
                  style={({ pressed }) => ({
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <AppText variant="body" style={{ fontWeight: '700', color: c.primary }}>
                    확인
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View>
              {actionBtns.map((btn, i) => (
                <View key={i}>
                  <Pressable
                    onPress={() => handlePress(btn)}
                    style={({ pressed }) => ({
                      paddingVertical: 14,
                      alignItems: 'center',
                      opacity: pressed ? 0.5 : 1,
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
                    paddingVertical: 14,
                    alignItems: 'center',
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <AppText variant="body" tone="tertiary">
                    {cancelBtn.text}
                  </AppText>
                </Pressable>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
