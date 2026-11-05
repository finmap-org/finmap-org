import type * as D3 from 'd3';

declare global {
  const d3: typeof D3;

  namespace Plotly {
    interface PlotlyHTMLElement extends HTMLElement {
      on(event: string, callback: (data: any) => void): void;
      removeAllListeners(event: string): void;
    }

    type Layout = Record<string, any>;
    type Data = Record<string, any>[];
    type Config = Record<string, any>;

    function newPlot(
      root: string | HTMLElement,
      data: Data,
      layout?: Partial<Layout>,
      config?: Partial<Config>,
    ): Promise<PlotlyHTMLElement>;

    function react(
      root: string | HTMLElement,
      data: Data,
      layout?: Partial<Layout>,
      config?: Partial<Config>,
    ): Promise<PlotlyHTMLElement>;

    function purge(root: string | HTMLElement): void;

    function relayout(
      root: string | HTMLElement,
      update: Partial<Layout>,
    ): Promise<PlotlyHTMLElement>;
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
}

export {};
