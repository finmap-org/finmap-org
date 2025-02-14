// Prevent the default context menu from appearing on right-click
const divChart = document.getElementById("chart");
divChart.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

// Read URL parameters
const url = new URL(window.location.href);
const urlDate = url.searchParams.get("date");
const urlChartType = url.searchParams.get("chartType");
const urlDataType = url.searchParams.get("dataType");
const urlExchange = url.searchParams.get("exchange");
const urlSearch = url.searchParams.get("search");
const urlLang = url.searchParams.get("lang");

// Language
let currentLanguage = urlLang || "ENG";
const linkLangToggle = document.getElementById("langToggle");
linkLangToggle.textContent = currentLanguage;
linkLangToggle.addEventListener("click", () => {
  currentLanguage = currentLanguage === "ENG" ? "RUS" : "ENG";
  linkLangToggle.textContent = currentLanguage;
  url.searchParams.set("lang", currentLanguage);
  history.replaceState(null, "", url);
});

// Exchange
let exchange;
if (urlExchange && ["nasdaq", "nyse", "amex", "us-all", "moex", "lse"].includes(urlExchange)) {
  exchange = urlExchange;
}
else {
  exchange = "nasdaq";
}

async function exchangeSwitcher(selectedExchange) {
  exchange = selectedExchange;
  convertToUSD = false;
  await currencyToggle();
  await refreshChart();
  return;
}

// Currency
let nativeCurrency;
let nativeCurrencySign;
let convertToUSD = false;
let currency = "USD";
let currencySign = "$";
const linkCurrencyToggle = document.getElementById("currencyToggle");
linkCurrencyToggle.textContent = "USD";

let exchangeRates;
let exchangeRateByDate = 1;
async function currencyToggle() {
  switch (exchange) {
    case "lse":
      nativeCurrency = "GBP";
      nativeCurrencySign = "£";
      break;
    case "bist":
      nativeCurrency = "TRY";
      nativeCurrencySign = "₺";
      break;
    case "moex":
      nativeCurrency = "RUB";
      nativeCurrencySign = "₽";
      break;
    case "nasdaq":
    case "nyse":
    case "amex":
    case "us-all":
      nativeCurrency = "USD";
      nativeCurrencySign = "$";
      break;
    default:
      nativeCurrency = "USD";
      nativeCurrencySign = "$";
      break;
  }
  if (convertToUSD) {
    convertToUSD = false;
    currency = nativeCurrency;
    currencySign = nativeCurrencySign;
    exchangeRateByDate = 1;
  }
  else {
    convertToUSD = true;
    currency = "USD";
    currencySign = "$";
    exchangeRates = await getExchangeRates(nativeCurrency);
    exchangeRateByDate = await getExchangeRateByDate(exchangeRates, date, nativeCurrency);
  }
  linkCurrencyToggle.textContent = currency;
}

if (nativeCurrency === undefined) {
  convertToUSD = false;
  currencyToggle();
}

let date = urlDate ? new Date(`${urlDate}T13:00:00`) : new Date();

let openHour;
switch (exchange) {
  case "lse":
    openHour = 5;
    break;
  case "moex":
    openHour = 8;
    break;
  case "nasdaq":
  case "nyse":
  case "amex":
  case "us-all":
    openHour = 10;
    break;
}

if (date.getUTCHours() < openHour) {
  date.setDate(date.getUTCDate() - 1);
}

while (date.getDay() === 0 || date.getDay() === 6) {
  date.setDate(date.getUTCDate() - 1);
}
var formattedDate = date.toISOString().split("T")[0];
const inputDate = document.getElementById("inputDate");
inputDate.addEventListener("change", refreshChart);
inputDate.value = formattedDate;
switch (exchange) {
  case "lse":
    inputDate.min = new Date(`2025-02-07T13:00:00`).toISOString().split("T")[0];
    break;
  case "moex":
    inputDate.min = new Date(`2011-12-19T13:00:00`).toISOString().split("T")[0];
    break;
  case "nasdaq":
  case "nyse":
  case "amex":
  case "us-all":
    inputDate.min = new Date(`2024-12-09T13:00:00`).toISOString().split("T")[0];
    break;
  default:
    inputDate.min = new Date(`2024-12-09T13:00:00`).toISOString().split("T")[0];
    break;
}
inputDate.max = new Date().toISOString().split("T")[0];

if (urlDate) {
  inputDate.value = urlDate;
}

let chartType = "treemap";
if (urlChartType && ["treemap", "histogram"].includes(urlChartType)) {
  chartType = urlChartType;
}

const inputDataType = document.getElementById("inputDataType");
inputDataType.addEventListener("change", refreshChart);
if (urlDataType && ["marketcap", "value", "trades"].includes(urlDataType)) {
  inputDataType.value = urlDataType;
}

//Searchbox
const inputSearch = document.getElementById("inputSearch");
inputSearch.addEventListener("keypress", handleEnterKey);

// Apply filter.csv
const inputFileLabel = document.getElementById("inputFileLabel");
const chooseFileButton = document.getElementById("inputFile");
chooseFileButton.addEventListener("change", function (event) {
  saveCsvToLocalStorage(event);
  chooseFileButton.value = null;
});

const linkEraseFilter = document.getElementById("linkEraseFilter");

function toggleInput() {
  url.searchParams.set("chartType", chartType);
  url.searchParams.set("dataType", inputDataType.value);
  url.searchParams.set("date", inputDate.value);
  url.searchParams.set("exchange", exchange);
  switch (chartType) {
    case "treemap":
      inputSearch.removeAttribute("hidden");
      inputDataType.removeAttribute("hidden");
      inputDate.removeAttribute("hidden");
      inputFileLabel.removeAttribute("hidden");
      linkEraseFilter.removeAttribute("hidden");
      break;
    case "histogram":
      inputSearch.setAttribute("hidden", "");
      inputDataType.removeAttribute("hidden");
      inputDate.setAttribute("hidden", "");
      inputFileLabel.setAttribute("hidden", "");
      linkEraseFilter.setAttribute("hidden", "");
      url.searchParams.delete("search");
      url.searchParams.delete("date");
      break;
  }
  history.replaceState(null, "", url);
}

async function refreshChart() {
  toggleInput();

  const dataType = inputDataType.value;
  const date = inputDate.value;

  switch (chartType) {
    case "treemap":
      await refreshTreemap(dataType, date);
      divChart.on("plotly_click", async (event) => {
        const clickedTreemapItem = event.points[0].customdata;
        const clickedTreemapItemType = clickedTreemapItem[2];
        if (clickedTreemapItemType !== "sector") await addOverlayWidget(exchange, clickedTreemapItem, date);
      });
      break;
    case "histogram":
      refreshHistogram(exchange, dataType);
      break;
  }
}

refreshChart();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}
