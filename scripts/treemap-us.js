async function getMarketDataJson(date) {
  let url = `data/${date.replace(/-/g, "/")}/${inputExchange.value}.json`;

  if (date === new Date().toISOString().split("T")[0]) {
    url = url + `?_=${new Date().toISOString().split(":")[0]}`;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      alert("Oops! There's no data. Please select another date.");
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function prepTreemapData_us() {
  const rootParentName = "Stock Market";

  const date = inputDate.value;
  const marketData = await getMarketDataJson(date);
  let filteredMarketData;

  if (filterList && filterList["ticker"].length > 0) {
    filteredMarketData = marketData.filter((item) =>
      filterList["ticker"].includes(item.symbol.split(":")[1]),
    );
  } else {
    filteredMarketData = marketData;
  }
  if (filterList && filterList["ammount"].some((value) => value > 0)) {
    isPortfolio = true;
  }

  const chartData = {
    ticker: filteredMarketData.map((item) => item.symbol),
    name: filteredMarketData.map((item) => item.name),
    lastsale: filteredMarketData.map((item) => item.lastsale),
    // netchange: filteredMarketData.map(item => parseFloat(item.netchange)),
    priceChange: filteredMarketData.map((item) => parseFloat(item.pctchange)),
    volume: filteredMarketData.map((item) => parseFloat(item.volume)),
    marketCap: filteredMarketData.map((item) => parseFloat(item.marketCap)),
    country: filteredMarketData.map((item) => item.country),
    ipoyear: filteredMarketData.map((item) => item.ipoyear),
    industry: filteredMarketData.map((item) => item.industry),
    sector: filteredMarketData.map((item) => {
      if (item.sector === "") {
        return "Miscellaneous";
      }
      return item.sector;
    }),
    size: [],
    prevMarketCap: [],
    borderWidth: new Array(filteredMarketData.length).fill(2),
    borderColor: new Array(filteredMarketData.length).fill("rgb(63,67,81)"),
    customdata: [],
  };

  uniqSectors = [...new Set(chartData["sector"])];
  uniqSectors.push(rootParentName);
  const sectorTotals = uniqSectors.reduce((acc, sector) => {
    if (sector === rootParentName || sector === "") {
      return acc;
    }
    acc[sector] = {
      size: 0,
      marketCap: 0,
      prevMarketCap: 0,
      pctCapChange: 0,
    };
    return acc;
  }, {});

  // Calculate values and add customdata for each ticker
  chartData.ticker.forEach((ticker, i) => {
    if (highlightList.includes(ticker)) {
      chartData["borderWidth"][i] = 5;
      chartData["borderColor"][i] = "rgb(206,218,109)";
    }
    if (uniqSectors.includes(ticker) || ticker === "") {
      return;
    }
    if (
      isPortfolio &&
      !filterList["ticker"].includes(ticker.replace(/nasdaq:|nyse:|amex:/, ""))
    ) {
      return;
    }
    const name = chartData.name[i];
    const lastsale = chartData.lastsale[i];
    const sector = chartData.sector[i];
    const priceChange = chartData.priceChange[i];
    const marketCap = chartData.marketCap[i];
    const volume = chartData.volume[i];
    const country = chartData.country[i];
    const ipoyear = chartData.ipoyear[i];
    const industry = chartData.industry[i];
    // const priceChange = chartData.priceChange[i] !== null ? chartData.priceChange[i] : 0;
    // const marketCap = chartData.marketCap[i] !== null ? chartData.marketCap[i] : 0;
    const prevMarketCap = marketCap / (1 + priceChange / 100);
    chartData.prevMarketCap[i] = prevMarketCap;

    var size;
    if (isPortfolio) {
      const filterListIndex = filterList["ticker"].indexOf(
        ticker.replace(/nasdaq:|nyse:|amex:/, ""),
      );
      size =
        parseFloat(lastsale.replace("$", "")) *
        filterList["ammount"][filterListIndex];
    } else {
      size = marketCap;
    }
    chartData.size.push(size);

    chartData.customdata.push([
      sector, // Parent Category Name
      ticker, // Item Ticker
      marketCap, // Market Cap
      priceChange, // Price Change, %
      name, // Item Name
      lastsale, // Price
      NaN, // Value
      NaN, // Trades Number
      volume, // Volume
      country, // Country
      ipoyear, // IPO Year
      industry, // Industry
    ]);

    // Calculate total marketCap and prevMarketCap for each sector
    if (sectorTotals[sector]) {
      sectorTotals[sector].size += size;
      sectorTotals[sector].marketCap += marketCap;
      sectorTotals[sector].prevMarketCap += prevMarketCap;
    }
  });

  // Calculate values for the whole market (root category)
  const totalSize = chartData.size.reduce((acc, size) => acc + (size || 0), 0);
  const totalMarketCap = chartData.marketCap.reduce(
    (acc, cap) => acc + (cap || 0),
    0,
  );
  const totalPrevMarketCap = chartData.prevMarketCap.reduce(
    (acc, prevMarketCap) => acc + (prevMarketCap || 0),
    0,
  );
  let totalMarketCapChangePct;
  if (totalPrevMarketCap !== 0) {
    // Avoid division by zero
    totalMarketCapChangePct =
      ((totalMarketCap - totalPrevMarketCap) / totalPrevMarketCap) * 100;
  } else {
    totalMarketCapChangePct = NaN;
  }

  // Add values for the whole market (root category)
  chartData.ticker.push(rootParentName);
  chartData.name.push(rootParentName);
  chartData.lastsale.push(NaN);
  chartData.size.push(totalSize);
  chartData.priceChange.push(totalMarketCapChangePct);
  chartData.marketCap.push(totalMarketCap);
  chartData.prevMarketCap.push(totalPrevMarketCap);
  chartData.country.push(NaN);
  chartData.sector.push("");
  chartData.customdata.push([
    "", // Parent Category Name
    rootParentName, // Item Ticker
    totalMarketCap, // Market Cap
    totalMarketCapChangePct, // Price Change, %
    rootParentName, // Item Name
    NaN, // Price
    NaN, // Value
    NaN, // Trades Number
    NaN, // Volume
    NaN, // Country
    NaN, // IPO Year
    NaN, // Industry
  ]);

  // Calculate percentage difference for each sector and add it to sectorTotals
  Object.keys(sectorTotals).forEach((sector) => {
    const marketCap = sectorTotals[sector].marketCap;
    const prevMarketCap = sectorTotals[sector].prevMarketCap;
    if (prevMarketCap !== 0) {
      // Avoid division by zero
      const pctCapChange = ((marketCap - prevMarketCap) / prevMarketCap) * 100;
      sectorTotals[sector].pctCapChange = pctCapChange;
    } else {
      sectorTotals[sector].pctCapChange = NaN;
    }
  });

  // Add values for each sector
  uniqSectors.forEach((sector) => {
    if (sector === "" || sector === rootParentName) {
      return;
    }
    chartData.ticker.push(sector);
    chartData.name.push(sector);
    chartData.lastsale.push(NaN);
    chartData.size.push(sectorTotals[sector].size);
    chartData.priceChange.push(sectorTotals[sector].pctCapChange);
    chartData.marketCap.push(sectorTotals[sector].marketCap);
    chartData.prevMarketCap.push(sectorTotals[sector].prevMarketCap);
    chartData.country.push(NaN);
    chartData.sector.push(rootParentName);
    chartData.customdata.push([
      rootParentName, // Parent Category Name
      sector, // Item Ticker
      sectorTotals[sector].marketCap, // Market Cap
      sectorTotals[sector].pctCapChange, // Price Change, %
      sector, // Item Name
      NaN, // Price
      NaN, // Value
      NaN, // Trades Number
      NaN, // Volume
      NaN, // Country
      NaN, // IPO Year
      NaN, // Industry
    ]);
  });

  chartData["texttemplate"] = `<b>%{label}</b><br>
%{customdata[4]}<br>
%{customdata[5]} (%{customdata[3]:.2f}%)<br>
MarketCap: %{customdata[2]:,.0f}`;

  chartData["hovertemplate"] = `<b>%{customdata[1]}</b><br>
%{customdata[4]}<br>
Share price: %{customdata[5]}<br>
Price change: %{customdata[3]:.2f}%<br>
MarketCap: %{customdata[2]:,.0f}<br>
Volume: %{customdata[8]:,.0f}<br>
Country: %{customdata[9]}<br>
IPO Year: %{customdata[10]}<br>
Industry: %{customdata[11]}<br>
Size: %{value:,.2f}<br>
percentParent: %{percentParent:.2p}<br>
percentRoot: %{percentRoot:.2p}
<extra></extra>`;

  // chartData["size"] = chartData["marketCap"];

  return chartData;
}
