# Cozy Home Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Построить персональное мобильное приложение и виджет для Samsung Galaxy A54 семейной пары, объединяющее синхронный список покупок, взаимный трекинг настроения с анимированными альтер-эго, SOS-пуши, меню ужинов и паспорт дома в стиле Liquid Glass.

**Architecture:** Клиент-серверное мобильное приложение на React Native / Expo (TypeScript) с локальным offline-first хранилищем (AsyncStorage / SQLite) и облачной синхронизацией через Firebase (Firestore real-time listeners, Firebase Cloud Messaging, Firebase Storage). Виджет для рабочего стола Samsung One UI реализуется через AppWidgetProvider (`react-native-android-widget`) с обновлением по data-пушам.

**Tech Stack:** React Native, Expo SDK 52, TypeScript, Firebase (Firestore, FCM, Auth), react-native-svg, react-native-reanimated, react-native-android-widget, Jest.

**Spec:** `docs/superpowers/specs/2026-10-19-cozy-home-companion-design.md`

## Global Constraints

- Целевые устройства: Samsung Galaxy A54 (Android 14+, One UI 6+).
- Визуальный стиль: Liquid Glass 2.0 (полупрозрачные карточки `backdrop-filter`, динамический фоновый меш-градиент, неоновые контуры).
- Взаимность (Reciprocity): полная симметрия — оба супруга могут менять настроение, видеть виджет партнера, слать быстрые пуши и использовать списки.
- Офлайн-персистентность: список покупок должен открываться и редактироваться без интернета (кэширование в цокольных этажах магазинов).
- Уведомления: канал `IMPORTANCE_HIGH` с баннером поверх экрана и показом на заблокированном экране.

## Review Focus

- **Потеря связи в супермаркете**: вычеркивание товаров в офлайне не должно сбрасываться при восстановлении соединения (тестируется в Task 3).
- **Маскирование секретных подарков**: при выборе «Секрет» в вишлисте товар не должен отображаться как купленный на телефоне получателя и не должен генерировать пуш (тестируется в Task 5).
- **Своевременный отклик виджета**: смена настроения партнера обновляет данные виджета в течение < 2 секунд при наличии сети (тестируется в Task 7).
- **Дублирование инвайт-кода сопряжения**: защита от подключения третьего пользователя к существующей паре (тестируется в Task 1).
- **Защита от спама уведомлениями**: дебаунс повторных нажатий «Я в магазине» и SOS-чипов (тестируется в Task 4).

---

### Task 1: Core Domain Models & Household Pairing

**Files:**
- Create: `src/types/domain.ts`
- Create: `src/services/pairingService.ts`
- Test: `__tests__/pairingService.test.ts`

**Interfaces:**
- Produces:
  - `interface UserProfile { id: string; name: string; role: 'husband' | 'wife'; currentMoodId: string; updatedAt: number; }`
  - `interface Household { id: string; inviteCode: string; members: UserProfile[]; createdAt: number; }`
  - `generatePairCode(): string`
  - `createHousehold(user: UserProfile): Household`
  - `joinHousehold(household: Household, user: UserProfile, code: string): Household`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/pairingService.test.ts
import { generatePairCode, createHousehold, joinHousehold } from '../src/services/pairingService';
import { UserProfile } from '../src/types/domain';

describe('PairingService', () => {
  const husband: UserProfile = { id: 'u1', name: 'Муж', role: 'husband', currentMoodId: 'happy', updatedAt: Date.now() };
  const wife: UserProfile = { id: 'u2', name: 'Жена', role: 'wife', currentMoodId: 'cozy', updatedAt: Date.now() };

  it('generates 6-digit pair code', () => {
    const code = generatePairCode();
    expect(code).toMatch(/^[0-9]{6}$/);
  });

  it('creates household with single member', () => {
    const household = createHousehold(husband);
    expect(household.members).toHaveLength(1);
    expect(household.inviteCode).toHaveLength(6);
  });

  it('joins household with valid code and prevents 3rd member', () => {
    const household = createHousehold(husband);
    const updated = joinHousehold(household, wife, household.inviteCode);
    expect(updated.members).toHaveLength(2);

    const intruder: UserProfile = { id: 'u3', name: 'Чужой', role: 'husband', currentMoodId: 'happy', updatedAt: Date.now() };
    expect(() => joinHousehold(updated, intruder, household.inviteCode)).toThrow('Household is full');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/pairingService.test.ts`  
Expected: FAIL with "Cannot find module '../src/services/pairingService'"

- [ ] **Step 3: Implement domain types and pairingService**

В `src/types/domain.ts` объявить типы сущностей (`UserProfile`, `Household`, `MoodState`, `ShoppingItem`, `DinnerRecipe`, `WishlistItem`, `HousePassportItem`).  
В `src/services/pairingService.ts` реализовать функции `generatePairCode`, `createHousehold`, `joinHousehold` с проверкой лимита в 2 участника.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/pairingService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/domain.ts src/services/pairingService.ts __tests__/pairingService.test.ts
git commit -m "feat: add domain types and household pairing service with tests"
```

---

### Task 2: Liquid Glass Design System & Animated Alter-Ego

**Files:**
- Create: `src/theme/liquidGlass.ts`
- Create: `src/components/character/CharacterAvatar.tsx`
- Create: `src/constants/moods.ts`
- Test: `__tests__/characterAvatar.test.ts`

**Interfaces:**
- Consumes: `MoodState` from `src/types/domain.ts`
- Produces:
  - `MOOD_PRESETS: Record<string, MoodState>` (8 состояний: happy, tired, hungry, sad, treat, grumpy, cozy, love для husband и wife)
  - `CharacterAvatar: React.FC<{ moodId: string; gender: 'husband' | 'wife'; size?: number }>`
  - `LiquidGlassTheme` (цвета, градиенты, блюр, тени)

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/characterAvatar.test.ts
import { MOOD_PRESETS, getMoodById } from '../src/constants/moods';

describe('Moods & Character configuration', () => {
  it('contains exactly 8 emotional states', () => {
    expect(Object.keys(MOOD_PRESETS)).toHaveLength(8);
    expect(MOOD_PRESETS).toHaveProperty('happy');
    expect(MOOD_PRESETS).toHaveProperty('tired');
    expect(MOOD_PRESETS).toHaveProperty('hungry');
    expect(MOOD_PRESETS).toHaveProperty('sad');
    expect(MOOD_PRESETS).toHaveProperty('treat');
    expect(MOOD_PRESETS).toHaveProperty('grumpy');
    expect(MOOD_PRESETS).toHaveProperty('cozy');
    expect(MOOD_PRESETS).toHaveProperty('love');
  });

  it('returns valid mood metadata with title and animation tags', () => {
    const mood = getMoodById('tired');
    expect(mood.title).toContain('Устал');
    expect(mood.animClass).toBe('anim-tired');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/characterAvatar.test.ts`  
Expected: FAIL with "Cannot find module '../src/constants/moods'"

- [ ] **Step 3: Implement Liquid Glass tokens and Character Avatar**

Создать `src/theme/liquidGlass.ts` с токенами стекла.  
Создать `src/constants/moods.ts` с 8 состояниями для обоих полов.  
Создать `src/components/character/CharacterAvatar.tsx` на базе `react-native-svg` и `react-native-reanimated` для отрисовки анимированных векторных ушек, глаз, румянца и частиц.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/characterAvatar.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/theme/liquidGlass.ts src/constants/moods.ts src/components/character/CharacterAvatar.tsx __tests__/characterAvatar.test.ts
git commit -m "feat: add liquid glass theme and 8-mood vector character avatar"
```

---

### Task 3: Shared Real-Time Shopping List & Consumables

**Files:**
- Create: `src/services/shoppingService.ts`
- Create: `src/components/shopping/ShoppingListView.tsx`
- Test: `__tests__/shoppingService.test.ts`

**Interfaces:**
- Consumes: `ShoppingItem` from `src/types/domain.ts`
- Produces:
  - `addItem(list: ShoppingItem[], name: string, comment?: string, photoUri?: string): ShoppingItem[]`
  - `toggleItemChecked(list: ShoppingItem[], itemId: string): ShoppingItem[]`
  - `getEndingSoonItems(history: ShoppingItem[]): string[]`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/shoppingService.test.ts
import { addItem, toggleItemChecked, getEndingSoonItems } from '../src/services/shoppingService';
import { ShoppingItem } from '../src/types/domain';

describe('ShoppingService', () => {
  it('adds item with photo and auto-category', () => {
    const list: ShoppingItem[] = [];
    const updated = addItem(list, 'Сыр Маасдам', 'В синей пачке', 'file://photo1.webp');
    expect(updated).toHaveLength(1);
    expect(updated[0].name).toBe('Сыр Маасдам');
    expect(updated[0].photoUri).toBe('file://photo1.webp');
    expect(updated[0].checked).toBe(false);
  });

  it('toggles item checked state and updates timestamp', () => {
    const list: ShoppingItem[] = [{ id: '1', name: 'Хлеб', checked: false, createdAt: 1000 }];
    const checked = toggleItemChecked(list, '1');
    expect(checked[0].checked).toBe(true);
    expect(checked[0].completedAt).toBeDefined();
  });

  it('predicts ending soon consumables based on recurrence cycle', () => {
    const history: ShoppingItem[] = [
      { id: '1', name: 'Капсулы для посудомойки', checked: true, createdAt: Date.now() - 32 * 86400000, recurrenceDays: 30 }
    ];
    const ending = getEndingSoonItems(history);
    expect(ending).toContain('Капсулы для посудомойки');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/shoppingService.test.ts`  
Expected: FAIL with "Cannot find module '../src/services/shoppingService'"

- [ ] **Step 3: Implement shoppingService**

Реализовать функции добавления, переключения статуса, прикрепления фото и расчет цикла регулярных расходников (`recurrenceDays`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/shoppingService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/shoppingService.ts __tests__/shoppingService.test.ts
git commit -m "feat: implement shopping list service with consumable prediction"
```

---

### Task 4: Fast SOS Push Requests & "At the Store" Mode

**Files:**
- Create: `src/services/notificationService.ts`
- Create: `src/components/notifications/QuickPushBar.tsx`
- Test: `__tests__/notificationService.test.ts`

**Interfaces:**
- Produces:
  - `buildSosPayload(senderName: string, itemText: string): PushNotificationPayload`
  - `buildStoreEntryPayload(senderName: string): PushNotificationPayload`
  - `canSendNotification(lastSentTimestamp: number, cooldownMs: number): boolean`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/notificationService.test.ts
import { buildSosPayload, buildStoreEntryPayload, canSendNotification } from '../src/services/notificationService';

describe('NotificationService', () => {
  it('creates High Priority SOS notification payload with action buttons', () => {
    const payload = buildSosPayload('Жена', 'хлеб');
    expect(payload.channelId).toBe('household_urgent');
    expect(payload.priority).toBe('high');
    expect(payload.title).toContain('Жена');
    expect(payload.body).toContain('хлеб');
    expect(payload.actions).toContainEqual(expect.objectContaining({ id: 'action_buy', title: 'Куплю!' }));
  });

  it('creates store arrival notification payload', () => {
    const payload = buildStoreEntryPayload('Муж');
    expect(payload.title).toContain('Муж зашёл в магазин');
    expect(payload.body).toContain('5 минут');
  });

  it('rate-limits rapid spam taps with cooldown', () => {
    const now = Date.now();
    expect(canSendNotification(now - 1000, 5000)).toBe(false);
    expect(canSendNotification(now - 6000, 5000)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/notificationService.test.ts`  
Expected: FAIL with "Cannot find module '../src/services/notificationService'"

- [ ] **Step 3: Implement notificationService**

Реализовать форматирование FCM data-payload с каналом высокой важности Android `household_urgent`, экшенами ответа прямо в шторке и дебаунсом отправки.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/notificationService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/notificationService.ts __tests__/notificationService.test.ts
git commit -m "feat: implement high-priority push payloads and rate-limiting"
```

---

### Task 5: "What's for Dinner?" Roulette & Secret Wishlist

**Files:**
- Create: `src/services/dinnerService.ts`
- Create: `src/services/wishlistService.ts`
- Test: `__tests__/dinnerWishlist.test.ts`

**Interfaces:**
- Produces:
  - `parseRecipeIngredients(recipe: DinnerRecipe, selectedIndices?: number[]): string[]`
  - `addIngredientsToShoppingList(shoppingList: ShoppingItem[], ingredients: string[]): ShoppingItem[]`
  - `filterWishlistForUser(wishlist: WishlistItem[], currentUserId: string): WishlistItem[]`
  - `markWishSecretlyPurchased(wishlist: WishlistItem[], itemId: string, buyerId: string): WishlistItem[]`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/dinnerWishlist.test.ts
import { parseRecipeIngredients, addIngredientsToShoppingList } from '../src/services/dinnerService';
import { filterWishlistForUser, markWishSecretlyPurchased } from '../src/services/wishlistService';
import { DinnerRecipe, WishlistItem, ShoppingItem } from '../src/types/domain';

describe('Dinner & Wishlist Services', () => {
  const carbonara: DinnerRecipe = {
    id: 'r1',
    title: 'Паста Карбонара',
    cookTimeMinutes: 25,
    ingredients: ['Спагетти', 'Бекон', 'Пармезан', 'Яйца']
  };

  it('parses recipe ingredients and adds them to shopping list', () => {
    const list: ShoppingItem[] = [];
    const needed = parseRecipeIngredients(carbonara, [0, 2]); // только спагетти и пармезан
    expect(needed).toEqual(['Спагетти', 'Пармезан']);

    const updatedList = addIngredientsToShoppingList(list, needed);
    expect(updatedList).toHaveLength(2);
    expect(updatedList.map(i => i.name)).toContain('Спагетти');
  });

  it('masks secret wishlist purchases from the recipient', () => {
    const items: WishlistItem[] = [
      { id: 'w1', ownerId: 'wife', title: 'Аромасвеча', isSecretPurchased: true, buyerId: 'husband' },
      { id: 'w2', ownerId: 'wife', title: 'Носочки', isSecretPurchased: false }
    ];

    // Муж видит, что свеча тайно куплена
    const husbandView = filterWishlistForUser(items, 'husband');
    expect(husbandView[0].isSecretPurchased).toBe(true);

    // Жена НЕ должна видеть, что свеча уже куплена (сюрприз сохраняется)
    const wifeView = filterWishlistForUser(items, 'wife');
    expect(wifeView[0].isSecretPurchased).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/dinnerWishlist.test.ts`  
Expected: FAIL with "Cannot find module '../src/services/dinnerService'"

- [ ] **Step 3: Implement dinnerService & wishlistService**

Реализовать перенос ингредиентов рецептов в список покупок и логику маскирования секретных покупок вишлиста.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/dinnerWishlist.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/dinnerService.ts src/services/wishlistService.ts __tests__/dinnerWishlist.test.ts
git commit -m "feat: implement dinner ingredient transfer and secret wishlist masking"
```

---

### Task 6: House Passport Knowledge Base

**Files:**
- Create: `src/services/passportService.ts`
- Create: `src/components/passport/PassportCard.tsx`
- Test: `__tests__/passportService.test.ts`

**Interfaces:**
- Produces:
  - `formatForClipboard(item: HousePassportItem): string`
  - `upsertPassportItem(items: HousePassportItem[], item: HousePassportItem): HousePassportItem[]`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/passportService.test.ts
import { formatForClipboard, upsertPassportItem } from '../src/services/passportService';
import { HousePassportItem } from '../src/types/domain';

describe('PassportService', () => {
  it('formats entry for instant one-tap clipboard copy', () => {
    const item: HousePassportItem = { id: 'p1', category: 'intercom', label: 'Домофон', value: '# 4829', note: 'Калитка 1234' };
    expect(formatForClipboard(item)).toBe('# 4829');
  });

  it('updates or inserts house passport data', () => {
    const items: HousePassportItem[] = [];
    const item: HousePassportItem = { id: 'p1', category: 'filter', label: 'Фильтр', value: 'Аквафор К5' };
    const updated = upsertPassportItem(items, item);
    expect(updated).toHaveLength(1);
    expect(updated[0].value).toBe('Аквафор К5');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/passportService.test.ts`  
Expected: FAIL with "Cannot find module '../src/services/passportService'"

- [ ] **Step 3: Implement passportService**

Реализовать форматирование, быстрое копирование и хранение паспорта дома.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/passportService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/passportService.ts __tests__/passportService.test.ts
git commit -m "feat: implement house passport service with quick copy"
```

---

### Task 7: Samsung One UI AppWidget Integration

**Files:**
- Create: `src/widgets/PartnerMoodWidget.tsx`
- Create: `src/services/widgetSyncService.ts`
- Test: `__tests__/widgetSyncService.test.ts`

**Interfaces:**
- Consumes: `UserProfile`, `MoodState`, `ShoppingItem`
- Produces:
  - `getWidgetRenderData(partner: UserProfile, unboughtCount: number): WidgetDisplayData`
  - `updateAppWidget(data: WidgetDisplayData): Promise<void>`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/widgetSyncService.test.ts
import { getWidgetRenderData } from '../src/services/widgetSyncService';
import { UserProfile } from '../src/types/domain';

describe('WidgetSyncService', () => {
  it('prepares high-contrast layout data for Samsung One UI widget', () => {
    const partner: UserProfile = {
      id: 'u2',
      name: 'Жена',
      role: 'wife',
      currentMoodId: 'cozy',
      updatedAt: Date.now() - 15 * 60 * 1000
    };
    const widgetData = getWidgetRenderData(partner, 3);
    expect(widgetData.partnerName).toBe('Жена');
    expect(widgetData.moodTitle).toContain('Уютная булочка');
    expect(widgetData.unboughtCountText).toBe('3 в списке');
    expect(widgetData.timeAgoText).toBe('15 мин назад');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/widgetSyncService.test.ts`  
Expected: FAIL with "Cannot find module '../src/services/widgetSyncService'"

- [ ] **Step 3: Implement widget layout and sync service**

Создать `src/widgets/PartnerMoodWidget.tsx` для Android AppWidgetProvider (`react-native-android-widget`) с кнопками быстрых действий («Обнять», «Уже еду», «Список») и сервис `src/services/widgetSyncService.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/widgetSyncService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/widgets/PartnerMoodWidget.tsx src/services/widgetSyncService.ts __tests__/widgetSyncService.test.ts
git commit -m "feat: implement Samsung One UI widget layout and sync service"
```
