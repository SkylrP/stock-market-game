import { useState } from 'react';
import { THEMES } from '../../themes';
import './MenuScreen.css'

interface Props {
  onLocalGame: () => void
  onMultiplayer: () => void
  theme: string
  onThemeChange: (id: string) => void
}

export function MenuScreen({ onLocalGame, onMultiplayer, theme, onThemeChange }: Props) {
  const [showThemePicker, setShowThemePicker] = useState(false);

  return (
    <div className="menu-screen">
      <div className="menu-header">
        <span className="menu-logo">📈</span>
        <h1 className="menu-title">Stock Market Game</h1>
        <p className="menu-subtitle">Choose your game mode</p>
      </div>

      <div className="menu-actions">
        <button className="btn btn-primary btn-lg menu-btn" onClick={onLocalGame}>
          <span className="menu-btn-icon">🎮</span>
          <span className="menu-btn-label">Local Game</span>
          <span className="menu-btn-desc">Pass &amp; play on this device</span>
        </button>

        <button className="btn btn-secondary btn-lg menu-btn" onClick={onMultiplayer}>
          <span className="menu-btn-icon">🌐</span>
          <span className="menu-btn-label">Multiplayer</span>
          <span className="menu-btn-desc">Join or host a game across devices</span>
        </button>

        <button
          className="btn btn-ghost menu-theme-btn"
          onClick={() => setShowThemePicker(true)}
        >
          <span>Theme: {THEMES.find(t => t.id === theme)?.name ?? theme}</span>
        </button>
      </div>

      {showThemePicker && (
        <div className="theme-modal-overlay" onClick={() => setShowThemePicker(false)}>
          <div className="theme-modal glass" onClick={e => e.stopPropagation()}>
            <div className="theme-modal-header">
              <h3>Choose Theme</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowThemePicker(false)}>✕</button>
            </div>
            <div className="theme-picker">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`theme-option ${t.id === theme ? 'selected' : ''}`}
                  onClick={() => { onThemeChange(t.id); setShowThemePicker(false) }}
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
          </div>
        </div>
      )}
    </div>
  )
}
