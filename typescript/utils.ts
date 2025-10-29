export function formatCurrency(value: number, currencySign: string): string {
  if (!value || value === 0) return `${currencySign}0`;

  const absValue = Math.abs(value);
  if (absValue >= 1e9) {
    return `${currencySign}${(value / 1e9).toFixed(2)}B`;
  }
  if (absValue >= 1e6) {
    return `${currencySign}${(value / 1e6).toFixed(2)}M`;
  }
  if (absValue >= 1e3) {
    return `${currencySign}${(value / 1e3).toFixed(1)}K`;
  }
  return `${currencySign}${value.toFixed(2)}`;
}
