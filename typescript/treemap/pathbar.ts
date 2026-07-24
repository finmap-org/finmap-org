import { COLOR_SCALE, COLORS, LAYOUT, FONT } from './constants.js';
import { getNodeData } from './types.js';
import type { MarketData } from './types.js';

export class PathbarComponent {
  private element: HTMLElement | null = null;

  create(container: HTMLElement): HTMLElement {
    this.element = d3
      .select(container)
      .append('div')
      .style('height', `${LAYOUT.PATHBAR_HEIGHT}px`)
      .style('background-color', COLORS.PATHBAR_BG)
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('padding', '0')
      .style('color', COLORS.TEXT_WHITE)
      .style('font-family', FONT.FAMILY)
      .style('font-size', FONT.SIZE.PATHBAR)
      .style('border-bottom', `1px solid ${COLORS.PATHBAR_BORDER}`)
      .style('overflow-x', 'auto')
      .style('white-space', 'nowrap')
      .style('flex-shrink', '0')
      .node() as HTMLElement;

    return this.element;
  }

  update(
    path: any[],
    callbacks: {
      onDrill: (node: any) => void;
      onShowTooltip: (data: MarketData, event: MouseEvent, node?: any) => void;
      onHideTooltip: () => void;
    },
  ): void {
    if (!this.element) return;

    const pathbarSelection = d3.select(this.element);
    pathbarSelection.selectAll('*').remove();

    const sectionsContainer = pathbarSelection
      .append('div')
      .style('display', 'flex')
      .style('width', '100%')
      .style('height', '100%');

    const totalCount = path.length;
    const arrowWidth = 12;

    path.forEach((item: any, index: number) => {
      const isFirst = index === 0;
      const isLast = index === totalCount - 1;
      const sectorData = getNodeData(item.node);
      const sectorChange = sectorData?.priceChangePct || 0;
      const sectorColor = COLOR_SCALE(sectorChange);

      let clipPath = 'none';
      let padding = '0 10px';
      let marginLeft = '0px';

      if (totalCount > 1) {
        if (isFirst) {
          clipPath = `polygon(0 0, calc(100% - ${arrowWidth}px) 0, 100% 50%, calc(100% - ${arrowWidth}px) 100%, 0 100%)`;
          padding = `0 ${arrowWidth + 6}px 0 10px`;
          marginLeft = '0px';
        } else if (isLast) {
          clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${arrowWidth}px 50%)`;
          padding = `0 10px 0 ${arrowWidth + 8}px`;
          marginLeft = `-${arrowWidth - 2}px`;
        } else {
          clipPath = `polygon(0 0, calc(100% - ${arrowWidth}px) 0, 100% 50%, calc(100% - ${arrowWidth}px) 100%, 0 100%, ${arrowWidth}px 50%)`;
          padding = `0 ${arrowWidth + 6}px 0 ${arrowWidth + 8}px`;
          marginLeft = `-${arrowWidth - 2}px`;
        }
      }

      const section = sectionsContainer
        .append('div')
        .style('width', `${100 / totalCount}%`)
        .style('height', '100%')
        .style('background-color', sectorColor)
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('cursor', isLast ? 'default' : 'pointer')
        .style('transition', 'background-color 0.2s ease')
        .style('position', 'relative')
        .style('clip-path', clipPath)
        .style('margin-left', marginLeft)
        .style('z-index', totalCount - index)
        .style('padding', padding);

      section
        .append('span')
        .style('color', COLORS.TEXT_WHITE)
        .style('font-family', FONT.FAMILY)
        .style('font-size', FONT.SIZE.PATHBAR)
        .style('font-weight', isLast ? 'normal' : 'bold')
        .style('text-align', 'center')
        .style('overflow', 'hidden')
        .style('text-overflow', 'ellipsis')
        .style('white-space', 'nowrap')
        .style('pointer-events', 'none')
        .text(sectorData?.nameEng || item.name);

      if (!isLast) {
        section
          .on('click', () => callbacks.onDrill(item.node))
          .on('mouseenter', (event: any) => {
            d3.select(event.currentTarget).style(
              'background-color',
              d3.color(sectorColor)?.brighter(0.3)?.toString() || sectorColor,
            );
          })
          .on('mouseleave', (event: any) => {
            d3.select(event.currentTarget).style('background-color', sectorColor);
          });
      }

      if (sectorData) {
        section
          .on('mouseenter.tooltip', (event: MouseEvent) => {
            callbacks.onShowTooltip(sectorData, event, item.node);
          })
          .on('mousemove.tooltip', (event: MouseEvent) => {
            callbacks.onShowTooltip(sectorData, event, item.node);
          })
          .on('mouseleave.tooltip', () => {
            callbacks.onHideTooltip();
          });
      }
    });
  }
}
