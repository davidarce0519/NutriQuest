import { supabase } from '../supabase/supabaseClient';
import { NotificationSettings } from '../../domain/models';

const mapSettings = (d: any): NotificationSettings => ({
  userId:                  d.user_id,
  darkModeAuto:            d.dark_mode_auto,
  darkModeManual:          d.dark_mode_manual,
  darkModeStartHour:       d.dark_mode_start_hour,
  darkModeEndHour:         d.dark_mode_end_hour,
  notificationsEnabled:    d.notifications_enabled,
  notificationsPaused:     d.notifications_paused,
  notificationsPausedUntil: d.notifications_paused_until ?? undefined,
  pushToken:               d.push_token ?? undefined,
  expoNotificationId:      d.expo_notification_id ?? undefined,
  notificationHour:        d.notification_hour ?? 12,
});

type SettingsUpdate = {
  darkModeAuto?:             boolean;
  darkModeManual?:           boolean;
  darkModeStartHour?:        number;
  darkModeEndHour?:          number;
  notificationsEnabled?:     boolean;
  notificationsPaused?:      boolean;
  notificationsPausedUntil?: string | null;
  pushToken?:                string;
  expoNotificationId?:       string | null;
  notificationHour?:         number;
};

export const notificationSettingsRepository = {
  async getSettings(userId: string): Promise<NotificationSettings> {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return mapSettings(data);
  },

  async updateSettings(userId: string, partial: SettingsUpdate): Promise<NotificationSettings> {
    const updates: Record<string, unknown> = {};

    if (partial.darkModeAuto !== undefined)        updates.dark_mode_auto = partial.darkModeAuto;
    if (partial.darkModeManual !== undefined)       updates.dark_mode_manual = partial.darkModeManual;
    if (partial.darkModeStartHour !== undefined)    updates.dark_mode_start_hour = partial.darkModeStartHour;
    if (partial.darkModeEndHour !== undefined)      updates.dark_mode_end_hour = partial.darkModeEndHour;
    if (partial.notificationsEnabled !== undefined) updates.notifications_enabled = partial.notificationsEnabled;
    if (partial.notificationsPaused !== undefined)  updates.notifications_paused = partial.notificationsPaused;
    if ('notificationsPausedUntil' in partial)       updates.notifications_paused_until = partial.notificationsPausedUntil;
    if (partial.pushToken !== undefined)             updates.push_token = partial.pushToken;
    if ('expoNotificationId' in partial)             updates.expo_notification_id = partial.expoNotificationId;
    if (partial.notificationHour !== undefined)      updates.notification_hour = partial.notificationHour;

    const { data, error } = await supabase
      .from('notification_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return mapSettings(data);
  },

  async savePushToken(userId: string, token: string): Promise<void> {
    const { error } = await supabase
      .from('notification_settings')
      .update({ push_token: token })
      .eq('user_id', userId);
    if (error) throw error;
  },

  async saveExpoNotificationId(userId: string, notifId: string): Promise<void> {
    const { error } = await supabase
      .from('notification_settings')
      .update({ expo_notification_id: notifId })
      .eq('user_id', userId);
    if (error) throw error;
  },
};
