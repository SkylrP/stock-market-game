import { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from './state/GameContext';
import { calculateTotalValue } from './game/player';
import { SetupScreen } from './components/SetupScreen/SetupScreen';
import { Board } from './components/Board/Board';
import { DiceRoller } from './components/DiceRoller/DiceRoller';
import { SlotMachine } from './components/SlotMachine/SlotMachine';
import { PlayerPanel } from './components/PlayerPanel/PlayerPanel';
import { StockPortfolio } from './components/StockPortfolio/StockPortfolio';
import { QbiIndicator } from './components/QbiIndicator/QbiIndicator';
import {
  BuySellModal,
  StockMeetingModal,
  FeeModal,
  MarketManipulatorModal,
  WinnerModal,
} from './components/Modals/Modals';
import { HelpModal } from './components/HelpModal/HelpModal';
import { LeaderboardModal } from './components/LeaderboardModal/LeaderboardModal';
import { MenuScreen } from './components/MenuScreen/MenuScreen';
import { MultiplayerLobby } from './components/MultiplayerLobby/MultiplayerLobby';
import { MultiplayerSetupScreen } from './components/MultiplayerSetupScreen/MultiplayerSetupScreen';
import './App.css';

interface LobbyPlayer {
  id: number
  nickname: string
}

function GameScreenContent({
  onBackToMenu,
  canInteract,
  myPlayerIndex,
}: {
  onBackToMenu: () => void
  canInteract: boolean
  myPlayerIndex?: number
}) {
  const { state, dispatch } = useGame();
  const [confirmingNewGame, setConfirmingNewGame] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    if (!state.pendingAction) {
      setShowActionModal(false);
    }
  }, [state.pendingAction]);

  useEffect(() => {
    if (showLeaderboard && stateRef.current !== state) {
      stateRef.current = state;
      setShowLeaderboard(false);
    }
  }, [showLeaderboard, state]);

  const displayIdx = myPlayerIndex ?? state.currentPlayerIndex;
  const displayPlayer = state.players[displayIdx];
  const activePlayer = state.players[state.currentPlayerIndex];

  const isGoingToWork = !activePlayer?.inMarket;

  const handleEndTurn = () => {
    if (!canInteract) return;
    dispatch({ type: 'END_TURN' });
  };

  const getActionLabel = () => {
    const a = state.pendingAction;
    if (!a) return '';
    switch (a.type) {
      case 'BUY_SELL': return a.buyOnly ? `Buy ${a.stock}` : `Sell ${a.stock}`;
      case 'STOCK_HOLDER_MEETING': return `${a.stock} Meeting`;
      case 'MARKET_MANIPULATOR': return 'Market Manipulator';
      default: return '';
    }
  };

  const canEndTurn = activePlayer?.hasRolled
    && !state.animationState.diceRolling
    && !state.animationState.slotSpinning
    && !state.animationState.pieceMoving
    && !state.animationState.qbiChanging
    && !state.landingPendingAction
    && !state.pendingAction;

  const hasShares = activePlayer && Object.values(activePlayer.portfolio).some(v => v > 0);



  const snapshot = activePlayer?.lastTurnSnapshot;
  const snapshotCurrentTotal = activePlayer
    ? calculateTotalValue(activePlayer.cash, activePlayer.portfolio, state.stockPrices)
    : 0;
  const snapshotCapitalChange = snapshot ? snapshotCurrentTotal - snapshot.totalValue : 0;
  const snapshotQbiChange = snapshot ? state.qbi - snapshot.qbi : 0;

  const waitingPlayer = !canInteract && activePlayer
    ? state.players[state.currentPlayerIndex]
    : null;

  const prevPieceMoving = useRef(state.animationState.pieceMoving);
  useEffect(() => {
    const wasMoving = prevPieceMoving.current;
    const nowMoving = state.animationState.pieceMoving;
    prevPieceMoving.current = nowMoving;
    if (wasMoving && !nowMoving && state.landingPendingAction) {
      const timer = setTimeout(() => {
        dispatch({ type: 'REVEAL_PENDING_ACTION' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.animationState.pieceMoving, state.landingPendingAction, dispatch]);

  return (
    <div className="game-screen">
      {waitingPlayer && (
        <div className="waiting-overlay">
          <div className="waiting-message glass">
            <span className="waiting-spinner" />
            <span>Waiting for {waitingPlayer.name}'s turn...</span>
          </div>
        </div>
      )}

      <div className="top-bar">
        <QbiIndicator />
      </div>

      <div className="board-area">
        <Board />
      </div>

      <div className="action-area">
        {isGoingToWork && (
          <div className="work-notice">
            <span className="work-icon">💼</span>
            <span>Roll your lucky number ({activePlayer?.luckyNumber}) to earn $400!</span>
          </div>
        )}
        {canInteract && activePlayer?.inMarket && snapshot && (
          <div className="turn-snapshot-bar">
            <span className={snapshotCapitalChange >= 0 ? 'capital-gain' : 'capital-loss'}>
              {snapshotCapitalChange >= 0 ? 'Capital Gains' : 'Capital Losses'}: {snapshotCapitalChange >= 0 ? '+' : ''}${snapshotCapitalChange.toFixed(2)}
            </span>
            <span className="snapshot-divider">|</span>
            <span>QBI: {snapshot.qbi} &rarr; {state.qbi}</span>
          </div>
        )}
        <DiceRoller disabled={!canInteract} />
        <StockPortfolio myPlayerIndex={displayIdx} canInteract={canInteract} />
      </div>

      <div className="bottom-bar">
        {!showActionModal && state.pendingAction && canInteract && (
          <div className="action-button-area">
            <button className="btn btn-success btn-block" onClick={() => setShowActionModal(true)}>
              {getActionLabel()}
            </button>
          </div>
        )}
        <PlayerPanel onOpenLeaderboard={() => setShowLeaderboard(true)} myPlayerIndex={displayIdx} />
        {canEndTurn && canInteract && (
          <div className="end-turn-area">
            <button className="btn btn-primary btn-block" onClick={handleEndTurn}>
              End Turn
            </button>
          </div>
        )}
        {confirmingNewGame ? (
          <div className="confirm-restart">
            <span className="confirm-text">Restart game?</span>
            <button className="btn btn-danger btn-sm" onClick={() => { dispatch({ type: 'NEW_GAME' }); setConfirmingNewGame(false); }}>
              Yes
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmingNewGame(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="bottom-row">
            <button className="btn btn-ghost btn-sm help-btn" onClick={() => setShowHelp(true)}>?</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmingNewGame(true)}>
              New Game
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onBackToMenu}>
              Menu
            </button>
            <a
              className="btn btn-ghost btn-sm"
              href="https://spot.fund/StockMarketGame"
              target="_blank"
              rel="noopener noreferrer"
            >
              Donate
            </a>
          </div>
        )}
      </div>

      {showActionModal && state.pendingAction?.type === 'BUY_SELL' && canInteract && <BuySellModal />}
      {showActionModal && state.pendingAction?.type === 'STOCK_HOLDER_MEETING' && canInteract && <StockMeetingModal />}
      {(state.pendingAction?.type === 'PAY_FEE' ||
        state.pendingAction?.type === 'BROKER_FEE' ||
        state.pendingAction?.type === 'SELL_FOR_FEE') && canInteract && <FeeModal />}
      {showActionModal && state.pendingAction?.type === 'MARKET_MANIPULATOR' && canInteract && <MarketManipulatorModal />}
      {state.gamePhase === 'GAME_OVER' && <WinnerModal />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
      <SlotMachine />
    </div>
  );
}

function LocalGameScreen({ onBackToMenu }: { onBackToMenu: () => void }) {
  return <GameScreenContent onBackToMenu={onBackToMenu} canInteract={true} />;
}

function MultiplayerGameScreen({
  onBackToMenu,
  ws,
  playerId,
}: {
  onBackToMenu: () => void
  ws: WebSocket | null
  playerId: number
}) {
  const { state, dispatch } = useGame();
  const myPlayerIndex = playerId - 1;
  const canInteract = state.currentPlayerIndex === myPlayerIndex;
  const prevSerialized = useRef('');
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    if (!ws) return;
    ws.onmessage = null;
    ws.onclose = () => setDisconnected(true);
    ws.onerror = () => setDisconnected(true);
    return () => {
      ws.onclose = null;
      ws.onerror = null;
    };
  }, [ws]);

  useEffect(() => {
    if (!ws || disconnected) return;
    if (state.animationState.diceRolling || state.animationState.slotSpinning) return;
    const serialized = JSON.stringify(state);
    if (serialized === prevSerialized.current) return;
    prevSerialized.current = serialized;
    ws.send(JSON.stringify({ type: 'GAME_STATE', state }));
  }, [state, ws, disconnected]);

  useEffect(() => {
    if (!ws) return;
    const handler = (e: MessageEvent) => {
      const m = JSON.parse(e.data);
      if (m.type === 'GAME_STATE') {
        prevSerialized.current = JSON.stringify(m.state);
        dispatch({ type: 'LOAD_STATE', payload: m.state });
      }
      if (m.type === 'LEFT') {
        setDisconnected(true);
      }
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [ws, dispatch]);

  if (disconnected) {
    return (
      <div className="game-screen">
        <div className="waiting-overlay">
          <div className="waiting-message glass">
            <span className="waiting-spinner" />
            <span>Another player disconnected</span>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onBackToMenu}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameScreenContent
      onBackToMenu={onBackToMenu}
      canInteract={canInteract}
      myPlayerIndex={myPlayerIndex}
    />
  );
}

function App() {
  const { state, dispatch } = useGame();
  const [screen, setScreen] = useState<'menu' | 'setup' | 'lobby' | 'multiplayer-setup' | 'game'>('menu');
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [lobbyPlayerId, setLobbyPlayerId] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const handleLocalGame = () => {
    setScreen('setup');
  };

  const handleBackToMenu = () => {
    wsRef.current?.close();
    wsRef.current = null;
    dispatch({ type: 'NEW_GAME' });
    setScreen('menu');
  };

  const handleMultiplayerSetup = useCallback((ws: WebSocket, playerId: number, players: LobbyPlayer[]) => {
    wsRef.current = ws;
    setLobbyPlayerId(playerId);
    setLobbyPlayers(players);
    setScreen('multiplayer-setup');
  }, []);

  const handleBeginGame = useCallback(() => {
    setScreen('game');
  }, []);

  if (screen === 'menu') {
    return <MenuScreen onLocalGame={handleLocalGame} onMultiplayer={() => setScreen('lobby')} />;
  }

  if (screen === 'lobby') {
    return <MultiplayerLobby onSetup={handleMultiplayerSetup} onBack={() => setScreen('menu')} />;
  }

  if (screen === 'multiplayer-setup') {
    return (
      <MultiplayerSetupScreen
        ws={wsRef.current!}
        playerId={lobbyPlayerId}
        players={lobbyPlayers}
        onBeginGame={handleBeginGame}
      />
    );
  }

  if (screen === 'setup') {
    return (
      <>
        {state.gamePhase === 'SETUP' && <SetupScreen onBack={handleBackToMenu} />}
        {state.gamePhase !== 'SETUP' && (
          <LocalGameScreen onBackToMenu={handleBackToMenu} />
        )}
      </>
    );
  }

  if (wsRef.current) {
    return (
      <MultiplayerGameScreen
        onBackToMenu={handleBackToMenu}
        ws={wsRef.current}
        playerId={lobbyPlayerId}
      />
    );
  }

  return <LocalGameScreen onBackToMenu={handleBackToMenu} />;
}

export default App;
