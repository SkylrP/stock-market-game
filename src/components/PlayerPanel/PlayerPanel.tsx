import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/GameContext';
import { calculateTotalValue } from '../../game/player';
import './PlayerPanel.css';

const ANIMATION_DURATION = 1000;

interface Props {
  onOpenLeaderboard: () => void;
  myPlayerIndex?: number;
}

export function PlayerPanel({ onOpenLeaderboard, myPlayerIndex }: Props) {
  const { state } = useGame();
  const playerIdx = myPlayerIndex ?? state.currentPlayerIndex;
  const incomingPlayer = state.players[playerIdx];

  const prevPlayerForFlip = useRef(incomingPlayer?.id ?? 0);
  const prevPlayerForValues = useRef(0);
  const [displayedPlayerId, setDisplayedPlayerId] = useState(incomingPlayer?.id ?? 0);
  const [flipClass, setFlipClass] = useState('');

  useEffect(() => {
    if (!incomingPlayer) return;
    if (incomingPlayer.id !== prevPlayerForFlip.current) {
      prevPlayerForFlip.current = incomingPlayer.id;
      setFlipClass('panel-exit');
      const t1 = setTimeout(() => {
        setDisplayedPlayerId(incomingPlayer.id);
        setFlipClass('panel-enter');
        setTimeout(() => setFlipClass(''), 300);
      }, 250);
      return () => clearTimeout(t1);
    }
  }, [incomingPlayer?.id]);

  const player = state.players.find(p => p.id === displayedPlayerId) || incomingPlayer;

  const totalValue = calculateTotalValue(player.cash, player.portfolio, state.stockPrices);
  const portfolioVal = totalValue - player.cash;

  const prevValues = useRef({ cash: player.cash, portfolio: portfolioVal, total: totalValue });
  const [displayValues, setDisplayValues] = useState({
    cash: player.cash,
    portfolio: portfolioVal,
    total: totalValue,
  });
  const [deltas, setDeltas] = useState<{ cash: number; portfolio: number; total: number } | null>(null);

  useEffect(() => {
    if (!player) return;

    if (player.id !== prevPlayerForValues.current) {
      prevPlayerForValues.current = player.id;
      prevValues.current = { cash: player.cash, portfolio: portfolioVal, total: totalValue };
      setDisplayValues({ cash: player.cash, portfolio: portfolioVal, total: totalValue });
      setDeltas(null);
      return;
    }

    const prev = prevValues.current;
    const curr = { cash: player.cash, portfolio: portfolioVal, total: totalValue };
    if (prev.cash === curr.cash && prev.portfolio === curr.portfolio && prev.total === curr.total) {
      return;
    }
    prevValues.current = curr;

    setDeltas({
      cash: curr.cash - prev.cash,
      portfolio: curr.portfolio - prev.portfolio,
      total: curr.total - prev.total,
    });

    const steps = 20;
    let step = 0;

    const ticker = setInterval(() => {
      step++;
      const t = step / steps;
      setDisplayValues({
        cash: prev.cash + (curr.cash - prev.cash) * t,
        portfolio: prev.portfolio + (curr.portfolio - prev.portfolio) * t,
        total: prev.total + (curr.total - prev.total) * t,
      });
      if (step >= steps) {
        clearInterval(ticker);
        setDisplayValues(curr);
      }
    }, ANIMATION_DURATION / steps);

    return () => clearInterval(ticker);
  }, [player?.cash, portfolioVal, totalValue, player?.id]);

  if (!player) return null;

  const isWinner = state.winner === player.id;

  const rankings = state.players
    .map(p => ({ id: p.id, total: calculateTotalValue(p.cash, p.portfolio, state.stockPrices) }))
    .sort((a, b) => b.total - a.total);
  const rank = rankings.findIndex(r => r.id === player.id) + 1;
  const playerCount = state.players.length;

  const deltasActive = deltas !== null;
  const isAnimating = deltasActive && displayValues.cash !== player.cash;
  const fmt = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={`player-panel glass ${flipClass}`}>
      <div className="player-info">
        <div className="player-identity">
          <div className="player-indicator" style={{ backgroundColor: player.color }} />
          <span className="player-name">{player.name}</span>
          <span className="player-rank clickable" onClick={onOpenLeaderboard} title="View Insider Transaction Report">#{rank} of {playerCount}</span>
        </div>
        <div className="player-status">
          {!player.inMarket && (
            <span className="status-badge work">Going to Work</span>
          )}
          {player.inMarket && (
            <span className="status-badge market">Playing Market</span>
          )}
          {isWinner && (
            <span className="status-badge winner">WINNER!</span>
          )}
        </div>
      </div>
      <div className="player-stats">
        <div className="stat">
          <span className="stat-label">Cash</span>
          <span className="stat-value">
            ${fmt(isAnimating ? displayValues.cash : player.cash)}
            {deltasActive && deltas.cash !== 0 && (
              <span className={`stat-delta ${deltas.cash > 0 ? 'delta-up' : 'delta-down'}`}>
                {' '}({deltas.cash > 0 ? '+' : ''}{fmt(deltas.cash)})
              </span>
            )}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Portfolio</span>
          <span className="stat-value">
            ${fmt(isAnimating ? displayValues.portfolio : portfolioVal)}
            {deltasActive && deltas.portfolio !== 0 && (
              <span className={`stat-delta ${deltas.portfolio > 0 ? 'delta-up' : 'delta-down'}`}>
                {' '}({deltas.portfolio > 0 ? '+' : ''}{fmt(deltas.portfolio)})
              </span>
            )}
          </span>
        </div>
        <div className="stat total">
          <span className="stat-label">Total</span>
          <span className="stat-value highlight">
            ${fmt(isAnimating ? displayValues.total : totalValue)}
            {deltasActive && deltas.total !== 0 && (
              <span className={`stat-delta ${deltas.total > 0 ? 'delta-up' : 'delta-down'}`}>
                {' '}({deltas.total > 0 ? '+' : ''}{fmt(deltas.total)})
              </span>
            )}
          </span>
        </div>
      </div>
      {player.inMarket && (
        <div className="win-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, (totalValue / state.winAmount) * 100)}%`,
                backgroundColor: player.color,
              }}
            />
          </div>
          <span className="progress-label">${Math.floor(totalValue).toLocaleString()} / ${state.winAmount.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
