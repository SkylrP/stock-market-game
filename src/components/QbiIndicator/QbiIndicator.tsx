import { useGame } from '../../state/GameContext';
import './QbiIndicator.css';

export function QbiIndicator() {
  const { state } = useGame();
  const qbi = state.qbi;
  const history = [...state.qbiHistory].reverse().concat([qbi]);
  const isHigh = qbi >= 60;
  const isLow = qbi <= 40;

  const W = 180;
  const H = 48;
  const pts = history.map((v, i) => {
    const x = i === 0 ? 0 : (i / (history.length - 1)) * W;
    const y = H - (v / 100) * H;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');

  return (
    <div className="qbi-container glass">
      <div className="qbi-header">
        <span className="qbi-label">QBI</span>
        <span className={`qbi-value ${isHigh ? 'high' : isLow ? 'low' : ''}`}>{qbi}</span>
      </div>
      <svg className="qbi-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H}>
        <defs>
          <linearGradient id="qbi-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="url(#qbi-grad)" stroke="none" points={polyline + ` ${W},${H} 0,${H}`} />
        <polyline fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={polyline} />
      </svg>
    </div>
  );
}