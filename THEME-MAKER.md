# Theme Maker

Every visual color and corner in the game is controlled by CSS variables defined in `:root` (`src/styles/global.css`). To create a theme, copy the `:root` block, change the values, and apply it by adding a class to `<html>` (or swapping stylesheets).

## Quick-start example

```css
/* Add a theme class alongside or instead of :root */
html.theme-classic {
  --bg-primary: #f5f0e8;
  --bg-card: #e8e0d0;
  --text-primary: #2c1810;
  --accent-green: #2d7d46;
  --radius: 4px;
  --radius-sm: 2px;
  --radius-pill: 4px;
  /* ... override everything below */
}
```

---

## 1. Background colors

| Variable | Default | What it paints |
|---|---|---|
| `--bg-primary` | `#0a0a1a` | Full-screen backdrop behind everything; the bottom action bar (End Turn area); the price strip and P&L row inside the Buy/Sell modal; the share-count input and ticker-chip backgrounds in the modal; the slot-machine reel windows; the rank badge, progress bar track, and disconnected player dots |
| `--bg-secondary` | `#12122a` | *(declared but not currently used — reserved for future surfaces)* |
| `--bg-card` | `#1a1a3e` | Every board square on the strip; the Roll Dice button; secondary and ghost button backgrounds |
| `--bg-card-hover` | `#222250` | Pressed state of secondary buttons and the Roll Dice button; hover highlight on portfolio stock rows and the clickable rank badge |

## 2. Text colors

| Variable | Default | What it paints |
|---|---|---|
| `--text-primary` | `#ffffff` | All body/default text; player name, stat values (cash / portfolio / total), stock ticker labels on board squares, price values, cash amounts, QBI percentage, portfolio totals, leaderboard totals, rules bold text, lobby player names |
| `--text-secondary` | `#8a8ab5` | Neutral/less-important text: "Working…" phase notice, waiting overlay message, ghost button labels, neutral stock change, "Tap to roll" die label, price labels, meeting instructions, winner subtitle, portfolio labels, setup section headers, rules body, help text, menu subtitles, lobby labels |
| `--text-muted` | `#5a5a8a` | The smallest/supporting text: board square labels (e.g. "+15" or "Meeting"), dividend info, scrollbar thumb, P&L label, "Shares" label above trade input, inactive toggle text, "Spinning…" text, "No stocks owned" empty state, section titles, stat labels, rank numbers, progress %, game-code labels, leaderboard headers, lucky-number picker label |

## 3. Accent colors (the main palette)

Each accent is used in several ways — as a solid fill, a gradient start, a text color, a tinted background (`rgba`), and a glow shadow. The `--*-rgb` counterparts (section 10) let you tint them at different opacities.

| Variable | Default | Where the color appears |
|---|---|---|
| `--accent-cyan` | `#00d4ff` | Primary action buttons (Buy, Start Game, Roll); START square border/highlight; "Owned: N" badge in modals; stock price number; MAX button; selected ticker chip; spinner ring; highlighted player stats; "Going to Work" badge; name-input focus underline; selected lucky-number; game code digits; Host badge; help section titles; gradient ends on title screens |
| `--accent-green` | `#00e676` | Success buttons (Confirm, Buy toggle); positive stock changes and gain arrows; dividend popup text/border; active Buy toggle; shares-awarded number in slot machine; high QBI value; upward QBI arrow; positive portfolio delta; "Playing Market" badge; connected player dot in lobby; cash column in leaderboard |
| `--accent-red` | `#ff5252` | Danger buttons (Remove Player, Sell); negative stock changes and loss arrows; loss amount in turn snapshot; "Tap to confirm" warning; active Sell toggle; low QBI value; downward QBI arrow; negative portfolio delta; Remove Player (X) button; lobby error messages; STOCK_NEGATIVE square border |
| `--accent-yellow` | `#ffd740` | "You Win!" title gradient; slot machine multiplier glow; "Winner" phase badge (with pulse animation); FEE_100 square border |
| `--accent-purple` | `#bb86fc` | "Slot Machine" title text; STOCK_HOLDER_MEETING square border; gradient end on menu/setup/lobby title screens |
| `--accent-orange` | `#ff9f43` | Winner title gradient end; slot multiplier gradient end; BROKER_FEE square border |

## 4. Borders & dividers

| Variable | Default | What it paints |
|---|---|---|
| `--border` | `#2a2a5a` | Bottom action bar top edge; spinner ring; all board square borders; Roll Dice button border; secondary/ghost button borders; share-control divider; ticker-chip borders; slot reel window; P&L divider; leaderboard header underline; name-input underline; lucky-number circle border |
| `--border-subtle` | `rgba(255,255,255,0.04)` | Extremely faint row separators in the leaderboard table |

## 5. Glass panels & overlays

These give the glassmorphism card look.

| Variable | Default | What it paints |
|---|---|---|
| `--glass-bg` | `rgba(26,26,62,0.7)` | Background of all `.glass` elements — modals, menu cards, setup player cards, lobby code display, win-amount input, rules summary |
| `--glass-border` | `rgba(255,255,255,0.08)` | Border of all `.glass` elements |
| `--glass-bg-hover` | `rgba(255,255,255,0.1)` | Close (X) button pressed/focused state |
| `--glass-bg-subtle` | `rgba(255,255,255,0.05)` | Close (X) button default background |

| Variable | Default | What it paints |
|---|---|---|
| `--overlay-bg` | `rgba(0,0,0,0.75)` | Dark backdrop behind all modals (Buy/Sell, meeting, winner screen) |
| `--overlay-bg-heavy` | `rgba(0,0,0,0.8)` | Darker backdrop behind the slot machine overlay |

## 6. Corner rounding

Set all `--radius-*` to `0` for a fully squared look.

| Variable | Default | Which corners |
|---|---|---|
| `--radius-xs` | `4px` | Scrollbar thumb, QBI chart container, Host badge, win-progress bar (track and fill) |
| `--radius-sm` | `8px` | Turn snapshot bar, all board squares, all buttons (default size), price strip, dividend popup, P&L row, share input, toggle group, individual toggle button, lobby error banner |
| `--radius` | `12px` | All glass cards/panels, large buttons, waiting message, Roll Dice button, the dice cube, slot reel window, menu cards |
| `--radius-lg` | `20px` | *(reserved for larger panels)* |
| `--radius-pill` | `20px` | Fully pill-shaped elements: "Owned: N" badge, ticker chips, rank badge, phase status badges (Work / Market / Winner) |
| `--radius-top` | `16px 16px 0 0` | Top-only rounding on the leaderboard bottom-sheet panel |

## 7. Dice

The physical dice the player taps to roll.

| Variable | Default | What it paints |
|---|---|---|
| `--dice-bg-start` | `#ffffff` | Top/light end of the dice face gradient |
| `--dice-bg-end` | `#e0e0e0` | Bottom/dark end of the dice face gradient |
| `--dice-dot-bg` | `#1a1a2e` | The pips (dots) on each dice face |
| `--dice-empty-color` | `#999999` | The "?" placeholder symbol during rolling animation |

## 8. Player pieces on the board

| Variable | Default | What it paints |
|---|---|---|
| `--player-piece-border` | `rgba(255,255,255,0.6)` | The semi-transparent ring around each player's colored dot on the board |

## 9. Buttons

Three button tiers, each with a gradient (accent → darker stop), a text color, and a glow shadow.

| Variable | Default | Where it appears |
|---|---|---|
| `--btn-primary-gradient-end` | `#0099cc` | Darker stop on primary (cyan) buttons — Buy, Start Game, Roll, etc. |
| `--btn-primary-text` | `#000000` | Text label on primary buttons |
| `--btn-danger-gradient-end` | `#d32f2f` | Darker stop on danger (red) buttons — Remove Player, Sell |
| `--btn-danger-text` | `#ffffff` | Text label on danger buttons; active Sell toggle text |
| `--btn-success-gradient-end` | `#00c853` | Darker stop on success (green) buttons — Confirm, Buy toggle |
| `--btn-success-text` | `#000000` | Text label on success buttons; active Buy toggle text |

## 10. RGB channel helpers (for transparent tints)

These hold the red, green, and blue channel values (comma-separated) of each accent color. They let you write `rgba(var(--accent-cyan-rgb), 0.15)` anywhere for a tinted version of the accent.

| Variable | Default (channels) | Used for |
|---|---|---|
| `--accent-cyan-rgb` | `0, 212, 255` | Tinted cyan backgrounds: START square ghost, owned-badge chip, selected ticker chip, active lucky-number button, "Going to Work" badge, Host badge, snapshots, primary button glow |
| `--accent-green-rgb` | `0, 230, 118` | Tinted green backgrounds: dividend notification, "Playing Market" badge, connected dot glow, success button glow |
| `--accent-red-rgb` | `255, 82, 82` | Tinted red backgrounds: Remove Player button, lobby error banner, danger button glow |
| `--accent-yellow-rgb` | `255, 215, 64` | Tinted yellow backgrounds: "Winner" badge |
| `--accent-purple-rgb` | `187, 134, 252` | *(available for custom tinted uses)* |
| `--accent-orange-rgb` | `255, 159, 67` | *(available for custom tinted uses)* |

## 11. Shadows

| Variable | Default | What it paints |
|---|---|---|
| `--shadow` | `0 4px 30px rgba(0,0,0,0.4)` | *(declared, not yet used — available)* |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.3)` | The colored player-indicator dot beside the player name |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.3)` | The raised current-square effect on the board; the dice cube drop shadow |

## 12. Font families

Every text element uses one of two fonts. Changing these single-handedly transforms the game's personality.

| Variable | Default | Where it's used |
|---|---|---|
| `--font-family` | `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` | Everywhere: body text, labels, buttons, inputs, headers, menu screens, all player-facing UI text |
| `--font-mono` | `'JetBrains Mono', monospace` | Number-heavy data: stock prices, cash amounts, QBI percentage, portfolio values, stat numbers, dice-face placeholder, rank badges, game codes, leaderboard figures, P&L values, progress percent |

Tip: Pick a `--font-family` that matches your theme's era (e.g. serif for classic board game, rounded sans for playful, geometric sans for futuristic). Pick a `--font-mono` that complements it and is legible at small sizes (your theme may not even need a monospace distinction — set both to the same font if you want a uniform look).

---

## What changes per theme

A theme needs to set **every variable above** to something that works together. The RGB channel variables (`--accent-*-rgb`) must match the hex values of their corresponding `--accent-*` — if `--accent-cyan` changes to `#ff6600`, then `--accent-cyan-rgb` must be `255, 102, 0`.

The existing `:root` block is the "Dark Neon" theme. Future themes can be loaded by:

1. Adding a second stylesheet with its own `:root` or `html.theme-xxx` block
2. Toggling the theme class on `<html>` at runtime
