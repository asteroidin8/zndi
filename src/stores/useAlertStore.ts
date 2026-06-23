import { create } from 'zustand';

export type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type PromptConfig = {
  defaultValue: string;
  placeholder?: string;
  onSubmit: (text: string) => void;
};

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  prompt?: PromptConfig;
  show: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showPrompt: (title: string, config: PromptConfig) => void;
  hide: () => void;
};

export const useAlertStore = create<AlertState>()((set) => ({
  visible: false,
  title: '',
  message: undefined,
  buttons: [],
  prompt: undefined,
  show: (title, message, buttons) =>
    set({
      visible: true,
      title,
      message,
      buttons: buttons ?? [{ text: '확인' }],
      prompt: undefined,
    }),
  showPrompt: (title, config) =>
    set({
      visible: true,
      title,
      message: undefined,
      buttons: [],
      prompt: config,
    }),
  hide: () => set({ visible: false }),
}));

export function appAlert(title: string, message?: string, buttons?: AlertButton[]) {
  useAlertStore.getState().show(title, message, buttons);
}

export function appPrompt(
  title: string,
  defaultValue: string,
  onSubmit: (text: string) => void,
  placeholder?: string,
) {
  useAlertStore.getState().showPrompt(title, { defaultValue, placeholder, onSubmit });
}
