function parsePubDate(item) {
  const pubDateStr = item.getElementsByTagName("pubDate")[0].textContent;
  return new Date(pubDateStr);
}

// Get Related News Feed
async function getNews(clickedTreemapItem, date) {
  // Format the date to a readable local time string
  const options = {
    month: "long", // Full month name (e.g., "January")
    day: "2-digit", // Day of the month, 2 digits (e.g., "05")
    hour: "2-digit", // Hour in 2 digits (e.g., "09")
    minute: "2-digit", // Minute in 2 digits (e.g., "07")
    hour12: false, // Use 24-hour format
  };

  let newsLang;
  let companyName;
  switch (currentLanguage) {
    case "ENG":
      newsLang = "hl=en-US&gl=US&ceid=US:en";
      companyName = clickedTreemapItem[7];
      break;
    case "RUS":
      newsLang = "hl=ru&gl=RU&ceid=RU:ru";
      companyName = clickedTreemapItem[9];
      break;
    default:
      newsLang = "hl=en-US&gl=US&ceid=US:en";
      companyName = clickedTreemapItem[7];
      break;
  }
  const clickedLabel = clickedTreemapItem[6];
  const newsQuery = companyName.split(" ").slice(0, 2).join(" ");
  const url = `https://d3sk7vmzjz3uox.cloudfront.net/${currentLanguage}:${clickedLabel}.xml?q=${newsQuery}+before:${date}&${newsLang}&_=${new Date().toISOString().split(":")[0]}`;
  let html = "";
  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
    const items = Array.from(xmlDoc.getElementsByTagName("item"));
    items.sort((a, b) => parsePubDate(b) - parsePubDate(a));
    items.forEach((item) => {
      const title = item.getElementsByTagName("title")[0].textContent;
      const pubDate = item.getElementsByTagName("pubDate")[0].textContent;
      const link = item.getElementsByTagName("link")[0].textContent;
      const source = item.getElementsByTagName("source")[0]?.textContent;
      const sourceUrl = item
        .getElementsByTagName("source")[0]
        ?.getAttribute("url");
      html += `
      <article>
        <h4>
          <a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a>
        </h4>
        <a href="${sourceUrl}" target="_blank" rel="noopener">${source}</a>, ${pubDate}<br><br>
      </article>
      `;
    });
  } catch (error) {
    html = "<h1>Woops! Nothing was found 🕵🏽</h1>";
  }

  return html;
}

// Get Company Info
async function getCompanyInfo(exchange, clickedTreemapItem) {
  let wikiPageId, url, response, json;
  let html = "";
  let description;
  let sourceLink;
  switch (exchange) {
    case "nasdaq":
    case "nyse":
    case "amex":
    case "us-all":
      const clickedExchange = clickedTreemapItem[0];
      const clickedLabel = clickedTreemapItem[6];
      url = `https://raw.githubusercontent.com/finmap-org/finmap-org/refs/heads/main/data/securities/${clickedExchange}/${clickedLabel.slice(0, 1)}/${clickedLabel}.json`;
      response = await fetch(url);

      if (response.ok) {
        json = await response.json();
        description = json.data.CompanyDescription.value;
        sourceLink = json.data.CompanyUrl.value;
      } else {
        console.error(`Error fetching from fallback URL: ${response.status}`);
      }
      break;
    case "moex":
      let infoLang;
      switch (currentLanguage) {
        case "ENG":
          infoLang = "en";
          wikiPageId = clickedTreemapItem[20];
          break;
        case "RUS":
          infoLang = "ru";
          wikiPageId = clickedTreemapItem[21];
          break;
        default:
          infoLang = "en";
          wikiPageId = clickedTreemapItem[20];
          break;
      }
      url = `https://${infoLang}.wikipedia.org/w/api.php?action=query&pageids=${wikiPageId}&prop=langlinks|extracts&lllimit=500&exintro&explaintext&format=json&origin=*`;
      response = await fetch(url);
      json = await response.json();
      const pages = json.query.pages;
      const firstPage = Object.keys(pages)[0];
      description = pages[firstPage].extract;
      sourceLink = `https://${infoLang}.wikipedia.org/wiki/?curid=${wikiPageId}`;
      break;
  }

  html = `<p>
            ${description}
            <br>
            <b>Link: <a href="${sourceLink}" target="_blank" rel="noopener">${sourceLink}</a></b>
          </p>
        `;

  return html;
}

// Add Overlay widget
let overlayDiv, newsDiv, infoDiv;
async function addOverlayWidget(exchange, clickedTreemapItem, date) {
  const slices = document.querySelectorAll("g.slice.cursor-pointer");

  if (slices.length === 1) {
    return;
  }
  const bbox = slices[0].getBBox();

  if (typeof overlayDiv !== "undefined") {
    overlayDiv.style.visibility = "visible";
    newsDiv.innerHTML = "";
    infoDiv.innerHTML = "";
    newsDiv.innerHTML = await getNews(clickedTreemapItem, date);
    infoDiv.innerHTML = await getCompanyInfo(exchange, clickedTreemapItem);
    return;
  }

  // Create a new div element
  overlayDiv = document.createElement("div");
  overlayDiv.id = "overlay";

  const closeOverlayBtn = document.createElement("button");
  closeOverlayBtn.id = "closeOverlayBtn";
  closeOverlayBtn.innerHTML = "close";
  closeOverlayBtn.style.top = "5px";
  closeOverlayBtn.style.right = "10px";

  const showNewsBtn = document.createElement("button");
  showNewsBtn.id = "showNewsBtn";
  showNewsBtn.innerHTML = "news";
  showNewsBtn.style.top = "5px";
  showNewsBtn.style.right = "100px";

  const showInfoBtn = document.createElement("button");
  showInfoBtn.id = "showInfoBtn";
  showInfoBtn.innerHTML = "info";
  showInfoBtn.style.top = "5px";
  showInfoBtn.style.right = "190px";

  const buyBtn = document.createElement("button");
  buyBtn.id = "buyBtn";
  buyBtn.innerHTML = "buy";
  buyBtn.style.top = "5px";
  buyBtn.style.right = "260px";
  buyBtn.style["background-color"] = "rgba(59, 161, 66, 0.5)";

  const buyDiv = document.createElement("div");
  buyDiv.id = "buyDiv";
  buyDiv.innerHTML = "Interested in integration? Contact us: <a href='mailto:integration@finmap.org'>integration@finmap.org</a>";
  buyDiv.setAttribute("hidden", "");
  
  closeOverlayBtn.addEventListener("click", function () {
    overlayDiv.style.visibility = "hidden";
  });

  // Position the div based on the bounding box of the slice
  overlayDiv.style.left = bbox.x + 10 + "px";
  overlayDiv.style.top = bbox.y + 150 + "px";
  // overlayDiv.style.width = bbox.width - 20 + "px";
  // overlayDiv.style.height = bbox.height - 120 + "px";
  overlayDiv.style.width = "95%";
  overlayDiv.style["max-width"] = "960px";
  overlayDiv.style.height = "75%";
  overlayDiv.style.display = "flex";

  overlayDiv.appendChild(showInfoBtn);
  overlayDiv.appendChild(showNewsBtn);
  overlayDiv.appendChild(closeOverlayBtn);
  overlayDiv.appendChild(buyBtn);
  overlayDiv.appendChild(buyDiv);

  newsDiv = document.createElement("div");
  newsDiv.id = "news";
  newsDiv.innerHTML = await getNews(clickedTreemapItem, date);
  overlayDiv.appendChild(newsDiv);

  infoDiv = document.createElement("div");
  infoDiv.id = "info";
  infoDiv.innerHTML = await getCompanyInfo(exchange, clickedTreemapItem);
  overlayDiv.appendChild(infoDiv);

  // Append the div to the body or a specific container
  document.body.appendChild(overlayDiv);

  document.onclick = function (event) {
    if (!overlayDiv.contains(event.target)) {
      overlayDiv.style.visibility = "hidden";
    }
  };

  newsDiv.removeAttribute("hidden");
  infoDiv.setAttribute("hidden", "");

  showInfoBtn.addEventListener("click", function () {
    newsDiv.setAttribute("hidden", "");
    infoDiv.removeAttribute("hidden");
    buyDiv.setAttribute("hidden", "");
  });

  showNewsBtn.addEventListener("click", function () {
    newsDiv.removeAttribute("hidden");
    infoDiv.setAttribute("hidden", "");
    buyDiv.setAttribute("hidden", "");
  });

  buyBtn.addEventListener("click", function () {
    infoDiv.setAttribute("hidden", "");
    newsDiv.setAttribute("hidden", "");
    buyDiv.removeAttribute("hidden");
  });
}
