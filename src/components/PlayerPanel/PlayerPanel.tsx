import { useGame } from '../../state/GameContext';
import { calculateTotalValue } from '../../game/player';
import './PlayerPanel.css';

interface Props {
  onOpenLeaderboard: () => void;
}

export function PlayerPanel({ onOpenLeaderboard }: Props) {
  const { state } = useGame();
  const player = state.players[state.currentPlayerIndex];

  if (!player) return null;

  const totalValue = calculateTotalValue(player.cash, player.portfolio, state.stockPrices);
  const isWinner = state.winner === player.id;

  const rankings = state.players
    .map(p => ({ id: p.id, total: calculateTotalValue(p.cash, p.portfolio, state.stockPrices) }))
    .sort((a, b) => b.total - a.total);
  const rank = rankings.findIndex(r => r.id === player.id) + 1;
  const playerCount = state.players.length;

  return (
    <div className="player-panel glass">
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
          <span className="stat-value">${Math.floor(player.cash).toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Portfolio</span>
          <span className="stat-value">
            ${Math.floor(totalValue - player.cash).toLocaleString()}
          </span>
        </div>
        <div className="stat total">
          <span className="stat-label">Total</span>
          <span className="stat-value highlight">
            ${Math.floor(totalValue).toLocaleString()}
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
