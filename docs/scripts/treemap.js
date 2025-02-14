function saveCsvToLocalStorage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const csvContent = e.target.result;
      localStorage.setItem("filterCsv", csvContent);
      refreshChart();
    };
    reader.readAsText(file);
  }
}

async function applyFilter(csv) {
  let data = csv
    .split("\n")
    .map((row) => row.replace(/\r/g, "").split(","))
    .filter((row) => row.some((cell) => cell));
  const filterCsv = {
    ticker: [],
    // date: [],
    // price: [],
    amount: [],
    // operation: [],
  };
  data.forEach((row) => {
    const [ticker, amount, date, price, operation] = row;
    filterCsv["ticker"].push(ticker);
    // filterCsv["date"].push(date);
    // filterCsv["price"].push(price);
    filterCsv["amount"].push(amount);
    // filterCsv["operation"].push(operation);
  });
  return filterCsv;
}

// Searchbox
async function handleEnterKey(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const inputValue = this.value.trim().toLowerCase();
    if (inputValue) {
      url.searchParams.set("search", inputSearch.value);
      history.replaceState(null, "", url);
      await selectTreemapItemByLabel(inputValue);
      this.value = "";
    }
  }
}

// ToDo
// function searchBoxAutocomplete()

let isPortfolio;

async function selectTreemapItemByLabel(label) {
  label = label.toLowerCase();

  var boxes = divChart.querySelectorAll("g.slice.cursor-pointer");
  let skipItems;
  switch (exchange) {
    case "nasdaq":
    case "nyse":
    case "amex":
    case "us-all":
      skipItems = 12;
      break;
    case "moex":
      skipItems = 18;
      break;
  }
  for (var i = skipItems; i < boxes.length; i++) {
    let box = boxes[i];
    let boxInnerHtml = box.innerHTML.toLowerCase();
    if (
      boxInnerHtml.includes(`<b>${label}</b>`) ||
      boxInnerHtml.includes(`:${label}</b>`)
    ) {
      box.dispatchEvent(new MouseEvent("click"));
      break;
    }
  }
}

async function renderTreemapChart(chartData) {
  const texttemplate = chartData["texttemplate"];
  const hovertemplate = chartData["hovertemplate"];
  let data = [
    {
      type: "treemap",
      labels: chartData["ticker"],
      parents: chartData["sector"],
      values: chartData["size"],
      marker: {
        colors: chartData["priceChangePct"],
        colorscale: [
          [0, "rgb(236, 48, 51)"],
          [0.5, "rgb(64, 68, 82)"],
          [1, "rgb(42, 202, 85)"],
        ],
        cmin: -3,
        cmid: 0,
        cmax: 3,
        line: {
          width: 2, // chartData["borderWidth"], - this breaks the pathbar
          color: chartData["borderColor"],
        },
      },
      text: chartData.customdata[8],
      textinfo: "label+text+value",
      customdata: chartData.customdata,
      branchvalues: "total",
      texttemplate: texttemplate,
      hovertemplate: hovertemplate,
      pathbar: {
        visible: true,
        edgeshape: ">",
        side: "top",
      },
    },
  ];

  var layout = {
    showlegend: false,
    autosize: true,
    margin: {
      l: 0,
      r: 0,
      t: 20,
      b: 20,
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
  };

  var config = {
    responsive: true,
    displaylogo: false,
    displayModeBar: false,
    scrollZoom: true,
  };

  document.getElementById("loading").style.display = "block";

  Plotly.react("chart", data, layout, config).then(() => {
    document.getElementById("loading").style.display = "none";
  });
}

let filterList;
const highlightList = ["AAPL", "ASML", "WLY", "GCHE"];

async function refreshTreemap(dataType, date) {
  const localFilterCsv = localStorage.getItem("filterCsv");
  if (localFilterCsv !== undefined && localFilterCsv !== null) {
    filterList = await applyFilter(localFilterCsv);
    inputFileLabel.setAttribute("hidden", "");
    linkEraseFilter.removeAttribute("hidden");
  } else {
    filterList = null;
    isPortfolio = false;
    localStorage.removeItem("filterCsv");
    inputFileLabel.removeAttribute("hidden");
    linkEraseFilter.setAttribute("hidden", "");
  }
  chartData = await prepTreemapData(dataType, date);
  await renderTreemapChart(chartData);
}


async function getMarketDataJson(date, exchange) {
  let url = `https://raw.githubusercontent.com/finmap-org/finmap-org/refs/heads/main/data/${date.replace(/-/g, "/")}/${exchange}.json`;

  if (date === new Date().toISOString().split("T")[0]) {
    url = url + `?_=${new Date().toISOString().split(":")[0]}`;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      alert("Oops! There's no data. Please select another date.");
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseJson = await response.json();
    return responseJson.securities.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}


async function prepTreemapData(dataType, date) {
  const marketData = await getMarketDataJson(date, exchange);
  let filteredMarketData = marketData;

  if (filterList && filterList["ticker"].length > 0) {
    filteredMarketData = marketData.filter((item) => {
      const ticker = item[6];
      const type = item[2];
      return filterList["ticker"].includes(ticker) || type === "sector";
    });
  }
  if (filterList && filterList["amount"].some((value) => value > 0)) {
    isPortfolio = true;
  }

  const chartData = {
    exchange: filteredMarketData.map((item) => item[0]),
    country: filteredMarketData.map((item) => item[1]),
    type: filteredMarketData.map((item) => item[2]),
    sector: filteredMarketData.map((item) => item[3]),
    industry: filteredMarketData.map((item) => item[4]),
    currencyId: filteredMarketData.map((item) => item[5]),
    ticker: filteredMarketData.map((item) => item[6]),
    nameEng: filteredMarketData.map((item) => item[7]),
    nameEngShort: filteredMarketData.map((item) => item[8]),
    nameRus: filteredMarketData.map((item) => item[9]),
    nameRusShort: filteredMarketData.map((item) => item[10]),
    priceOpen: filteredMarketData.map((item) => item[11]),
    priceLastSale: filteredMarketData.map((item) => item[12]),
    priceChangePct: filteredMarketData.map((item) => item[13]),
    volume: filteredMarketData.map((item) => item[14]),
    value: filteredMarketData.map((item) => item[15]),
    numTrades: filteredMarketData.map((item) => item[16]),
    marketCap: filteredMarketData.map((item) => item[17]),
    listedFrom: filteredMarketData.map((item) => item[18]),
    listedTill: filteredMarketData.map((item) => item[19]),
    wikiPageIdEng: filteredMarketData.map((item) => item[20]),
    wikiPageIdOriginal: filteredMarketData.map((item) => item[21]),
    nestedItemsCount: filteredMarketData.map((item) => item[22]),
    size: new Array(filteredMarketData.length).fill(0),
    borderWidth: new Array(filteredMarketData.length).fill(2),
    borderColor: new Array(filteredMarketData.length).fill("rgb(63,67,81)"),
    customdata: [],
  };
  
  chartData.ticker.forEach((ticker, i) => {
    if (highlightList.includes(ticker)) {
      chartData["borderWidth"][i] = 5;
      chartData["borderColor"][i] = "rgb(206,218,109)";
    }
    if (isPortfolio && (!filterList["ticker"].includes(ticker) && chartData["type"][i] !== "sector")) {
      return;
    }
    chartData.marketCap[i] = chartData.marketCap[i] / (1e6 * exchangeRateByDate);
    chartData.value[i] = chartData.value[i] / (1e6 * exchangeRateByDate);
    let size;
    if (isPortfolio) {
      const filterListIndex = filterList["ticker"].indexOf(ticker);
      if (filterListIndex == -1)
        size = 0;
      else {
        size = chartData.priceLastSale[i] * filterList["amount"][filterListIndex];
      }
    } else {
      switch (dataType) {
        case "marketcap":
          size = chartData.marketCap[i];
          break;
        case "value":
          size = chartData.value[i];
          break;
        case "trades":
          size = chartData.numTrades[i];
          break;
        case "nestedItems":
          size = chartData.nestedItemsCount[i];
          break;
      }
    }
    
    chartData.size[i] = size;

    chartData.customdata.push([
      chartData.exchange[i],
      chartData.country[i],
      chartData.type[i],
      chartData.sector[i],
      chartData.industry[i],
      chartData.currencyId[i],
      chartData.ticker[i],
      chartData.nameEng[i],
      chartData.nameEngShort[i],
      chartData.nameRus[i],
      chartData.nameRusShort[i],
      chartData.priceOpen[i],
      chartData.priceLastSale[i],
      chartData.priceChangePct[i],
      chartData.volume[i],
      chartData.value[i],
      chartData.numTrades[i],
      chartData.marketCap[i],
      chartData.listedFrom[i],
      chartData.listedTill[i],
      chartData.wikiPageIdEng[i],
      chartData.wikiPageIdOriginal[i],
      chartData.nestedItemsCount[i],
    ]);
  });

let portfolioValue = "<br>";
if (isPortfolio) {
  const rootIndex = chartData.sector.findIndex(sector => sector === "");
  if (rootIndex === -1) return;

  chartData.type.forEach((type, index) => {
    if (type === "sector") return;

    const itemSize = chartData.size[index];
    const sectorIndex = chartData.ticker.indexOf(chartData.sector[index]);
    
    if (sectorIndex !== -1) {
      chartData.size[sectorIndex] += itemSize;
      chartData.size[rootIndex] += itemSize;
    }
  });

  portfolioValue = `In Portfolio: %{value:,.0f}<br>`;
}

  chartData["texttemplate"] = `<b>%{label}</b><br>
%{customdata[7]}<br>
%{customdata[12]} (%{customdata[13]:.2f}%)<br>
MarketCap: ${currencySign}%{customdata[17]:,.0f}M`;

  chartData["hovertemplate"] = `<b>%{customdata[6]}</b><br>
%{customdata[7]}<br>
Price: %{customdata[12]}<br>
Price change: %{customdata[13]:.2f}%<br>
MarketCap: ${currencySign}%{customdata[17]:,.0f}M<br>
Volume: %{customdata[14]:,.0f}<br>
Value: ${currencySign}%{customdata[15]:,.0f}M<br>
Trades: %{customdata[16]:,.0f}<br>
Exchange: %{customdata[0]}<br>
Country: %{customdata[1]}<br>
Listed Since: %{customdata[18]}<br>
Industry: %{customdata[4]}<br>
${portfolioValue}
percentParent: %{percentParent:.2p}<br>
percentRoot: %{percentRoot:.2p}<br>
Nested Items: %{customdata[22]:,.0f}
<extra></extra>`;

  return chartData;
}
