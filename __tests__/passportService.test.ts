import {
  formatForClipboard,
  upsertPassportItem,
  deletePassportItem,
  createPassportItem,
  getCategoryMeta,
  filterPassportByCategory,
  searchPassportItems,
  DEFAULT_PASSPORT_ITEMS,
  PASSPORT_CATEGORIES,
} from '../src/services/passportService';
import {
  PassportCard,
  renderPassportCardHtml,
} from '../src/components/passport/PassportCard';
import { HousePassportItem } from '../src/types/domain';

describe('PassportService', () => {
  describe('formatForClipboard', () => {
    it('formats entry for instant one-tap clipboard copy', () => {
      const item: HousePassportItem = {
        id: 'p1',
        category: 'intercom',
        label: 'Домофон',
        value: '# 4829',
        note: 'Калитка 1234',
      };
      expect(formatForClipboard(item)).toBe('# 4829');
    });

    it('trims leading and trailing whitespace', () => {
      const item: HousePassportItem = {
        id: 'p2',
        category: 'wifi',
        label: 'Гостевой пароль',
        value: '   pass12345   ',
      };
      expect(formatForClipboard(item)).toBe('pass12345');
    });

    it('safely handles empty or missing values', () => {
      const itemWithoutVal = {
        id: 'p3',
        category: 'custom',
        label: 'Заметка',
        value: '',
      } as HousePassportItem;
      expect(formatForClipboard(itemWithoutVal)).toBe('');
      expect(formatForClipboard(null as any)).toBe('');
    });
  });

  describe('upsertPassportItem', () => {
    it('updates or inserts house passport data', () => {
      const items: HousePassportItem[] = [];
      const item: HousePassportItem = {
        id: 'p1',
        category: 'filter',
        label: 'Фильтр',
        value: 'Аквафор К5',
      };
      const updated = upsertPassportItem(items, item);
      expect(updated).toHaveLength(1);
      expect(updated[0].value).toBe('Аквафор К5');
    });

    it('updates existing item by matching id and does not mutate list', () => {
      const initial: HousePassportItem[] = [
        {
          id: 'p1',
          category: 'intercom',
          label: 'Домофон',
          value: '# 1111',
          updatedAt: 1000,
        },
        {
          id: 'p2',
          category: 'wifi',
          label: 'Wi-Fi',
          value: 'old-pass',
          updatedAt: 1000,
        },
      ];

      const modified: HousePassportItem = {
        id: 'p2',
        category: 'wifi',
        label: 'Wi-Fi 5GHz',
        value: 'new-secure-pass',
      };

      const result = upsertPassportItem(initial, modified);
      expect(result).toHaveLength(2);
      expect(result[1].label).toBe('Wi-Fi 5GHz');
      expect(result[1].value).toBe('new-secure-pass');
      expect(result[1].updatedAt).toBeGreaterThan(1000);
      // original untouched
      expect(initial[1].value).toBe('old-pass');
    });

    it('auto-generates id and timestamp if not provided', () => {
      const items: HousePassportItem[] = [];
      const item = {
        category: 'meter',
        label: 'Электричество',
        value: '12345678',
      } as HousePassportItem;

      const result = upsertPassportItem(items, item);
      expect(result[0].id).toBeDefined();
      expect(result[0].id).toMatch(/^pass_/);
      expect(result[0].updatedAt).toBeGreaterThan(0);
    });
  });

  describe('deletePassportItem', () => {
    it('removes item immutably by id', () => {
      const initial: HousePassportItem[] = [
        { id: '1', category: 'wifi', label: 'W', value: '1' },
        { id: '2', category: 'intercom', label: 'I', value: '2' },
      ];
      const remaining = deletePassportItem(initial, '1');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('2');
      expect(initial).toHaveLength(2);
    });
  });

  describe('createPassportItem', () => {
    it('creates well-formed item with auto ID and trimmed text', () => {
      const item = createPassportItem(
        'paint',
        '  Краска кухня  ',
        '  RAL 9010  ',
        '  матовая  '
      );
      expect(item.id).toMatch(/^pass_/);
      expect(item.category).toBe('paint');
      expect(item.label).toBe('Краска кухня');
      expect(item.value).toBe('RAL 9010');
      expect(item.note).toBe('матовая');
      expect(item.updatedAt).toBeGreaterThan(0);
    });
  });

  describe('category metadata and presets', () => {
    it('provides metadata for intercom, filter, wifi, meter, paint, and master', () => {
      expect(PASSPORT_CATEGORIES).toHaveProperty('intercom');
      expect(PASSPORT_CATEGORIES).toHaveProperty('filter');
      expect(PASSPORT_CATEGORIES).toHaveProperty('wifi');
      expect(PASSPORT_CATEGORIES).toHaveProperty('meter');
      expect(PASSPORT_CATEGORIES).toHaveProperty('paint');
      expect(PASSPORT_CATEGORIES).toHaveProperty('master');

      const intercomMeta = getCategoryMeta('intercom');
      expect(intercomMeta.icon).toBe('🔔');
      expect(intercomMeta.title).toContain('Домофон');

      const fallbackMeta = getCategoryMeta('custom_unknown');
      expect(fallbackMeta.icon).toBe('📌');
    });

    it('contains realistic default passport items', () => {
      expect(DEFAULT_PASSPORT_ITEMS.length).toBeGreaterThanOrEqual(5);
      const categories = DEFAULT_PASSPORT_ITEMS.map((i) => i.category);
      expect(categories).toContain('intercom');
      expect(categories).toContain('wifi');
      expect(categories).toContain('filter');
    });
  });

  describe('filter and search', () => {
    const sampleItems: HousePassportItem[] = [
      { id: '1', category: 'intercom', label: 'Домофон подъезда', value: '# 4829', note: 'Калитка 1234' },
      { id: '2', category: 'filter', label: 'Фильтр воды', value: 'Аквафор К5', note: 'Замена раз в полгода' },
      { id: '3', category: 'wifi', label: 'Wi-Fi гостевой', value: 'secretpass', note: 'Роутер в прихожей' },
    ];

    it('filters items by category or returns all', () => {
      const filters = filterPassportByCategory(sampleItems, 'filter');
      expect(filters).toHaveLength(1);
      expect(filters[0].label).toBe('Фильтр воды');

      expect(filterPassportByCategory(sampleItems, 'all')).toHaveLength(3);
      expect(filterPassportByCategory(sampleItems)).toHaveLength(3);
    });

    it('searches across label, value, note, and category', () => {
      expect(searchPassportItems(sampleItems, 'аквафор')).toHaveLength(1);
      expect(searchPassportItems(sampleItems, '1234')).toHaveLength(1); // matches note
      expect(searchPassportItems(sampleItems, 'домофон')).toHaveLength(1); // matches label
      expect(searchPassportItems(sampleItems, 'wifi')).toHaveLength(1); // matches category
      expect(searchPassportItems(sampleItems, 'nonexistent')).toHaveLength(0);
      expect(searchPassportItems(sampleItems, '')).toHaveLength(3);
    });
  });
});

describe('PassportCard Component', () => {
  const item: HousePassportItem = {
    id: 'pass_101',
    category: 'intercom',
    label: 'Домофон подъезда',
    value: '# 4829',
    note: 'Код калитки 1234',
  };

  it('renders PassportCard with Liquid Glass styling and quick-copy trigger', () => {
    const html = renderPassportCardHtml({ item });

    expect(html).toContain('passport-card');
    expect(html).toContain('Домофон подъезда');
    expect(html).toContain('# 4829');
    expect(html).toContain('Код калитки 1234');
    expect(html).toContain('btn-passport-copy');
    expect(html).toContain('data-clipboard="# 4829"');
    expect(html).toContain('backdrop-filter');
  });

  it('reflects copied state when isCopied is true', () => {
    const htmlCopied = renderPassportCardHtml({ item, isCopied: true });
    expect(htmlCopied).toContain('Скопировано');
    expect(htmlCopied).toContain('copied');

    const htmlNotCopied = renderPassportCardHtml({ item, isCopied: false });
    expect(htmlNotCopied).toContain('Копировать');
  });

  it('safely escapes special characters in value and note', () => {
    const dangerousItem: HousePassportItem = {
      id: 'pass_x',
      category: 'custom',
      label: 'Dangerous <script>',
      value: 'Value & "Quote"',
      note: 'Note with <tag>',
    };
    const html = renderPassportCardHtml({ item: dangerousItem });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;Quote&quot;');
  });

  it('exports functional component with proper props', () => {
    const component = PassportCard({ item });
    expect(component.type).toBe('PassportCard');
    expect(component.props.clipboardText).toBe('# 4829');
    expect(component.props.renderedHtml).toContain('passport-card');
  });
});
