declare const d3: any;

import type { MarketData, ChartRenderer } from './types.js';
import { getConfig } from './config.js';
import { formatNumber } from './utils.js';

export class D3TreemapRenderer implements ChartRenderer {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private currentData: MarketData[] = [];
  private treemapLayout: any = null;
  private hierarchyRoot: any = null;
  private tooltip: HTMLElement | null = null;
  private colorScale: any = null;

  render(data: MarketData[], container: HTMLElement): void {
    this.container = container;
    this.currentData = data;
    this.setupCanvas();
    this.setupColorScale();
    this.setupTooltip();
    this.prepareData();
    this.renderCanvas();
    this.setupInteractions();
  }

  destroy(): void {
    if (this.canvas && this.container && this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
    }
    if (this.tooltip && this.tooltip.parentNode && this.tooltip.parentNode.contains(this.tooltip)) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.canvas = null;
    this.context = null;
    this.container = null;
    this.tooltip = null;
  }

  private setupCanvas(): void {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'calc(100vh - 70px)';
    this.canvas.style.display = 'block';
    
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    
    this.context = this.canvas.getContext('2d');
    if (this.context) {
      this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    this.container.appendChild(this.canvas);
  }

  private setupColorScale(): void {
    this.colorScale = d3.scaleLinear()
      .domain([-3, 0, 3])
      .range(['rgb(236, 48, 51)', 'rgb(64, 68, 82)', 'rgb(42, 202, 85)'])
      .clamp(true);
  }

  private setupTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
    this.tooltip.style.color = 'white';
    this.tooltip.style.padding = '8px';
    this.tooltip.style.borderRadius = '4px';
    this.tooltip.style.fontSize = '12px';
    this.tooltip.style.pointerEvents = 'none';
    this.tooltip.style.visibility = 'hidden';
    this.tooltip.style.zIndex = '1000';
    document.body.appendChild(this.tooltip);
  }

  private prepareData(): void {
    const securities = this.currentData.filter(item => item.type === 'stock' || item.type === 'etf');
    const config = getConfig();
    
    const chartData = {
      labels: [] as string[],
      parents: [] as string[],
      values: [] as number[],
      colors: [] as number[],
      items: [] as (MarketData | null)[]
    };

    const sectors = new Set<string>();
    securities.forEach(item => {
      if (item.sector) sectors.add(item.sector);
    });

    chartData.labels.push('Market');
    chartData.parents.push('');
    chartData.values.push(0);
    chartData.colors.push(0);
    chartData.items.push(null);

    sectors.forEach(sector => {
      chartData.labels.push(sector);
      chartData.parents.push('Market');
      chartData.values.push(0);
      chartData.colors.push(0);
      chartData.items.push(null);
    });

    securities.forEach(item => {
      let value = 0;
      switch (config.dataType) {
        case 'marketcap':
          value = item.marketCap / 1e6;
          break;
        case 'value':
          value = item.value / 1e6;
          break;
        case 'trades':
          value = item.numTrades;
          break;
        case 'nestedItems':
          value = item.nestedItemsCount;
          break;
      }

      chartData.labels.push(item.ticker);
      chartData.parents.push(item.sector || 'Other');
      chartData.values.push(value);
      chartData.colors.push(item.priceChangePct || 0);
      chartData.items.push(item);
    });

    const stratify = d3.stratify()
      .id((d: any, i: number) => chartData.labels[i])
      .parentId((d: any, i: number) => chartData.parents[i]);

    const dataWithIndex = chartData.labels.map((_, i) => i);
    this.hierarchyRoot = stratify(dataWithIndex)
      .sum((d: any, i: number) => chartData.values[i])
      .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

    this.hierarchyRoot.leaves().forEach((leaf: any) => {
      const dataIndex = leaf.id;
      leaf.color = chartData.colors[dataIndex];
      leaf.item = chartData.items[dataIndex];
    });

    const rect = this.container!.getBoundingClientRect();
    this.treemapLayout = d3.treemap()
      .size([rect.width, rect.height])
      .padding(2)
      .round(true);

    this.treemapLayout(this.hierarchyRoot);
  }

  private renderCanvas(): void {
    if (!this.context || !this.hierarchyRoot) return;

    const rect = this.container!.getBoundingClientRect();
    this.context.clearRect(0, 0, rect.width, rect.height);

    this.hierarchyRoot.leaves().forEach((leaf: any) => {
      const x = leaf.x0;
      const y = leaf.y0;
      const width = leaf.x1 - leaf.x0;
      const height = leaf.y1 - leaf.y0;

      if (width < 1 || height < 1) return;

      const color = this.colorScale(Math.max(-3, Math.min(3, leaf.color || 0)));

      this.context!.fillStyle = color;
      this.context!.fillRect(x, y, width, height);

      this.context!.strokeStyle = 'rgb(63,67,81)';
      this.context!.lineWidth = 2;
      this.context!.strokeRect(x, y, width, height);

      if (width > 30 && height > 20 && leaf.item) {
        this.context!.fillStyle = 'white';
        this.context!.font = 'bold 12px Arial';
        this.context!.textAlign = 'center';
        this.context!.textBaseline = 'middle';
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        this.context!.fillText(leaf.item.ticker, centerX, centerY - 8);
        
        this.context!.font = '10px Arial';
        const displayName = leaf.item.nameEngShort || leaf.item.nameEng;
        if (displayName && displayName.length > 0) {
          const maxWidth = width - 4;
          const truncatedName = displayName.length > 15 ? 
            displayName.substring(0, 15) + '...' : displayName;
          this.context!.fillText(truncatedName, centerX, centerY + 8);
        }
      }
    });
  }

  private setupInteractions(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      const rect = this.canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const leaf = this.findLeafAtPosition(x, y);
      
      if (leaf && leaf.item) {
        this.showTooltip(event, leaf.item);
      } else {
        this.hideTooltip();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });

    this.canvas.addEventListener('click', (event: MouseEvent) => {
      const rect = this.canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const leaf = this.findLeafAtPosition(x, y);
      if (leaf && leaf.item) {
        this.handleClick(leaf.item);
      }
    });
  }

  private findLeafAtPosition(x: number, y: number): any {
    if (!this.hierarchyRoot) return null;

    return this.hierarchyRoot.leaves().find((leaf: any) => {
      return x >= leaf.x0 && x <= leaf.x1 && y >= leaf.y0 && y <= leaf.y1;
    });
  }

  private showTooltip(event: MouseEvent, item: MarketData): void {
    if (!this.tooltip) return;

    const config = getConfig();
    const currencySign = config.currency === 'USD' ? '$' : config.currency;

    this.tooltip.innerHTML = `
      <b>${item.ticker}</b><br>
      ${item.nameEng}<br>
      Price: ${item.priceLastSale}<br>
      Price change: ${(item.priceChangePct || 0).toFixed(2)}%<br>
      MarketCap: ${currencySign}${formatNumber(item.marketCap / 1e6)}M<br>
      Volume: ${formatNumber(item.volume)}<br>
      Value: ${currencySign}${formatNumber(item.value / 1e6)}M<br>
      Trades: ${formatNumber(item.numTrades)}<br>
      Exchange: ${item.exchange}<br>
      Country: ${item.country}<br>
      Listed Since: ${item.listedFrom}<br>
      Industry: ${item.industry}
    `;

    this.tooltip.style.left = event.pageX + 10 + 'px';
    this.tooltip.style.top = event.pageY + 10 + 'px';
    this.tooltip.style.visibility = 'visible';
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.style.visibility = 'hidden';
    }
  }

  private handleClick(item: MarketData): void {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('search', item.ticker);
    window.history.replaceState(null, '', `${window.location.pathname}?${searchParams}`);
  }
}

export class D3HistogramRenderer implements ChartRenderer {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  render(data: MarketData[], container: HTMLElement): void {
    this.container = container;
    this.setupCanvas();
    this.renderHistogram(data);
  }

  destroy(): void {
    if (this.canvas && this.container && this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
    }
    this.canvas = null;
    this.context = null;
    this.container = null;
  }

  private setupCanvas(): void {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'calc(100vh - 70px)';
    this.canvas.style.display = 'block';
    
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    
    this.context = this.canvas.getContext('2d');
    if (this.context) {
      this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    this.container.appendChild(this.canvas);
  }

  private renderHistogram(data: MarketData[]): void {
    if (!this.context) return;

    const rect = this.container!.getBoundingClientRect();
    this.context.clearRect(0, 0, rect.width, rect.height);

    const config = getConfig();
    let values: number[] = [];

    switch (config.dataType) {
      case 'marketcap':
        values = data.map(d => d.marketCap / 1e6);
        break;
      case 'value':
        values = data.map(d => d.value / 1e6);
        break;
      case 'trades':
        values = data.map(d => d.numTrades);
        break;
      case 'nestedItems':
        values = data.map(d => d.nestedItemsCount);
        break;
    }

    const bins = d3.bin().thresholds(50)(values);
    const xScale = d3.scaleLinear()
      .domain(d3.extent(values))
      .range([50, rect.width - 50]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, (d: any) => d.length)])
      .range([rect.height - 50, 50]);

    this.context.fillStyle = 'rgb(42, 202, 85)';
    bins.forEach((bin: any) => {
      const x = xScale(bin.x0);
      const y = yScale(bin.length);
      const width = xScale(bin.x1) - xScale(bin.x0) - 1;
      const height = rect.height - 50 - y;
      
      if (width > 0 && height > 0) {
        this.context!.fillRect(x, y, width, height);
      }
    });

    this.context.strokeStyle = 'white';
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.moveTo(50, 50);
    this.context.lineTo(50, rect.height - 50);
    this.context.lineTo(rect.width - 50, rect.height - 50);
    this.context.stroke();
  }
}
