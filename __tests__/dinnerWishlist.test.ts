import {
  parseRecipeIngredients,
  addIngredientsToShoppingList,
  spinDinnerRoulette,
  DEFAULT_RECIPES,
} from '../src/services/dinnerService';
import {
  filterWishlistForUser,
  markWishSecretlyPurchased,
  unmarkWishSecretlyPurchased,
  addWishlistItem,
  removeWishlistItem,
} from '../src/services/wishlistService';
import { DinnerRecipe, WishlistItem, ShoppingItem } from '../src/types/domain';

describe('Dinner & Wishlist Services', () => {
  const carbonara: DinnerRecipe = {
    id: 'r1',
    title: 'Паста Карбонара',
    cookTimeMinutes: 25,
    ingredients: ['Спагетти', 'Бекон', 'Пармезан', 'Яйца'],
    tags: ['Быстро', 'Паста', 'Любимое жены'],
  };

  describe('dinnerService', () => {
    it('parses recipe ingredients and adds them to shopping list', () => {
      const list: ShoppingItem[] = [];
      const needed = parseRecipeIngredients(carbonara, [0, 2]); // только спагетти и пармезан
      expect(needed).toEqual(['Спагетти', 'Пармезан']);

      const updatedList = addIngredientsToShoppingList(list, needed);
      expect(updatedList).toHaveLength(2);
      expect(updatedList.map((i: ShoppingItem) => i.name)).toContain('Спагетти');
      expect(updatedList.map((i: ShoppingItem) => i.name)).toContain('Пармезан');
      expect(updatedList.some((i: ShoppingItem) => i.category === 'Бакалея')).toBe(true);
    });

    it('returns all ingredients when selectedIndices is omitted', () => {
      const all = parseRecipeIngredients(carbonara);
      expect(all).toEqual(['Спагетти', 'Бекон', 'Пармезан', 'Яйца']);
    });

    it('safely handles empty recipes and out-of-bounds indices', () => {
      const emptyRecipe: DinnerRecipe = {
        id: 'r_empty',
        title: 'Пустой рецепт',
        cookTimeMinutes: 5,
        ingredients: [],
      };
      expect(parseRecipeIngredients(emptyRecipe)).toEqual([]);
      expect(parseRecipeIngredients(carbonara, [-1, 10, 1])).toEqual(['Бекон']);
    });

    it('skips empty strings when adding ingredients to shopping list', () => {
      const initial: ShoppingItem[] = [];
      const updated = addIngredientsToShoppingList(initial, ['  ', 'Сливки', '']);
      expect(updated).toHaveLength(1);
      expect(updated[0].name).toBe('Сливки');
    });

    it('spins dinner roulette with filters', () => {
      expect(spinDinnerRoulette([])).toBeNull();

      const quickRecipe = spinDinnerRoulette(DEFAULT_RECIPES, { maxCookTimeMinutes: 20 });
      expect(quickRecipe).not.toBeNull();
      expect(quickRecipe!.cookTimeMinutes).toBeLessThanOrEqual(20);

      const pastaRecipe = spinDinnerRoulette(DEFAULT_RECIPES, { tag: 'паста' });
      expect(pastaRecipe).not.toBeNull();
      expect(pastaRecipe!.title).toContain('Паста Карбонара');

      const nonExistent = spinDinnerRoulette(DEFAULT_RECIPES, { tag: 'nonexistent_tag_xyz' });
      expect(nonExistent).toBeNull();
    });
  });

  describe('wishlistService', () => {
    it('masks secret wishlist purchases from the recipient', () => {
      const items: WishlistItem[] = [
        { id: 'w1', ownerId: 'wife', title: 'Аромасвеча', isSecretPurchased: true, buyerId: 'husband' },
        { id: 'w2', ownerId: 'wife', title: 'Носочки', isSecretPurchased: false },
      ];

      // Муж видит, что свеча тайно куплена
      const husbandView = filterWishlistForUser(items, 'husband');
      expect(husbandView[0].isSecretPurchased).toBe(true);
      expect(husbandView[0].buyerId).toBe('husband');

      // Жена НЕ должна видеть, что свеча уже куплена (сюрприз сохраняется)
      const wifeView = filterWishlistForUser(items, 'wife');
      expect(wifeView[0].isSecretPurchased).toBe(false);
      expect(wifeView[0].buyerId).toBeUndefined();
      expect(wifeView[1].isSecretPurchased).toBe(false);
    });

    it('marks and unmarks secret purchases correctly', () => {
      const items: WishlistItem[] = [
        { id: 'w1', ownerId: 'wife', title: 'Духи', isSecretPurchased: false },
      ];

      const marked = markWishSecretlyPurchased(items, 'w1', 'husband');
      expect(marked[0].isSecretPurchased).toBe(true);
      expect(marked[0].buyerId).toBe('husband');

      const unmark = unmarkWishSecretlyPurchased(marked, 'w1');
      expect(unmark[0].isSecretPurchased).toBe(false);
      expect(unmark[0].buyerId).toBeUndefined();
    });

    it('adds and removes wishlist items', () => {
      let list: WishlistItem[] = [];
      list = addWishlistItem(list, 'Уютный плед', 'wife', { price: 2500, note: 'Цвет лавандовый' });
      expect(list).toHaveLength(1);
      expect(list[0].title).toBe('Уютный плед');
      expect(list[0].ownerId).toBe('wife');
      expect(list[0].price).toBe(2500);
      expect(list[0].isSecretPurchased).toBe(false);

      const removed = removeWishlistItem(list, list[0].id);
      expect(removed).toHaveLength(0);
    });
  });
});
