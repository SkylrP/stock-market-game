# Stock Market Game

## Commands

```sh
npm run dev       # start Vite dev server
npm run build     # tsc && vite build (no separate typecheck or lint)
npm run preview   # vite preview
npm run deploy    # build + npx wrangler pages deploy dist
```

**Note:** On this machine `node`/`npm` are not in PATH. Prefix with:
```pwsh
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
```

## Architecture

- **Vite + React 18 + TypeScript** PWA (vite-plugin-pwa), no backend, no router
- **State:** single `useReducer` in `GameContext` → `gameReducer` (`src/state/gameReducer.ts`), persisted to `localStorage` key `stock-market-game-state`
- **State migration:** `migrateState()` runs only on initial load from localStorage (not per-dispatch) — auto-fills missing fields (e.g. `costBasis`)
- **Modals:** driven by `pendingAction` type — rendered in `App.tsx` with `&&` guards: e.g. `{state.pendingAction?.type === 'BUY_SELL' && <BuySellModal />}`
- **Animated overlays:** `<SlotMachine />` (z-index 100, rendered last) and modals (z-index 50) are both fixed overlays
- **Path alias:** `@/` → `src/`
- **Components:** `src/components/<Name>/<Name>.tsx` + `<Name>.css`

## Game flow

1. **SETUP** screen → `START_GAME` → players enter **GOING_TO_WORK** phase
2. Roll dice → lucky-number salary ($400) → earn $1k total → enter **PLAYING_MARKET** ($200 salary)
3. Landing on a square resolves QBI, dividend, and sets `pendingAction` (modal)
4. `END_TURN` advances player index, resets `hasRolled`, sets `canSellBeforeRoll: true`
5. Win at $100k total value (cash + stock prices × shares)

## Key state fields

| Field | Purpose |
|---|---|
| `gamePhase` | `SETUP` / `GOING_TO_WORK` / `PLAYING_MARKET` / `GAME_OVER` |
| `pendingAction` | Which modal to show (null = none) |
| `diceValue` | Single source of truth for dice roll (removed from animationState) |
| `animationState.diceRolling` | True during 600ms roll animation |
| `animationState.slotSpinning` | True during slot machine spin |
| `player.hasRolled` | Guard — prevents double roll, enables End Turn |
| `player.costBasis` | Total cost paid per stock (for P&L / avg buy price) |

## Modal/trade rules

- **Stock squares:** open `BUY_SELL` modal with `buyOnly: true` (sell hidden). Dividend shown when applicable.
- **Portfolio click:** opens `BUY_SELL` with `sellOnly: true` (buy hidden). Guarded by `!player.hasRolled`.
- **Meeting:** "Buy 1 Share" button → `BUY_ONE_SHARE_MEETING`. Then "Spin" → slot machine. After spin, End Turn directly (no BUY_SELL modal).
- **Sell-before-roll button:** red, opens warning-only modal. Actual selling via portfolio click.
- **Market Manipulator:** own flow, allows both buy/sell after QBI direction choice.
- **Buying only allowed** on stock squares and before meetings.

## CanEndTurn condition

```ts
player.hasRolled && !diceRolling && !slotSpinning && !pendingAction
```

## Persistence

- Saves to `localStorage` on every state change when `gamePhase !== 'SETUP'`
- `clearGame()` available for debugging
- Migrations run automatically for old saved state

## Directory layout

```
src/
  types/index.ts          — all types, stock data, constants
  state/
    gameReducer.ts         — all game actions (formerly 700+, now ~640)
    GameContext.tsx         — context provider + persistence hook
    persistence.ts         — localStorage save/load/clear
  game/
    board.ts               — 36-square board creation
    stocks.ts              — QBI-based pricing, dividends
    qbi.ts                 — bounce physics (0–100)
    slotMachine.ts         — weighted 3-reel slot resolution
    dice.ts                — rollDice, DICE_DOTS, DICE_REROLL_INTERVAL, DICE_ROLL_DURATION
    player.ts              — salary, total value, getOwnedTickers, calculatePnl
  App.tsx                  — GameScreen + SETUP switch
  components/
    SetupScreen/
    Board/
    DiceRoller/            — reads state.diceValue (single source of truth)
    SlotMachine/           — vertical scroll strip animation
    PlayerPanel/
    StockPortfolio/        — clickable to sell (canTrade guard)
    Modals/Modals.tsx      — all modals in one file
    QbiIndicator/
```

## Slot machine

- 3 reels, weighted symbols (SKULL:30, 2/3/7/10:20 each, JACKPOT:5)
- Resolution priority: triple skull (1×) < triple number (10×N) < triple jackpot (300×) < jackpot present (8×) < highest number (N×)
- Vertical scroll strip animation (16 symbols per reel, CSS `@keyframes scrollStrip`)
- `START_STOCK_MEETING` → `FINISH_SLOTS` (stop reels) → `DISMISS_SLOTS` (clear, show result then End Turn)

## Selling mechanics

- `SELL_STOCK`: uses average cost basis (`costBasis[ticker] / owned`) to reduce cost basis proportionally
- `SELL_AT_LOWEST`: forced sale at `startingPrice * 0.5`, also adjusts cost basis (via shared `sellShares` helper)
- Broker fee: $5/share owned, force-sells at lowest price if cash insufficient
- Actions `SKIP_BUY` and `CLOSE_SELL_MODAL` were merged into `CLEAR_PENDING`

## Game reducer helpers

- `buyShares(state, player, ticker, shares, priceOverride?)` — shared buy logic with cost basis
- `sellShares(state, player, ticker, shares, priceOverride?)` — shared sell logic with proportional cost basis
- `withWinCheck(state)` — wraps a return to check win condition (replaces 6 inline checkWin calls)
- `getCurrentPlayer(state)` / `updatePlayer(state, id, updates)` — standard helpers

## Shared constants (game/dice.ts)

- `DICE_DOTS` — dot positions for dice face rendering (used by both DiceRoller and MarketManipulatorModal)
- `DICE_REROLL_INTERVAL` = 80ms — interval between random number updates during rolling
- `DICE_ROLL_DURATION` = 600ms — total animation duration before FINISH_DICE_ROLL
