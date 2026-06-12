import * as Haptics from 'expo-haptics';

export function feedbackComplete() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function feedbackUncomplete() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function feedbackDelete() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function feedbackSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function feedbackBooster() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export function feedbackTabSwitch() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
