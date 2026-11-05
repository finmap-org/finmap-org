import { fetchHistoricalData, fetchExchangeRates, fetchCommodityData, convertCurrency, calculateTotalValues, } from './data.js';
import { getConfig, EXCHANGE_INFO } from '../config.js';
import { getCurrencyInfo } from '../currency/index.js';
export class HistogramChart {
    container = null;
    plotElement = null;
    chartData = [];
    isFirstRender = true;
    fetchController = null;
    render(_, container) {
        this.container = container;
        this.setupContainer();
        this.loadAndRenderChart();
    }
    destroy() {
        if (this.fetchController) {
            this.fetchController.abort();
            this.fetchController = null;
        }
        if (this.plotElement && typeof Plotly !== 'undefined') {
            Plotly.purge(this.plotElement);
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.chartData.length = 0;
        this.plotElement = null;
        this.container = null;
        this.isFirstRender = true;
    }
    setupContainer() {
        if (!this.container)
            return;
        this.container.innerHTML =
            '<div id="histogram-chart" style="width: 100%; height: 100%;"></div>';
        this.plotElement = this.container.querySelector('#histogram-chart');
    }
    async loadAndRenderChart() {
        if (this.fetchController) {
            this.fetchController.abort();
        }
        this.fetchController = new AbortController();
        const signal = this.fetchController.signal;
        try {
            const config = getConfig();
            const exchangeInfo = EXCHANGE_INFO[config.exchange];
            const [historicalData, exchangeRates, commodityData] = await Promise.all([
                fetchHistoricalData(signal),
                fetchExchangeRates(exchangeInfo.nativeCurrency, signal),
                fetchCommodityData(signal),
            ]);
            if (!this.container || !this.plotElement) {
                return;
            }
            let processedData = historicalData;
            if (config.currency === 'USD' && exchangeInfo.nativeCurrency !== 'USD') {
                const startDate = historicalData.dates[0] || '';
                for (const [key, value] of Object.entries(exchangeRates)) {
                    if (value === undefined || isNaN(value) || value === 0 || key < startDate) {
                        delete exchangeRates[key];
                    }
                }
                processedData = convertCurrency(historicalData, exchangeRates);
            }
            const startDate = processedData.dates[0] || '';
            for (const key of Object.keys(commodityData)) {
                if (key < startDate) {
                    delete commodityData[key];
                }
            }
            this.renderChart(processedData, exchangeRates, commodityData, exchangeInfo.nativeCurrency);
        }
        catch (error) {
            if (error?.name === 'AbortError') {
                return;
            }
            this.showError(error);
        }
    }
    renderChart(data, exchangeRates, commodityData, nativeCurrency) {
        if (!this.plotElement)
            return;
        const config = getConfig();
        const currencyInfo = getCurrencyInfo(config.currency);
        const currencySign = currencyInfo.symbol;
        this.chartData.length = 0;
        if (!data.dates.length)
            return;
        const dataStartDate = data.dates[0];
        const dataEndDate = data.dates[data.dates.length - 1];
        if (!dataStartDate || !dataEndDate)
            return;
        if (Object.keys(exchangeRates).length > 0) {
            const filteredExchangeKeys = Object.keys(exchangeRates).filter(date => date >= dataStartDate && date <= dataEndDate);
            const filteredExchangeValues = filteredExchangeKeys
                .map(date => exchangeRates[date])
                .filter((x) => x !== undefined);
            if (filteredExchangeKeys.length > 0) {
                this.chartData.push({
                    name: nativeCurrency,
                    type: 'scatter',
                    mode: 'lines',
                    yaxis: 'y2',
                    connectgaps: true,
                    customdata: filteredExchangeValues,
                    hoverinfo: 'all',
                    hovertemplate: `%{x|%x}<br>%{customdata:,.2f}<br>${nativeCurrency} per USD<br>%{fullData.name}<extra></extra>`,
                    x: filteredExchangeKeys.slice(0, filteredExchangeValues.length),
                    y: filteredExchangeValues.map(x => Number((1 / x).toFixed(4))),
                });
            }
        }
        if (Object.keys(commodityData).length > 0) {
            const filteredCommodityKeys = Object.keys(commodityData).filter(date => date >= dataStartDate && date <= dataEndDate);
            const filteredCommodityValues = filteredCommodityKeys
                .map(date => commodityData[date])
                .filter((x) => x !== undefined);
            if (filteredCommodityKeys.length > 0) {
                this.chartData.push({
                    name: 'Brent',
                    type: 'scatter',
                    mode: 'lines',
                    yaxis: 'y3',
                    connectgaps: true,
                    customdata: filteredCommodityValues,
                    hoverinfo: 'all',
                    hovertemplate: `%{x|%x}<br>%{customdata:,.2f} USD<br>%{fullData.name}<extra></extra>`,
                    x: filteredCommodityKeys.slice(0, filteredCommodityValues.length),
                    y: filteredCommodityValues,
                });
            }
        }
        data.sectors.forEach(sector => {
            if (sector.sectorName === '')
                return;
            let y;
            switch (config.dataType) {
                case 'marketcap':
                    y = sector.marketCap;
                    break;
                case 'value':
                    y = sector.value;
                    break;
                case 'trades':
                    y = sector.tradesNumber;
                    break;
                default:
                    y = sector.marketCap;
            }
            if (!y.some(v => v && v > 0))
                return;
            this.chartData.push({
                name: sector.sectorName,
                type: 'scatter',
                mode: 'lines',
                stackgroup: 'one',
                connectgaps: true,
                hoverinfo: 'all',
                hovertemplate: `%{x|%x}<br>${currencySign}%{y:,.0f}<br>%{fullData.name}<extra></extra>`,
                x: data.dates,
                y: y,
            });
        });
        const totalValues = calculateTotalValues(data, config.dataType);
        this.chartData.push({
            name: 'TOTAL',
            fill: 'tozeroy',
            type: 'scatter',
            mode: 'lines',
            line: { width: 3, dash: 'line', color: 'rgba(212, 64, 64, 0.7)' },
            fillcolor: 'rgba(0, 0, 0, 0.7)',
            x: data.dates,
            y: totalValues,
            hovertemplate: `%{x|%x}<br>${currencySign}%{y:,.0f}<br>%{fullData.name}<extra></extra>`,
            hoverinfo: 'all',
            visible: false,
            showlegend: false,
        });
        const layout = {
            showlegend: true,
            legend: {
                visible: true,
                traceorder: 'normal',
                orientation: 'h',
                x: 0,
                xanchor: 'left',
                y: 0.89,
                yanchor: 'top',
                bgcolor: 'rgba(65, 69, 84, 0)',
                bordercolor: 'rgba(65, 69, 84, 0)',
                borderwidth: 0,
            },
            updatemenus: [
                {
                    type: 'buttons',
                    buttons: [
                        {
                            label: 'Show Legend',
                            method: 'relayout',
                            args: [{ showlegend: true }],
                            args2: [{ showlegend: false }],
                        },
                    ],
                    direction: 'right',
                    showactive: true,
                    x: 0.02,
                    xanchor: 'left',
                    y: 1.0,
                    yanchor: 'top',
                    bgcolor: 'rgba(65, 69, 84, 1)',
                    borderwidth: 0,
                    font: {
                        lineposition: 'none',
                        color: 'black',
                        size: 14,
                        variant: 'all-small-caps',
                    },
                },
                {
                    type: 'buttons',
                    buttons: [
                        {
                            label: 'Show Totals',
                            method: 'restyle',
                            args: [{ visible: false }, [this.chartData.length - 1]],
                            args2: [{ visible: true }, [this.chartData.length - 1]],
                        },
                    ],
                    direction: 'right',
                    showactive: false,
                    x: 0.2,
                    xanchor: 'left',
                    y: 1.0,
                    yanchor: 'top',
                    bgcolor: 'rgba(255, 255, 84, 1)',
                    borderwidth: 0,
                    font: {
                        lineposition: 'none',
                        color: 'black',
                        size: 14,
                        variant: 'all-small-caps',
                    },
                },
            ],
            yaxis: {
                visible: true,
                fixedrange: true,
                side: 'right',
                showgrid: true,
            },
            yaxis2: {
                title: 'Currency Rate',
                overlaying: 'y',
                visible: false,
                fixedrange: true,
                side: 'left',
            },
            yaxis3: {
                title: 'Oil prices',
                overlaying: 'y',
                visible: false,
                fixedrange: true,
                side: 'left',
            },
            xaxis: {
                type: 'date',
                range: [data.dates[0], data.dates[data.dates.length - 1]],
                fixedrange: false,
                tickformatstops: [
                    {
                        dtickrange: [null, 'M1'],
                        value: '%e\n%b %Y',
                    },
                    {
                        dtickrange: ['M1', 'M12'],
                        value: '%b\n%Y',
                    },
                    {
                        dtickrange: ['M12', null],
                        value: '%Y',
                    },
                ],
                rangeslider: {
                    visible: true,
                    range: [data.dates[0], data.dates[data.dates.length - 1]],
                },
                rangeselector: {
                    visible: true,
                    activecolor: '#000000',
                    bgcolor: 'rgb(38, 38, 39)',
                    buttons: [
                        {
                            step: 'month',
                            stepmode: 'backward',
                            count: 1,
                            label: '1m',
                        },
                        {
                            step: 'month',
                            stepmode: 'backward',
                            count: 6,
                            label: '6m',
                        },
                        {
                            step: 'year',
                            stepmode: 'todate',
                            count: 1,
                            label: 'YTD',
                        },
                        {
                            step: 'year',
                            stepmode: 'backward',
                            count: 1,
                            label: '1y',
                        },
                        {
                            step: 'all',
                            count: 1,
                            label: 'all',
                        },
                    ],
                },
                showgrid: true,
            },
            autosize: true,
            margin: {
                l: 0,
                r: 30,
                t: 0,
                b: 20,
            },
            plot_bgcolor: 'rgb(66, 70, 83)',
            paper_bgcolor: 'rgb(65, 69, 85)',
            font: {
                family: 'Arial',
                size: 12,
                color: 'rgba(245, 246, 249, 1)',
            },
        };
        const plotConfig = {
            responsive: true,
            displaylogo: false,
            displayModeBar: true,
            modeBarButtonsToRemove: ['toImage', 'lasso2d', 'select2d'],
            scrollZoom: true,
        };
        const filteredChartData = this.chartData.filter((trace) => {
            return trace.y.some((v) => v !== null && v !== 0 && !isNaN(v));
        });
        if (this.isFirstRender) {
            Plotly.newPlot(this.plotElement, filteredChartData, layout, plotConfig);
            this.isFirstRender = false;
        }
        else {
            Plotly.react(this.plotElement, filteredChartData, layout, plotConfig);
        }
    }
    showError(error) {
        if (!this.container)
            return;
        this.container.innerHTML = `<div class="error" style="color: #ff6b6b; text-align: center; padding: 20px; font-family: Arial;">Error: ${error.message}</div>`;
    }
}
//# sourceMappingURL=index.js.map