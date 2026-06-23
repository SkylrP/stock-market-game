import { useEffect } from 'react';
import { useGame } from '../../state/GameContext';
import { SlotSymbol } from '../../types';
import './SlotMachine.css';

const SYMBOL_CHARS: Record<SlotSymbol, string> = {
  SKULL: '💀',
  '2': '2',
  '3': '3',
  '7': '7',
  '10': '10',
  JACKPOT: '⭐',
};

const ITEM_HEIGHT = 80;

export function SlotMachine() {
  const { state, dispatch } = useGame();
  const { animationState } = state;

  useEffect(() => {
    if (!animationState.slotSpinning) return;
    const t1 = setTimeout(() => dispatch({ type: 'STOP_SLOT_REEL', payload: 0 }), 600);
    const t2 = setTimeout(() => dispatch({ type: 'STOP_SLOT_REEL', payload: 1 }), 1400);
    const t3 = setTimeout(() => dispatch({ type: 'STOP_SLOT_REEL', payload: 2 }), 2200);
    const t4 = setTimeout(() => dispatch({ type: 'FINISH_SLOTS' }), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [animationState.slotSpinning, dispatch]);

  if (!animationState.slotSpinning && !animationState.slotReels.length) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'DISMISS_SLOTS' });
  };

  const result = animationState.slotResult;

  return (
    <div className="slot-overlay">
      <div className="slot-machine glass" onClick={e => e.stopPropagation()}>
        <div className="slot-header">
          <h3>Stock Holder Meeting</h3>
        </div>
        <div className="slot-reels">
          {animationState.slotReels.map((reel, i) => (
            <div
              key={i}
              className={`slot-reel ${reel.spinning ? 'spinning' : ''}`}
            >
              <div
                className="slot-strip"
                style={
                  reel.spinning && reel.strip
                    ? { animation: `scrollStrip 0.4s linear infinite`, '--item-count': reel.strip.length } as React.CSSProperties
                    : undefined
                }
              >
                {reel.spinning && reel.strip ? (
                  reel.strip.map((sym, j) => (
                    <div key={j} className="slot-strip-item" style={{ height: ITEM_HEIGHT }}>
                      <span className="slot-symbol">{SYMBOL_CHARS[sym]}</span>
                    </div>
                  ))
                ) : (
                  <div className="slot-strip-item" style={{ height: ITEM_HEIGHT }}>
                    <span className="slot-symbol">{SYMBOL_CHARS[reel.symbol]}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {!animationState.slotSpinning && result && (
          <div className="slot-result" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="slot-multiplier">{result.multiplier}×</div>
            <div className="slot-description">{result.description}</div>
            <div className="slot-shares">
              New shares: <strong>{result.newShares.toLocaleString()}</strong>
            </div>
            <button className="btn btn-primary" onClick={handleDismiss}>
              Continue
            </button>
          </div>
        )}
        {animationState.slotSpinning && (
          <div className="slot-spinning-text">Spinning...</div>
        )}
      </div>
    </div>
  );
}
