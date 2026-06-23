import { useGame } from '../../state/GameContext';
import { calculateTotalValue } from '../../game/player';
import './LeaderboardModal.css';

interface Props {
  onClose: () => void;
}

export function LeaderboardModal({ onClose }: Props) {
  const { state } = useGame();

  const players = state.players.map(p => ({
    ...p,
    total: calculateTotalValue(p.cash, p.portfolio, state.stockPrices),
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="leaderboard-panel glass" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Insider Transaction Report</h3>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th className="col-rank">#</th>
            <th className="col-player">Player</th>
            <th className="col-cash">Cash</th>
            <th className="col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id}>
              <td className="col-rank">{i + 1}</td>
              <td className="col-player">
                <div className="player-cell">
                  <div className="player-indicator" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </div>
              </td>
              <td className="col-cash">${Math.floor(p.cash).toLocaleString()}</td>
              <td className="col-total">${Math.floor(p.total).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}