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
    ammount: [],
    // operation: [],
  };
  data.forEach((row) => {
    const [ticker, ammount, date, price, operation] = row;
    filterCsv["ticker"].push(ticker);
    // filterCsv["date"].push(date);
    // filterCsv["price"].push(price);
    filterCsv["ammount"].push(ammount);
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

let clickedLabel;
let companyName;
let isPortfolio;

async function selectTreemapItemByLabel(label) {
  clickedLabel = label;
  label = label.toLowerCase();

  var boxes = divChart.querySelectorAll("g.slice.cursor-pointer");
  let skipItems;
  switch (inputExchange.value) {
    case "nasdaq":
    case "nyse":
    case "amex":
    case "all":
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
        colors: chartData["priceChange"],
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
      text: chartData.customdata[4],
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
const highlightList = ["nasdaq:AAPL", "nasdaq:ASML", "nyse:WLY", "GCHE"];

async function refreshTreemap() {
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

  let chartData;
  switch (inputExchange.value) {
    case "nasdaq":
    case "nyse":
    case "amex":
    case "all":
      chartData = await prepTreemapData_us();
      await renderTreemapChart(chartData);
      break;
    case "moex":
      chartData = await prepTreemapData_ru();
      await renderTreemapChart(chartData);
      break;
    default:
      chartData = await prepTreemapData_us();
      await renderTreemapChart(chartData);
      break;
  }
}
