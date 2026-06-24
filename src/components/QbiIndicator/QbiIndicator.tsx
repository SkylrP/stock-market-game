import { useEffect, useState, useRef } from 'react';
import { useGame } from '../../state/GameContext';
import './QbiIndicator.css';

const QBI_ANIMATION_DURATION = 1000;

export function QbiIndicator() {
  const { state } = useGame();
  const { animationState } = state;
  const qbi = state.qbi;
  const history = [...state.qbiHistory].reverse().concat([qbi]);
  const isHigh = qbi >= 60;
  const isLow = qbi <= 40;

  const [displayQbi, setDisplayQbi] = useState(qbi);
  const [delta, setDelta] = useState<number | null>(null);
  const prevTurnIdx = useRef(state.currentPlayerIndex);

  useEffect(() => {
    if (state.currentPlayerIndex !== prevTurnIdx.current) {
      prevTurnIdx.current = state.currentPlayerIndex;
      setDelta(null);
      setDisplayQbi(qbi);
    }
  }, [state.currentPlayerIndex, qbi]);

  useEffect(() => {
    if (!animationState.qbiChanging) return;

    const from = animationState.qbiFrom;
    const to = animationState.qbiTo;
    const diff = to - from;
    const steps = Math.abs(diff);
    const interval = QBI_ANIMATION_DURATION / Math.max(steps, 1);
    let current = from;

    setDelta(diff);
    setDisplayQbi(from);

    const ticker = setInterval(() => {
      if (diff > 0) current++;
      else current--;
      setDisplayQbi(current);
      if (current === to) {
        clearInterval(ticker);
        setDisplayQbi(to);
      }
    }, interval);

    return () => clearInterval(ticker);
  }, [animationState.qbiChanging, animationState.qbiFrom, animationState.qbiTo]);

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
        <span className={`qbi-value ${isHigh ? 'high' : isLow ? 'low' : ''}`}>
          {animationState.qbiChanging ? Math.round(displayQbi) : qbi}
          {delta !== null && (
            <span className={`qbi-delta ${delta > 0 ? 'delta-up' : 'delta-down'}`}>
              {' '}({delta > 0 ? '+' : ''}{Math.round(delta)})
            </span>
          )}
        </span>
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
