import { HousePassportItem } from '../../types/domain';
import { liquidGlassTheme } from '../../theme/liquidGlass';
import { formatForClipboard, getCategoryMeta } from '../../services/passportService';

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

export interface PassportCardProps {
  item: HousePassportItem;
  isCopied?: boolean;
  onCopy?: (text: string) => void;
  onEdit?: (item: HousePassportItem) => void;
  onDelete?: (id: string) => void;
}

export interface PassportCardRenderProps extends PassportCardProps {
  clipboardText: string;
  renderedHtml: string;
}

/**
 * Generates an HTML string representing a single Passport Card in Liquid Glass style.
 * Optimized for high legibility in dim doorways and fast 1-tap copy.
 */
export function renderPassportCardHtml(props: PassportCardProps): string {
  const { item, isCopied = false } = props;
  const theme = liquidGlassTheme;
  const meta = getCategoryMeta(item.category);
  const clipboardValue = formatForClipboard(item);

  const noteHtml = item.note
    ? `
      <div class="passport-card-note" style="
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: ${theme.colors.textMuted};
      ">
        <span style="opacity: 0.7;">ℹ️</span>
        <span>${escapeHtml(item.note)}</span>
      </div>
    `
    : '';

  const copyButtonState = isCopied
    ? `
      <button class="btn-passport-copy copied" data-item-id="${item.id}" data-clipboard="${escapeHtml(clipboardValue)}" style="
        background: rgba(0, 242, 254, 0.25);
        border: 1px solid ${theme.colors.accentCyan};
        color: ${theme.colors.accentCyan};
        border-radius: ${theme.radius.button}px;
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
        box-shadow: 0 0 12px rgba(0, 242, 254, 0.3);
      ">
        <span>✓</span>
        <span>Скопировано</span>
      </button>
    `
    : `
      <button class="btn-passport-copy" data-item-id="${item.id}" data-clipboard="${escapeHtml(clipboardValue)}" title="Скопировать в буфер" style="
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid ${theme.glass.borderLight};
        color: ${theme.colors.textLight};
        border-radius: ${theme.radius.button}px;
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      ">
        <span>📋</span>
        <span>Копировать</span>
      </button>
    `;

  return `
    <div class="passport-card" data-category="${item.category}" data-item-id="${item.id}" style="
      font-family: ${theme.typography.fontFamilyPrimary};
      background: ${theme.glass.bgSubtle};
      border: 1px solid ${theme.glass.border};
      border-radius: ${theme.radius.card}px;
      padding: 16px 18px;
      backdrop-filter: ${theme.glass.blurFilter};
      box-shadow: ${theme.glass.shadow};
      color: ${theme.colors.textLight};
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;" class="passport-category-icon">${meta.icon}</span>
          <span class="passport-category-label" style="
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: ${theme.colors.accentCyan};
          ">
            ${escapeHtml(item.label)}
          </span>
        </div>
        <span class="passport-category-badge" style="
          font-size: 11px;
          color: ${theme.colors.textMuted};
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: ${theme.radius.pill}px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        ">
          ${escapeHtml(meta.title)}
        </span>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 4px 0;">
        <div class="passport-value" style="
          font-family: ${theme.typography.fontFamilyAccent};
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #FFFFFF;
          word-break: break-word;
          user-select: all;
        ">
          ${escapeHtml(item.value)}
        </div>
        <div>
          ${copyButtonState}
        </div>
      </div>

      ${noteHtml}
    </div>
  `.trim();
}

/**
 * PassportCard Component compatible with React / React Native.
 */
export const PassportCard: React.FC<PassportCardProps> = (props) => {
  const clipboardText = formatForClipboard(props.item);
  const renderedHtml = renderPassportCardHtml(props);

  return {
    type: 'PassportCard',
    props: {
      ...props,
      clipboardText,
      renderedHtml,
      children: renderedHtml,
    },
    key: props.item?.id || null,
  };
};

PassportCard.displayName = 'PassportCard';

/**
 * Escapes HTML entities to ensure safe rendering of user inputs.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
