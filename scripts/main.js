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
let date = urlDate ? new Date(`${urlDate}T13:00:00`) : new Date();

let openHour;
switch (inputExchange.value) {
  case "moex":
    openHour = 8;
    break;
  case "nasdaq":
  case "nyse":
  case "amex":
  case "all":
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
inputDate.value = formattedDate;
inputDate.max = new Date().toISOString().split("T")[0];

if (urlDate) {
  inputDate.value = urlDate;
}

const inputChartType = document.getElementById("inputChartType");
if (urlChartType && ["treemap", "history", "listings"].includes(urlChartType)) {
  inputChartType.value = urlChartType;
}

const inputCurrency = document.getElementById("inputCurrency");
if (urlCurrency && ["USD", "EUR", "CNY", "RUB"].includes(urlCurrency)) {
  inputCurrency.value = urlCurrency;
}

const inputDataType = document.getElementById("inputDataType");
if (urlDataType && ["marketcap", "value", "trades"].includes(urlDataType)) {
  inputDataType.value = urlDataType;
}

inputChartType.addEventListener("change", refreshChart);
inputCurrency.addEventListener("change", refreshChart);
inputDataType.addEventListener("change", refreshChart);
inputDate.addEventListener("change", refreshChart);

if (
  urlExchange &&
  ["nasdaq", "nyse", "amex", "all", "moex"].includes(urlExchange)
) {
  inputExchange.value = urlExchange;
}
inputExchange.addEventListener("change", refreshChart);

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
  url.searchParams.set("currency", inputCurrency.value);
  url.searchParams.set("chartType", inputChartType.value);
  url.searchParams.set("dataType", inputDataType.value);
  url.searchParams.set("date", inputDate.value);
  switch (inputChartType.value) {
    case "treemap":
      inputSearch.removeAttribute("hidden");
      inputCurrency.removeAttribute("hidden");
      inputChartType.removeAttribute("hidden");
      inputDataType.removeAttribute("hidden");
      inputDate.removeAttribute("hidden");
      break;
    case "history":
      // inputExchange.value = "moex";
      inputSearch.setAttribute("hidden", "");
      inputCurrency.removeAttribute("hidden");
      inputChartType.removeAttribute("hidden");
      inputDataType.removeAttribute("hidden");
      inputDate.setAttribute("hidden", "");
      // inputFileLabel.setAttribute("hidden", "");
      // linkEraseFilter.setAttribute("hidden", "");
      url.searchParams.delete("search");
      url.searchParams.delete("date");
      break;
    case "listings":
      // inputExchange.value = "moex";
      inputSearch.setAttribute("hidden", "");
      inputCurrency.setAttribute("hidden", "");
      inputChartType.removeAttribute("hidden");
      inputDataType.setAttribute("hidden", "");
      inputDate.setAttribute("hidden", "");
      // inputFileLabel.setAttribute("hidden", "");
      // linkEraseFilter.setAttribute("hidden", "");
      url.searchParams.delete("search");
      url.searchParams.delete("currency");
      url.searchParams.delete("dataType");
      url.searchParams.delete("date");
      break;
  }
  switch (inputExchange.value) {
    case "nasdaq":
    case "nyse":
    case "amex":
    case "all":
      inputSearch.removeAttribute("hidden");
      inputCurrency.setAttribute("hidden", "");
      inputChartType.value = "treemap";
      url.searchParams.set("chartType", "treemap");
      inputDataType.setAttribute("hidden", "");
      inputDate.removeAttribute("hidden");
      url.searchParams.delete("currency");
      url.searchParams.delete("dataType");
      break;
    case "moex":
      inputSearch.removeAttribute("hidden");
      inputCurrency.removeAttribute("hidden");
      inputChartType.removeAttribute("hidden");
      inputDataType.removeAttribute("hidden");
      inputDate.removeAttribute("hidden");
      break;
  }
  history.replaceState(null, "", url);
}

let hasPlotlyClickListener = false;
let uniqSectors = [];
async function refreshChart() {
  toggleInput();

  switch (inputChartType.value) {
    case "treemap":
      await refreshTreemap();
      // if (urlSearch) {
      //   await selectTreemapItemByLabel(urlSearch);
      //   await addOverlayWidget();
      // }
      if (!hasPlotlyClickListener) {
        hasPlotlyClickListener = true;
        divChart.on("plotly_click", async (event) => {
          clickedLabel = event.points[0].label;
          companyName = event.points[0].customdata[4];
          if (!uniqSectors.includes(clickedLabel)) await addOverlayWidget();
        });
      }
      break;
    case "history":
      refreshHistogram();
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
