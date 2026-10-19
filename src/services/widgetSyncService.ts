import { UserProfile, WidgetDisplayData, WidgetAction } from '../types/domain';
import { getMoodById } from '../constants/moods';
import { getCharacterSvgString } from '../components/character/CharacterAvatar';

export { WidgetDisplayData, WidgetAction };

export type WidgetUpdateHandler = (data: WidgetDisplayData) => Promise<void> | void;

let currentWidgetUpdater: WidgetUpdateHandler | null = null;
let cachedWidgetData: WidgetDisplayData | null = null;

/**
 * Registers an optional native/custom widget updater handler.
 */
export function registerWidgetUpdater(handler: WidgetUpdateHandler | null): void {
  currentWidgetUpdater = handler;
}

/**
 * Returns the most recently updated widget data.
 */
export function getLastWidgetData(): WidgetDisplayData | null {
  return cachedWidgetData;
}

/**
 * Formats time difference in Russian relative format.
 */
export function formatTimeAgo(updatedAt: number, now: number = Date.now()): string {
  if (!updatedAt || updatedAt <= 0) {
    return 'давно';
  }
  const diffMs = Math.max(0, now - updatedAt);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 1) {
    return 'только что';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} мин назад`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ч назад`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} дн назад`;
}

/**
 * Formats unbought shopping items count for Samsung One UI widget display.
 */
export function formatUnboughtCount(count: number): string {
  const safeCount = Math.max(0, count);
  return `${safeCount} в списке`;
}

/**
 * Compiles high-contrast widget render data for partner's mood and household status.
 */
export function getWidgetRenderData(
  partner: UserProfile,
  unboughtCount: number,
  now?: number
): WidgetDisplayData {
  const safeNow = now ?? Date.now();
  const mood = getMoodById(partner.currentMoodId, partner.role);
  const unboughtText = formatUnboughtCount(unboughtCount);
  const timeAgo = formatTimeAgo(partner.updatedAt, safeNow);
  const characterSvg = getCharacterSvgString(partner.currentMoodId, partner.role, 64);

  const actions: WidgetAction[] = [
    {
      id: 'hug',
      label: 'Обнять',
      icon: '🤗',
    },
    {
      id: 'on_my_way',
      label: 'Уже еду',
      icon: '🚗',
    },
    {
      id: 'shopping_list',
      label: unboughtText,
      icon: '🛒',
    },
  ];

  return {
    partnerId: partner.id,
    partnerName: partner.name,
    partnerRole: partner.role,
    moodId: mood.id,
    moodTitle: mood.title,
    moodColor: mood.color || '#FF8A65',
    moodEmoji: mood.emoji || '✨',
    moodDescription: mood.description,
    unboughtCount: Math.max(0, unboughtCount),
    unboughtCountText: unboughtText,
    timeAgoText: timeAgo,
    characterSvg,
    actions,
    updatedAt: partner.updatedAt,
  };
}

/**
 * Pushes updated data to the Android AppWidget (Samsung One UI).
 */
export async function updateAppWidget(data: WidgetDisplayData): Promise<void> {
  cachedWidgetData = data;
  if (currentWidgetUpdater) {
    await currentWidgetUpdater(data);
  }
}
