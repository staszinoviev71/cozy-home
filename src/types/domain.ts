export type UserRole = 'husband' | 'wife';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  currentMoodId: string;
  updatedAt: number;
}

export interface Household {
  id: string;
  inviteCode: string;
  members: UserProfile[];
  createdAt: number;
}

export interface MoodState {
  id: string;
  title: string;
  animClass: string;
  emoji?: string;
  description?: string;
  color?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  createdAt: number;
  comment?: string;
  photoUri?: string;
  completedAt?: number;
  recurrenceDays?: number;
  category?: string;
}

export interface DinnerRecipe {
  id: string;
  title: string;
  cookTimeMinutes: number;
  ingredients: string[];
  tags?: string[];
}

export interface WishlistItem {
  id: string;
  ownerId: string;
  title: string;
  isSecretPurchased: boolean;
  buyerId?: string;
  link?: string;
  price?: number;
  note?: string;
}

export type PassportCategory = 'intercom' | 'filter' | 'meter' | 'wifi' | 'custom' | string;

export interface HousePassportItem {
  id: string;
  category: PassportCategory;
  label: string;
  value: string;
  note?: string;
  updatedAt?: number;
}

export interface PushNotificationAction {
  id: string;
  title: string;
}

export interface PushNotificationPayload {
  channelId: string;
  priority: 'high' | 'normal' | 'low';
  title: string;
  body: string;
  actions?: PushNotificationAction[];
  data?: Record<string, string>;
}
