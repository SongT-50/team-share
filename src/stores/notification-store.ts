import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationSettings {
  chat: boolean;
  file: boolean;
  action: boolean;
}

interface NotificationStore {
  settings: NotificationSettings;
  toggleSetting: (key: keyof NotificationSettings) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      settings: { chat: true, file: true, action: true },
      toggleSetting: (key) =>
        set((state) => ({
          settings: { ...state.settings, [key]: !state.settings[key] },
        })),
    }),
    { name: 'notification-settings' }
  )
);
