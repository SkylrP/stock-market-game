import {
  GameState,
  GameAction,
  Player,
  StockTicker,
  SlotSymbol,
  PendingAction,
  STOCKS_DATA,
  PLAYER_COLORS,
  SLOT_SYMBOLS,
} from '../types';
import { createBoard } from '../game/board';
import { calculateAllPrices, calculateDividend } from '../game/stocks';
import { moveQbi } from '../game/qbi';
import { rollDice } from '../game/dice';
import { runSlotMachine } from '../game/slotMachine';
import { getSalary, calculateTotalValue, getTotalShares } from '../game/player';

export function createInitialState(): GameState {
  const board = createBoard();
  const stocks: Record<string, typeof STOCKS_DATA[0]> = {};
  for (const s of STOCKS_DATA) {
    stocks[s.ticker] = s;
  }
  const prices = calculateAllPrices(50);
  return {
    players: [],
    currentPlayerIndex: 0,
    qbi: 50,
    qbiHistory: [],
    stocks: stocks as GameState['stocks'],
    stockPrices: prices,
    board,
    gamePhase: 'SETUP',
    winner: null,
    winAmount: 100000,
    diceValue: null,
    pendingAction: null,
    landingPendingAction: null,
    animationState: {
      diceRolling: false,
      pieceMoving: false,
      pieceFrom: 0,
      pieceTo: 0,
      qbiChanging: false,
      qbiFrom: 0,
      qbiTo: 0,
      slotSpinning: false,
      slotReels: [],
      slotResult: null,
    },
  };
}

function checkWin(state: GameState, player: Player): boolean {
  const total = calculateTotalValue(player.cash, player.portfolio, state.stockPrices);
  return total >= state.winAmount;
}

function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

function updatePlayer(state: GameState, playerId: number, updates: Partial<Player>): GameState {
  return {
    ...state,
    players: state.players.map(p => p.id === playerId ? { ...p, ...updates } : p),
  };
}

function generateReelStrip(finalSymbol: SlotSymbol): SlotSymbol[] {
  const strip: SlotSymbol[] = [];
  for (let i = 0; i < 35; i++) {
    strip.push(SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
  }
  strip.push(finalSymbol);
  strip.push(finalSymbol);
  return strip;
}

export function migrateState(state: GameState): GameState {
  let s: GameState = {
    ...state,
    qbiHistory: (state as any).qbiHistory ?? [],
    gamePhase: (state.gamePhase as string) === 'GOING_TO_WORK' ? 'PLAYING_MARKET' : state.gamePhase,
  };
  let changed = s !== state;
  const players = s.players.map(p => {
    const updates: Partial<Player> = {};
      if (!p.costBasis) {
        const cb = {} as Record<StockTicker, number>;
        for (const t of STOCKS_DATA) cb[t.ticker] = 0;
        updates.costBasis = cb;
        changed = true;
      }
      if (!('lastTurnSnapshot' in p)) {
        updates.lastTurnSnapshot = null;
        changed = true;
      }
      if (!('totalTrades' in p)) {
        updates.totalTrades = 0;
        changed = true;
      }
      if (!('totalMeetings' in p)) {
        updates.totalMeetings = 0;
        changed = true;
      }
      if (!('biggestDividend' in p)) {
        updates.biggestDividend = 0;
        changed = true;
      }
      if (!('totalFeesPaid' in p)) {
        updates.totalFeesPaid = 0;
        changed = true;
      }
      return Object.keys(updates).length ? { ...p, ...updates } : p;
  });
  return changed ? { ...s, players } : s;
}

function buyShares(state: GameState, player: Player, ticker: StockTicker, shares: number, priceOverride?: number): GameState {
  if (shares <= 0) return state;
  const price = priceOverride ?? state.stockPrices[ticker];
  const cost = Math.round(shares * price * 100) / 100;
  if (player.cash < cost) return state;
  const newPortfolio = { ...player.portfolio };
  newPortfolio[ticker] = (newPortfolio[ticker] || 0) + shares;
  const newCostBasis = { ...player.costBasis };
  newCostBasis[ticker] = (newCostBasis[ticker] || 0) + cost;
  return updatePlayer(state, player.id, {
    cash: Math.round((player.cash - cost) * 100) / 100,
    portfolio: newPortfolio,
    costBasis: newCostBasis,
  });
}

function sellShares(state: GameState, player: Player, ticker: StockTicker, shares: number, priceOverride?: number): GameState {
  if (shares <= 0) return state;
  if ((player.portfolio[ticker] || 0) < shares) return state;
  const price = priceOverride ?? state.stockPrices[ticker];
  const revenue = Math.round(shares * price * 100) / 100;
  const newPortfolio = { ...player.portfolio };
  newPortfolio[ticker] = Math.max(0, (newPortfolio[ticker] || 0) - shares);
  const owned = player.portfolio[ticker] || 0;
  const avgCost = owned > 0 ? (player.costBasis[ticker] || 0) / owned : 0;
  const costSold = Math.round(avgCost * shares * 100) / 100;
  const newCostBasis = { ...player.costBasis };
  newCostBasis[ticker] = Math.max(0, (newCostBasis[ticker] || 0) - costSold);
  return updatePlayer(state, player.id, {
    cash: Math.round((player.cash + revenue) * 100) / 100,
    portfolio: newPortfolio,
    costBasis: newCostBasis,
  });
}

function withWinCheck(state: GameState): GameState {
  if (checkWin(state, state.players[state.currentPlayerIndex])) {
    return { ...state, gamePhase: 'GAME_OVER', winner: state.currentPlayerIndex };
  }
  return state;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_WIN_AMOUNT': {
      return { ...state, winAmount: action.payload as number };
    }

    case 'ADD_PLAYER': {
      const idx = state.players.length;
      const { name, luckyNumber } = action.payload as { name: string; luckyNumber: number };
      const portfolio = {} as Record<StockTicker, number>;
      const costBasis = {} as Record<StockTicker, number>;
      for (const t of STOCKS_DATA) {
        portfolio[t.ticker] = 0;
        costBasis[t.ticker] = 0;
      }
      const player: Player = {
        id: idx,
        name,
        color: PLAYER_COLORS[idx],
        luckyNumber,
        position: 0,
        cash: 0,
        portfolio,
        costBasis,
        totalEarned: 0,
        inMarket: false,
        hasRolled: false,
        lastTurnSnapshot: null,
        totalTrades: 0,
        totalMeetings: 0,
        biggestDividend: 0,
        totalFeesPaid: 0,
      };
      return { ...state, players: [...state.players, player] };
    }

    case 'START_GAME': {
      const newPlayers = state.players.map(p => ({
        ...p,
        hasRolled: false,
      }));
      return {
        ...state,
        players: newPlayers,
        gamePhase: 'PLAYING_MARKET',
        currentPlayerIndex: 0,
          animationState: {
            diceRolling: false,
            pieceMoving: false,
            pieceFrom: 0,
            pieceTo: 0,
            qbiChanging: false,
            qbiFrom: 0,
            qbiTo: 0,
            slotSpinning: false,
            slotReels: [],
            slotResult: null,
          },
      };
    }

    case 'ROLL_DICE': {
      const player = getCurrentPlayer(state);
      if (player.hasRolled) return state;
      if (state.animationState.diceRolling) return state;

      const dice = rollDice();

      return {
        ...state,
        diceValue: dice,
        animationState: {
          ...state.animationState,
          diceRolling: true,
        },
      };
    }

    case 'FINISH_DICE_ROLL': {
      const player = getCurrentPlayer(state);

      const dice = state.diceValue
      if (dice) {
        const luckyPlayers = state.players.filter(p => p.luckyNumber === dice)
        for (const lp of luckyPlayers) {
          const salary = getSalary(lp.inMarket)
          state = updatePlayer(state, lp.id, {
            cash: Math.round((lp.cash + salary) * 100) / 100,
            totalEarned: lp.inMarket ? lp.totalEarned : Math.round((lp.totalEarned + salary) * 100) / 100,
          })
        }
      }

      if (!player.inMarket) {
        return {
          ...state,
          players: state.players.map(p =>
            p.id === player.id ? { ...p, hasRolled: true } : p
          ),
          animationState: {
            ...state.animationState,
            diceRolling: false,
          },
        };
      }

      const oldPos = player.position;
      let newPos = (oldPos + (state.diceValue || 0)) % state.board.length;
      if (newPos === 0) newPos = 1;
      const square = state.board[newPos];

      let newState = updatePlayer(state, player.id, {
        position: newPos,
        hasRolled: true,
      });

      newState = {
        ...newState,
        animationState: {
          ...newState.animationState,
          diceRolling: false,
          pieceMoving: true,
          pieceFrom: oldPos,
          pieceTo: newPos,
          qbiChanging: false,
          qbiFrom: 0,
          qbiTo: 0,
        },
      };

      let landingPending: PendingAction | null = null;

      if (square.type === 'STOCK_POSITIVE' || square.type === 'STOCK_NEGATIVE') {
        const oldQbi = newState.qbi;
        const newQbi = moveQbi(oldQbi, square.qbiChange || 0);
        const qbiHistory = [oldQbi, ...newState.qbiHistory];
        newState = { ...newState, qbi: newQbi, qbiHistory, stockPrices: calculateAllPrices(newQbi) };

        newState = {
          ...newState,
          animationState: {
            ...newState.animationState,
            qbiChanging: true,
            qbiFrom: oldQbi,
            qbiTo: newQbi,
          },
        };

        const stock = newState.stocks[square.stock!];
        const divPerShare = calculateDividend(newState.stockPrices[square.stock!], stock.dividendPercent);
        const ownedShares = player.portfolio[square.stock!];
        let dividendAmount = 0;

        if (ownedShares > 0) {
          dividendAmount = Math.round(divPerShare * ownedShares * 100) / 100;
          newState = updatePlayer(newState, player.id, {
            cash: Math.round((player.cash + dividendAmount) * 100) / 100,
            biggestDividend: Math.max(player.biggestDividend, dividendAmount),
          });
        }

        landingPending = {
          type: 'BUY_SELL',
          stock: square.stock!,
          price: newState.stockPrices[square.stock!],
          buyOnly: true,
          dividend: dividendAmount > 0 ? dividendAmount : undefined,
        };
      }

      if (square.type === 'STOCK_HOLDER_MEETING') {
        landingPending = { type: 'STOCK_HOLDER_MEETING', stock: square.stock! };
      }

      if (square.type === 'FEE_100') {
        landingPending = { type: 'PAY_FEE', amount: 100, reason: '$100 Fee' };
      }

      if (square.type === 'BROKER_FEE') {
        landingPending = { type: 'BROKER_FEE' };
      }

      if (square.type === 'MARKET_MANIPULATOR') {
        landingPending = { type: 'MARKET_MANIPULATOR' };
      }

      return withWinCheck({ ...newState, landingPendingAction: landingPending });
    }

    case 'FINISH_LANDING_ANIMATION': {
      return {
        ...state,
        animationState: {
          ...state.animationState,
          pieceMoving: false,
          qbiChanging: false,
        },
      };
    }

    case 'REVEAL_PENDING_ACTION': {
      return {
        ...state,
        pendingAction: state.landingPendingAction,
        landingPendingAction: null,
      };
    }

    case 'BUY_STOCK': {
      const { ticker, shares } = action.payload as { ticker: StockTicker; shares: number };
      const player = getCurrentPlayer(state);
      if (!state.pendingAction || state.pendingAction.type !== 'BUY_SELL') return state;
      let newState = buyShares(state, player, ticker, shares, state.pendingAction.price);
      if (newState !== state) {
        const p = getCurrentPlayer(newState);
        newState = updatePlayer(newState, p.id, { totalTrades: p.totalTrades + 1 });
      }
      return newState;
    }

    case 'SELL_STOCK': {
      const { ticker, shares } = action.payload as { ticker: StockTicker; shares: number };
      const player = getCurrentPlayer(state);
      let newState = sellShares(state, player, ticker, shares);
      if (newState !== state) {
        const p = getCurrentPlayer(newState);
        newState = updatePlayer(newState, p.id, { totalTrades: p.totalTrades + 1 });
      }
      return newState;
    }

    case 'SELL_AT_LOWEST': {
      const { ticker, shares } = action.payload as { ticker: StockTicker; shares: number };
      const player = getCurrentPlayer(state);
      const stock = state.stocks[ticker];
      return sellShares(state, player, ticker, shares, stock.startingPrice * 0.5);
    }

    case 'PAY_FEE': {
      const player = getCurrentPlayer(state);
      if (!state.pendingAction || state.pendingAction.type !== 'PAY_FEE') return state;
      const { amount } = state.pendingAction;

      if (player.cash >= amount) {
        let newState = updatePlayer(state, player.id, {
          cash: Math.round((player.cash - amount) * 100) / 100,
          totalFeesPaid: player.totalFeesPaid + amount,
        });
        return withWinCheck({ ...newState, pendingAction: null });
      }

      return { ...state, pendingAction: { type: 'SELL_FOR_FEE', amount: state.pendingAction.amount, reason: state.pendingAction.reason } };
    }

    case 'BROKER_FEE': {
      const player = getCurrentPlayer(state);
      if (!state.pendingAction || state.pendingAction.type !== 'BROKER_FEE') return state;

      const totalShares = getTotalShares(player.portfolio);
      const fee = totalShares * 5;

      if (player.cash >= fee) {
        let newState = updatePlayer(state, player.id, {
          cash: Math.round((player.cash - fee) * 100) / 100,
          totalFeesPaid: player.totalFeesPaid + fee,
        });
        return withWinCheck({ ...newState, pendingAction: null });
      }

      return { ...state, pendingAction: { type: 'SELL_FOR_FEE', amount: fee, reason: 'Broker Fee' } };
    }

    case 'FORCE_SELL_FOR_FEE': {
      const player = getCurrentPlayer(state);
      if (!state.pendingAction || state.pendingAction.type !== 'SELL_FOR_FEE') return state;
      const needed = state.pendingAction.amount || 100;

      const ownedTickers = (Object.keys(player.portfolio) as StockTicker[])
        .filter(t => player.portfolio[t] > 0)
        .sort((a, b) => state.stockPrices[a] - state.stockPrices[b]);

      let remainingNeeded = Math.round((needed - player.cash) * 100) / 100;
      if (remainingNeeded <= 0) {
        let newState = updatePlayer(state, player.id, {
          cash: Math.round((player.cash - needed) * 100) / 100,
          totalFeesPaid: player.totalFeesPaid + needed,
        });
        newState = { ...newState, pendingAction: null };
        return withWinCheck(newState);
      }

      let newState = state;
      for (const ticker of ownedTickers) {
        if (remainingNeeded <= 0) break;
        const shares = getCurrentPlayer(newState).portfolio[ticker];
        if (shares === 0) continue;
        const lowestPrice = newState.stocks[ticker].startingPrice * 0.5;
        newState = sellShares(newState, getCurrentPlayer(newState), ticker, shares, lowestPrice);
        remainingNeeded = Math.round((remainingNeeded - shares * lowestPrice) * 100) / 100;
      }

      if (remainingNeeded > 0) {
        return {
          ...state,
          pendingAction: null,
          players: state.players.map(p =>
            p.id === player.id
              ? { ...p, cash: 0, portfolio: {} as Record<StockTicker, number>, costBasis: {} as Record<StockTicker, number>, totalEarned: 0, inMarket: false, totalFeesPaid: player.totalFeesPaid + needed }
              : p
          ),
        };
      }

      const currentPlayer = getCurrentPlayer(newState);
      newState = updatePlayer(newState, player.id, {
        cash: Math.round((currentPlayer.cash - needed) * 100) / 100,
        totalFeesPaid: currentPlayer.totalFeesPaid + needed,
      });
      newState = { ...newState, pendingAction: null };
      return withWinCheck(newState);
    }

    case 'START_STOCK_MEETING': {
      const player = getCurrentPlayer(state);
      if (!state.pendingAction || state.pendingAction.type !== 'STOCK_HOLDER_MEETING') return state;
      const ticker = state.pendingAction.stock;
      const heldShares = player.portfolio[ticker] || 0;

      if (heldShares === 0) {
        return {
          ...state,
          pendingAction: { type: 'BUY_SELL', stock: ticker, price: state.stockPrices[ticker] },
        };
      }

      const { reels, result } = runSlotMachine(heldShares);
      const newPortfolio = { ...player.portfolio };
      newPortfolio[ticker] = result.newShares;

      return {
        ...state,
        animationState: {
          ...state.animationState,
          slotSpinning: true,
          slotReels: reels.map(s => ({
            symbol: s,
            spinning: true,
            offset: 0,
            strip: generateReelStrip(s),
          })),
          slotResult: result,
        },
        players: state.players.map(p =>
          p.id === player.id ? { ...p, portfolio: newPortfolio, totalMeetings: player.totalMeetings + 1 } : p
        ),
        pendingAction: null,
      };
    }

    case 'BUY_ONE_SHARE_MEETING': {
      const player = getCurrentPlayer(state);
      if (!state.pendingAction || state.pendingAction.type !== 'STOCK_HOLDER_MEETING') return state;
      const ticker = state.pendingAction.stock;
      const price = state.stockPrices[ticker];
      if (player.cash < price) return state;

      return updatePlayer(state, player.id, {
        cash: Math.round((player.cash - price) * 100) / 100,
        portfolio: { ...player.portfolio, [ticker]: 1 },
      });
    }

    case 'STOP_SLOT_REEL': {
      const index = action.payload as number;
      const reels = state.animationState.slotReels.map((r, i) =>
        i === index ? { ...r, spinning: false, strip: undefined } : r
      );
      return {
        ...state,
        animationState: { ...state.animationState, slotReels: reels },
      };
    }

    case 'FINISH_SLOTS': {
      return {
        ...state,
        animationState: {
          ...state.animationState,
          slotSpinning: false,
          slotReels: state.animationState.slotReels.map(r => ({ ...r, spinning: false })),
        },
      };
    }

    case 'DISMISS_SLOTS': {
      return {
        ...state,
        animationState: {
          ...state.animationState,
          slotSpinning: false,
          slotReels: [],
          slotResult: null,
        },
        pendingAction: null,
      };
    }

    case 'START_MARKET_MANIPULATOR': {
      const roll = action.payload as number;
      return {
        ...state,
        diceValue: roll,
        pendingAction: { type: 'MARKET_MANIPULATOR' },
      };
    }

    case 'APPLY_MARKET_MANIPULATOR': {
      const { direction } = action.payload as { direction: 'up' | 'down' };
      if (!state.pendingAction || state.pendingAction.type !== 'MARKET_MANIPULATOR') return state;
      const diceValue = state.diceValue || 0;
      const change = direction === 'up' ? diceValue : -diceValue;
      const newQbi = moveQbi(state.qbi, change);
      const qbiHistory = [state.qbi, ...state.qbiHistory];
      return {
        ...state,
        qbi: newQbi,
        qbiHistory,
        stockPrices: calculateAllPrices(newQbi),
        diceValue: null,
      };
    }

    case 'MARKET_MANIPULATOR_TRADE': {
      const player = getCurrentPlayer(state);
      const { ticker, shares, action: tradeAction } = action.payload as {
        ticker: StockTicker;
        shares: number;
        action: 'BUY' | 'SELL';
      };

      if (tradeAction === 'BUY') {
        let newState = buyShares(state, player, ticker, shares);
        if (newState === state) return state;
        const p = getCurrentPlayer(newState);
        newState = updatePlayer(newState, p.id, { totalTrades: p.totalTrades + 1 });
        newState = { ...newState, pendingAction: null };
        return withWinCheck(newState);
      }

      if (tradeAction === 'SELL') {
        let newState = sellShares(state, player, ticker, shares);
        if (newState === state) return state;
        const p = getCurrentPlayer(newState);
        newState = updatePlayer(newState, p.id, { totalTrades: p.totalTrades + 1 });
        newState = { ...newState, pendingAction: null };
        return withWinCheck(newState);
      }

      return state;
    }

    case 'OPEN_BUY_SELL': {
      const player = getCurrentPlayer(state);
      if (player.hasRolled) return state;
      const ticker = action.payload as StockTicker;
      return {
        ...state,
        pendingAction: { type: 'BUY_SELL', stock: ticker, price: state.stockPrices[ticker] },
      };
    }

    case 'OPEN_SELL_PORTFOLIO': {
      const player = getCurrentPlayer(state);
      if (player.hasRolled) return state;
      const ticker = action.payload as StockTicker;
      return {
        ...state,
        pendingAction: { type: 'BUY_SELL', stock: ticker, price: state.stockPrices[ticker], sellOnly: true },
      };
    }

    case 'CLEAR_PENDING': {
      return { ...state, pendingAction: null };
    }

    case 'END_TURN': {
      let nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
      const player = getCurrentPlayer(state);
      const snapshotTotal = calculateTotalValue(player.cash, player.portfolio, state.stockPrices);
      let newState = updatePlayer(state, player.id, {
        hasRolled: false,
        lastTurnSnapshot: { totalValue: snapshotTotal, qbi: state.qbi },
      });

      newState = {
        ...newState,
        players: newState.players.map(p =>
          p.inMarket ? p : { ...p, inMarket: p.totalEarned >= 1000 }
        ),
        currentPlayerIndex: nextIdx,
        pendingAction: null,
        diceValue: null,
        animationState: {
          ...newState.animationState,
        },
      };

      if (
        newState.gamePhase === 'PLAYING_MARKET' &&
        checkWin(newState, newState.players[nextIdx])
      ) {
        return { ...newState, gamePhase: 'GAME_OVER', winner: nextIdx };
      }

      return newState;
    }

    case 'NEW_GAME': {
      return createInitialState();
    }

    case 'LOAD_STATE': {
      return action.payload as GameState;
    }

    default:
      return state;
  }
}
