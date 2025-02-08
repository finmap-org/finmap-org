async function prepListingsData() {
  const totalSecurities = new Map();
  const today = new Date();
  const startDate = new Date("1994-01-01");

  for (
    let date = startDate;
    date <= today;
    date.setMonth(date.getMonth() + 1)
  ) {
    const dateString = date.toISOString().slice(0, 7); // Format to 'YYYY-MM'
    totalSecurities.set(`${dateString}`, 0);
  }

  const newSecurities = new Map(totalSecurities);
  const delistedSecurities = new Map(totalSecurities);

  const response = await fetch(
    `data/sectors/moex.tsv?_=${new Date().toISOString().split("T")[0]}`,
  );
  const data = await response.text();
  const rows = data.split("\n").slice(32);
  const excludeList = [
    "cb_bond",
    "corporate_bond",
    "etf_ppif",
    "euro_bond",
    "exchange_bond",
    "exchange_ppif",
    "Foreign Companies",
    "ifi_bond",
    "interval_ppif",
    "municipal_bond",
    "ofz_bond",
    "private_ppif",
    "public_ppif",
    "state_bond",
    "stock_mortgage",
    "subfederal_bond",
  ];

  rows.forEach((row) => {
    const columns = row.split("\t");
    const parent = String(columns[0]);
    if (excludeList.includes(parent)) {
      return;
    }

    let historyFrom = columns[5];
    let historyTill = columns[6];
    if (historyFrom == undefined || historyTill == undefined) {
      return;
    }

    historyFrom = String(historyFrom).slice(0, 7);
    historyTill = String(historyTill).slice(0, 7);

    if (historyFrom !== "") {
      if (totalSecurities.has(historyFrom)) {
        totalSecurities.set(historyFrom, totalSecurities.get(historyFrom) + 1);
        newSecurities.set(historyFrom, newSecurities.get(historyFrom) + 1);
      } else {
        totalSecurities.set(historyFrom, 1);
        newSecurities.set(historyFrom, 1);
      }
    }

    if (historyTill !== "") {
      if (totalSecurities.has(historyTill)) {
        totalSecurities.set(historyTill, totalSecurities.get(historyTill) - 1);
        delistedSecurities.set(
          historyTill,
          delistedSecurities.get(historyTill) - 1,
        );
      } else {
        totalSecurities.set(historyTill, -1);
        delistedSecurities.set(historyTill, -1);
      }
    }
  });

  const dates = Array.from(totalSecurities.keys());
  const values = Array.from(totalSecurities.values());

  return { dates, values };
}

async function refreshListings() {
  const { dates, values } = await prepListingsData();

  const trace = {
    name: "new/delisted securities",
    type: "bar",
    x: dates,
    y: values,
    connector: { line: { color: "rgb(63, 63, 63)" } },
    textposition: "outside",
    hoverinfo: "x+y+text+value",
    hovertemplate: "%{x|%x}<br>%{y}<extra></extra>",
    text: values.map((v) => (v > 0 ? "+" + v : v)),
    marker: {
      color: values.map((value) => (value >= 0 ? "green" : "red")),
    },
    xaxis: "x",
    yaxis: "y2",
  };

  let total = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    total.push(sum);
  }
  const traceTotal = {
    name: "total",
    type: "bar",
    x: dates,
    y: total,
    connector: { line: { color: "rgb(63, 63, 63)" } },
    textposition: "outside",
    hoverinfo: "x+y+text+value",
    text: total.map((v) => (v > 0 ? +v : v)),
    marker: {
      color: "blue",
    },
    xaxis: "x",
    yaxis: "y",
  };

  const layout = {
    grid: { rows: 1, columns: 1, pattern: "independent" },
    // dragmode: false,
    showlegend: true,
    legend: {
      visible: true,
      traceorder: "normal",
      orientation: "h",
      x: 0,
      xanchor: "left",
      y: 0.89,
      yanchor: "bottom",
      bgcolor: "rgba(0, 0, 0, 0)",
      bordercolor: "rgba(0, 0, 0, 0)",
      borderwidth: 0,
    },
    xaxis: {
      type: "date",
      fixedrange: false,
      // tickangle: -35, // -90,
      // tickmode: "array",
      // tickformat: "%Y",
      // tickvals: tickvals,
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
    },
    yaxis: {
      visible: true,
      // title: 'total # of securities',
      range: [0, 500],
      side: "right",
      domain: [0.175, 1.0],
      showgrid: false,
      fixedrange: true,
    },
    yaxis2: {
      visible: true,
      // title: '# of new/delisted',
      range: [-15, 70],
      domain: [0.0, 1.0],
      showgrid: false,
      fixedrange: true,
    },
    autosize: true,
    margin: {
      l: 0,
      r: 30,
      t: 0,
      b: 20,
    },
    plot_bgcolor: "rgba(65, 69, 84, 0)",
    paper_bgcolor: "rgba(65, 69, 85, 0)",
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

  Plotly.react("chart", [traceTotal, trace], layout, config);
}
