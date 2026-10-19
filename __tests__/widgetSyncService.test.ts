import {
  getWidgetRenderData,
  updateAppWidget,
  getLastWidgetData,
  registerWidgetUpdater,
  formatTimeAgo,
  formatUnboughtCount,
  WidgetDisplayData,
} from '../src/services/widgetSyncService';
import { UserProfile } from '../src/types/domain';
import {
  PartnerMoodWidget,
  renderPartnerMoodWidgetHtml,
  WidgetLayoutSize,
} from '../src/widgets/PartnerMoodWidget';

describe('WidgetSyncService', () => {
  beforeEach(() => {
    registerWidgetUpdater(null);
  });

  it('prepares high-contrast layout data for Samsung One UI widget', () => {
    const partner: UserProfile = {
      id: 'u2',
      name: 'Жена',
      role: 'wife',
      currentMoodId: 'cozy',
      updatedAt: Date.now() - 15 * 60 * 1000,
    };
    const widgetData = getWidgetRenderData(partner, 3);
    expect(widgetData.partnerName).toBe('Жена');
    expect(widgetData.moodTitle).toContain('Уютная булочка');
    expect(widgetData.unboughtCountText).toBe('3 в списке');
    expect(widgetData.timeAgoText).toBe('15 мин назад');
  });

  it('formats time ago correctly across different intervals', () => {
    const now = 1700000000000;
    expect(formatTimeAgo(now, now)).toBe('только что');
    expect(formatTimeAgo(now - 30 * 1000, now)).toBe('только что');
    expect(formatTimeAgo(now - 5 * 60 * 1000, now)).toBe('5 мин назад');
    expect(formatTimeAgo(now - 2 * 60 * 60 * 1000, now)).toBe('2 ч назад');
    expect(formatTimeAgo(now - 26 * 60 * 60 * 1000, now)).toBe('1 дн назад');
    expect(formatTimeAgo(0, now)).toBe('давно');
  });

  it('formats unbought items counter', () => {
    expect(formatUnboughtCount(0)).toBe('0 в списке');
    expect(formatUnboughtCount(5)).toBe('5 в списке');
  });

  it('handles husband role with custom presets and character SVG', () => {
    const husband: UserProfile = {
      id: 'u1',
      name: 'Муж',
      role: 'husband',
      currentMoodId: 'tired',
      updatedAt: Date.now() - 5 * 60 * 1000,
    };
    const widgetData = getWidgetRenderData(husband, 0);
    expect(widgetData.partnerName).toBe('Муж');
    expect(widgetData.partnerRole).toBe('husband');
    expect(widgetData.moodTitle).toContain('Устал');
    expect(widgetData.unboughtCountText).toBe('0 в списке');
    expect(widgetData.characterSvg).toContain('<svg');
    expect(widgetData.characterSvg).toContain('circle'); // Husband has bear ears
  });

  it('provides quick action buttons («Обнять», «Уже еду», «Список»)', () => {
    const partner: UserProfile = {
      id: 'u2',
      name: 'Жена',
      role: 'wife',
      currentMoodId: 'happy',
      updatedAt: Date.now(),
    };
    const widgetData = getWidgetRenderData(partner, 2);
    expect(widgetData.actions).toHaveLength(3);
    const actionIds = widgetData.actions.map((a) => a.id);
    expect(actionIds).toContain('hug');
    expect(actionIds).toContain('on_my_way');
    expect(actionIds).toContain('shopping_list');

    const hugAction = widgetData.actions.find((a) => a.id === 'hug');
    expect(hugAction?.label).toContain('Обнять');

    const onMyWayAction = widgetData.actions.find((a) => a.id === 'on_my_way');
    expect(onMyWayAction?.label).toContain('Уже еду');
  });

  it('updates app widget data and triggers listeners', async () => {
    const partner: UserProfile = {
      id: 'u2',
      name: 'Жена',
      role: 'wife',
      currentMoodId: 'love',
      updatedAt: Date.now(),
    };
    const data = getWidgetRenderData(partner, 1);

    let callbackCalledWith: WidgetDisplayData | null = null;
    registerWidgetUpdater(async (updatedData) => {
      callbackCalledWith = updatedData;
    });

    await updateAppWidget(data);
    expect(getLastWidgetData()).toEqual(data);
    expect(callbackCalledWith).toEqual(data);
  });
});

describe('PartnerMoodWidget Component', () => {
  const sampleData: WidgetDisplayData = {
    partnerId: 'u2',
    partnerName: 'Любимая',
    partnerRole: 'wife',
    moodId: 'cozy',
    moodTitle: 'Уютная булочка 🥐',
    moodColor: '#FFD54F',
    moodEmoji: '🥐',
    unboughtCount: 4,
    unboughtCountText: '4 в списке',
    timeAgoText: '10 мин назад',
    characterSvg: '<svg class="character-svg">Cat</svg>',
    actions: [
      { id: 'hug', label: 'Обнять', icon: '🤗' },
      { id: 'on_my_way', label: 'Уже еду', icon: '🚗' },
      { id: 'shopping_list', label: '4 в списке', icon: '🛒' },
    ],
    updatedAt: Date.now(),
  };

  it('renders compact 2x2 widget layout for Samsung One UI', () => {
    const html = renderPartnerMoodWidgetHtml({
      data: sampleData,
      layoutSize: '2x2',
    });

    expect(html).toContain('widget-compact-2x2');
    expect(html).toContain('Любимая');
    expect(html).toContain('Уютная булочка');
    expect(html).toContain('10 мин назад');
    expect(html).toContain('Cat');
    expect(html).toContain('Обнять');
  });

  it('renders expanded 4x2 widget layout for Samsung One UI with full quick actions', () => {
    const html = renderPartnerMoodWidgetHtml({
      data: sampleData,
      layoutSize: '4x2',
    });

    expect(html).toContain('widget-expanded-4x2');
    expect(html).toContain('Любимая');
    expect(html).toContain('Уютная булочка');
    expect(html).toContain('Cat');
    expect(html).toContain('Обнять');
    expect(html).toContain('Уже еду');
    expect(html).toContain('4 в списке');
  });

  it('returns valid PartnerMoodWidget React element descriptor', () => {
    const element = PartnerMoodWidget({
      data: sampleData,
      layoutSize: '4x2',
    });

    expect(element.type).toBe('PartnerMoodWidget');
    expect(element.props.layoutSize).toBe('4x2');
    expect(element.props.renderedHtml).toBeDefined();
    expect(element.props.renderedHtml).toContain('widget-expanded-4x2');
  });
});
