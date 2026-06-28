export type StockTicker = 'NVDA' | 'MSFT' | 'AAPL' | 'GOOGL' | 'KO' | 'JPM' | 'GLD' | 'XOM';

export interface Stock {
  ticker: StockTicker;
  name: string;
  startingPrice: number;
  qbiVolatility: number;
  dividendPercent: number;
  positiveCorrelation: boolean;
}

export interface Square {
  id: number;
  type: SquareType;
  stock?: StockTicker;
  qbiChange?: number;
  label: string;
  description: string;
}

export type SquareType =
  | 'START'
  | 'STOCK_POSITIVE'
  | 'STOCK_NEGATIVE'
  | 'STOCK_HOLDER_MEETING'
  | 'FEE_100'
  | 'BROKER_FEE'
  | 'MARKET_MANIPULATOR';

export interface Player {
  id: number;
  name: string;
  color: string;
  luckyNumber: number;
  position: number;
  cash: number;
  portfolio: Record<StockTicker, number>;
  costBasis: Record<StockTicker, number>;
  totalEarned: number;
  inMarket: boolean;
  hasRolled: boolean;
  lastTurnSnapshot: { totalValue: number; qbi: number } | null;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  qbi: number;
  qbiHistory: number[];
  stocks: Record<StockTicker, Stock>;
  stockPrices: Record<StockTicker, number>;
  board: Square[];
  gamePhase: GamePhase;
  winner: number | null;
  winAmount: number;
  diceValue: number | null;
  pendingAction: PendingAction | null;
  landingPendingAction: PendingAction | null;
  animationState: AnimationState;
}

export type GamePhase =
  | 'SETUP'
  | 'PLAYING_MARKET'
  | 'GAME_OVER';

export type PendingAction =
  | { type: 'BUY_SELL'; stock: StockTicker; price: number; sellOnly?: boolean; buyOnly?: boolean; dividend?: number }
  | { type: 'STOCK_HOLDER_MEETING'; stock: StockTicker }
  | { type: 'MARKET_MANIPULATOR' }
  | { type: 'PAY_FEE'; amount: number; reason: string }
  | { type: 'BROKER_FEE' }
  | { type: 'SELL_FOR_FEE'; amount: number; reason: string }
  | null;

export interface AnimationState {
  diceRolling: boolean;
  pieceMoving: boolean;
  pieceFrom: number;
  pieceTo: number;
  qbiChanging: boolean;
  qbiFrom: number;
  qbiTo: number;
  slotSpinning: boolean;
  slotReels: SlotReel[];
  slotResult: SlotResult | null;
}

export type SlotSymbol = 'SKULL' | '2' | '3' | '7' | '10' | 'JACKPOT';

export interface SlotReel {
  symbol: SlotSymbol;
  spinning: boolean;
  offset: number;
  strip?: SlotSymbol[];
}

export interface SlotResult {
  multiplier: number;
  priority: number;
  description: string;
  newShares: number;
}

export interface GameAction {
  type: string;
  payload?: unknown;
}

export const STOCKS_DATA: Stock[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corp.', startingPrice: 135, qbiVolatility: 9, dividendPercent: 1.20, positiveCorrelation: true },
  { ticker: 'MSFT', name: 'Microsoft Corp.', startingPrice: 420, qbiVolatility: 6, dividendPercent: 2.80, positiveCorrelation: true },
  { ticker: 'AAPL', name: 'Apple Inc.', startingPrice: 190, qbiVolatility: 6, dividendPercent: 2.00, positiveCorrelation: true },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', startingPrice: 175, qbiVolatility: 7, dividendPercent: 1.00, positiveCorrelation: true },
  { ticker: 'KO', name: 'Coca‑Cola Co.', startingPrice: 60, qbiVolatility: 3, dividendPercent: 31.00, positiveCorrelation: false },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', startingPrice: 200, qbiVolatility: 5, dividendPercent: 25.00, positiveCorrelation: false },
  { ticker: 'GLD', name: 'Gold ETF', startingPrice: 220, qbiVolatility: 4, dividendPercent: 0.00, positiveCorrelation: false },
  { ticker: 'XOM', name: 'Exxon Mobil Corp.', startingPrice: 110, qbiVolatility: 5, dividendPercent: 32.00, positiveCorrelation: false },
];

export const PLAYER_COLORS = [
  '#00d4ff', // cyan
  '#ff6b6b', // red
  '#69db7c', // green
  '#ffd93d', // yellow
  '#bb86fc', // purple
  '#ff9f43', // orange
];

export const SLOT_SYMBOLS: SlotSymbol[] = ['SKULL', '2', '3', '7', '10', 'JACKPOT'];

export const SLOT_WEIGHTS: Record<SlotSymbol, number> = {
  SKULL: 30,
  '2': 20,
  '3': 20,
  '7': 20,
  '10': 20,
  JACKPOT: 5,
};