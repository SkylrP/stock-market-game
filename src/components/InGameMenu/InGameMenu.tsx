import { useState } from 'react';
import { THEMES } from '../../themes';
import './InGameMenu.css'

interface Props {
  onClose: () => void
  onLeaveGame: () => void
  onRestartGame: () => void
  theme: string
  onThemeChange: (id: string) => void
}

export function InGameMenu({ onClose, onLeaveGame, onRestartGame, theme, onThemeChange }: Props) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  const handleLeave = () => {
    if (!confirmLeave) { setConfirmLeave(true); return }
    onLeaveGame();
  };

  const handleRestart = () => {
    if (!confirmRestart) { setConfirmRestart(true); return }
    onRestartGame();
  };

  const handleCancel = () => {
    setConfirmLeave(false);
    setConfirmRestart(false);
    setShowTheme(false);
    onClose();
  };

  return (
    <div className="game-menu-overlay" onClick={handleCancel}>
      <div className="game-menu glass" onClick={e => e.stopPropagation()}>
        <div className="game-menu-header">
          <h3>Menu</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {!confirmLeave && !confirmRestart && !showTheme && (
          <div className="game-menu-options">
            <button className="game-menu-option" onClick={handleLeave}>
              <span className="game-menu-option-icon">🚪</span>
              <span className="game-menu-option-label">Leave Game</span>
              <span className="game-menu-option-arrow">›</span>
            </button>
            <button className="game-menu-option" onClick={handleRestart}>
              <span className="game-menu-option-icon">🔄</span>
              <span className="game-menu-option-label">Restart Game</span>
              <span className="game-menu-option-arrow">›</span>
            </button>
            <button className="game-menu-option" onClick={() => setShowTheme(true)}>
              <span className="game-menu-option-icon">🎨</span>
              <span className="game-menu-option-label">Game Theme: {THEMES.find(t => t.id === theme)?.name ?? theme}</span>
              <span className="game-menu-option-arrow">›</span>
            </button>
          </div>
        )}

        {confirmLeave && (
          <div className="game-menu-confirm">
            <p className="confirm-message">Leave the current game?</p>
            <div className="confirm-actions">
              <button className="btn btn-danger btn-sm" onClick={onLeaveGame}>Leave</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmLeave(false)}>Cancel</button>
            </div>
          </div>
        )}

        {confirmRestart && (
          <div className="game-menu-confirm">
            <p className="confirm-message">Restart the game?</p>
            <div className="confirm-actions">
              <button className="btn btn-danger btn-sm" onClick={onRestartGame}>Restart</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmRestart(false)}>Cancel</button>
            </div>
          </div>
        )}

        {showTheme && (
          <div className="game-menu-theme">
            {THEMES.map(t => (
              <button
                key={t.id}
                className={`theme-option ${t.id === theme ? 'selected' : ''}`}
                onClick={() => onThemeChange(t.id)}
              >
                <div className="theme-option-swatches">
                  {t.colors.map(c => (
                    <span
                      key={c.label}
                      className="theme-swatch"
                      style={{ background: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="theme-option-info">
                  <span className="theme-option-name">{t.name}</span>
                  {t.id === theme && <span className="theme-option-check">✓</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
