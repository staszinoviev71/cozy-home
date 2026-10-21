export type UserRole = 'husband' | 'wife';
export type AvatarArchetype = 'corgi' | 'human';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  currentMoodId: string;
  avatarArchetype?: AvatarArchetype;
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

export interface NoteCategory {
  id: string;
  name: string;
  icon: string;
}

export interface HousePassportItem {
  id: string;
  category: PassportCategory;
  label: string;
  value: string;
  note?: string;
  updatedAt?: number;
  type?: 'text' | 'date_reminder';
  reminderDate?: string;
  reminderNoticeDays?: number;
}

export interface MoneyGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  completed?: boolean;
}

export interface HouseState {
  sparks: number;
  tier: number;
  installedFurniture: string[];
  dayNight: 'day' | 'night';
  weeklyPurchases: number;
  corgiMood?: string;
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

export interface WidgetAction {
  id: string;
  label: string;
  icon?: string;
}

export interface WidgetDisplayData {
  partnerId: string;
  partnerName: string;
  partnerRole: UserRole;
  moodId: string;
  moodTitle: string;
  moodColor: string;
  moodEmoji: string;
  moodDescription?: string;
  unboughtCount: number;
  unboughtCountText: string;
  timeAgoText: string;
  characterSvg: string;
  actions: WidgetAction[];
  updatedAt: number;
}
