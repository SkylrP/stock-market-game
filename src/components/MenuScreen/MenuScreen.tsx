import './MenuScreen.css'

interface Props {
  onLocalGame: () => void
  onMultiplayer: () => void
}

export function MenuScreen({ onLocalGame, onMultiplayer }: Props) {
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
      </div>
    </div>
  )
}
