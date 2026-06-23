import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { PLAYER_COLORS } from '../../types';
import { HelpModal } from '../HelpModal/HelpModal';
import './SetupScreen.css';

const LUCKY_NUMBERS = [1, 2, 3, 4, 5, 6];

export function SetupScreen() {
  const { dispatch } = useGame();
  const [players, setPlayers] = useState<{ name: string; luckyNumber: number | null }[]>([
    { name: 'Player 1', luckyNumber: null },
    { name: 'Player 2', luckyNumber: null },
  ]);
  const [winAmount, setWinAmount] = useState(100000);
  const [showHelp, setShowHelp] = useState(false);

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, { name: `Player ${players.length + 1}`, luckyNumber: null }]);
    }
  };

  const removePlayer = (idx: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== idx));
    }
  };

  const setLuckyNumber = (idx: number, num: number) => {
    const used = players.map(p => p.luckyNumber);
    if (used.includes(num)) return;
    const updated = [...players];
    updated[idx] = { ...updated[idx], luckyNumber: num };
    setPlayers(updated);
  };

  const setName = (idx: number, name: string) => {
    const updated = [...players];
    updated[idx] = { ...updated[idx], name };
    setPlayers(updated);
  };

  const canStart = players.every(p => p.luckyNumber !== null && p.name.trim());

  const handleStart = () => {
    for (const p of players) {
      dispatch({ type: 'ADD_PLAYER', payload: { name: p.name, luckyNumber: p.luckyNumber } });
    }
    dispatch({ type: 'SET_WIN_AMOUNT', payload: winAmount });
    dispatch({ type: 'START_GAME' });
  };

  return (
    <div className="setup-screen">
      <div className="setup-header">
        <div className="setup-logo">
          <span className="logo-icon">📈</span>
        </div>
        <h1 className="setup-title">Stock Market Game</h1>
        <p className="setup-subtitle">Pass &amp; Play</p>
        <button className="btn btn-ghost btn-sm help-btn" onClick={() => setShowHelp(true)}>?</button>
      </div>

      <div className="setup-content">
        <div className="setup-section">
          <div className="section-header">
            <h2>Players</h2>
            {players.length < 6 && (
              <button className="btn btn-ghost btn-sm" onClick={addPlayer}>
                + Add Player
              </button>
            )}
          </div>

          <div className="players-list">
            {players.map((player, idx) => (
              <div key={idx} className="player-setup-card glass">
                <div className="player-setup-header">
                  <div
                    className="player-dot"
                    style={{ backgroundColor: PLAYER_COLORS[idx] }}
                  />
                  <input
                    className="player-name-input"
                    value={player.name}
                    onChange={e => setName(idx, e.target.value)}
                    placeholder={`Player ${idx + 1}`}
                    maxLength={15}
                  />
                  {players.length > 2 && (
                    <button className="btn-remove" onClick={() => removePlayer(idx)}>✕</button>
                  )}
                </div>
                <div className="lucky-number-picker">
                  <span className="picker-label">Lucky #</span>
                  <div className="number-options">
                    {LUCKY_NUMBERS.map(num => {
                      const isUsed = players.some((p, i) => i !== idx && p.luckyNumber === num);
                      const isSelected = player.luckyNumber === num;
                      return (
                        <button
                          key={num}
                          className={`num-btn ${isSelected ? 'selected' : ''} ${isUsed ? 'used' : ''}`}
                          onClick={() => !isUsed && setLuckyNumber(idx, num)}
                          disabled={isUsed}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="setup-section">
          <h2>Win Condition</h2>
          <div className="win-amount-input glass">
            <span className="dollar-sign">$</span>
            <input
              type="number"
              value={winAmount}
              onChange={e => setWinAmount(Math.max(1000, parseInt(e.target.value) || 100000))}
              min={1000}
              max={10000000}
            />
          </div>
        </div>

        <div className="setup-section">
          <h2>Rules Summary</h2>
          <div className="rules-summary glass">
            <p><strong>Going to Work:</strong> Earn $400 when your lucky number is rolled. After $1,000 total earnings, enter the market (salary drops to $200).</p>
            <p><strong>Playing the Market:</strong> Roll, move, buy/sell stocks. QBI (0-100) drives prices.</p>
            <p><strong>Win:</strong> Reach ${winAmount.toLocaleString()} total (cash + stocks at current price).</p>
          </div>
        </div>

        <button
          className={`btn btn-primary btn-lg btn-block start-btn ${!canStart ? 'disabled' : ''}`}
          onClick={handleStart}
          disabled={!canStart}
        >
          Start Game
        </button>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
