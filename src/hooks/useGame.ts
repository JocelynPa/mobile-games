import { useCallback, useRef, useState } from 'react';
import { LevelConfig } from '../data/levels';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface ComboPopup {
  id: number;
  text: string;
  amount: number;
}

const COMBO_LABELS = ['Joli !', 'Combo x2 !', 'Combo x3 !', 'Combo x4 !', 'INCROYABLE !'];

export function useGame(level: LevelConfig) {
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(level.moves);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [resetKey, setResetKey] = useState(0);
  const [combo, setCombo] = useState<ComboPopup | null>(null);
  const comboIdRef = useRef(0);

  const onScoreGained = useCallback((amount: number, cascadeIndex: number) => {
    setScore((prev) => prev + amount);
    if (cascadeIndex > 0) {
      comboIdRef.current += 1;
      const id = comboIdRef.current;
      const text = COMBO_LABELS[Math.min(cascadeIndex, COMBO_LABELS.length - 1)];
      setCombo({ id, text, amount });
      setTimeout(() => {
        setCombo((c) => (c?.id === id ? null : c));
      }, 900);
    }
  }, []);

  const onMoveSpent = useCallback(() => {
    setMovesLeft((prev) => Math.max(0, prev - 1));
  }, []);

  const settleTurn = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'playing') return prev;
      if (score >= level.targetScore) return 'won';
      if (movesLeft <= 0) return 'lost';
      return prev;
    });
  }, [score, movesLeft, level.targetScore]);

  const reset = useCallback(() => {
    setScore(0);
    setMovesLeft(level.moves);
    setStatus('playing');
    setCombo(null);
    setResetKey((k) => k + 1);
  }, [level.moves]);

  return {
    score,
    movesLeft,
    status,
    combo,
    resetKey,
    onScoreGained,
    onMoveSpent,
    settleTurn,
    reset,
  };
}
