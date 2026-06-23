import { useState, useRef, useEffect } from 'react';
import { useGame } from './state/GameContext';
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
  SellBeforeRollModal,
} from './components/Modals/Modals';
import { HelpModal } from './components/HelpModal/HelpModal';
import { LeaderboardModal } from './components/LeaderboardModal/LeaderboardModal';
import './App.css';

function GameScreen() {
  const { state, dispatch } = useGame();
  const [confirmingNewGame, setConfirmingNewGame] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    if (showLeaderboard && stateRef.current !== state) {
      stateRef.current = state;
      setShowLeaderboard(false);
    }
  }, [showLeaderboard, state]);

  const player = state.players[state.currentPlayerIndex];
  const isGoingToWork = !player.inMarket;

  const handleEndTurn = () => {
    dispatch({ type: 'END_TURN' });
  };

  const handleSellBeforeRoll = () => {
    dispatch({ type: 'OPEN_SELL_MODAL' });
  };

  const canEndTurn = player.hasRolled
    && !state.animationState.diceRolling
    && !state.animationState.slotSpinning
    && !state.pendingAction;

  const hasShares = Object.values(player.portfolio).some(v => v > 0);
  const canSellBeforeRoll = player.canSellBeforeRoll
    && !player.hasRolled
    && hasShares
    && player.inMarket
    && !state.pendingAction
    && !state.animationState.diceRolling;

  return (
    <div className="game-screen">
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
            <span>Roll your lucky number ({player.luckyNumber}) to earn $400!</span>
          </div>
        )}
        {canSellBeforeRoll && (
          <button className="btn btn-danger btn-sm sell-before-btn" onClick={handleSellBeforeRoll}>
            Sell Shares Before Rolling
          </button>
        )}
        <DiceRoller />
        <StockPortfolio />
      </div>

      <div className="bottom-bar">
        <PlayerPanel onOpenLeaderboard={() => setShowLeaderboard(true)} />
        {canEndTurn && (
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

      {state.pendingAction?.type === 'SELL_BEFORE_ROLL' && <SellBeforeRollModal />}
      {state.pendingAction?.type === 'BUY_SELL' && <BuySellModal />}
      {state.pendingAction?.type === 'STOCK_HOLDER_MEETING' && <StockMeetingModal />}
      {(state.pendingAction?.type === 'PAY_FEE' ||
        state.pendingAction?.type === 'BROKER_FEE' ||
        state.pendingAction?.type === 'SELL_FOR_FEE') && <FeeModal />}
      {state.pendingAction?.type === 'MARKET_MANIPULATOR' && <MarketManipulatorModal />}
      {state.gamePhase === 'GAME_OVER' && <WinnerModal />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
      <SlotMachine />
    </div>
  );
}

function App() {
  const { state } = useGame();

  if (state.gamePhase === 'SETUP') {
    return <SetupScreen />;
  }

  return <GameScreen />;
}

export default App;
