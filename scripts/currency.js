async function getExchangeRates(currency) {
  let dataJson;
  try {
    const response = await fetch(
      `data/currency/exchangeRates.json?_=${new Date().toISOString().split("T")[0]}`);
    if (!response.ok) {
      alert("Oops! Nothing's here");
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    dataJson = await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  const exchangeRates = Object.entries(dataJson.rates).reduce((acc, [date, currencies]) => {
    acc[date] = currencies[currency];
    return acc;
  }, {});

  return exchangeRates;
}

async function getExchangeRateByDate(exchangeRates, date, currency) {
  let rate = exchangeRates[date];
  let d = new Date(date);
  let limit = 14;
  while (typeof rate == "undefined" && limit >= 0) {
    limit = limit - 1;
    d.setDate(d.getUTCDate() - 1);
    let prevDate = d.toISOString().split("T")[0];
    rate = exchangeRates[prevDate];
  }

  if (typeof rate == "undefined") {
    rate = 1;
    currencyToggle();
  }

  return rate;
}