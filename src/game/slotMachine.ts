import { SlotSymbol, SlotResult, SLOT_WEIGHTS, SLOT_SYMBOLS } from '../types';

export function spinReel(): SlotSymbol {
  const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + SLOT_WEIGHTS[s], 0);
  let r = Math.random() * totalWeight;
  for (const symbol of SLOT_SYMBOLS) {
    r -= SLOT_WEIGHTS[symbol];
    if (r <= 0) return symbol;
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

export function resolveSlots(reels: [SlotSymbol, SlotSymbol, SlotSymbol]): {
  multiplier: number;
  priority: number;
  description: string;
} {
  const [a, b, c] = reels;
  const numbers: number[] = [];
  let hasJackpot = false;
  let skullCount = 0;

  for (const sym of reels) {
    if (sym === 'JACKPOT') hasJackpot = true;
    else if (sym === 'SKULL') skullCount++;
    else numbers.push(parseInt(sym, 10));
  }

  // Priority 1: Triple Skull → 1×
  if (skullCount === 3) {
    return { multiplier: 1, priority: 1, description: 'Triple Skull — 1×' };
  }

  // Priority 2: Triple matching number → 10 × N
  if (a === b && b === c && a !== 'SKULL' && a !== 'JACKPOT') {
    const n = parseInt(a, 10);
    return { multiplier: 10 * n, priority: 2, description: `Triple ${a} — ${10 * n}×` };
  }

  // Priority 3: Triple Jackpot → 300×
  if (a === 'JACKPOT' && b === 'JACKPOT' && c === 'JACKPOT') {
    return { multiplier: 300, priority: 3, description: 'JACKPOT! — 300×' };
  }

  // Priority 4: At least one Jackpot AND no numbers → 8×
  if (hasJackpot && numbers.length === 0) {
    return { multiplier: 8, priority: 4, description: 'Jackpot present — 8×' };
  }

  // Priority 5: Anything else → highest number
  const highest = Math.max(...numbers, 0);
  return { multiplier: highest, priority: 5, description: `Highest number — ${highest}×` };
}

export function runSlotMachine(heldShares: number): {
  reels: [SlotSymbol, SlotSymbol, SlotSymbol];
  result: SlotResult;
} {
  const reels: [SlotSymbol, SlotSymbol, SlotSymbol] = [
    spinReel(),
    spinReel(),
    spinReel(),
  ];
  const { multiplier, priority, description } = resolveSlots(reels);
  return {
    reels,
    result: {
      multiplier,
      priority,
      description,
      newShares: heldShares * multiplier,
    },
  };
}