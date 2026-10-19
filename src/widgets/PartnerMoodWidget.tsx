import { WidgetDisplayData, WidgetAction } from '../types/domain';
import { liquidGlassTheme } from '../theme/liquidGlass';

export type WidgetLayoutSize = '2x2' | '4x2';

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

export interface PartnerMoodWidgetProps {
  data: WidgetDisplayData;
  layoutSize?: WidgetLayoutSize;
  onAction?: (actionId: string) => void;
}

export interface PartnerMoodWidgetRenderProps extends PartnerMoodWidgetProps {
  layoutSize: WidgetLayoutSize;
  renderedHtml: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders HTML markup for Samsung One UI AppWidget.
 * High-contrast, AMOLED-friendly Liquid Glass design with rounded corners (26px).
 */
export function renderPartnerMoodWidgetHtml(props: PartnerMoodWidgetProps): string {
  const { data, layoutSize = '4x2' } = props;
  const theme = liquidGlassTheme;

  const hugAction = data.actions.find((a) => a.id === 'hug') || {
    id: 'hug',
    label: 'Обнять',
    icon: '🤗',
  };
  const onMyWayAction = data.actions.find((a) => a.id === 'on_my_way') || {
    id: 'on_my_way',
    label: 'Уже еду',
    icon: '🚗',
  };
  const shoppingAction = data.actions.find((a) => a.id === 'shopping_list') || {
    id: 'shopping_list',
    label: data.unboughtCountText,
    icon: '🛒',
  };

  if (layoutSize === '2x2') {
    return `
      <div class="samsung-widget widget-compact-2x2" style="
        font-family: ${theme.typography.fontFamilyPrimary};
        background: rgba(18, 20, 26, 0.92);
        border: 1.5px solid rgba(255, 255, 255, 0.22);
        border-radius: 26px;
        padding: 14px;
        color: #FFFFFF;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 170px;
        height: 170px;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; font-size: 13px; color: #FFFFFF; letter-spacing: 0.3px;">
            ${escapeHtml(data.partnerName)}
          </span>
          <span style="font-size: 11px; color: #9EABB8; font-weight: 500;">
            ${escapeHtml(data.timeAgoText)}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 4px 0;">
          <div style="width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;">
            ${data.characterSvg}
          </div>
          <div style="
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid ${data.moodColor};
            border-radius: 12px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 600;
            color: #FFFFFF;
            text-align: center;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${escapeHtml(data.moodTitle)}
          </div>
        </div>

        <div style="display: flex; gap: 6px;">
          <button class="widget-btn-action" data-action="${hugAction.id}" style="
            flex: 1;
            background: rgba(255, 94, 98, 0.25);
            border: 1px solid #FF5E62;
            color: #FFFFFF;
            border-radius: 12px;
            padding: 6px 4px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            cursor: pointer;
          ">
            <span>${hugAction.icon || '🤗'}</span>
            <span>${escapeHtml(hugAction.label)}</span>
          </button>
          <button class="widget-btn-action" data-action="${shoppingAction.id}" style="
            flex: 1;
            background: rgba(0, 242, 254, 0.2);
            border: 1px solid #00F2FE;
            color: #FFFFFF;
            border-radius: 12px;
            padding: 6px 4px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            cursor: pointer;
          ">
            <span>${shoppingAction.icon || '🛒'}</span>
            <span>${data.unboughtCount}</span>
          </button>
        </div>
      </div>
    `.trim();
  }

  // Expanded 4x2 layout
  return `
    <div class="samsung-widget widget-expanded-4x2" style="
      font-family: ${theme.typography.fontFamilyPrimary};
      background: rgba(18, 20, 26, 0.94);
      border: 1.5px solid rgba(255, 255, 255, 0.24);
      border-radius: 28px;
      padding: 16px;
      color: #FFFFFF;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 360px;
      height: 180px;
      box-sizing: border-box;
      overflow: hidden;
    ">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 4px;
          border: 1px solid rgba(255, 255, 255, 0.15);
        ">
          ${data.characterSvg}
        </div>

        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
            <span style="font-weight: 700; font-size: 15px; color: #FFFFFF;">
              ${escapeHtml(data.partnerName)}
            </span>
            <span style="font-size: 11px; color: #9EABB8; font-weight: 500;">
              ${escapeHtml(data.timeAgoText)}
            </span>
          </div>

          <div style="
            font-size: 14px;
            font-weight: 700;
            color: ${data.moodColor};
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${escapeHtml(data.moodTitle)}
          </div>

          ${
            data.moodDescription
              ? `
            <div style="
              font-size: 12px;
              color: #CBD2D9;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 4px;
            ">
              ${escapeHtml(data.moodDescription)}
            </div>
          `
              : ''
          }
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 10px;">
        <button class="widget-btn-action" data-action="${hugAction.id}" style="
          flex: 1;
          background: rgba(255, 94, 98, 0.22);
          border: 1px solid #FF5E62;
          color: #FFFFFF;
          border-radius: 14px;
          padding: 10px 8px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        ">
          <span>${hugAction.icon || '🤗'}</span>
          <span>${escapeHtml(hugAction.label)}</span>
        </button>

        <button class="widget-btn-action" data-action="${onMyWayAction.id}" style="
          flex: 1;
          background: rgba(155, 81, 224, 0.22);
          border: 1px solid #9B51E0;
          color: #FFFFFF;
          border-radius: 14px;
          padding: 10px 8px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        ">
          <span>${onMyWayAction.icon || '🚗'}</span>
          <span>${escapeHtml(onMyWayAction.label)}</span>
        </button>

        <button class="widget-btn-action" data-action="${shoppingAction.id}" style="
          flex: 1.2;
          background: rgba(0, 242, 254, 0.18);
          border: 1px solid #00F2FE;
          color: #FFFFFF;
          border-radius: 14px;
          padding: 10px 8px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        ">
          <span>${shoppingAction.icon || '🛒'}</span>
          <span>${escapeHtml(shoppingAction.label)}</span>
        </button>
      </div>
    </div>
  `.trim();
}

/**
 * Samsung One UI Partner Mood & Status Widget Component.
 */
export const PartnerMoodWidget: React.FC<PartnerMoodWidgetProps> = (props) => {
  const { layoutSize = '4x2' } = props;
  const renderedHtml = renderPartnerMoodWidgetHtml(props);

  return {
    type: 'PartnerMoodWidget',
    props: {
      ...props,
      layoutSize,
      renderedHtml,
      children: renderedHtml,
    },
    key: null,
  };
};

PartnerMoodWidget.displayName = 'PartnerMoodWidget';
