import {
  addItem,
  toggleItemChecked,
  getEndingSoonItems,
  removeItem,
  clearCheckedItems,
  getShoppingStats,
  detectCategory,
  detectRecurrenceDays,
} from '../src/services/shoppingService';
import { ShoppingListView } from '../src/components/shopping/ShoppingListView';
import { ShoppingItem } from '../src/types/domain';

describe('ShoppingService', () => {
  describe('addItem', () => {
    it('adds item with photo and auto-category', () => {
      const list: ShoppingItem[] = [];
      const updated = addItem(list, 'Сыр Маасдам', 'В синей пачке', 'file://photo1.webp');
      expect(updated).toHaveLength(1);
      expect(updated[0].name).toBe('Сыр Маасдам');
      expect(updated[0].photoUri).toBe('file://photo1.webp');
      expect(updated[0].checked).toBe(false);
      expect(updated[0].category).toBeDefined();
      expect(updated[0].id).toBeDefined();
      expect(updated[0].createdAt).toBeGreaterThan(0);
    });

    it('auto-categorizes common grocery and household products', () => {
      const list: ShoppingItem[] = [];
      const withMilk = addItem(list, 'Молоко 3.2%');
      const withBread = addItem(withMilk, 'Батон нарезной');
      const withApples = addItem(withBread, 'Яблоки сезонные');
      const withMeat = addItem(withApples, 'Куриное филе');
      const withPods = addItem(withMeat, 'Капсулы для посудомойки');
      const withTreat = addItem(withPods, 'Шоколад горький');

      expect(withPods[0].category).toBe('Молочные продукты');
      expect(withPods[1].category).toBe('Хлеб и выпечка');
      expect(withPods[2].category).toBe('Овощи и фрукты');
      expect(withPods[3].category).toBe('Мясо и рыба');
      expect(withPods[4].category).toBe('Бытовая химия и дом');
      expect(withTreat[5].category).toBe('Сладости и десерты');
    });

    it('assigns detected recurrence days for regular consumables', () => {
      const list: ShoppingItem[] = [];
      const updated = addItem(list, 'Таблетки для посудомойки');
      expect(updated[0].recurrenceDays).toBe(30);
    });

    it('respects explicitly provided recurrenceDays', () => {
      const list: ShoppingItem[] = [];
      const updated = addItem(list, 'Кофе в зернах', 'Lavazza', undefined, 14);
      expect(updated[0].recurrenceDays).toBe(14);
    });

    it('does not mutate original list', () => {
      const initial: ShoppingItem[] = [];
      const next = addItem(initial, 'Чай');
      expect(initial).toHaveLength(0);
      expect(next).toHaveLength(1);
    });
  });

  describe('toggleItemChecked', () => {
    it('toggles item checked state and updates timestamp', () => {
      const list: ShoppingItem[] = [{ id: '1', name: 'Хлеб', checked: false, createdAt: 1000 }];
      const checked = toggleItemChecked(list, '1');
      expect(checked[0].checked).toBe(true);
      expect(checked[0].completedAt).toBeDefined();
      expect(checked[0].completedAt).toBeGreaterThanOrEqual(1000);
    });

    it('unchecks item and clears completedAt', () => {
      const list: ShoppingItem[] = [
        { id: '1', name: 'Хлеб', checked: true, createdAt: 1000, completedAt: 1500 },
      ];
      const unchecked = toggleItemChecked(list, '1');
      expect(unchecked[0].checked).toBe(false);
      expect(unchecked[0].completedAt).toBeUndefined();
    });

    it('returns original list copy if itemId is not found', () => {
      const list: ShoppingItem[] = [{ id: '1', name: 'Хлеб', checked: false, createdAt: 1000 }];
      const result = toggleItemChecked(list, 'non-existent');
      expect(result).toHaveLength(1);
      expect(result[0].checked).toBe(false);
    });
  });

  describe('getEndingSoonItems', () => {
    it('predicts ending soon consumables based on recurrence cycle', () => {
      const history: ShoppingItem[] = [
        {
          id: '1',
          name: 'Капсулы для посудомойки',
          checked: true,
          createdAt: Date.now() - 32 * 86400000,
          recurrenceDays: 30,
        },
      ];
      const ending = getEndingSoonItems(history);
      expect(ending).toContain('Капсулы для посудомойки');
    });

    it('uses completedAt when present to compute elapsed duration', () => {
      const history: ShoppingItem[] = [
        {
          id: '1',
          name: 'Сменный картридж фильтра',
          checked: true,
          createdAt: Date.now() - 100 * 86400000,
          completedAt: Date.now() - 65 * 86400000,
          recurrenceDays: 60,
        },
      ];
      const ending = getEndingSoonItems(history);
      expect(ending).toContain('Сменный картридж фильтра');
    });

    it('does not include consumables that are not due yet', () => {
      const history: ShoppingItem[] = [
        {
          id: '1',
          name: 'Стиральный порошок',
          checked: true,
          createdAt: Date.now() - 5 * 86400000,
          recurrenceDays: 30,
        },
      ];
      const ending = getEndingSoonItems(history);
      expect(ending).not.toContain('Стиральный порошок');
    });

    it('ignores items without recurrenceDays or with non-positive values', () => {
      const history: ShoppingItem[] = [
        { id: '1', name: 'Бананы', checked: true, createdAt: Date.now() - 40 * 86400000 },
        { id: '2', name: 'Яблоки', checked: true, createdAt: Date.now() - 40 * 86400000, recurrenceDays: 0 },
      ];
      const ending = getEndingSoonItems(history);
      expect(ending).toEqual([]);
    });

    it('deduplicates ending soon consumable names', () => {
      const now = Date.now();
      const history: ShoppingItem[] = [
        {
          id: '1',
          name: 'Капсулы для посудомойки',
          checked: true,
          createdAt: now - 35 * 86400000,
          completedAt: now - 33 * 86400000,
          recurrenceDays: 30,
        },
        {
          id: '2',
          name: 'Капсулы для посудомойки',
          checked: true,
          createdAt: now - 70 * 86400000,
          completedAt: now - 65 * 86400000,
          recurrenceDays: 30,
        },
      ];
      const ending = getEndingSoonItems(history);
      expect(ending).toEqual(['Капсулы для посудомойки']);
    });
  });

  describe('Utility operations', () => {
    it('removes item by id', () => {
      const list: ShoppingItem[] = [
        { id: '1', name: 'Хлеб', checked: false, createdAt: 1000 },
        { id: '2', name: 'Молоко', checked: true, createdAt: 1000 },
      ];
      const result = removeItem(list, '1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('clears completed items', () => {
      const list: ShoppingItem[] = [
        { id: '1', name: 'Хлеб', checked: false, createdAt: 1000 },
        { id: '2', name: 'Молоко', checked: true, createdAt: 1000 },
        { id: '3', name: 'Сыр', checked: true, createdAt: 1000 },
      ];
      const result = clearCheckedItems(list);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Хлеб');
    });

    it('calculates shopping list statistics', () => {
      const list: ShoppingItem[] = [
        { id: '1', name: 'Хлеб', checked: false, createdAt: 1000 },
        { id: '2', name: 'Молоко', checked: true, createdAt: 1000 },
        { id: '3', name: 'Сыр', checked: false, createdAt: 1000 },
      ];
      const stats = getShoppingStats(list);
      expect(stats).toEqual({
        total: 3,
        checked: 1,
        remaining: 2,
        progressPercent: 33,
      });
    });

    it('detects category fallback for unknown items', () => {
      expect(detectCategory('Неизвестная штука 123')).toBe('Прочее');
    });

    it('detects recurrence days for known household consumables', () => {
      expect(detectRecurrenceDays('Таблетки для посудомойки')).toBe(30);
      expect(detectRecurrenceDays('Фильтр для воды')).toBe(60);
      expect(detectRecurrenceDays('Зубная паста')).toBe(30);
      expect(detectRecurrenceDays('Шоколадка')).toBeUndefined();
    });
  });
});

describe('ShoppingListView Component', () => {
  it('renders shopping list view with liquid glass theme styling and items', () => {
    const items: ShoppingItem[] = [
      { id: '1', name: 'Сыр Маасдам', checked: false, createdAt: 1000, category: 'Молочные продукты', photoUri: 'file://cheese.webp' },
      { id: '2', name: 'Хлеб', checked: true, createdAt: 1000, category: 'Хлеб и выпечка', completedAt: 1200 },
    ];
    const endingSoon = ['Капсулы для посудомойки'];

    const view = ShoppingListView({
      items,
      endingSoon,
      isStoreMode: true,
    });

    expect(view).toBeDefined();
    expect(view.props.items).toHaveLength(2);
    expect(view.props.stats.remaining).toBe(1);
    expect(view.props.stats.checked).toBe(1);
    expect(view.props.isStoreMode).toBe(true);
    expect(view.props.renderedHtml).toContain('Сыр Маасдам');
    expect(view.props.renderedHtml).toContain('Капсулы для посудомойки');
    expect(view.props.renderedHtml).toContain('В магазине');
  });
});
