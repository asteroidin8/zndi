import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>()((set) => ({
  visible: false,
  message: '',
  type: 'success',
  show: (message, type = 'success') => set({ visible: true, message, type }),
  hide: () => set({ visible: false }),
}));

export function toast(message: string, type?: ToastType) {
  useToastStore.getState().show(message, type);
}
