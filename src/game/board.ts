import { Square, StockTicker } from '../types';

const allTickers: StockTicker[] = ['NVDA', 'MSFT', 'AAPL', 'GOOGL', 'KO', 'JPM', 'GLD', 'XOM'];

const qbiChanges = [-20, -15, -10, -8, -5, -3, -2, -1, 1, 2, 3, 5, 8, 10, 15, 20];

function shuffleQBIChanges(): number[] {
  const arr = [...qbiChanges];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createBoard(): Square[] {
  const posChanges = shuffleQBIChanges();
  const negChanges = shuffleQBIChanges();

  const stockSquares: Square[] = [];
  const meetingSquares: Square[] = [];
  const feeSquares: Square[] = [];
  const manipSquares: Square[] = [];

  for (let i = 0; i < allTickers.length; i++) {
    const ticker = allTickers[i];
    stockSquares.push({
      id: -1,
      type: 'STOCK_POSITIVE',
      stock: ticker,
      qbiChange: posChanges[i],
      label: `${ticker}`,
      description: `+QBI ${posChanges[i] > 0 ? '+' : ''}${posChanges[i]}`,
    });
    stockSquares.push({
      id: -1,
      type: 'STOCK_NEGATIVE',
      stock: ticker,
      qbiChange: negChanges[i],
      label: `${ticker}`,
      description: `QBI ${negChanges[i] > 0 ? '+' : ''}${negChanges[i]}`,
    });
  }

  for (const ticker of allTickers) {
    meetingSquares.push({
      id: -1,
      type: 'STOCK_HOLDER_MEETING',
      stock: ticker,
      qbiChange: 0,
      label: `${ticker} Meeting`,
      description: 'Stock Holder Meeting',
    });
  }

  for (let i = 0; i < 4; i++) {
    feeSquares.push({
      id: -1,
      type: 'FEE_100',
      qbiChange: 0,
      label: '$100 Fee',
      description: 'Pay $100 fee',
    });
  }

  for (let i = 0; i < 2; i++) {
    feeSquares.push({
      id: -1,
      type: 'BROKER_FEE',
      qbiChange: 0,
      label: 'Broker Fee',
      description: 'Broker fee: $5 per share',
    });
  }

  for (let i = 0; i < 2; i++) {
    manipSquares.push({
      id: -1,
      type: 'MARKET_MANIPULATOR',
      qbiChange: 0,
      label: 'Market Manipulator',
      description: 'Influence the market!',
    });
  }

  const pools: Record<string, Square[]> = {
    stock: shuffle(stockSquares),
    meeting: shuffle(meetingSquares),
    fee: shuffle(feeSquares),
    manip: shuffle(manipSquares),
  };

  const keys = ['stock', 'meeting', 'fee', 'manip'] as const;
  const squares: Square[] = [];
  let lastKey: string | null = null;

  while (keys.some(k => pools[k].length > 0)) {
    const available = keys.filter(k => pools[k].length > 0);
    const candidates = available.filter(k => k !== lastKey);
    const pick = (candidates.length > 0 ? candidates : available).reduce((a, b) =>
      pools[a].length >= pools[b].length ? a : b
    );
    squares.push(pools[pick].pop()!);
    lastKey = pick;
  }

  squares.splice(0, 0, {
    id: -1,
    type: 'START',
    qbiChange: 0,
    label: 'START',
    description: 'Start - no fee',
  });

  squares.forEach((s, idx) => {
    s.id = idx;
  });

  return squares;
}