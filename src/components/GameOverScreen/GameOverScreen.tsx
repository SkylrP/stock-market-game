import { useGame } from '../../state/GameContext';
import { calculateTotalValue } from '../../game/player';
import './GameOverScreen.css';

export function GameOverScreen({ onBackToMenu }: { onBackToMenu: () => void }) {
  const { state, dispatch } = useGame();

  if (state.gamePhase !== 'GAME_OVER' || state.winner === null) return null;

  const winner = state.players[state.winner];
  const sorted = [...state.players].sort((a, b) => {
    const valA = calculateTotalValue(a.cash, a.portfolio, state.stockPrices);
    const valB = calculateTotalValue(b.cash, b.portfolio, state.stockPrices);
    return valB - valA;
  });

  return (
    <div className="gameover-overlay">
      <div className="gameover-scroll">
        <div className="gameover-content">
          <div className="gameover-winner">
            <div className="gameover-trophy">🏆</div>
            <h1 className="gameover-title">{winner.name} Wins!</h1>
            <p className="gameover-subtitle">
              Reached ${state.winAmount.toLocaleString()} in total value!
            </p>
          </div>

          <div className="gameover-players">
            {sorted.map((player, idx) => {
              const totalVal = calculateTotalValue(player.cash, player.portfolio, state.stockPrices);
              const isFirst = idx === 0;

              return (
                <div
                  key={player.id}
                  className="gameover-player-row glass"
                  style={{ borderLeftColor: winner.id === player.id ? 'var(--accent-yellow)' : player.color }}
                >
                  <span className="gameover-player-rank">{isFirst ? '👑' : `#${idx + 1}`}</span>
                  <span className="player-row-name" style={{ color: player.color }}>
                    {player.name}
                  </span>
                  <span className="player-row-total">${totalVal.toLocaleString()}</span>
                  <span className="player-row-stats">
                    <span className="player-row-stat">
                      <span className="player-row-stat-icon">📈</span>
                      <span className="player-row-stat-value">{player.totalTrades}</span>
                    </span>
                    <span className="player-row-stat">
                      <span className="player-row-stat-icon">📋</span>
                      <span className="player-row-stat-value">{player.totalMeetings}</span>
                    </span>
                    {player.biggestDividend > 0 && (
                      <span className="player-row-stat">
                        <span className="player-row-stat-icon">💰</span>
                        <span className="player-row-stat-value pos">+${player.biggestDividend.toFixed(2)}</span>
                      </span>
                    )}
                    {player.totalFeesPaid > 0 && (
                      <span className="player-row-stat">
                        <span className="player-row-stat-icon">💸</span>
                        <span className="player-row-stat-value neg">-${player.totalFeesPaid.toFixed(2)}</span>
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="gameover-actions">
            <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'NEW_GAME' })}>
              Play Again
            </button>
            <button className="btn btn-ghost btn-lg" onClick={onBackToMenu}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
