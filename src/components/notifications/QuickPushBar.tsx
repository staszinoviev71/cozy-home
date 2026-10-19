import { liquidGlassTheme } from '../../theme/liquidGlass';
import {
  canSendNotification,
  getRemainingCooldown,
  QUICK_SOS_PRESETS,
  SosPreset,
  DEFAULT_NOTIFICATION_COOLDOWN_MS,
} from '../../services/notificationService';

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

export interface QuickPushBarProps {
  currentUserName: string;
  partnerName?: string;
  lastSentTimestamp?: number;
  cooldownMs?: number;
  isStoreMode?: boolean;
  presets?: SosPreset[];
  onSendSos?: (itemText: string) => void;
  onStoreArrival?: () => void;
  onToggleStoreMode?: () => void;
}

export interface QuickPushBarRenderProps extends QuickPushBarProps {
  isCoolingDown: boolean;
  remainingCooldownSeconds: number;
  renderedHtml: string;
}

/**
 * Generates HTML string representing the Quick Push bar in Liquid Glass style.
 */
export function renderQuickPushBarHtml(props: QuickPushBarProps): string {
  const {
    currentUserName,
    partnerName = 'Партнёр',
    lastSentTimestamp = 0,
    cooldownMs = DEFAULT_NOTIFICATION_COOLDOWN_MS,
    isStoreMode = false,
    presets = QUICK_SOS_PRESETS,
  } = props;

  const theme = liquidGlassTheme;
  const isAllowed = canSendNotification(lastSentTimestamp, cooldownMs);
  const remainingSeconds = getRemainingCooldown(lastSentTimestamp, cooldownMs);

  const cooldownBadge = !isAllowed
    ? `
      <div class="cooldown-badge" style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 153, 0, 0.2);
        border: 1px solid ${theme.colors.accentAmber};
        color: ${theme.colors.accentAmber};
        padding: 4px 10px;
        border-radius: ${theme.radius.pill}px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.3px;
      ">
        <span>⏳</span>
        <span>Подождите ${remainingSeconds} сек</span>
      </div>
    `
    : '';

  const storeModeBtn = `
    <button class="btn-store-arrival" ${!isAllowed ? 'disabled' : ''} style="
      background: ${
        isStoreMode
          ? 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)'
          : 'rgba(0, 242, 254, 0.15)'
      };
      border: 1px solid ${theme.colors.accentCyan};
      color: ${isStoreMode ? '#0B0E17' : '#FFFFFF'};
      padding: 12px 18px;
      border-radius: ${theme.radius.tile}px;
      font-weight: 700;
      font-size: 14px;
      cursor: ${isAllowed ? 'pointer' : 'not-allowed'};
      opacity: ${isAllowed ? '1' : '0.6'};
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.2s ease;
      box-shadow: ${isStoreMode ? '0 0 20px rgba(0, 242, 254, 0.35)' : 'none'};
    ">
      <span style="font-size: 18px;">🛒</span>
      <span>${isStoreMode ? 'Режим: В магазине (активен)' : 'Зашёл в магазин (пуш)'}</span>
    </button>
  `;

  const chipsHtml = presets
    .map((preset) => {
      return `
      <button class="chip-sos-preset" data-sos-text="${preset.text}" ${!isAllowed ? 'disabled' : ''} style="
        background: ${theme.glass.bg};
        border: 1px solid ${theme.glass.border};
        border-radius: ${theme.radius.pill}px;
        color: #FFFFFF;
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: ${isAllowed ? 'pointer' : 'not-allowed'};
        opacity: ${isAllowed ? '1' : '0.55'};
        backdrop-filter: ${theme.glass.blurFilter};
        transition: transform 0.15s ease, background 0.15s ease;
      ">
        <span>${preset.icon}</span>
        <span>${preset.shortLabel}</span>
      </button>
    `;
    })
    .join('');

  return `
    <div class="quick-push-bar" style="
      font-family: ${theme.typography.fontFamilyPrimary};
      background: ${theme.glass.bgSubtle};
      border: 1px solid ${theme.glass.borderLight};
      border-radius: ${theme.radius.card}px;
      padding: 16px;
      backdrop-filter: ${theme.glass.blurFilter};
      box-shadow: ${theme.glass.shadow};
      color: ${theme.colors.textLight};
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">⚡</span>
          <span style="font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: ${theme.colors.textLight};">
            Быстрые SOS-пуши → ${partnerName}
          </span>
        </div>
        ${cooldownBadge}
      </div>

      <div style="margin-bottom: 14px;">
        ${storeModeBtn}
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span style="font-size: 12px; color: ${theme.colors.textMuted};">Срочно попросить купить в 1 тап:</span>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${chipsHtml}
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * QuickPushBar Component
 */
export const QuickPushBar: React.FC<QuickPushBarProps> = (props) => {
  const {
    lastSentTimestamp = 0,
    cooldownMs = DEFAULT_NOTIFICATION_COOLDOWN_MS,
  } = props;

  const isAllowed = canSendNotification(lastSentTimestamp, cooldownMs);
  const remainingSeconds = getRemainingCooldown(lastSentTimestamp, cooldownMs);
  const renderedHtml = renderQuickPushBarHtml(props);

  return {
    type: 'QuickPushBar',
    props: {
      ...props,
      isCoolingDown: !isAllowed,
      remainingCooldownSeconds: remainingSeconds,
      renderedHtml,
      children: renderedHtml,
    },
    key: null,
  };
};

QuickPushBar.displayName = 'QuickPushBar';
