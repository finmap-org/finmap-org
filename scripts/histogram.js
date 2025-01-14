async function prepHistogramData() {
  const currencyType = inputCurrency.value;
  try {
    const startDate = "2011-12-19";

    let response = await fetch(
      `data/securities-by-sector/moex.tsv?_=${new Date().toISOString().split("T")[0]}`,
    );
    response = await response.text();
    let data = response
      .split("\n")
      .slice(1, 32)
      .map((row) => row.split("\t"));
    let traceColors = {};
    data.forEach((row) => {
      const [, label, , , , , , traceColor] = row;
      traceColors[label] = traceColor;
    });

    const currencyRates = await getCurrencyRates(currencyType);
    const oneOverY = Object.values(currencyRates);
    let chartData = {};
    if (!chartData[currencyType]) {
      chartData[currencyType] = {
        name: currencyType,
        customdata: oneOverY,
        type: "scatter",
        mode: "lines",
        yaxis: "y2",
        hoverinfo: "all",
        hovertemplate:
          "%{x|%x}<br>%{customdata:,.2f}<br>RUB per %{fullData.name}<extra></extra>",
        x: Object.keys(currencyRates),
        y: Object.values(currencyRates).map((y) => (y > 0 ? 1 / y : null)),
      };
    }

    response = await fetch(
      `https://raw.githubusercontent.com/datasets/oil-prices/refs/heads/main/data/brent-daily.csv`,
    );
    response = await response.text();
    data = response.split("\n").map((row) => row.split(","));
    const brentRates = {};
    data.forEach((row) => {
      const [Date, Close] = row;
      if (Date >= startDate) {
        brentRates[Date] = Number(Close);
      }
    });

    if (!chartData["brent"]) {
      chartData["brent"] = {
        name: "Brent",
        type: "line",
        mode: "lines",
        yaxis: "y3",
        hoverinfo: "all",
        hovertemplate:
          "%{x|%x}<br>%{y:,.2f}<br>USD per %{fullData.name}<extra></extra>",
        x: Object.keys(brentRates),
        y: Object.values(brentRates),
      };
    }

    response = await fetch(
      `data/history/moex.tsv?_=${new Date().toISOString().split("T")[0]}`,
    );
    response = await response.text();
    data = response
      .split("\n")
      .slice(1)
      .map((row) => row.replace(/\r/g, "").split("\t"))
      .filter((row) => row.some((cell) => cell));

    data.forEach((row) => {
      let y;
      const [date, marketValue, marketTrades, marketCap, traceName] = row;
      // const traceNameExcludeList = ['cb_bond', 'corporate_bond', 'etf_ppif', 'euro_bond', 'exchange_bond', 'exchange_ppif',
      //                               'Foreign Companies', 'ifi_bond', 'interval_ppif', 'municipal_bond', 'ofz_bond',
      //                               'private_ppif', 'public_ppif', 'state_bond', 'stock_mortgage', 'subfederal_bond'];
      const traceNameExcludeList = ["Foreign Companies"];

      switch (inputDataType.value) {
        case "marketcap":
          y = parseFloat(marketCap);
          if (traceNameExcludeList.includes(traceName)) {
            return;
          }
          break;
        case "value":
          y = parseFloat(marketValue);
          break;
        case "trades":
          y = parseFloat(marketTrades);
          break;
      }

      if (!chartData[traceName]) {
        chartData[traceName] = {
          name: traceName,
          type: "scatter",
          mode: "lines",
          stackgroup: "one",
          connectgaps: true,
          hoverinfo: "all",
          hovertemplate:
            "%{x|%x}<br>%{y:,.0f}<br>%{fullData.name}<extra></extra>",
          marker: {
            color: traceColors[traceName],
          },
          x: [],
          y: [],
        };
      }

      if (
        currencyType !== "RUB" &&
        (inputDataType.value == "marketcap" || inputDataType.value == "value")
      ) {
        var rate = currencyRates[date];
        var d = new Date(date);
        while (typeof rate == "undefined") {
          d.setDate(d.getUTCDate() - 1);
          let prevDate = d.toISOString().split("T")[0];
          rate = currencyRates[prevDate];
        }
        y = y / rate;
      }

      chartData[traceName].x.push(date);
      chartData[traceName].y.push(y);
    });

    const jsonChartData = Object.values(chartData);
    const filteredData = jsonChartData.filter((trace) => {
      return trace.y.some((v) => v !== null && v !== 0 && !isNaN(v));
    });

    return filteredData;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

function refreshHistogram() {
  var currency = inputCurrency.value;
  toggleInput();

  prepHistogramData()
    .then(function (chartData) {
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
      Plotly.react("chart", chartData, layout, config);
    })
    .catch(function (error) {
      console.error(error);
    });
}
