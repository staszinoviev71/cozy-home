import { DinnerRecipe, ShoppingItem } from '../types/domain';
import { addItem } from './shoppingService';

/**
 * Extracts ingredients from a recipe, optionally filtered by selected indices.
 * If selectedIndices is omitted or undefined, returns all recipe ingredients.
 */
export function parseRecipeIngredients(
  recipe: DinnerRecipe,
  selectedIndices?: number[]
): string[] {
  if (!recipe || !Array.isArray(recipe.ingredients)) {
    return [];
  }

  if (selectedIndices === undefined) {
    return [...recipe.ingredients];
  }

  return selectedIndices
    .filter((idx) => typeof idx === 'number' && idx >= 0 && idx < recipe.ingredients.length)
    .map((idx) => recipe.ingredients[idx]);
}

/**
 * Adds recipe ingredients to the active shopping list using the smart shoppingService.
 */
export function addIngredientsToShoppingList(
  shoppingList: ShoppingItem[],
  ingredients: string[]
): ShoppingItem[] {
  let updatedList = [...shoppingList];

  for (const ingredient of ingredients) {
    const trimmed = ingredient.trim();
    if (trimmed.length > 0) {
      updatedList = addItem(updatedList, trimmed);
    }
  }

  return updatedList;
}

export interface DinnerFilterOptions {
  tag?: string;
  maxCookTimeMinutes?: number;
}

/**
 * Picks a random recipe from a list, optionally filtering by tag and max cook time.
 */
export function spinDinnerRoulette(
  recipes: DinnerRecipe[],
  options?: DinnerFilterOptions
): DinnerRecipe | null {
  if (!recipes || recipes.length === 0) {
    return null;
  }

  let candidates = [...recipes];

  if (options?.tag) {
    const targetTag = options.tag.toLowerCase();
    candidates = candidates.filter((r) =>
      r.tags?.some((t) => t.toLowerCase() === targetTag)
    );
  }

  if (options?.maxCookTimeMinutes !== undefined) {
    candidates = candidates.filter((r) => r.cookTimeMinutes <= options.maxCookTimeMinutes!);
  }

  if (candidates.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Default preset recipes for cozy home dinners.
 */
export const DEFAULT_RECIPES: DinnerRecipe[] = [
  {
    id: 'rec_carbonara',
    title: 'Паста Карбонара',
    cookTimeMinutes: 25,
    ingredients: ['Спагетти', 'Бекон', 'Пармезан', 'Яйца', 'Черный перец'],
    tags: ['Быстро', 'Любимое жены', 'Паста'],
  },
  {
    id: 'rec_salmon_veg',
    title: 'Лосось в духовке с брокколи',
    cookTimeMinutes: 30,
    ingredients: ['Филе лосося', 'Брокколи', 'Лимон', 'Оливковое масло', 'Чеснок'],
    tags: ['Здоровое', 'Рыба', 'Романтично'],
  },
  {
    id: 'rec_mushroom_soup',
    title: 'Сливочный грибной крем-суп',
    cookTimeMinutes: 35,
    ingredients: ['Шампиньоны', 'Сливки 20%', 'Картофель', 'Лук репчатый', 'Гренки'],
    tags: ['Уютно', 'Супы'],
  },
  {
    id: 'rec_pizza_home',
    title: 'Домашняя мини-пицца',
    cookTimeMinutes: 20,
    ingredients: ['Основа для пиццы', 'Моцарелла', 'Томатный соус', 'Пепперони', 'Базилик'],
    tags: ['Быстро', 'Выходные', 'Любимое мужа'],
  },
  {
    id: 'rec_curry_chicken',
    title: 'Нежное карри с курицей и рисом',
    cookTimeMinutes: 30,
    ingredients: ['Куриное филе', 'Рис басмати', 'Кокосовое молоко', 'Паста карри', 'Болгарский перец'],
    tags: ['Пряное', 'Сытно'],
  },
  {
    id: 'rec_syrniki',
    title: 'Пышные сырники с ягодами',
    cookTimeMinutes: 20,
    ingredients: ['Творог 9%', 'Яйца', 'Мука пшеничная', 'Ванильный сахар', 'Свежие ягоды', 'Сметана'],
    tags: ['Быстро', 'Завтрак-ужин', 'Сладкое'],
  },
];
