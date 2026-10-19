import { ShoppingItem } from '../../types/domain';
import { liquidGlassTheme } from '../../theme/liquidGlass';
import { getShoppingStats, ShoppingStats } from '../../services/shoppingService';

export namespace React {
  export interface ReactElement<P = any, T = any> {
    type: T;
    props: P;
    key: any;
  }
  export type FC<P = {}> = {
    (props: P): ReactElement<any>;
    displayName?: string;
  };
}

export interface ShoppingListViewProps {
  items: ShoppingItem[];
  endingSoon?: string[];
  isStoreMode?: boolean;
  onToggleItem?: (itemId: string) => void;
  onAddItem?: (name: string, comment?: string, photoUri?: string) => void;
  onClearChecked?: () => void;
}

export interface ShoppingListViewRenderProps extends ShoppingListViewProps {
  stats: ShoppingStats;
  renderedHtml: string;
}

/**
 * Generates HTML string representing the shopping list with Liquid Glass styling.
 */
export function renderShoppingListHtml(
  items: ShoppingItem[],
  endingSoon: string[] = [],
  isStoreMode: boolean = false
): string {
  const stats = getShoppingStats(items);
  const theme = liquidGlassTheme;

  const endingSoonSection =
    endingSoon.length > 0
      ? `
    <div class="ending-soon-card" style="
      background: rgba(255, 179, 0, 0.12);
      border: 1px solid rgba(255, 179, 0, 0.35);
      border-radius: ${theme.radius.tile}px;
      padding: 14px 18px;
      margin-bottom: 16px;
      backdrop-filter: blur(16px);
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #FFB300; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
          ⏳ Скоро закончится дома
        </span>
        <span style="font-size: 11px; color: ${theme.colors.textMuted};">${endingSoon.length} поз.</span>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${endingSoon
          .map(
            (name) => `
          <button class="chip-consumable" style="
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 179, 0, 0.4);
            border-radius: ${theme.radius.pill}px;
            color: #FFFFFF;
            padding: 6px 12px;
            font-size: 13px;
            cursor: pointer;
          ">+ ${name}</button>
        `
          )
          .join('')}
      </div>
    </div>
  `
      : '';

  const storeModeHeader = isStoreMode
    ? `
    <div class="store-mode-banner" style="
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.22) 0%, rgba(79, 172, 254, 0.12) 100%);
      border: 1px solid ${theme.colors.accentCyan};
      border-radius: ${theme.radius.card}px;
      padding: 12px 18px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    ">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">🛒</span>
        <div>
          <div style="font-weight: 700; color: #FFFFFF; font-size: 15px;">Режим: В магазине</div>
          <div style="font-size: 12px; color: ${theme.colors.accentCyan};">Быстрое вычеркивание товаров</div>
        </div>
      </div>
      <div style="font-size: 13px; font-weight: 600; color: #FFFFFF; background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 12px;">
        Осталось: ${stats.remaining}
      </div>
    </div>
  `
    : '';

  const itemsHtml =
    items.length === 0
      ? `
    <div style="text-align: center; padding: 48px 16px; color: ${theme.colors.textMuted}; font-size: 15px;">
      🛒 Список покупок пуст.<br/>Добавьте первый товар или загляните в рецепты ужина!
    </div>
  `
      : items
          .map((item) => {
            const isChecked = item.checked;
            const textStyle = isChecked
              ? 'text-decoration: line-through; opacity: 0.5; color: #8F90A6;'
              : 'color: #FFFFFF; font-weight: 500;';

            const photoIndicator = item.photoUri
              ? `<span title="Есть фото упаковки" style="background: rgba(0, 242, 254, 0.15); border: 1px solid rgba(0, 242, 254, 0.4); padding: 2px 6px; border-radius: 6px; font-size: 11px; color: ${theme.colors.accentCyan};">📷 Фото</span>`
              : '';

            const commentSection = item.comment
              ? `<div style="font-size: 12px; color: ${theme.colors.textMuted}; margin-top: 2px;">💬 ${item.comment}</div>`
              : '';

            const categoryTag = item.category
              ? `<span style="font-size: 11px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px;">${item.category}</span>`
              : '';

            return `
      <div class="shopping-item-card" data-id="${item.id}" style="
        background: ${isChecked ? 'rgba(255, 255, 255, 0.05)' : theme.glass.bg};
        border: 1px solid ${isChecked ? 'rgba(255, 255, 255, 0.08)' : theme.glass.border};
        border-radius: ${theme.radius.tile}px;
        padding: ${isStoreMode ? '14px 16px' : '12px 16px'};
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        backdrop-filter: ${theme.glass.blurFilter};
        transition: all 0.2s ease;
      ">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} style="
            width: 20px;
            height: 20px;
            accent-color: ${theme.colors.primary};
            cursor: pointer;
          "/>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="${textStyle}; font-size: ${isStoreMode ? '16px' : '15px'};">${item.name}</span>
              ${photoIndicator}
              ${categoryTag}
            </div>
            ${commentSection}
          </div>
        </div>
      </div>
    `;
          })
          .join('');

  return `
    <div class="shopping-list-container" style="
      font-family: ${theme.typography.fontFamilyPrimary};
      background: ${theme.colors.backgroundDark};
      padding: 16px;
      border-radius: ${theme.radius.card}px;
      color: ${theme.colors.textLight};
    ">
      ${storeModeHeader}
      ${endingSoonSection}
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: #FFFFFF;">
          Список покупок (${stats.total})
        </h2>
        <span style="font-size: 13px; color: ${theme.colors.accentCyan};">
          Куплено: ${stats.checked}/${stats.total} (${stats.progressPercent}%)
        </span>
      </div>
      <div class="items-list">
        ${itemsHtml}
      </div>
    </div>
  `.trim();
}

/**
 * Liquid Glass Shopping List View Component
 */
export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  endingSoon = [],
  isStoreMode = false,
  onToggleItem,
  onAddItem,
  onClearChecked,
}) => {
  const stats = getShoppingStats(items);
  const renderedHtml = renderShoppingListHtml(items, endingSoon, isStoreMode);

  return {
    type: 'ShoppingListView',
    props: {
      items,
      endingSoon,
      isStoreMode,
      stats,
      renderedHtml,
      onToggleItem,
      onAddItem,
      onClearChecked,
      children: renderedHtml,
    },
    key: null,
  };
};

ShoppingListView.displayName = 'ShoppingListView';
