import { useRef, useEffect, useState } from 'react';
import { useGame } from '../../state/GameContext';
import { SquareType } from '../../types';
import './Board.css';

const SQUARE_COLORS: Record<SquareType, string> = {
  START: 'var(--accent-cyan)',
  STOCK_POSITIVE: 'var(--accent-green)',
  STOCK_NEGATIVE: 'var(--accent-red)',
  STOCK_HOLDER_MEETING: 'var(--accent-purple)',
  FEE_100: 'var(--accent-yellow)',
  BROKER_FEE: 'var(--accent-orange)',
  MARKET_MANIPULATOR: 'var(--accent-cyan)',
};

function stockColor(qbiChange?: number): string {
  if (!qbiChange) return SQUARE_COLORS.STOCK_POSITIVE;
  return qbiChange > 0 ? 'var(--accent-green)' : 'var(--accent-red)';
}

const SQUARE_LABELS: Record<SquareType, string> = {
  START: 'S',
  STOCK_POSITIVE: '▲',
  STOCK_NEGATIVE: '▼',
  STOCK_HOLDER_MEETING: 'M',
  FEE_100: '$',
  BROKER_FEE: 'B',
  MARKET_MANIPULATOR: '⚡',
};

const HOP_DURATION = 1000;

export function Board() {
  const { state, dispatch } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const SQUARE_STEP = 56;
  const [hopIdx, setHopIdx] = useState<number | null>(null);
  const [bounceKey, setBounceKey] = useState(0);
  const { animationState } = state;

  useEffect(() => {
    if (!animationState.pieceMoving) {
      setHopIdx(null);
      return;
    }
    const totalHops = animationState.pieceTo - animationState.pieceFrom;
    const hopInterval = HOP_DURATION / totalHops;
    let step = 0;

    setHopIdx(animationState.pieceFrom);
    setBounceKey(k => k + 1);

    const advance = () => {
      step++;
      setHopIdx(animationState.pieceFrom + step);
      setBounceKey(k => k + 1);
      if (step < totalHops) {
        setTimeout(advance, hopInterval);
      } else {
        setTimeout(() => dispatch({ type: 'FINISH_LANDING_ANIMATION' }), hopInterval * 0.3);
      }
    };

    const timer = setTimeout(advance, hopInterval);
    return () => clearTimeout(timer);
  }, [animationState.pieceMoving, animationState.pieceFrom, animationState.pieceTo, dispatch]);

  useEffect(() => {
    if (animationState.pieceMoving) return;
    const player = state.players[state.currentPlayerIndex];
    if (!player || !containerRef.current) return;
    const scrollTo = 12 + player.position * SQUARE_STEP;
    containerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
  }, [animationState.pieceMoving, state.currentPlayerIndex, state.players]);

  const currentPlayerId = state.players[state.currentPlayerIndex]?.id;
  const currentPlayerColor = state.players[state.currentPlayerIndex]?.color;

  return (
    <div className="board-container" ref={containerRef}>
      <div className="board-strip">
        {state.board.map((square, idx) => {
          const isAnimatingHere = animationState.pieceMoving && hopIdx === idx;
          const playerOnSquare = state.players.filter(p =>
            p.position === idx && !(animationState.pieceMoving && p.id === currentPlayerId)
          );
          const isCurrent = idx === state.players[state.currentPlayerIndex]?.position && !animationState.pieceMoving;
          return (
            <div
              key={idx}
              className={`board-square ${isCurrent ? 'current' : ''} ${square.type.toLowerCase()}`}
              style={{
                borderColor: square.type === 'STOCK_POSITIVE' || square.type === 'STOCK_NEGATIVE'
                  ? stockColor(square.qbiChange) : SQUARE_COLORS[square.type],
              }}
            >
              <div className="square-top">
                <span className="square-icon" style={{
                  color: square.type === 'STOCK_POSITIVE' || square.type === 'STOCK_NEGATIVE'
                    ? stockColor(square.qbiChange) : SQUARE_COLORS[square.type],
                }}>
                  {SQUARE_LABELS[square.type]}
                </span>
                {square.type === 'STOCK_POSITIVE' || square.type === 'STOCK_NEGATIVE' || square.type === 'STOCK_HOLDER_MEETING' ? (
                  <span className="square-ticker">{square.stock}</span>
                ) : null}
              </div>
              <div className="square-label">{square.label}</div>
              {playerOnSquare.length > 0 && (
                <div className="square-players">
                  {playerOnSquare.map(p => (
                    <div
                      key={p.id}
                      className="player-piece"
                      style={{ backgroundColor: p.color }}
                    />
                  ))}
                </div>
              )}
              {isAnimatingHere && (
                <div className="square-players">
                  <div key={bounceKey} className="player-piece bouncing" style={{ backgroundColor: currentPlayerColor }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
