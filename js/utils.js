export function formatCurrency(value, currencySign) {
    if (!value || value === 0 || !isFinite(value))
        return `${currencySign}0`;
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
export function formatDisplayDate(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(Date.UTC(year, month, day));
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
        }).format(date);
    }
    return dateStr;
}
//# sourceMappingURL=utils.js.map