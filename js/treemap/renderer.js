import { COLOR_SCALE, COLORS, LAYOUT, FONT } from './constants.js';
import { formatCurrency } from '../utils.js';
import { isLeafNode, getNodeData, getNodeChange, getDisplayName, } from './types.js';
import { getConfig, EXCHANGE_INFO } from '../config.js';
import { getCurrencyInfo } from '../currency/index.js';
export class CanvasRenderer {
    render(nodes, context) {
        const config = getConfig();
        const currencyInfo = getCurrencyInfo(config.currency);
        nodes.forEach((node) => {
            if (!node.parent)
                return;
            const nodeWidth = node.x1 - node.x0;
            const nodeHeight = node.y1 - node.y0;
            if (nodeWidth < 2 || nodeHeight < 2)
                return;
            this.renderNode(node, nodeWidth, nodeHeight, context, currencyInfo.symbol);
        });
    }
    renderNode(node, width, height, context, currencySign) {
        const isLeaf = isLeafNode(node);
        const data = getNodeData(node);
        const change = getNodeChange(node);
        context.fillStyle = COLOR_SCALE(change);
        context.fillRect(node.x0, node.y0, width, height);
        context.strokeStyle = COLORS.SECTOR_STROKE;
        context.lineWidth = 1;
        context.strokeRect(node.x0, node.y0, width, height);
        if (width > 30 && height > 20) {
            this.renderNodeText(node, width, height, isLeaf, data, context, currencySign);
        }
    }
    renderNodeText(node, width, height, isLeaf, data, context, currencySign) {
        context.save();
        context.fillStyle = COLORS.TEXT_WHITE;
        context.textAlign = 'left';
        context.textBaseline = 'top';
        const padding = LAYOUT.PADDING.TEXT;
        const textX = node.x0 + padding;
        const textY = node.y0 + padding;
        const maxWidth = width - padding * 2;
        if (isLeaf) {
            const nodeArea = width * height;
            const baseFontSize = Math.max(8, Math.min(14, Math.sqrt(nodeArea) / 15));
            const lineHeight = Math.round(baseFontSize * 1.2);
            const config = getConfig();
            const exchangeInfo = data.exchange ? EXCHANGE_INFO[data.exchange] : null;
            const ticker = data?.ticker || '';
            const name = exchangeInfo
                ? getDisplayName(data, config.language, exchangeInfo.language)
                : data?.nameEng || ticker;
            const price = Number(data?.priceLastSale) || 0;
            const changeValue = Number(data?.priceChangePct) || 0;
            const marketCap = Number(data?.marketCap) || 0;
            let currentY = textY;
            context.font = `bold ${baseFontSize}px ${FONT.FAMILY}`;
            this.drawText(ticker, textX, currentY, maxWidth, context);
            currentY += lineHeight + 2;
            if (height > baseFontSize * 4) {
                context.font = `${baseFontSize * 0.9}px ${FONT.FAMILY}`;
                const nameLines = this.drawWrappedText(name, textX, currentY, maxWidth, lineHeight, 2, context);
                currentY += nameLines * lineHeight + 2;
            }
            if (height > baseFontSize * 6) {
                context.font = `${baseFontSize * 0.8}px ${FONT.FAMILY}`;
                const changeText = `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`;
                this.drawText(`${d3.format('.2f')(price)} (${changeText})`, textX, currentY, maxWidth, context);
                currentY += lineHeight + 2;
            }
            if (height > baseFontSize * 8) {
                context.font = `${baseFontSize * 0.8}px ${FONT.FAMILY}`;
                const value = data.positionValue !== undefined ? data.positionValue : marketCap;
                const label = data.positionValue !== undefined ? 'Position: ' : 'Cap: ';
                const text = label + formatCurrency(value, currencySign);
                this.drawText(text, textX, currentY, maxWidth, context);
            }
        }
        else {
            const config = getConfig();
            const exchangeInfo = data.exchange ? EXCHANGE_INFO[data.exchange] : null;
            const sectorName = exchangeInfo
                ? getDisplayName(data, config.language, exchangeInfo.language)
                : data?.nameEng || data?.ticker || '';
            context.font = `bold 12px ${FONT.FAMILY}`;
            context.fillStyle = COLORS.TEXT_WHITE;
            context.shadowColor = COLORS.TEXT_SHADOW;
            context.shadowBlur = 2;
            context.shadowOffsetX = 1;
            context.shadowOffsetY = 1;
            this.drawText(sectorName, textX, textY, maxWidth, context);
            context.shadowColor = 'transparent';
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
        context.restore();
    }
    drawText(text, x, y, maxWidth, context) {
        const metrics = context.measureText(text);
        if (metrics.width <= maxWidth) {
            context.fillText(text, x, y);
        }
        else {
            // Truncate with ellipsis
            let truncated = text;
            while (truncated.length > 1 && context.measureText(truncated + '...').width > maxWidth) {
                truncated = truncated.slice(0, -1);
            }
            context.fillText(truncated + '...', x, y);
        }
    }
    drawWrappedText(text, x, y, maxWidth, lineHeight, maxLines, context) {
        const words = text.split(' ');
        let line = '';
        let lineCount = 0;
        let currentY = y;
        for (let i = 0; i < words.length && lineCount < maxLines; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = context.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                context.fillText(line.trim(), x, currentY);
                lineCount++;
                currentY += lineHeight;
                line = words[i] + ' ';
            }
            else {
                line = testLine;
            }
        }
        if (line.trim() && lineCount < maxLines) {
            context.fillText(line.trim(), x, currentY);
            lineCount++;
        }
        return lineCount;
    }
}
//# sourceMappingURL=renderer.js.map