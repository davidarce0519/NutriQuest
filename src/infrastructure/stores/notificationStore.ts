import { create } from 'zustand';
import { NotificationSettings } from '../../domain/models';

interface NotificationState {
  settings:       NotificationSettings | null;
  setSettings:    (s: NotificationSettings) => void;
  updateSettings: (partial: Partial<NotificationSettings>) => void;
  clear:          () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  settings: null,

  setSettings:    (s)       => set({ settings: s }),
  updateSettings: (partial) => set((state) => ({
    settings: state.settings ? { ...state.settings, ...partial } : null,
  })),
  clear:          ()        => set({ settings: null }),
}));
