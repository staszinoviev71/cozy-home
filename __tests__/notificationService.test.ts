import {
  buildSosPayload,
  buildStoreEntryPayload,
  canSendNotification,
  getRemainingCooldown,
  QUICK_SOS_PRESETS,
  DEFAULT_NOTIFICATION_COOLDOWN_MS,
  formatNotificationTime
} from '../src/services/notificationService';
import { QuickPushBar, renderQuickPushBarHtml } from '../src/components/notifications/QuickPushBar';

describe('NotificationService', () => {
  it('creates High Priority SOS notification payload with action buttons', () => {
    const payload = buildSosPayload('Жена', 'хлеб');
    expect(payload.channelId).toBe('household_urgent');
    expect(payload.priority).toBe('high');
    expect(payload.title).toContain('Жена');
    expect(payload.body).toContain('хлеб');
    expect(payload.actions).toContainEqual(expect.objectContaining({ id: 'action_buy', title: 'Куплю!' }));
    expect(payload.data).toBeDefined();
    expect(payload.data?.type).toBe('sos_request');
    expect(payload.data?.item).toBe('хлеб');
  });

  it('creates store arrival notification payload', () => {
    const payload = buildStoreEntryPayload('Муж');
    expect(payload.channelId).toBe('household_urgent');
    expect(payload.priority).toBe('high');
    expect(payload.title).toContain('Муж зашёл в магазин');
    expect(payload.body).toContain('5 минут');
    expect(payload.data?.type).toBe('store_entry');
    expect(payload.actions).toContainEqual(expect.objectContaining({ id: 'action_open_list' }));
  });

  it('rate-limits rapid spam taps with cooldown', () => {
    const now = Date.now();
    expect(canSendNotification(now - 1000, 5000)).toBe(false);
    expect(canSendNotification(now - 6000, 5000)).toBe(true);
  });

  it('handles edge cases in rate limiting', () => {
    expect(canSendNotification(0, 5000)).toBe(true);
    expect(canSendNotification(-1, 5000)).toBe(true);
    const now = Date.now();
    expect(canSendNotification(now, 5000)).toBe(false);
    expect(canSendNotification(now - 5000, 5000)).toBe(true);
  });

  it('calculates remaining cooldown correctly', () => {
    const now = Date.now();
    expect(getRemainingCooldown(now - 2000, 5000)).toBe(3);
    expect(getRemainingCooldown(now - 6000, 5000)).toBe(0);
    expect(getRemainingCooldown(0, 5000)).toBe(0);
  });

  it('provides quick SOS preset items', () => {
    expect(QUICK_SOS_PRESETS.length).toBeGreaterThanOrEqual(4);
    const texts = QUICK_SOS_PRESETS.map((p) => p.text.toLowerCase());
    expect(texts.some((t) => t.includes('хлеб'))).toBe(true);
    expect(texts.some((t) => t.includes('молоко'))).toBe(true);
    expect(texts.some((t) => t.includes('вод'))).toBe(true);
  });

  it('formats notification time properly', () => {
    const testTime = 1700000000000;
    const formatted = formatNotificationTime(testTime);
    expect(formatted).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('QuickPushBar Component', () => {
  it('renders quick push bar HTML with preset chips and store entry button', () => {
    const html = renderQuickPushBarHtml({
      lastSentTimestamp: 0,
      currentUserName: 'Жена',
      isStoreMode: false
    });

    expect(html).toContain('Зашёл в магазин');
    expect(html).toContain('хлеб');
    expect(html).toContain('молоко');
    expect(html).toContain('quick-push-bar');
  });

  it('shows cooldown badge when cooldown is active', () => {
    const now = Date.now();
    const html = renderQuickPushBarHtml({
      lastSentTimestamp: now - 2000,
      cooldownMs: 10000,
      currentUserName: 'Муж'
    });

    expect(html).toContain('cooldown-badge');
    expect(html).toContain('сек');
  });

  it('creates QuickPushBar React element structure', () => {
    const element = QuickPushBar({
      currentUserName: 'Жена',
      isStoreMode: true,
      lastSentTimestamp: 0
    });

    expect(element.type).toBe('QuickPushBar');
    expect(element.props.isStoreMode).toBe(true);
    expect(element.props.renderedHtml).toBeDefined();
  });
});
