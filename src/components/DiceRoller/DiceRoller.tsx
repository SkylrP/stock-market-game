import { useEffect, useState } from 'react';
import { useGame } from '../../state/GameContext';
import { DICE_DOTS, DICE_REROLL_INTERVAL, DICE_ROLL_DURATION } from '../../game/dice';
import './DiceRoller.css';

export function DiceRoller({ disabled }: { disabled?: boolean } = {}) {
  const { state, dispatch } = useGame();
  const { animationState, diceValue } = state;
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'done'>('idle');
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [randomValue, setRandomValue] = useState<number | null>(null);

  useEffect(() => {
    if (animationState.diceRolling) {
      setPhase('rolling');
      setDisplayValue(null);
      const interval = setInterval(() => {
        setRandomValue(Math.floor(Math.random() * 6) + 1);
      }, DICE_REROLL_INTERVAL);
      const timer = setTimeout(() => {
        clearInterval(interval);
        setPhase('done');
        dispatch({ type: 'FINISH_DICE_ROLL' });
      }, DICE_ROLL_DURATION);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [animationState.diceRolling, dispatch]);

  useEffect(() => {
    if (diceValue && (phase === 'done' || phase === 'idle')) {
      setDisplayValue(diceValue);
    }
  }, [diceValue, phase]);

  useEffect(() => {
    if (!diceValue) {
      setPhase('idle');
      setDisplayValue(null);
      setRandomValue(null);
    }
  }, [diceValue]);

  const handleRoll = () => {
    if (phase !== 'idle') return;
    if (disabled) return;
    dispatch({ type: 'ROLL_DICE' });
  };

  const isRolling = phase === 'rolling';
  const shownValue = displayValue || randomValue;

  return (
    <div className="dice-roller">
      <button
        className={`dice-btn ${isRolling ? 'rolling' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleRoll}
        disabled={isRolling || disabled}
      >
          <div className={`dice ${isRolling ? 'shake' : ''}`}>
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
