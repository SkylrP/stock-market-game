import { useGame } from '../../state/GameContext';
import { StockTicker } from '../../types';
import { calculatePnl, getOwnedTickers } from '../../game/player';
import './StockPortfolio.css';

export function StockPortfolio({ canInteract, myPlayerIndex }: { canInteract?: boolean; myPlayerIndex?: number } = {}) {
  const { state, dispatch } = useGame();
  const playerIdx = myPlayerIndex ?? state.currentPlayerIndex;
  const player = state.players[playerIdx];

  if (!player) return null;

  const canTrade = canInteract && state.gamePhase === 'PLAYING_MARKET' && !player.hasRolled;

  const ownedStocks = getOwnedTickers(player.portfolio);

  if (ownedStocks.length === 0) {
    return (
      <div className="portfolio-empty">
        <span className="empty-icon">📄</span>
        <span className="empty-text">No stocks owned</span>
      </div>
    );
  }

  return (
    <div className="stock-portfolio">
      <h3 className="portfolio-title">Portfolio</h3>
      <div className="portfolio-list">
        {ownedStocks.map(ticker => {
          const stock = state.stocks[ticker];
          const price = state.stockPrices[ticker];
          const shares = player.portfolio[ticker];
          const value = Math.round(shares * price * 100) / 100;
          const priceChange = price - stock.startingPrice;
          const changePercent = ((priceChange / stock.startingPrice) * 100);
          const { avgCost, pnl, pnlPercent } = calculatePnl(player.costBasis[ticker] || 0, shares, price);

          return (
            <div
              key={ticker}
              className={`portfolio-item glass ${canTrade ? 'clickable' : ''}`}
              onClick={() => canTrade && dispatch({ type: 'OPEN_SELL_PORTFOLIO', payload: ticker })}
            >
              <div className="stock-info">
                <span className="stock-ticker">{ticker}</span>
                <span className="stock-shares">{shares.toLocaleString()} shares</span>
              </div>
              <div className="stock-value-info">
                <span className="stock-price">${price.toFixed(2)}</span>
                <span className={`stock-change ${changePercent >= 0 ? 'value-up' : 'value-down'}`}>
                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                </span>
                <span className="stock-total">${value.toLocaleString()}</span>
              </div>
              {shares > 0 && (
                <div className="stock-pnl">
                  <span className="pnl-label">Avg ${avgCost.toFixed(2)}</span>
                  <span className={`pnl-value ${pnl >= 0 ? 'value-up' : 'value-down'}`}>
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
