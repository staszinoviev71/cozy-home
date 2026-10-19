import { HousePassportItem, PassportCategory } from '../types/domain';

/**
 * Category metadata with localized human-friendly titles, icons, and placeholder examples.
 */
export interface CategoryMeta {
  title: string;
  icon: string;
  placeholder: string;
  example: string;
}

export const PASSPORT_CATEGORIES: Record<string, CategoryMeta> = {
  intercom: {
    title: 'Домофон и доступ',
    icon: '🔔',
    placeholder: 'Код калитки или домофона',
    example: '# 4829',
  },
  filter: {
    title: 'Фильтры воды',
    icon: '💧',
    placeholder: 'Модели картриджей',
    example: 'Аквафор К5 / К2 / КО-50',
  },
  wifi: {
    title: 'Wi-Fi и интернет',
    icon: '📶',
    placeholder: 'Пароль гостевой сети',
    example: 'CozyHome2026!',
  },
  meter: {
    title: 'Счётчики и ЖКХ',
    icon: '⚡',
    placeholder: 'Номера лицевых счетов',
    example: 'Л/С 8274-1928-01',
  },
  paint: {
    title: 'Краска и ремонт',
    icon: '🎨',
    placeholder: 'Код колеровки стен',
    example: 'Dulux 30YY 68/024 (гостиная)',
  },
  master: {
    title: 'Мастера и службы',
    icon: '🔧',
    placeholder: 'Телефон сантехника/УК',
    example: '+7 (999) 123-45-67 (Диспетчер)',
  },
  custom: {
    title: 'Другие заметки',
    icon: '📋',
    placeholder: 'Значение для быстрого копирования',
    example: '',
  },
};

/**
 * Default preloaded house passport entries for a cozy couple's home.
 */
export const DEFAULT_PASSPORT_ITEMS: HousePassportItem[] = [
  {
    id: 'pass_intercom_1',
    category: 'intercom',
    label: 'Домофон подъезда',
    value: '# 4829',
    note: 'Калитка во двор: 1234#',
    updatedAt: 1700000000000,
  },
  {
    id: 'pass_wifi_1',
    category: 'wifi',
    label: 'Wi-Fi для гостей',
    value: 'CozyNest_Guest5G',
    note: 'Пароль: warmtea2026',
    updatedAt: 1700000000000,
  },
  {
    id: 'pass_filter_1',
    category: 'filter',
    label: 'Сменные картриджи',
    value: 'Аквафор К5 - К2 - КО-50',
    note: 'Замена каждые 6 месяцев (май/ноябрь)',
    updatedAt: 1700000000000,
  },
  {
    id: 'pass_paint_1',
    category: 'paint',
    label: 'Краска в спальне',
    value: 'Tikkurila H484',
    note: 'Шелковисто-матовая, база A',
    updatedAt: 1700000000000,
  },
  {
    id: 'pass_master_1',
    category: 'master',
    label: 'Сантехник (УК Дом)',
    value: '+7 (999) 555-32-10',
    note: 'Михаил Иванович, с 9:00 до 18:00',
    updatedAt: 1700000000000,
  },
];

/**
 * Returns formatted value ready for instant one-tap copy to system clipboard.
 * Strips superfluous whitespace or delimiters while preserving accurate credential strings.
 */
export function formatForClipboard(item: HousePassportItem): string {
  if (!item || !item.value) {
    return '';
  }
  return item.value.trim();
}

/**
 * Inserts a new passport item or updates an existing one immutably.
 */
export function upsertPassportItem(
  items: HousePassportItem[],
  item: HousePassportItem
): HousePassportItem[] {
  const now = Date.now();
  const normalizedItem: HousePassportItem = {
    ...item,
    id: item.id || `pass_${now}_${Math.random().toString(36).substring(2, 7)}`,
    updatedAt: item.updatedAt ?? now,
  };

  const existingIndex = items.findIndex((i) => i.id === normalizedItem.id);
  if (existingIndex >= 0) {
    const copy = [...items];
    copy[existingIndex] = normalizedItem;
    return copy;
  }

  return [...items, normalizedItem];
}

/**
 * Deletes a passport item by ID immutably.
 */
export function deletePassportItem(
  items: HousePassportItem[],
  itemId: string
): HousePassportItem[] {
  return items.filter((item) => item.id !== itemId);
}

/**
 * Factory helper to construct a valid HousePassportItem with auto-generated id and timestamp.
 */
export function createPassportItem(
  category: PassportCategory,
  label: string,
  value: string,
  note?: string
): HousePassportItem {
  const now = Date.now();
  return {
    id: `pass_${now}_${Math.random().toString(36).substring(2, 7)}`,
    category,
    label: label.trim(),
    value: value.trim(),
    note: note ? note.trim() : undefined,
    updatedAt: now,
  };
}

/**
 * Returns metadata (title, icon, placeholder, example) for a given passport category.
 */
export function getCategoryMeta(category: PassportCategory): CategoryMeta {
  return (
    PASSPORT_CATEGORIES[category] || {
      title: category,
      icon: '📌',
      placeholder: 'Значение',
      example: '',
    }
  );
}

/**
 * Filters passport items by category. Passing 'all' or empty string returns all items.
 */
export function filterPassportByCategory(
  items: HousePassportItem[],
  category?: PassportCategory | 'all'
): HousePassportItem[] {
  if (!category || category === 'all') {
    return items;
  }
  return items.filter((item) => item.category === category);
}

/**
 * Performs case-insensitive search across label, value, note, and category.
 */
export function searchPassportItems(
  items: HousePassportItem[],
  query: string
): HousePassportItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return items;
  }
  return items.filter((item) => {
    const matchLabel = item.label.toLowerCase().includes(clean);
    const matchValue = item.value.toLowerCase().includes(clean);
    const matchNote = item.note ? item.note.toLowerCase().includes(clean) : false;
    const matchCat = item.category.toLowerCase().includes(clean);
    return matchLabel || matchValue || matchNote || matchCat;
  });
}
