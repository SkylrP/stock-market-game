import { useState, useEffect, useRef, useCallback } from 'react'
import './MultiplayerLobby.css'

const WORKER_HOST = 'stock-market-game.spagniello.workers.dev'

interface LobbyPlayer {
  id: number
  nickname: string
  connected: boolean
}

interface Props {
  onStartGame: (players: LobbyPlayer[]) => void
  onBack: () => void
}

type LobbyPhase = 'CHOOSE' | 'CREATE' | 'JOIN_INPUT' | 'WAITING'

export function MultiplayerLobby({ onStartGame, onBack }: Props) {
  const [phase, setPhase] = useState<LobbyPhase>('CHOOSE')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [lobbyCode, setLobbyCode] = useState('')
  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [playerId, setPlayerId] = useState(0)
  const [error, setError] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  const reset = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    setPhase('CHOOSE')
    setCode('')
    setJoinCode('')
    setLobbyCode('')
    setPlayers([])
    setPlayerId(0)
    setError('')
  }, [])

  useEffect(() => {
    return () => { wsRef.current?.close() }
  }, [])

  const connectWebSocket = useCallback((c: string, nick: string) => {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${WORKER_HOST}/ws?code=${c}`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'JOIN', nickname: nick }))
    }

    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      switch (m.type) {
        case 'WELCOME':
          setPlayerId(m.playerId)
          setPlayers(m.players)
          setLobbyCode(c)
          setPhase('WAITING')
          break
        case 'JOINED':
          setPlayers(prev => [...prev, m.player])
          break
        case 'LEFT':
          setPlayers(prev => prev.filter((p: LobbyPlayer) => p.id !== m.playerId))
          break
        case 'GAME_STARTING':
          onStartGame(m.players)
          break
        case 'ERROR':
          setError(m.message)
          break
      }
    }

    ws.onclose = () => {
      if (wsRef.current === ws) {
        setError('Disconnected from server')
      }
    }

    ws.onerror = () => {
      setError('Connection failed')
    }
  }, [onStartGame])

  const handleCreate = async () => {
    setError('')
    if (!nickname.trim()) { setError('Enter a nickname'); return }
    try {
      const res = await fetch(`https://${WORKER_HOST}/api/create`, { method: 'POST' })
      const data = await res.json()
      connectWebSocket(data.code, nickname.trim())
    } catch {
      setError('Could not connect to game server')
    }
  }

  const handleJoin = async () => {
    setError('')
    if (!joinCode.trim() || !/^\d{4}$/.test(joinCode.trim())) { setError('Enter a valid 4-digit code'); return }
    if (!nickname.trim()) { setError('Enter a nickname'); return }

    try {
      const res = await fetch(`https://${WORKER_HOST}/api/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      if (!res.ok) { setError('Invalid code or lobby not found'); return }
      connectWebSocket(joinCode.trim(), nickname.trim())
    } catch {
      setError('Could not connect to game server')
    }
  }

  const handleStart = () => {
    wsRef.current?.send(JSON.stringify({ type: 'START_GAME' }))
  }

  const isHost = playerId === 1

  return (
    <div className="lobby-screen">
      <button className="btn btn-ghost btn-sm lobby-back" onClick={phase === 'CHOOSE' ? onBack : reset}>
        ← Back
      </button>

      <div className="lobby-header">
        <span className="lobby-logo">🌐</span>
        <h2 className="lobby-title">Multiplayer</h2>
      </div>

      {error && <div className="lobby-error">{error}</div>}

      {phase === 'CHOOSE' && (
        <div className="lobby-choose">
          <div className="nickname-input glass">
            <input
              placeholder="Your nickname"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={15}
              autoFocus
            />
          </div>
          <div className="lobby-buttons">
            <button className="btn btn-primary btn-lg btn-block" onClick={handleCreate}>
              Create Game
            </button>
            <button className="btn btn-secondary btn-lg btn-block" onClick={() => setPhase('JOIN_INPUT')}>
              Join Game
            </button>
          </div>
        </div>
      )}

      {phase === 'JOIN_INPUT' && (
        <div className="lobby-join">
          <div className="nickname-input glass">
            <input
              placeholder="Your nickname"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={15}
            />
          </div>
          <div className="code-input glass">
            <input
              placeholder="Enter 4-digit code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              autoFocus
            />
          </div>
          <button className="btn btn-primary btn-lg btn-block" onClick={handleJoin}>
            Join
          </button>
        </div>
      )}

      {phase === 'WAITING' && (
        <div className="lobby-waiting">
          <div className="lobby-code-display glass">
            <span className="code-label">Game Code</span>
            <span className="code-value">{lobbyCode}</span>
            <span className="code-hint">Share this code with friends</span>
          </div>

          <div className="lobby-players glass">
            <div className="lobby-players-header">
              <span>Players ({players.length})</span>
              {isHost && players.length >= 2 && (
                <button className="btn btn-primary btn-sm" onClick={handleStart}>
                  Start Game
                </button>
              )}
            </div>
            <div className="lobby-players-list">
              {players.map((p) => (
                <div key={p.id} className="lobby-player-row">
                  <div className={`lobby-player-dot ${p.connected ? 'connected' : ''}`} />
                  <span className="lobby-player-name">
                    {p.nickname}
                    {p.id === 1 && <span className="host-badge">Host</span>}
                  </span>
                </div>
              ))}
            </div>
            {!isHost && players.length < 2 && (
              <p className="lobby-wait-msg">Waiting for host to start the game...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
