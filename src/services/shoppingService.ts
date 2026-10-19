import { ShoppingItem } from '../types/domain';

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  {
    category: 'Молочные продукты',
    keywords: ['сыр', 'молок', 'творог', 'масло сливоч', 'сметан', 'йогурт', 'кефир', 'сливк', 'ряженк', 'брынз'],
  },
  {
    category: 'Хлеб и выпечка',
    keywords: ['хлеб', 'батон', 'булочк', 'лаваш', 'круассан', 'багет', 'тост', 'выпечк', 'булка'],
  },
  {
    category: 'Овощи и фрукты',
    keywords: [
      'яблок', 'банан', 'огурц', 'помидор', 'томат', 'картоф', 'морков', 'лук',
      'зелен', 'апельсин', 'мандарин', 'лимон', 'чеснок', 'капуст', 'перец', 'ягод', 'клубник', 'авокадо',
    ],
  },
  {
    category: 'Мясо и рыба',
    keywords: ['куриц', 'филе', 'говядин', 'свинин', 'фарш', 'мяс', 'рыб', 'лосос', 'форел', 'индейк', 'колбас', 'сосиск', 'кревет'],
  },
  {
    category: 'Бакалея',
    keywords: ['макарон', 'паста', 'спагетти', 'рис', 'гречк', 'круп', 'мука', 'сахар', 'соль', 'чай', 'кофе', 'оливков', 'подсолнеч', 'хлопь'],
  },
  {
    category: 'Бытовая химия и дом',
    keywords: [
      'капсул', 'посудомой', 'порошок', 'стирал', 'таблетк', 'мыло', 'бумаг', 'салфет',
      'кондиционер', 'средств', 'губк', 'фильтр', 'освежител', 'зубн', 'паст', 'щетк', 'мусор',
    ],
  },
  {
    category: 'Сладости и десерты',
    keywords: ['шоколад', 'конфет', 'печень', 'торт', 'пирожн', 'вафл', 'мармелад', 'морожен', 'десерт', 'зефир'],
  },
  {
    category: 'Напитки',
    keywords: ['вода', 'сок', 'газировк', 'лимонад', 'кола', 'морс', 'квас'],
  },
];

const RECURRENCE_RULES: { keywords: string[]; days: number }[] = [
  { keywords: ['посудомой', 'капсулы для посуд', 'таблетки для посуд'], days: 30 },
  { keywords: ['фильтр', 'картридж'], days: 60 },
  { keywords: ['стирал', 'порошок', 'гель для стирки'], days: 45 },
  { keywords: ['зубная паста', 'зубн'], days: 30 },
  { keywords: ['туалетная бумага'], days: 14 },
  { keywords: ['кофе в зерн', 'зерновой кофе'], days: 20 },
  { keywords: ['мешки для мусора', 'пакеты для мусора'], days: 30 },
  { keywords: ['средство для мытья посуды'], days: 45 },
];

/**
 * Automatically detects item category based on Russian naming patterns.
 */
export function detectCategory(itemName: string): string {
  const normalized = itemName.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule.category;
    }
  }
  return 'Прочее';
}

/**
 * Predicts default recurrence cycle (in days) for standard consumables.
 */
export function detectRecurrenceDays(itemName: string): number | undefined {
  const normalized = itemName.toLowerCase();
  for (const rule of RECURRENCE_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule.days;
    }
  }
  return undefined;
}

let idCounter = 1;

/**
 * Adds an item to the shopping list with auto-categorization and recurrence detection.
 */
export function addItem(
  list: ShoppingItem[],
  name: string,
  comment?: string,
  photoUri?: string,
  recurrenceDays?: number,
  category?: string
): ShoppingItem[] {
  const resolvedCategory = category || detectCategory(name);
  const resolvedRecurrence = recurrenceDays ?? detectRecurrenceDays(name);

  const newItem: ShoppingItem = {
    id: `shop_${Date.now()}_${idCounter++}`,
    name,
    checked: false,
    createdAt: Date.now(),
    comment: comment || undefined,
    photoUri: photoUri || undefined,
    category: resolvedCategory,
    recurrenceDays: resolvedRecurrence,
  };

  return [...list, newItem];
}

/**
 * Toggles the checked status of a shopping list item and tracks completion time.
 */
export function toggleItemChecked(list: ShoppingItem[], itemId: string): ShoppingItem[] {
  return list.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    const isNowChecked = !item.checked;
    return {
      ...item,
      checked: isNowChecked,
      completedAt: isNowChecked ? Date.now() : undefined,
    };
  });
}

/**
 * Predicts consumable items that are ending soon based on recurrence cycles.
 */
export function getEndingSoonItems(history: ShoppingItem[], now: number = Date.now()): string[] {
  // Find the latest purchase per consumable name
  const latestByConsumable = new Map<string, { lastPurchased: number; recurrenceDays: number }>();

  for (const item of history) {
    if (!item.recurrenceDays || item.recurrenceDays <= 0) {
      continue;
    }
    const purchaseDate = item.completedAt ?? item.createdAt;
    const existing = latestByConsumable.get(item.name);

    if (!existing || purchaseDate > existing.lastPurchased) {
      latestByConsumable.set(item.name, {
        lastPurchased: purchaseDate,
        recurrenceDays: item.recurrenceDays,
      });
    }
  }

  const endingSoon: string[] = [];

  for (const [name, meta] of latestByConsumable.entries()) {
    const elapsedMs = now - meta.lastPurchased;
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

    if (elapsedDays >= meta.recurrenceDays * 0.9) {
      endingSoon.push(name);
    }
  }

  return endingSoon;
}

/**
 * Removes an item by id.
 */
export function removeItem(list: ShoppingItem[], itemId: string): ShoppingItem[] {
  return list.filter((item) => item.id !== itemId);
}

/**
 * Clears checked items from the active list.
 */
export function clearCheckedItems(list: ShoppingItem[]): ShoppingItem[] {
  return list.filter((item) => !item.checked);
}

export interface ShoppingStats {
  total: number;
  checked: number;
  remaining: number;
  progressPercent: number;
}

/**
 * Returns shopping progress statistics.
 */
export function getShoppingStats(list: ShoppingItem[]): ShoppingStats {
  const total = list.length;
  const checked = list.filter((item) => item.checked).length;
  const remaining = total - checked;
  const progressPercent = total === 0 ? 0 : Math.round((checked / total) * 100);

  return {
    total,
    checked,
    remaining,
    progressPercent,
  };
}
