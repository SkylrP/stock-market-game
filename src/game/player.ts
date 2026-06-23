import { StockTicker } from '../types';

export function getSalary(inMarket: boolean): number {
  return inMarket ? 200 : 400;
}

export function calculateTotalValue(
  cash: number,
  portfolio: Record<StockTicker, number>,
  prices: Record<StockTicker, number>
): number {
  let stockValue = 0;
  for (const ticker of Object.keys(portfolio) as StockTicker[]) {
    stockValue += portfolio[ticker] * prices[ticker];
  }
  return cash + stockValue;
}

export function getOwnedTickers(portfolio: Record<StockTicker, number>): StockTicker[] {
  return (Object.keys(portfolio) as StockTicker[]).filter(t => portfolio[t] > 0);
}

export function calculatePnl(
  costBasis: number,
  shares: number,
  price: number
): { avgCost: number; pnl: number; pnlPercent: number } {
  const avgCost = shares > 0 ? costBasis / shares : 0;
  const currentValue = Math.round(shares * price * 100) / 100;
  const pnl = currentValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  return { avgCost, pnl, pnlPercent };
}

export function getHighestPortfolioTicker(
  portfolio: Record<StockTicker, number>
): StockTicker | null {
  let highest: StockTicker | null = null;
  let highestShares = -1;
  for (const ticker of Object.keys(portfolio) as StockTicker[]) {
    if (portfolio[ticker] > highestShares) {
      highestShares = portfolio[ticker];
      highest = ticker;
    }
  }
  return highest;
}

export function getTotalShares(portfolio: Record<StockTicker, number>): number {
  return Object.values(portfolio).reduce((sum, v) => sum + v, 0);
}