import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { DICE_DOTS, DICE_REROLL_INTERVAL } from '../../game/dice';
import { StockTicker } from '../../types';
import { calculatePnl, getOwnedTickers, getTotalShares } from '../../game/player';
import './Modals.css';

export function BuySellModal() {
  const { state, dispatch } = useGame();
  const action = state.pendingAction;
  const player = state.players[state.currentPlayerIndex];

  if (!action || action.type !== 'BUY_SELL' || !player) return null;

  const ticker = action.stock;
  const price = action.price;
  const stock = state.stocks[ticker];
  const ownedShares = player.portfolio[ticker] || 0;
  const sellOnly = action.sellOnly || false;
  const buyOnly = action.buyOnly || false;
  const [buyShares, setBuyShares] = useState(0);
  const [sellShares, setSellShares] = useState(0);

  const maxBuy = Math.floor(player.cash / price);
  const maxSell = ownedShares;

  const { avgCost, pnl, pnlPercent } = calculatePnl(player.costBasis[ticker] || 0, ownedShares, price);

  const handleBuy = () => {
    if (buyShares <= 0) return;
    dispatch({ type: 'BUY_STOCK', payload: { ticker, shares: buyShares } });
    setBuyShares(0);
  };

  const handleSell = () => {
    if (sellShares <= 0) return;
    dispatch({ type: 'SELL_STOCK', payload: { ticker, shares: sellShares } });
    setSellShares(0);
  };

  const handleSkip = () => {
    dispatch({ type: 'CLEAR_PENDING' });
  };

  const divPerShare = (stock.dividendPercent / 100) * price;

  return (
    <div className="modal-overlay" onClick={handleSkip}>
      <div className="modal glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{ticker}</h3>
          {ownedShares > 0 && <span className="owned-badge">{ownedShares} owned</span>}
        </div>
        {action.dividend ? (
          <div className="dividend-notification">
            💰 Dividend received: <strong>+${action.dividend.toFixed(2)}</strong>
          </div>
        ) : null}
        <div className="modal-cash">
          Cash: <strong>${player.cash.toFixed(2)}</strong>
          <span className="modal-qbi">QBI: {state.qbi}</span>
        </div>
        <div className="modal-price">
          <span className="price-label">Current Price</span>
          <div className="price-value">${price.toFixed(2)}</div>
        </div>
        {ownedShares > 0 && (
          <>
            <div className="dividend-info">
              <span>Dividend: ${divPerShare.toFixed(2)}/share</span>
              <span className="div-percent">({stock.dividendPercent}%)</span>
            </div>
            <div className="pnl-info">
              <span className="pnl-label">Avg Buy: ${avgCost.toFixed(2)}</span>
              <span className={`pnl-value ${pnl >= 0 ? 'value-up' : 'value-down'}`}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
              </span>
            </div>
          </>
        )}
        <div className="modal-actions">
          {!sellOnly && (
            <div className="trade-section">
              <span className="trade-label">Buy</span>
              <div className="trade-controls">
                <button className="btn btn-sm btn-ghost" onClick={() => setBuyShares(Math.max(0, buyShares - 1))}>-</button>
                <input
                  type="number"
                  className="trade-input"
                  value={buyShares}
                  onChange={e => setBuyShares(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={maxBuy}
                />
                <button className="btn btn-sm btn-ghost" onClick={() => setBuyShares(Math.min(maxBuy, buyShares + 1))}>+</button>
                <button className="btn btn-sm btn-ghost max-btn" onClick={() => setBuyShares(maxBuy)}>MAX</button>
              </div>
              <div className="trade-total">
                Cost: <strong>${(buyShares * price).toFixed(2)}</strong>
              </div>
              <button
                className="btn btn-success btn-sm btn-block"
                onClick={handleBuy}
                disabled={buyShares <= 0}
              >
                Buy {buyShares} Shares
              </button>
            </div>
          )}

          {!buyOnly && ownedShares > 0 && (
            <div className="trade-section">
              <span className="trade-label">Sell</span>
              <div className="trade-controls">
                <button className="btn btn-sm btn-ghost" onClick={() => setSellShares(Math.max(0, sellShares - 1))}>-</button>
                <input
                  type="number"
                  className="trade-input"
                  value={sellShares}
                  onChange={e => setSellShares(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={maxSell}
                />
                <button className="btn btn-sm btn-ghost" onClick={() => setSellShares(Math.min(maxSell, sellShares + 1))}>+</button>
                <button className="btn btn-sm btn-ghost max-btn" onClick={() => setSellShares(maxSell)}>ALL</button>
              </div>
              <div className="trade-total">
                Revenue: <strong>${(sellShares * price).toFixed(2)}</strong>
              </div>
              <button
                className="btn btn-danger btn-sm btn-block"
                onClick={handleSell}
                disabled={sellShares <= 0}
              >
                Sell {sellShares} Shares
              </button>
            </div>
          )}
        </div>
        <button className="btn btn-ghost btn-block skip-btn" onClick={handleSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}

export function StockMeetingModal() {
  const { state, dispatch } = useGame();
  const action = state.pendingAction;
  const player = state.players[state.currentPlayerIndex];

  if (!action || action.type !== 'STOCK_HOLDER_MEETING' || !player) return null;

  const ticker = action.stock;
  const price = state.stockPrices[ticker];
  const ownedShares = player.portfolio[ticker] || 0;
  const canBuy = player.cash >= price && ownedShares === 0;

  const handleStartMeeting = () => {
    dispatch({ type: 'START_STOCK_MEETING' });
  };

  const handleBuyAndStart = () => {
    dispatch({ type: 'BUY_ONE_SHARE_MEETING' });
  };

  return (
    <div className="modal-overlay">
      <div className="modal glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 {ticker} Meeting</h3>
        </div>
        {ownedShares === 0 && canBuy && (
          <div className="meeting-option">
            <p className="meeting-text">You don't own any {ticker}. Buy 1 share (${price.toFixed(2)}) before the meeting?</p>
            <button className="btn btn-primary btn-block" onClick={handleBuyAndStart}>
              Buy 1 Share &amp; Start Meeting
            </button>
          </div>
        )}
        {ownedShares === 0 && !canBuy && (
          <div className="meeting-option">
            <p className="meeting-text">You don't own any {ticker} and can't afford to buy. Meeting skipped.</p>
            <button className="btn btn-ghost btn-block" onClick={() => dispatch({ type: 'CLEAR_PENDING' })}>
              Continue
            </button>
          </div>
        )}
        {ownedShares > 0 && (
          <div className="meeting-option">
            <p className="meeting-text">
              You hold <strong>{ownedShares.toLocaleString()}</strong> shares of {ticker}.
              Time to spin the slot machine!
            </p>
            <button className="btn btn-primary btn-block" onClick={handleStartMeeting}>
              Spin the Slot Machine
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FeeModal() {
  const { state, dispatch } = useGame();
  const action = state.pendingAction;
  const player = state.players[state.currentPlayerIndex];

  if (!action || !player) return null;

  if (action.type === 'PAY_FEE') {
    return (
      <div className="modal-overlay">
        <div className="modal glass">
          <div className="modal-header">
            <h3>💰 Pay Fee</h3>
          </div>
          <p className="meeting-text">You owe <strong>${action.amount}</strong> in fees.</p>
          <div className="modal-actions">
            <button
              className="btn btn-primary btn-block"
              onClick={() => dispatch({ type: 'PAY_FEE' })}
            >
              Pay ${action.amount}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (action.type === 'BROKER_FEE') {
    return (
      <div className="modal-overlay">
        <div className="modal glass">
          <div className="modal-header">
            <h3>📊 Broker Fee</h3>
          </div>
          <p className="meeting-text">Broker fee: $5 per share owned.</p>
          <p className="meeting-text" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-red)' }}>
            Total fee: ${(getTotalShares(player.portfolio) * 5).toFixed(2)}
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-primary btn-block"
              onClick={() => dispatch({ type: 'BROKER_FEE' })}
            >
              Pay Broker Fee
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (action.type === 'SELL_FOR_FEE') {
    return (
      <div className="modal-overlay">
        <div className="modal glass">
          <div className="modal-header">
            <h3>⚠️ Insufficient Funds</h3>
          </div>
          <p className="meeting-text">
            You don't have enough cash to pay. Shares will be sold at lowest market value.
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-danger btn-block"
              onClick={() => dispatch({ type: 'FORCE_SELL_FOR_FEE' })}
            >
              Sell Shares to Cover
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function MarketManipulatorModal() {
  const { state, dispatch } = useGame();
  const action = state.pendingAction;
  const player = state.players[state.currentPlayerIndex];

  const [step, setStep] = useState<'roll' | 'choose' | 'trade'>('roll');
  const [dice1, setDice1] = useState<number | null>(null);
  const [dice2, setDice2] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollTotal, setRollTotal] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState<StockTicker | null>(null);
  const [tradeShares, setTradeShares] = useState(0);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  if (!action || action.type !== 'MARKET_MANIPULATOR' || !player) return null;

  const ownedTickers = getOwnedTickers(player.portfolio);

  const handleRoll = () => {
    setRolling(true);
    const interval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
    }, DICE_REROLL_INTERVAL);
    setTimeout(() => {
      clearInterval(interval);
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice1(d1);
      setDice2(d2);
      const total = d1 * d2;
      setRollTotal(total);
      setRolling(false);
      setStep('choose');
      dispatch({ type: 'START_MARKET_MANIPULATOR', payload: total });
    }, 800);
  };

  const handleChooseDirection = (direction: 'up' | 'down') => {
    dispatch({ type: 'APPLY_MARKET_MANIPULATOR', payload: { direction } });
    setStep('trade');
  };

  const handleTrade = () => {
    if (!selectedTicker || tradeShares <= 0) return;
    dispatch({
      type: 'MARKET_MANIPULATOR_TRADE',
      payload: { ticker: selectedTicker, shares: tradeShares, action: tradeType },
    });
  };

  const handleSkip = () => {
    dispatch({ type: 'CLEAR_PENDING' });
  };

  if (step === 'roll') {
    return (
      <div className="modal-overlay">
        <div className="modal glass">
          <div className="modal-header">
            <h3>⚡ Market Manipulator</h3>
          </div>
          {rolling ? (
            <>
              <p className="meeting-text">Rolling...</p>
              <div className="dice-pair">
                <div className="dice dice-face">
                  {dice1 ? DICE_DOTS[dice1]?.map((pos, i) => (
                    <div key={i} className="dice-dot" style={{ gridRow: pos[0] + 1, gridColumn: pos[1] + 1 }} />
                  )) : <span>?</span>}
                </div>
                <div className="dice dice-face">
                  {dice2 ? DICE_DOTS[dice2]?.map((pos, i) => (
                    <div key={i} className="dice-dot" style={{ gridRow: pos[0] + 1, gridColumn: pos[1] + 1 }} />
                  )) : <span>?</span>}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="meeting-text">Roll two dice to determine your influence over the QBI!</p>
              <p className="meeting-text" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Current QBI: <strong>{state.qbi}</strong>
              </p>
              <button className="btn btn-primary btn-block" onClick={handleRoll}>
                Roll Dice
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (step === 'choose') {
    return (
      <div className="modal-overlay">
        <div className="modal glass">
          <div className="modal-header">
            <h3>⚡ Market Manipulator</h3>
          </div>
          <div className="dice-pair">
            <div className="dice dice-face">
              {dice1 ? DICE_DOTS[dice1]?.map((pos, i) => (
                <div key={i} className="dice-dot" style={{ gridRow: pos[0] + 1, gridColumn: pos[1] + 1 }} />
              )) : null}
            </div>
            <div className="dice dice-face">
              {dice2 ? DICE_DOTS[dice2]?.map((pos, i) => (
                <div key={i} className="dice-dot" style={{ gridRow: pos[0] + 1, gridColumn: pos[1] + 1 }} />
              )) : null}
            </div>
          </div>
          <p className="meeting-text">
            Rolled <strong>{rollTotal}</strong> ({dice1} × {dice2}). Current QBI: <strong>{state.qbi}</strong>
          </p>
          <div className="modal-actions-row">
            <button className="btn btn-primary" onClick={() => handleChooseDirection('up')}>
              Increase QBI +{rollTotal}
            </button>
            <button className="btn btn-danger" onClick={() => handleChooseDirection('down')}>
              Decrease QBI -{rollTotal}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal glass">
        <div className="modal-header">
          <h3>⚡ Manipulator Trade</h3>
        </div>
        <p className="meeting-text">Select a stock to buy or sell at current prices.</p>

        <div className="ticker-select">
          {ownedTickers.length > 0 ? ownedTickers.map(t => (
            <button
              key={t}
              className={`ticker-chip ${selectedTicker === t ? 'selected' : ''}`}
              onClick={() => {
                setSelectedTicker(t);
                setTradeShares(0);
              }}
            >
              {t} ({player.portfolio[t]} shares) ${state.stockPrices[t].toFixed(0)}
            </button>
          )) : (
            <p className="meeting-text" style={{ fontSize: 12 }}>No stocks owned. You can buy a stock by selecting it below.</p>
          )}
        </div>

        <div className="ticker-select" style={{ marginTop: 4 }}>
          {(Object.keys(state.stockPrices) as StockTicker[]).filter(t => !ownedTickers.includes(t)).map(t => (
            <button
              key={t}
              className={`ticker-chip ${selectedTicker === t ? 'selected' : ''}`}
              onClick={() => {
                setSelectedTicker(t);
                setTradeType('BUY');
                setTradeShares(0);
              }}
            >
              {t} ${state.stockPrices[t].toFixed(0)}
            </button>
          ))}
        </div>

        {selectedTicker && (
          <div className="trade-section">
            <div className="trade-type-toggle">
              <button
                className={`toggle-btn ${tradeType === 'BUY' ? 'active-buy' : ''}`}
                onClick={() => setTradeType('BUY')}
              >
                Buy
              </button>
              <button
                className={`toggle-btn ${tradeType === 'SELL' ? 'active-sell' : ''}`}
                onClick={() => setTradeType('SELL')}
                disabled={!ownedTickers.includes(selectedTicker)}
              >
                Sell
              </button>
            </div>
            <div className="trade-controls">
              <button className="btn btn-sm btn-ghost" onClick={() => setTradeShares(Math.max(0, tradeShares - 1))}>-</button>
              <input
                type="number"
                className="trade-input"
                value={tradeShares}
                onChange={e => setTradeShares(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
              />
              <button className="btn btn-sm btn-ghost" onClick={() => setTradeShares(tradeShares + 1)}>+</button>
            </div>
            <div className="trade-total">
              {tradeType === 'BUY'
                ? `Cost: $${(tradeShares * state.stockPrices[selectedTicker]).toFixed(2)}`
                : `Revenue: $${(tradeShares * state.stockPrices[selectedTicker]).toFixed(2)}`}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn btn-primary btn-block"
            onClick={handleTrade}
            disabled={!selectedTicker || tradeShares <= 0}
          >
            {tradeType === 'BUY' ? 'Buy' : 'Sell'} {tradeShares} {selectedTicker}
          </button>
          <button className="btn btn-ghost btn-block skip-btn" onClick={handleSkip}>
            Skip Trade
          </button>
        </div>
      </div>
    </div>
  );
}

export function SellBeforeRollModal() {
  const { state, dispatch } = useGame();
  const player = state.players[state.currentPlayerIndex];

  if (!player) return null;

  const handleClose = () => {
    dispatch({ type: 'CLEAR_PENDING' });
  };

  const ownedTickers = getOwnedTickers(player.portfolio);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal modal-warning glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚠️ Sell Before Rolling</h3>
          <button className="btn-close" onClick={handleClose}>✕</button>
        </div>
        <p className="warning-text">
          You can sell stocks by tapping them in your portfolio below.
          Selling is only available <strong>before</strong> you roll the dice.
        </p>
        <div className="warning-tickers">
          {ownedTickers.map(t => (
            <span key={t} className="warning-chip">{t} ({player.portfolio[t]} shares)</span>
          ))}
        </div>
        <button className="btn btn-ghost btn-block skip-btn" onClick={handleClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

export function WinnerModal() {
  const { state, dispatch } = useGame();

  if (state.gamePhase !== 'GAME_OVER' || state.winner === null) return null;

  const winner = state.players[state.winner];

  return (
    <div className="modal-overlay">
      <div className="modal glass winner-modal">
        <div className="winner-icon">🏆</div>
        <h2 className="winner-title">{winner.name} Wins!</h2>
        <p className="winner-text">
          {winner.name} has reached ${state.winAmount.toLocaleString()} in total value!
        </p>
        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={() => dispatch({ type: 'NEW_GAME' })}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
