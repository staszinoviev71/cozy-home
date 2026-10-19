import { WishlistItem } from '../types/domain';

let wishIdCounter = 1;

/**
 * Filters and masks wishlist items based on current viewer's ID.
 * If an item is secretly purchased, the owner (recipient) will see
 * isSecretPurchased: false so the surprise is preserved.
 * The buyer or other household members see the real secret status.
 */
export function filterWishlistForUser(
  wishlist: WishlistItem[],
  currentUserId: string
): WishlistItem[] {
  return wishlist.map((item) => {
    if (item.ownerId === currentUserId && item.isSecretPurchased) {
      return {
        ...item,
        isSecretPurchased: false,
        buyerId: undefined,
      };
    }
    return { ...item };
  });
}

/**
 * Marks a wishlist item as secretly purchased by a buyer.
 */
export function markWishSecretlyPurchased(
  wishlist: WishlistItem[],
  itemId: string,
  buyerId: string
): WishlistItem[] {
  return wishlist.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        isSecretPurchased: true,
        buyerId,
      };
    }
    return item;
  });
}

/**
 * Clears secret purchase status if a purchase was cancelled.
 */
export function unmarkWishSecretlyPurchased(
  wishlist: WishlistItem[],
  itemId: string
): WishlistItem[] {
  return wishlist.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        isSecretPurchased: false,
        buyerId: undefined,
      };
    }
    return item;
  });
}

export interface NewWishlistItemOptions {
  link?: string;
  price?: number;
  note?: string;
}

/**
 * Adds a new item to the user's wishlist.
 */
export function addWishlistItem(
  wishlist: WishlistItem[],
  title: string,
  ownerId: string,
  options?: NewWishlistItemOptions
): WishlistItem[] {
  const newItem: WishlistItem = {
    id: `wish_${Date.now()}_${wishIdCounter++}`,
    title: title.trim(),
    ownerId,
    isSecretPurchased: false,
    link: options?.link || undefined,
    price: options?.price,
    note: options?.note || undefined,
  };

  return [...wishlist, newItem];
}

/**
 * Removes an item from the wishlist by ID.
 */
export function removeWishlistItem(wishlist: WishlistItem[], itemId: string): WishlistItem[] {
  return wishlist.filter((item) => item.id !== itemId);
}
