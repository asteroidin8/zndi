import * as Haptics from 'expo-haptics';

const { Light, Medium } = Haptics.ImpactFeedbackStyle;
const { Success, Warning } = Haptics.NotificationFeedbackType;

const impact = (style: Haptics.ImpactFeedbackStyle) =>
  Haptics.impactAsync(style).catch(() => {});

const notify = (type: Haptics.NotificationFeedbackType) =>
  Haptics.notificationAsync(type).catch(() => {});

export const feedbackComplete = () => impact(Medium);
export const feedbackUncomplete = () => impact(Light);
export const feedbackDelete = feedbackComplete;
export const feedbackSuccess = () => notify(Success);
export const feedbackBooster = () => notify(Warning);
export const feedbackTabSwitch = () => impact(Light);
export const feedbackShare = () => impact(Light);
export const feedbackSave = () => impact(Light);
export const feedbackVote = () => impact(Medium);
export const feedbackRefresh = () => impact(Light);
export const feedbackError = () => notify(Warning);
