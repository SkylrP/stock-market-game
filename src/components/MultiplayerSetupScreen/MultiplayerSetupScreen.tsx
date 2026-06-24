import { useState, useEffect, useRef } from 'react'
import { useGame } from '../../state/GameContext'
import { PLAYER_COLORS } from '../../types'
import '../SetupScreen/SetupScreen.css'

const LUCKY_NUMBERS = [1, 2, 3, 4, 5, 6]

interface LobbyPlayer {
  id: number
  nickname: string
}

interface Props {
  ws: WebSocket
  playerId: number
  players: LobbyPlayer[]
  onBeginGame: () => void
}

export function MultiplayerSetupScreen({ ws, playerId, players, onBeginGame }: Props) {
  const { state, dispatch } = useGame()
  const playerIdRef = useRef(playerId)
  playerIdRef.current = playerId
  const [luckyNumbers, setLuckyNumbers] = useState<Record<number, number | null>>(
    Object.fromEntries(players.map(p => [p.id, null]))
  )
  const [winAmount, setWinAmount] = useState(100000)
  const [started, setStarted] = useState(false)
  const prevStateRef = useRef('')
  const isHost = playerIdRef.current === 1

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const m = JSON.parse(e.data)
      if (m.type === 'GAME_STATE') {
        dispatch({ type: 'LOAD_STATE', payload: m.state })
        onBeginGame()
      }
      if (m.type === 'SETUP_LUCKY_NUMBER') {
        setLuckyNumbers(prev => ({ ...prev, [m.playerId]: m.luckyNumber }))
      }
      if (m.type === 'SETUP_WIN_AMOUNT') {
        setWinAmount(m.amount)
      }
    }
    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [ws, dispatch, onBeginGame])

  useEffect(() => {
    if (!started) return
    if (state.gamePhase === 'SETUP') return
    const serialized = JSON.stringify(state)
    if (serialized === prevStateRef.current) return
    prevStateRef.current = serialized
    ws.send(JSON.stringify({ type: 'GAME_STATE', state }))
    onBeginGame()
  }, [state, started, ws, onBeginGame])

  const pickLuckyNumber = (num: number) => {
    const used = Object.values(luckyNumbers)
    if (used.includes(num)) return
    const myId = playerIdRef.current
    setLuckyNumbers(prev => ({ ...prev, [myId]: num }))
    ws.send(JSON.stringify({ type: 'SETUP_LUCKY_NUMBER', playerId: myId, luckyNumber: num }))
  }

  const handleWinAmount = (amount: number) => {
    setWinAmount(amount)
    ws.send(JSON.stringify({ type: 'SETUP_WIN_AMOUNT', amount }))
  }

  const handleBegin = () => {
    if (started) return
    setStarted(true)
    for (const p of players) {
      dispatch({ type: 'ADD_PLAYER', payload: { name: p.nickname, luckyNumber: luckyNumbers[p.id] || 1 } })
    }
    dispatch({ type: 'SET_WIN_AMOUNT', payload: winAmount })
    dispatch({ type: 'START_GAME' })
  }

  const allChosen = Object.values(luckyNumbers).every(v => v !== null)

  return (
    <div className="setup-screen">
      <div className="setup-header">
        <div className="setup-logo">
          <span className="logo-icon">📈</span>
        </div>
        <h1 className="setup-title">Stock Market Game</h1>
        <p className="setup-subtitle">Multiplayer Setup</p>
      </div>

      <div className="setup-content">
        <div className="setup-section">
          <h2>Players</h2>
          <div className="players-list">
            {players.map((p) => {
              const idx = players.indexOf(p)
              return (
                <div key={p.id} className="player-setup-card glass">
                  <div className="player-setup-header">
                    <div
                      className="player-dot"
                      style={{ backgroundColor: PLAYER_COLORS[idx] }}
                    />
                    <span className="player-name-input" style={{ borderBottom: 'none' }}>
                      {p.nickname}
                      {p.id === 1 && <span className="host-badge" style={{ marginLeft: 8 }}>Host</span>}
                    </span>
                  </div>
                  <div className="lucky-number-picker">
                    <span className="picker-label">Lucky #</span>
                    <div className="number-options">
                      {LUCKY_NUMBERS.map(num => {
                        const isUsed = Object.entries(luckyNumbers).some(
                          ([id, v]) => Number(id) !== p.id && v === num
                        )
                        const isSelected = luckyNumbers[p.id] === num
                        const myId = playerIdRef.current
                        const isMe = p.id === myId
                        return (
                          <button
                            key={num}
                            className={`num-btn ${isSelected ? 'selected' : ''} ${isUsed ? 'used' : ''}`}
                            disabled={!isMe || isUsed}
                            onClick={() => isMe && !isUsed && pickLuckyNumber(num)}
                          >
                            {num}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {isHost && (
          <div className="setup-section">
            <h2>Win Condition</h2>
            <div className="win-amount-input glass">
              <span className="dollar-sign">$</span>
              <input
                type="number"
                value={winAmount}
                onChange={e => handleWinAmount(Math.max(1000, parseInt(e.target.value) || 100000))}
                min={1000}
                max={10000000}
              />
            </div>
          </div>
        )}

        {isHost && (
          <button
            className={`btn btn-primary btn-lg btn-block start-btn ${!allChosen ? 'disabled' : ''}`}
            onClick={handleBegin}
            disabled={!allChosen}
          >
            Begin Game
          </button>
        )}
        {!isHost && (
          <p className="lobby-wait-msg" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            Waiting for host to begin the game...
          </p>
        )}
      </div>
    </div>
  )
}
