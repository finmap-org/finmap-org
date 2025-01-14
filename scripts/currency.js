async function getCurrencyRates(currencyType) {
  const startDate = "2011-12-19";
  const response = await fetch(
    `data/FIXME${currencyType}.csv?_=${new Date().toISOString().split("T")[0]}`,
  );
  const textResponse = await response.text();
  const data = textResponse.split("\n").map((row) => row.split(","));

  const currencyRates = {};
  data.forEach((row) => {
    const [Date, , , , Close] = row;
    if (Date >= startDate) {
      currencyRates[Date] = Number(Close);
    }
  });
  return currencyRates;
}

async function getCurrencyRateByDate(date) {
  const currencyType = inputCurrency.value;
  const currencyRates = await getCurrencyRates(currencyType);

  let rate = currencyRates[date];
  let d = new Date(date);
  while (typeof rate == "undefined") {
    d.setDate(d.getUTCDate() - 1);
    let prevDate = d.toISOString().split("T")[0];
    rate = currencyRates[prevDate];
  }

  return rate;
}
