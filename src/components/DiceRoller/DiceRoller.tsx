import { useEffect, useState, useRef } from 'react';
import { useGame } from '../../state/GameContext';
import { DICE_DOTS, DICE_ROLL_DURATION } from '../../game/dice';
import './DiceRoller.css';

export function DiceRoller({ disabled }: { disabled?: boolean } = {}) {
  const { state, dispatch } = useGame();
  const { animationState, diceValue } = state;
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'done'>('idle');
  const randomRef = useRef<number | null>(null);
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    if (animationState.diceRolling) {
      setPhase('rolling');
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = elapsed / DICE_ROLL_DURATION;
        const interval = 50 + progress * 170;
        randomRef.current = Math.floor(Math.random() * 6) + 1;
        setTickCount(c => c + 1);
        if (elapsed < DICE_ROLL_DURATION) {
          setTimeout(tick, interval);
        } else {
          setPhase('done');
          dispatch({ type: 'FINISH_DICE_ROLL' });
        }
      };
      tick();
    }
  }, [animationState.diceRolling, dispatch]);

  useEffect(() => {
    if (!diceValue) {
      setPhase('idle');
      randomRef.current = null;
      setTickCount(0);
    }
  }, [diceValue]);

  const handleRoll = () => {
    if (phase !== 'idle') return;
    if (disabled) return;
    dispatch({ type: 'ROLL_DICE' });
  };

  const isRolling = phase === 'rolling';
  const shownValue = phase === 'done' ? diceValue : (phase === 'rolling' ? randomRef.current : null);

  return (
    <div className="dice-roller">
      <button
        className={`dice-btn ${isRolling ? 'rolling' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleRoll}
        disabled={isRolling || disabled}
      >
          <div className={`dice ${isRolling ? 'rolling' : ''} ${phase === 'done' ? 'landing' : ''}`}>
            {shownValue ? (
              <div className="dice-face">
                {DICE_DOTS[shownValue as keyof typeof DICE_DOTS]?.map((pos, i) => (
                  <div
                    key={i}
                    className="dice-dot"
                    style={{
                      gridRow: pos[0] + 1,
                      gridColumn: pos[1] + 1,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="dice-face dice-face-empty">
                <span>?</span>
              </div>
            )}
          </div>
          <span className="dice-label">
            {isRolling ? 'Rolling...' : diceValue ? `Rolled ${diceValue}` : 'Roll Dice'}
          </span>
        </button>
    </div>
  );
}
