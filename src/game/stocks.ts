import { StockTicker, Stock, STOCKS_DATA } from '../types';

export function calculateStockPrice(stock: Stock, qbi: number): number {
  const qbiRatio = (qbi - 50) / 50;
  const volatilityFactor = stock.qbiVolatility / 10;
  let price: number;
  if (stock.positiveCorrelation) {
    price = stock.startingPrice * (1 + volatilityFactor * qbiRatio);
  } else {
    price = stock.startingPrice * (1 - volatilityFactor * qbiRatio);
  }
  return Math.max(1, Math.round(price * 100) / 100);
}

export function calculateAllPrices(qbi: number): Record<StockTicker, number> {
  const prices: Partial<Record<StockTicker, number>> = {};
  for (const stock of STOCKS_DATA) {
    prices[stock.ticker] = calculateStockPrice(stock, qbi);
  }
  return prices as Record<StockTicker, number>;
}

export function calculateDividend(price: number, dividendPercent: number): number {
  return Math.round(price * (dividendPercent / 100) * 100) / 100;
}

export function isCorrelationPositive(ticker: StockTicker): boolean {
  const stock = STOCKS_DATA.find(s => s.ticker === ticker);
  return stock ? stock.positiveCorrelation : true;
}