function unpack(rows, keyIndex) {
  const headers = rows[0];
  const key = headers.indexOf(keyIndex);

  if (key === -1) {
    throw new Error(`Key "${keyIndex}" not found in headers.`);
  }

  return rows.slice(1).map(function (row) {
    return row[key];
  });
}

async function prepTreemapData_ru() {
  const currencyType = inputCurrency.value;
  const dataType = inputDataType.value;
  const date = inputDate.value;
  const currencyRates = await getCurrencyRates(currencyType);

  let rate = 1;
  if (currencyType != "RUB") {
    rate = await getCurrencyRateByDate(date);
  }

  const rows = await fetch(
    `data/securities-by-sector/moex.tsv?_=${new Date().toISOString().split("T")[0]}`,
  )
    .then((response) => response.text())
    .then((text) => {
      return text.split("\n").map((row) => row.split("\t"));
    });
  let chartData = {
    sector: [],
    ticker: [],
    size: [],
    priceChange: [],
    cap: [],
    prevCap: [],
    customdata: [],
    borderWidth: [],
    borderColor: [],
  };

  let labels = unpack(rows, "labels");
  let parents = unpack(rows, "parents");
  uniqSectors = [...new Set(parents)];
  let shortnames = unpack(rows, "shortname");
  let shortnamesRus = unpack(rows, "shortname_rus");
  // let namesRus = unpack(rows, 'name_rus');

  for (let i = 0; i <= 30; i++) {
    chartData["sector"].push(parents[i]);
    chartData["ticker"].push(labels[i]);
    chartData["size"].push(0);
    chartData["priceChange"].push(NaN);
    chartData["cap"].push(0);
    chartData["prevCap"].push(0);
    chartData["customdata"].push([
      "Moscow Exchange",
      labels[i],
      NaN,
      NaN,
      labels[i],
      NaN,
      NaN,
      NaN,
    ]);
    chartData["borderWidth"].push(2);
    chartData["borderColor"].push("rgb(63,67,81)");
  }

  let path = `data/${date}/moex.json`.replace(/-/g, "/");

  if (date === new Date().toISOString().split("T")[0]) {
    path = path + `?_=${new Date().getTime()}`;
  }
  
  let moexJson = await fetch(path).then((response) => {
    if (response.status === 404) {
      alert("Oops! There's no data. Please select another date.");
      throw new Error("404 Not Found");
    }
    return response.json();
  }).catch((error) => {
    console.error(error);
  });

  let isToday = false;

  if (moexJson.marketdata) {
    moexJson = moexJson.marketdata.data.filter((entry) => entry[1] === "TQBR");
    isToday = true;
  } else {
    moexJson = moexJson.securities.data;
    isToday = false;
  }

  if (filterList && filterList["ammount"].some((value) => value > 0)) {
    const isPortfolio = true;
  }
  moexJson.forEach((item) => {
    let ticker = item[0];

    let currency,
      openPrice,
      closePrice,
      volume,
      value,
      numTrades,
      marketCapDaily;

    if (filterList && !filterList["ticker"].includes(ticker)) {
      return;
    }

    if (highlightList.includes(ticker)) {
      chartData["borderWidth"].push(5);
      chartData["borderColor"].push("rgb(206,218,109)");
    } else {
      chartData["borderWidth"].push(2);
      chartData["borderColor"].push("rgb(63,67,81)");
    }

    if (isToday) {
      currency = "";
      openPrice = item[9] == null ? 0 : item[9];
      closePrice = item[12] == null ? 0 : item[12];
      volume = item[27] == null ? 0 : item[27];
      value = item[28] == null ? 0 : item[28];
      numTrades = item[26] == null ? 0 : item[26];
      marketCapDaily = item[50] == null ? 0 : item[50];
    } else {
      currency = item[1];
      openPrice = item[2] == null ? 0 : item[2];
      closePrice = item[3] == null ? 0 : item[3];
      volume = item[4] == null ? 0 : item[4];
      value = item[5] == null ? 0 : item[5];
      numTrades = item[6] == null ? 0 : item[6];
      marketCapDaily = item[7] == null ? 0 : item[7];
    }

    value = value / rate;
    marketCapDaily = marketCapDaily / rate;

    let priceChange, prevMarketCap;

    if (openPrice === 0) {
      priceChange = 0;
      prevMarketCap = marketCapDaily;
    } else {
      priceChange = (100 * (closePrice - openPrice)) / openPrice;
      prevMarketCap = marketCapDaily / (1 + priceChange * 0.01);
    }

    let size;

    if (isPortfolio) {
      const filterListIndex = filterList["ticker"].indexOf(ticker);
      size = closePrice * filterList["ammount"][filterListIndex];
    } else {
      switch (dataType) {
        case "marketcap":
          size = marketCapDaily;
          break;
        case "value":
          size = value;
          break;
        case "trades":
          size = numTrades;
          break;
      }
    }

    let sector;
    let index = labels.indexOf(ticker);
    if (index === -1) {
      sector = "Others";
      sectorIndex = labels.indexOf(sector);
      chartData["size"][sectorIndex] = chartData["size"][sectorIndex] + size;
      chartData["cap"][sectorIndex] =
        chartData["cap"][sectorIndex] + marketCapDaily;
      chartData["prevCap"][sectorIndex] =
        chartData["prevCap"][sectorIndex] + prevMarketCap;
      chartData["customdata"].push([
        sector,
        ticker,
        marketCapDaily,
        priceChange,
        ticker,
        closePrice,
        value,
        numTrades,
      ]);
    } else {
      sector = parents[index];
      if (sector === "Foreign Companies") {
        return;
      }
      sectorIndex = labels.indexOf(sector);
      chartData["size"][sectorIndex] = chartData["size"][sectorIndex] + size;
      chartData["cap"][sectorIndex] =
        chartData["cap"][sectorIndex] + marketCapDaily;
      chartData["prevCap"][sectorIndex] =
        chartData["prevCap"][sectorIndex] + prevMarketCap;

      let name;
      switch (currentLanguage) {
        case "ENG":
          name = shortnames[index];
          break;
        case "RUS":
          name = shortnamesRus[index];
          break;
        default:
          name = shortnames[index];
          break;
      }
      chartData["customdata"].push([
        sector,
        ticker,
        marketCapDaily,
        priceChange,
        name,
        closePrice,
        value,
        numTrades,
      ]);
    }

    chartData["sector"].push(sector);
    chartData["ticker"].push(ticker);
    chartData["size"].push(size);
    chartData["priceChange"].push(priceChange);
    chartData["cap"].push(marketCapDaily);
    chartData["prevCap"].push(prevMarketCap);
  });

  for (let i = 1; i <= 30; i++) {
    chartData["customdata"][i][2] = chartData["cap"][i];
    chartData["priceChange"][i] =
      (100 * (chartData["cap"][i] - chartData["prevCap"][i])) /
      chartData["prevCap"][i];
    chartData["customdata"][i][3] = chartData["priceChange"][i];

    chartData["size"][0] = chartData["size"][0] + chartData["size"][i];
    chartData["cap"][0] = chartData["cap"][0] + chartData["cap"][i];
    chartData["prevCap"][0] = chartData["prevCap"][0] + chartData["prevCap"][i];
    chartData["priceChange"][0] =
      (100 * (chartData["cap"][0] - chartData["prevCap"][0])) /
      chartData["prevCap"][0];
  }
  chartData["customdata"][0] = [
    "Moscow Exchange",
    "Moscow Exchange",
    chartData["cap"][0],
    chartData["priceChange"][0],
    "Moscow Exchange",
    NaN,
    NaN,
    NaN,
  ];

  chartData["texttemplate"] = `<b>%{label}</b><br>
%{customdata[4]}<br>
%{customdata[5]:,.2f} (%{customdata[3]:.2f}%)<br>
C: %{customdata[2]:,.0f}<br>
V: %{customdata[6]:,.0f}<br>
T: %{customdata[7]:,.0f}`;

  chartData["hovertemplate"] = `<b>%{customdata[1]}</b><br>
%{customdata[4]}<br>
Share price: %{customdata[5]:,.4f}<br>
Price change: %{customdata[3]:.2f}%<br>
Cap: %{customdata[2]:,.0f}<br>
Value: %{customdata[6]:,.0f}<br>
Trades: %{customdata[7]:,.0f}<br>
Size: %{value:,.2f}<br>
percentParent: %{percentParent:.2p}<br>
percentRoot: %{percentRoot:.2p}
<extra></extra>`;

  return chartData;
}
