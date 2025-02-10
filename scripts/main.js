// Prevent the default context menu from appearing on right-click
const divChart = document.getElementById("chart");
divChart.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

// Read URL parameters
const url = new URL(window.location.href);
const urlDate = url.searchParams.get("date");
const urlChartType = url.searchParams.get("chartType");
const urlCurrency = url.searchParams.get("currency");
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

const inputExchange = document.getElementById("inputExchange");
inputExchange.addEventListener("change", refreshChart);
if (urlExchange && ["nasdaq", "nyse", "amex", "us-all", "moex"].includes(urlExchange)) {
  inputExchange.value = urlExchange;
}

let date = urlDate ? new Date(`${urlDate}T13:00:00`) : new Date();

let openHour;
switch (inputExchange.value) {
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

// const inputCurrency = document.getElementById("inputCurrency");
// inputCurrency.addEventListener("change", refreshChart);
// if (urlCurrency && ["USD", "EUR", "CNY", "RUB"].includes(urlCurrency)) {
//   inputCurrency.value = urlCurrency;
// }

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
  url.searchParams.set("exchange", inputExchange.value);
  // url.searchParams.set("currency", inputCurrency.value);
  url.searchParams.set("chartType", inputChartType.value);
  url.searchParams.set("dataType", inputDataType.value);
  url.searchParams.set("date", inputDate.value);
  switch (inputChartType.value) {
    case "treemap":
      inputSearch.removeAttribute("hidden");
      // inputCurrency.removeAttribute("hidden");
      inputChartType.removeAttribute("hidden");
      inputDataType.removeAttribute("hidden");
      inputDate.removeAttribute("hidden");
      inputFileLabel.removeAttribute("hidden");
      linkEraseFilter.removeAttribute("hidden");
      break;
    case "history":
      inputSearch.setAttribute("hidden", "");
      // inputCurrency.removeAttribute("hidden");
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
      // inputCurrency.setAttribute("hidden", "");
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

let clickedTreemapItem;
let uniqSectors = [];
async function refreshChart() {
  toggleInput();
  switch (inputChartType.value) {
    case "treemap":
      await refreshTreemap();
      divChart.on("plotly_click", async (event) => {
        clickedTreemapItem = event.points[0].customdata;
        const clickedTreemapItemType = clickedTreemapItem[2];
        if (clickedTreemapItemType !== "sector") await addOverlayWidget();
      });
      break;
    case "history":
      refreshHistogram(inputExchange.value, inputDataType.value);
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