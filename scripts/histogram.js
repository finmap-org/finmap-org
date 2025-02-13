async function refreshHistogram(exchange, dataType) {
  let chartData = [];
  let dataJson;
  try {
    const response = await fetch(`data/history/${exchange}.json`);
    if (!response.ok) {
      alert("Oops! Nothing's here");
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    dataJson = await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  
  // Plot exchange rates
  let exchangeRates;
  if (exchangeRates === undefined) {
    exchangeRates = await getExchangeRates(nativeCurrency);
  }
  const filteredExchangeRates = Object.fromEntries(
    Object.entries(exchangeRates)
    .filter(([_, value]) => 
      value !== undefined && 
      !isNaN(value) && 
      value !== 0
    )
  );
  if (nativeCurrency !== "USD"){
    chartData.push({
      name: nativeCurrency,
      type: "line",
      mode: "lines",
      yaxis: "y2",
      connectgaps: true,
      customdata: Object.values(filteredExchangeRates),
      hoverinfo: "all",
      hovertemplate:
        `%{x|%x}<br>%{customdata:,.2f}<br>${nativeCurrency} per USD<extra></extra>`,
      x: Object.keys(filteredExchangeRates),
      y: Object.values(filteredExchangeRates).map(x => (1/x).toFixed(4)),
    });
  }

  if (currency != nativeCurrency) {
    dataJson = {
      dates: dataJson.dates.filter(date => date in filteredExchangeRates),
      sectors: dataJson.sectors.map(sector => {
        // Create indexes array for valid dates
        const validIndexes = dataJson.dates
          .map((date, index) => ({ date, index }))
          .filter(item => item.date in filteredExchangeRates)
          .map(item => item.index);
    
        return {
          sectorName: sector.sectorName,
          marketCap: validIndexes.map(i => sector.marketCap[i] / filteredExchangeRates[dataJson.dates[i]]),
          value: validIndexes.map(i => sector.value[i] / filteredExchangeRates[dataJson.dates[i]]),
          volume: sector.volume,
          priceChangePct: sector.priceChangePct,
          tradesNumber: sector.tradesNumber,
          itemsNumber: sector.itemsNumber
        };
      })
    };
  }

  const x = dataJson.dates;

  // Sectors
  dataJson.sectors.forEach((trace) => {
    if (trace.sectorName === "") {
      return;
    }
    let y;
    switch (dataType) {
      case "marketcap":
        y = trace.marketCap;
        break;
      case "value":
        y = trace.value;
        break;
      case "trades":
        y = trace.tradesNumber;
        break;
    }
    chartData.push({
      name: trace.sectorName,
      type: "scatter",
      mode: "lines",
      stackgroup: "one",
      connectgaps: true,
      hoverinfo: "all",
      hovertemplate:
        "%{x|%x}<br>%{y:,.0f}<br>%{fullData.name}<extra></extra>",
      x: x,
      y: y,
    });
  });

  var layout = {
    showlegend: true,
    legend: {
      visible: true,
      traceorder: "normal",
      orientation: "h",
      x: 0,
      xanchor: "left",
      y: 0.89,
      yanchor: "top",
      bgcolor: "rgba(65, 69, 84, 0)",
      bordercolor: "rgba(65, 69, 84, 0)",
      borderwidth: 0,
    },
    updatemenus: [
      {
        type: "buttons",
        buttons: [
          {
            label: "Show/Hide Legend",
            method: "relayout",
            args: [{ showlegend: true }],
            args2: [{ showlegend: false }],
          },
        ],
        direction: "right",
        showactive: true,
        x: 0.02,
        xanchor: "left",
        y: 1.0,
        yanchor: "top",
        bgcolor: "rgba(65, 69, 84, 1)",
        bordercolor: "rgba(65, 69, 84, 1)",
        borderwidth: 0,
        font: {
          lineposition: "none",
          color: "black",
          size: 14,
          variant: "all-small-caps",
        },
      },
    ],
    yaxis: {
      visible: true,
      fixedrange: true,
      side: "right",
      showgrid: true,
    },
    yaxis2: {
      title: "Currency Rate",
      overlaying: "y",
      visible: false,
      fixedrange: true,
      side: "left",
    },
    yaxis3: {
      title: "Oil prices",
      overlaying: "y",
      visible: false,
      fixedrange: true,
      side: "left",
    },
    xaxis: {
      type: "date",
      range: [chartData[1].x[0], "chartData[1].x[chartData[1].x.length - 1]"],
      fixedrange: false,
      // tickangle: -35,
      tickformatstops: [
        (enabled = false),
        {
          dtickrange: [null, "M1"],
          value: "%e\n%b %Y",
        },
        {
          dtickrange: ["M1", "M12"],
          value: "%b\n%Y",
        },
        {
          dtickrange: ["M12", null],
          value: "%Y",
        },
      ],
      rangeslider: {
        visible: true,
      },
      rangeselector: {
        visible: true,
        activecolor: "#000000",
        bgcolor: "rgb(38, 38, 39)",
        buttons: [
          {
            step: "month",
            stepmode: "backward",
            count: 1,
            label: "1m",
          },
          {
            step: "month",
            stepmode: "backward",
            count: 6,
            label: "6m",
          },
          {
            step: "year",
            stepmode: "todate",
            count: 1,
            label: "YTD",
          },
          {
            step: "year",
            stepmode: "backward",
            count: 1,
            label: "1y",
          },
          {
            step: "all",
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
    plot_bgcolor: "rgb(66, 70, 83)",
    paper_bgcolor: "rgb(65, 69, 85)",
    font: {
      family: "Arial",
      size: 12,
      color: "rgba(245, 246, 249, 1)",
    },
  };

  var config = {
    responsive: true,
    displaylogo: false,
    displayModeBar: true,
    modeBarButtonsToRemove: ["toImage", "lasso2d", "select2d"],
    scrollZoom: true,
  };

  // Filter out traces where all values are 0 or null
  chartData = chartData.filter((trace) => {
    return trace.y.some((v) => v !== null && v !== 0 && !isNaN(v));
  });

  Plotly.react("chart", chartData, layout, config);
}
