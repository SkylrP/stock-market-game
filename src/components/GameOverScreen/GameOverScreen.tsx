import { useGame } from '../../state/GameContext';
import { StockTicker } from '../../types';
import { calculateTotalValue, calculatePnl, getOwnedTickers } from '../../game/player';
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
                  className="gameover-player-card glass"
                  style={{ borderLeftColor: winner.id === player.id ? 'var(--accent-yellow)' : player.color }}
                >
                  {isFirst && <div className="gameover-crown">👑</div>}
                  <h2 className="player-name" style={{ color: player.color }}>
                    {player.name}
                    {winner.id === player.id ? ' (Winner)' : ''}
                  </h2>
                  <div className="player-total-value">${totalVal.toLocaleString()}</div>

                  <div className="player-stats">
                    <div className="stat">
                      <span className="stat-label">Cash</span>
                      <span className="stat-value">${player.cash.toFixed(2)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Trades</span>
                      <span className="stat-value">{player.totalTrades}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Meetings</span>
                      <span className="stat-value">{player.totalMeetings}</span>
                    </div>
                    {player.biggestDividend > 0 && (
                      <div className="stat">
                        <span className="stat-label">Biggest Dividend</span>
                        <span className="stat-value value-up">+${player.biggestDividend.toFixed(2)}</span>
                      </div>
                    )}
                    {player.totalFeesPaid > 0 && (
                      <div className="stat">
                        <span className="stat-label">Fees Paid</span>
                        <span className="stat-value value-down">-${player.totalFeesPaid.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {getOwnedTickers(player.portfolio).length > 0 && (
                    <div className="player-portfolio">
                      <h3 className="portfolio-heading">Portfolio</h3>
                      {getOwnedTickers(player.portfolio).map(ticker => {
                        const shares = player.portfolio[ticker];
                        const price = state.stockPrices[ticker];
                        const { avgCost, pnl, pnlPercent } = calculatePnl(player.costBasis[ticker] || 0, shares, price);
                        return (
                          <div key={ticker} className="portfolio-row">
                            <span className="pf-ticker">{ticker}</span>
                            <span className="pf-shares">{shares} × ${price.toFixed(2)}</span>
                            <span className={`pf-pnl ${pnl >= 0 ? 'value-up' : 'value-down'}`}>
                              ${(shares * price).toFixed(2)}
                            </span>
                            <span className={`pf-pnl-percent ${pnl >= 0 ? 'value-up' : 'value-down'}`}>
                              {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {getOwnedTickers(player.portfolio).length === 0 && (
                    <div className="player-portfolio empty-portfolio">
                      <span>No stocks owned</span>
                    </div>
                  )}
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
