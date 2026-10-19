import { PushNotificationAction, PushNotificationPayload } from '../types/domain';

export const NOTIFICATION_CHANNEL_URGENT = 'household_urgent';
export const DEFAULT_NOTIFICATION_COOLDOWN_MS = 15000;

export interface SosPreset {
  id: string;
  icon: string;
  text: string;
  shortLabel: string;
}

export const QUICK_SOS_PRESETS: SosPreset[] = [
  { id: 'bread', icon: '🥖', text: 'Купи, пожалуйста, хлеб', shortLabel: 'Хлеб' },
  { id: 'milk', icon: '🥛', text: 'Захвати молоко', shortLabel: 'Молоко' },
  { id: 'water', icon: '💧', text: 'Закончилась питьевая вода', shortLabel: 'Вода' },
  { id: 'eggs', icon: '🥚', text: 'Купи яйца', shortLabel: 'Яйца' },
  { id: 'coffee', icon: '☕', text: 'Закончился кофе', shortLabel: 'Кофе' },
];

/**
 * Builds High Priority SOS push notification payload with action buttons in shade.
 */
export function buildSosPayload(senderName: string, itemText: string): PushNotificationPayload {
  const actions: PushNotificationAction[] = [
    { id: 'action_buy', title: 'Куплю!' },
    { id: 'action_cant', title: 'Не смогу' },
  ];

  return {
    channelId: NOTIFICATION_CHANNEL_URGENT,
    priority: 'high',
    title: `🚨 ${senderName}: Срочно нужно!`,
    body: `Пожалуйста, купи: ${itemText}`,
    actions,
    data: {
      type: 'sos_request',
      sender: senderName,
      item: itemText,
      timestamp: Date.now().toString(),
      sound: 'urgent_chime.wav',
    },
  };
}

/**
 * Builds store entry announcement payload to give partner 5 minutes to adjust shopping list.
 */
export function buildStoreEntryPayload(senderName: string): PushNotificationPayload {
  const actions: PushNotificationAction[] = [
    { id: 'action_open_list', title: 'Открыть список' },
    { id: 'action_nothing_needed', title: 'Всё есть' },
  ];

  return {
    channelId: NOTIFICATION_CHANNEL_URGENT,
    priority: 'high',
    title: `🛒 ${senderName} зашёл в магазин!`,
    body: 'Есть 5 минут проверить или дополнить список покупок!',
    actions,
    data: {
      type: 'store_entry',
      sender: senderName,
      timestamp: Date.now().toString(),
    },
  };
}

/**
 * Checks if notification can be sent or if rate limit cooldown is active.
 */
export function canSendNotification(
  lastSentTimestamp: number,
  cooldownMs: number = DEFAULT_NOTIFICATION_COOLDOWN_MS
): boolean {
  if (!lastSentTimestamp || lastSentTimestamp <= 0) {
    return true;
  }
  const elapsed = Date.now() - lastSentTimestamp;
  return elapsed >= cooldownMs;
}

/**
 * Calculates remaining cooldown in seconds (0 if ready).
 */
export function getRemainingCooldown(
  lastSentTimestamp: number,
  cooldownMs: number = DEFAULT_NOTIFICATION_COOLDOWN_MS
): number {
  if (!lastSentTimestamp || lastSentTimestamp <= 0) {
    return 0;
  }
  const elapsed = Date.now() - lastSentTimestamp;
  if (elapsed >= cooldownMs) {
    return 0;
  }
  return Math.ceil((cooldownMs - elapsed) / 1000);
}

/**
 * Formats notification timestamp into HH:MM.
 */
export function formatNotificationTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}
