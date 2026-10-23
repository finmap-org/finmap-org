export function isLeafNode(node) {
    return !node.children || node.children.length === 0;
}
export function getNodeData(node) {
    return node.data.data;
}
export function getNodeChange(node) {
    const data = getNodeData(node);
    return data?.priceChangePct || 0;
}
export const dataParser = {
    parseSecurityRow(columns, row) {
        const data = {};
        columns.forEach((col, index) => {
            data[col] = row[index] ?? null;
        });
        const str = (v) => v !== null && v !== undefined ? String(v) : '';
        const num = (v) => v !== null && v !== undefined ? Number(v) || 0 : 0;
        const exchangeValue = str(data.exchange);
        return {
            exchange: exchangeValue ? exchangeValue.toLowerCase() : '',
            country: str(data.country),
            type: str(data.type),
            sector: str(data.sector),
            industry: str(data.industry),
            currencyId: str(data.currencyId),
            ticker: str(data.ticker),
            nameEng: str(data.nameEng),
            nameEngShort: str(data.nameEngShort),
            nameOriginal: str(data.nameOriginal),
            nameOriginalShort: str(data.nameOriginalShort),
            priceOpen: num(data.priceOpen),
            priceLastSale: num(data.priceLastSale),
            priceChangePct: data.priceChangePct === null ? null : num(data.priceChangePct),
            volume: num(data.volume),
            value: num(data.value),
            numTrades: num(data.numTrades),
            marketCap: num(data.marketCap),
            listedFrom: str(data.listedFrom),
            listedTill: str(data.listedTill),
            wikiPageIdEng: str(data.wikiPageIdEng),
            wikiPageIdOriginal: str(data.wikiPageIdOriginal),
            nestedItemsCount: num(data.nestedItemsCount),
        };
    },
    validateDataIntegrity(data) {
        return !!(data?.securities?.columns?.length && data?.securities?.data?.length);
    },
};
export function parseMarketData(response) {
    if (!dataParser.validateDataIntegrity(response)) {
        return [];
    }
    return response.securities.data.map(row => dataParser.parseSecurityRow(response.securities.columns, row));
}
export function getDisplayName(data, language, exchangeLanguage) {
    if (exchangeLanguage &&
        language !== 'en' &&
        language === exchangeLanguage &&
        data.nameOriginalShort) {
        return data.nameOriginalShort;
    }
    return data.nameEng;
}
//# sourceMappingURL=types.js.map