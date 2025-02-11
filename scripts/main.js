// Prevent the default context menu from appearing on right-click
const divChart = document.getElementById("chart");
divChart.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

// Read URL parameters
const url = new URL(window.location.href);
const urlDate = url.searchParams.get("date");
const urlChartType = url.searchParams.get("chartType");
const urlConvertToUSD = url.searchParams.get("convertToUSD");
const urlDataType = url.searchParams.get("dataType");
const urlExchange = url.searchParams.get("exchange");
const urlSearch = url.searchParams.get("search");
const urlLang = url.searchParams.get("lang");

let exchange;
if (urlExchange && ["nasdaq", "nyse", "amex", "us-all", "moex", "lse"].includes(urlExchange)) {
  exchange = urlExchange;
}
else {
  exchange = "nasdaq";
}

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

// Currency
let convertToUSD = urlConvertToUSD || true;
const currencyToggle = document.getElementById("currencyToggle");
currencyToggle.textContent = "USD";
currencyToggle.style.textDecoration = convertToUSD ? "none" : "line-through";
currencyToggle.addEventListener("click", () => {
  convertToUSD = convertToUSD === true ? false : true;
  currencyToggle.style.textDecoration = convertToUSD ? "none" : "line-through";
  url.searchParams.set("convertToUSD", convertToUSD);
  history.replaceState(null, "", url);
});

let date = urlDate ? new Date(`${urlDate}T13:00:00`) : new Date();

let openHour;
switch (exchange) {
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
inputDate.max = new Date().toISOString().split("T")[0];

if (urlDate) {
  inputDate.value = urlDate;
}

const inputChartType = document.getElementById("inputChartType");
inputChartType.addEventListener("change", refreshChart);
if (urlChartType && ["treemap", "history", "listings"].includes(urlChartType)) {
  inputChartType.value = urlChartType;
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
  url.searchParams.set("chartType", inputChartType.value);
  url.searchParams.set("dataType", inputDataType.value);
  url.searchParams.set("date", inputDate.value);
  switch (inputChartType.value) {
    case "treemap":
      inputSearch.removeAttribute("hidden");
      inputChartType.removeAttribute("hidden");
      inputDataType.removeAttribute("hidden");
      inputDate.removeAttribute("hidden");
      inputFileLabel.removeAttribute("hidden");
      linkEraseFilter.removeAttribute("hidden");
      break;
    case "history":
      inputSearch.setAttribute("hidden", "");
      inputChartType.removeAttribute("hidden");
      inputDataType.removeAttribute("hidden");
      inputDate.setAttribute("hidden", "");
      inputFileLabel.setAttribute("hidden", "");
      linkEraseFilter.setAttribute("hidden", "");
      url.searchParams.delete("search");
      url.searchParams.delete("date");
      break;
    case "listings":
      inputSearch.setAttribute("hidden", "");
      inputChartType.removeAttribute("hidden");
      inputDataType.setAttribute("hidden", "");
      inputDate.setAttribute("hidden", "");
      inputFileLabel.setAttribute("hidden", "");
      linkEraseFilter.setAttribute("hidden", "");
      url.searchParams.delete("search");
      url.searchParams.delete("currency");
      url.searchParams.delete("dataType");
      url.searchParams.delete("date");
      break;
  }
  history.replaceState(null, "", url);
}

async function refreshChart() {
  toggleInput();

  const chartType = inputChartType.value;
  const dataType = inputDataType.value;
  const date = inputDate.value;

  switch (chartType) {
    case "treemap":
      await refreshTreemap(exchange, dataType, date);
      divChart.on("plotly_click", async (event) => {
        const clickedTreemapItem = event.points[0].customdata;
        const clickedTreemapItemType = clickedTreemapItem[2];
        if (clickedTreemapItemType !== "sector") await addOverlayWidget(exchange, clickedTreemapItem, date);
      });
      break;
    case "history":
      refreshHistogram(exchange, dataType);
      break;
    case "listings":
      refreshListings();
      break;
  }
}

refreshChart();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}
