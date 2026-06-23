import { useRef, useEffect } from 'react';
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

const SQUARE_LABELS: Record<SquareType, string> = {
  START: 'S',
  STOCK_POSITIVE: '▲',
  STOCK_NEGATIVE: '▼',
  STOCK_HOLDER_MEETING: 'M',
  FEE_100: '$',
  BROKER_FEE: 'B',
  MARKET_MANIPULATOR: '⚡',
};

export function Board() {
  const { state } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const SQUARE_STEP = 56;

  useEffect(() => {
    const player = state.players[state.currentPlayerIndex];
    if (!player || !containerRef.current) return;
    const scrollTo = 12 + player.position * SQUARE_STEP;
    containerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
  }, [state.currentPlayerIndex, state.players]);

  return (
    <div className="board-container" ref={containerRef}>
      <div className="board-strip">
        {state.board.map((square, idx) => {
          const playerOnSquare = state.players.filter(p => p.position === idx);
          const isCurrent = idx === state.players[state.currentPlayerIndex]?.position;
          return (
            <div
              key={idx}
              className={`board-square ${isCurrent ? 'current' : ''} ${square.type.toLowerCase()}`}
              style={{ borderColor: SQUARE_COLORS[square.type] }}
            >
              <div className="square-top">
                <span className="square-icon" style={{ color: SQUARE_COLORS[square.type] }}>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
