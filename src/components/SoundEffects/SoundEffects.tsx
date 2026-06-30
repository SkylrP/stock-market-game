import { useEffect, useRef } from 'react';
import { useGame } from '../../state/GameContext';
import { soundManager } from '../../game/sound';
import { GamePhase } from '../../types';

const SLOT_REEL_STOP_1 = 600;
const SLOT_REEL_STOP_2 = 1400;
const SLOT_REEL_STOP_3 = 2200;

export function SoundEffects() {
  const { state } = useGame();

  const prevDiceRolling = useRef(false);
  const prevSlotSpinning = useRef(false);
  const prevPieceMoving = useRef(false);
  const prevQbiChanging = useRef(false);
  const prevPhase = useRef<GamePhase>('SETUP');
  const prevTotalTrades = useRef<number[]>([]);
  const prevTotalFees = useRef<number[]>([]);
  const prevMeeting = useRef(false);
  const reelTimers = useRef<number[]>([]);

  useEffect(() => {
    if (state.animationState.diceRolling && !prevDiceRolling.current) {
      soundManager.diceRoll();
    }
    if (!state.animationState.diceRolling && prevDiceRolling.current && state.diceValue) {
      soundManager.diceResult();
    }
    prevDiceRolling.current = state.animationState.diceRolling;
  }, [state.animationState.diceRolling, state.diceValue]);

  useEffect(() => {
    if (state.animationState.pieceMoving && !prevPieceMoving.current) {
      soundManager.pieceHop();
    }
    if (!state.animationState.pieceMoving && prevPieceMoving.current) {
      soundManager.pieceLand();
    }
    prevPieceMoving.current = state.animationState.pieceMoving;
  }, [state.animationState.pieceMoving]);

  useEffect(() => {
    if (state.animationState.qbiChanging && !prevQbiChanging.current) {
      const up = state.animationState.qbiTo > state.animationState.qbiFrom;
      soundManager.qbiChange(up);
    }
    prevQbiChanging.current = state.animationState.qbiChanging;
  }, [
    state.animationState.qbiChanging,
    state.animationState.qbiFrom,
    state.animationState.qbiTo,
  ]);

  useEffect(() => {
    if (state.animationState.slotSpinning && !prevSlotSpinning.current) {
      soundManager.slotSpin();
      reelTimers.current = [
        window.setTimeout(() => soundManager.slotReelStop(0), SLOT_REEL_STOP_1),
        window.setTimeout(() => soundManager.slotReelStop(1), SLOT_REEL_STOP_2),
        window.setTimeout(() => soundManager.slotReelStop(2), SLOT_REEL_STOP_3),
      ];
    }
    if (
      !state.animationState.slotSpinning &&
      prevSlotSpinning.current &&
      state.animationState.slotResult
    ) {
      reelTimers.current.forEach(clearTimeout);
      reelTimers.current = [];
      const isTriple = state.animationState.slotResult.priority === 2 || state.animationState.slotResult.priority === 3;
      soundManager.slotResult(state.animationState.slotResult.multiplier, isTriple);
    }
    if (!state.animationState.slotSpinning && !state.animationState.slotResult) {
      reelTimers.current.forEach(clearTimeout);
      reelTimers.current = [];
    }
    prevSlotSpinning.current = state.animationState.slotSpinning;
  }, [state.animationState.slotSpinning, state.animationState.slotResult]);

  useEffect(() => {
    if (
      state.pendingAction?.type === 'STOCK_HOLDER_MEETING' &&
      !prevMeeting.current
    ) {
      soundManager.meetingSpin();
    }
    prevMeeting.current = state.pendingAction?.type === 'STOCK_HOLDER_MEETING';
  }, [state.pendingAction]);

  useEffect(() => {
    const trades = state.players.map(p => p.totalTrades);
    if (prevTotalTrades.current.length === trades.length) {
      for (let i = 0; i < trades.length; i++) {
        if (trades[i] > prevTotalTrades.current[i]) {
          soundManager.tradeComplete();
          break;
        }
      }
    }
    prevTotalTrades.current = trades;
  }, [state.players]);

  useEffect(() => {
    const fees = state.players.map(p => p.totalFeesPaid);
    if (prevTotalFees.current.length === fees.length) {
      for (let i = 0; i < fees.length; i++) {
        if (fees[i] > prevTotalFees.current[i]) {
          soundManager.feePaid();
          break;
        }
      }
    }
    prevTotalFees.current = fees;
  }, [state.players]);

  useEffect(() => {
    if (state.gamePhase === 'GAME_OVER' && prevPhase.current !== 'GAME_OVER') {
      soundManager.winFanfare();
    }
    prevPhase.current = state.gamePhase;
  }, [state.gamePhase]);

  return null;
}
