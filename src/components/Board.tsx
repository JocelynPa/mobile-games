import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  areAdjacent,
  generateBoard,
  hasAnyValidMove,
  resolveSwap,
  reshuffleBoard,
  toFlat,
} from '../engine/board';
import { Grid, GridCandy, Position } from '../engine/types';
import { LevelConfig } from '../data/levels';
import CandyView from './Candy';

const POP_MS = 200;
const FALL_MS = 260;
const OPTIMISTIC_MS = 170;
const SWIPE_THRESHOLD = 16;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function swapVisualPositions(
  candies: GridCandy[],
  a: Position,
  b: Position
): GridCandy[] {
  return candies.map((c) => {
    if (c.row === a.row && c.col === a.col) return { ...c, row: b.row, col: b.col };
    if (c.row === b.row && c.col === b.col) return { ...c, row: a.row, col: a.col };
    return c;
  });
}

function fromFlat(list: GridCandy[], rows: number, cols: number): Grid {
  const grid: Grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const c of list) {
    grid[c.row][c.col] = { id: c.id, color: c.color, special: c.special };
  }
  return grid;
}

export interface BoardProps {
  level: LevelConfig;
  size: number;
  paused: boolean;
  onScoreGained: (amount: number, cascadeIndex: number) => void;
  onMoveSpent: () => void;
  onBusyChange?: (busy: boolean) => void;
  resetKey: number;
}

export default function Board({
  level,
  size,
  paused,
  onScoreGained,
  onMoveSpent,
  onBusyChange,
  resetKey,
}: BoardProps) {
  const { rows, cols, numColors } = level;
  const cellSize = size / cols;

  const gridRef = useRef<Grid>(generateBoard(rows, cols, numColors));
  const seenIdsRef = useRef<Set<number>>(new Set());
  const lastNewIdsRef = useRef<Set<number>>(new Set());
  const busyRef = useRef(false);

  const [renderCandies, setRenderCandies] = useState<GridCandy[]>(() =>
    toFlat(gridRef.current, rows, cols)
  );
  const [poppingIds, setPoppingIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Position | null>(null);
  const [shakeIds, setShakeIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    gridRef.current = generateBoard(rows, cols, numColors);
    seenIdsRef.current = new Set();
    setRenderCandies(toFlat(gridRef.current, rows, cols));
    setPoppingIds(new Set());
    setShakeIds(new Set());
    setSelected(null);
    busyRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, rows, cols, numColors]);

  function updateRenderCandies(list: GridCandy[]) {
    const newIds = new Set<number>();
    for (const c of list) {
      if (!seenIdsRef.current.has(c.id)) newIds.add(c.id);
    }
    newIds.forEach((id) => seenIdsRef.current.add(id));
    lastNewIdsRef.current = newIds;
    setRenderCandies(list);
  }

  async function attemptSwap(a: Position, b: Position) {
    if (busyRef.current || paused) return;
    if (!areAdjacent(a, b)) {
      setSelected(b);
      return;
    }
    busyRef.current = true;
    onBusyChange?.(true);

    const beforeIdA = gridRef.current[a.row][a.col]?.id;
    const beforeIdB = gridRef.current[b.row][b.col]?.id;

    setRenderCandies((prev) => swapVisualPositions(prev, a, b));
    await sleep(OPTIMISTIC_MS);

    const result = resolveSwap(gridRef.current, rows, cols, a, b, numColors);

    if (!result.valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setRenderCandies((prev) => swapVisualPositions(prev, a, b));
      const ids = new Set<number>();
      if (beforeIdA) ids.add(beforeIdA);
      if (beforeIdB) ids.add(beforeIdB);
      setShakeIds(ids);
      await sleep(280);
      setShakeIds(new Set());
      busyRef.current = false;
      onBusyChange?.(false);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onMoveSpent();

    for (const phase of result.phases) {
      setPoppingIds(new Set(phase.removedIds));
      onScoreGained(phase.scoreGained, phase.cascadeIndex);
      if (phase.cascadeIndex > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      await sleep(POP_MS);
      setPoppingIds(new Set());
      updateRenderCandies(phase.grid);
      gridRef.current = fromFlat(phase.grid, rows, cols);
      await sleep(FALL_MS);
    }

    if (!hasAnyValidMove(gridRef.current, rows, cols)) {
      await sleep(250);
      const reshuffled = reshuffleBoard(gridRef.current, rows, cols);
      gridRef.current = reshuffled;
      updateRenderCandies(toFlat(reshuffled, rows, cols));
      await sleep(FALL_MS);
    }

    busyRef.current = false;
    onBusyChange?.(false);
  }

  function handleCandyPress(row: number, col: number) {
    if (busyRef.current || paused) return;
    if (!selected) {
      setSelected({ row, col });
      return;
    }
    if (selected.row === row && selected.col === col) {
      setSelected(null);
      return;
    }
    if (areAdjacent(selected, { row, col })) {
      const from = selected;
      setSelected(null);
      attemptSwap(from, { row, col });
    } else {
      setSelected({ row, col });
    }
  }

  function onSwipeAttempt(row: number, col: number, dRow: number, dCol: number) {
    const target = { row: row + dRow, col: col + dCol };
    if (target.row < 0 || target.row >= rows || target.col < 0 || target.col >= cols) {
      return;
    }
    setSelected(null);
    attemptSwap({ row, col }, target);
  }

  const startX = useSharedValue<number | null>(0);
  const startY = useSharedValue<number | null>(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin((e) => {
          'worklet';
          startX.value = e.x;
          startY.value = e.y;
        })
        .onUpdate((e) => {
          'worklet';
          if (startX.value === null) return;
          const dx = e.x - (startX.value as number);
          const dy = e.y - (startY.value as number);
          if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
            const col = Math.floor((startX.value as number) / cellSize);
            const row = Math.floor((startY.value as number) / cellSize);
            let dRow = 0;
            let dCol = 0;
            if (Math.abs(dx) > Math.abs(dy)) dCol = dx > 0 ? 1 : -1;
            else dRow = dy > 0 ? 1 : -1;
            startX.value = null;
            startY.value = null;
            runOnJS(onSwipeAttempt)(row, col, dRow, dCol);
          }
        })
        .onFinalize(() => {
          'worklet';
          startX.value = 0;
          startY.value = 0;
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cellSize, rows, cols]
  );

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: size, height: size }}>
        <View style={styles.checkerboard}>
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((__, c) => (
              <View
                key={`${r}-${c}`}
                style={{
                  position: 'absolute',
                  left: c * cellSize,
                  top: r * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor:
                    (r + c) % 2 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                  borderRadius: cellSize * 0.22,
                }}
              />
            ))
          )}
        </View>
        {renderCandies.map((candy) => (
          <CandyView
            key={candy.id}
            candy={candy}
            cellSize={cellSize}
            popping={poppingIds.has(candy.id)}
            selected={!!selected && selected.row === candy.row && selected.col === candy.col}
            shake={shakeIds.has(candy.id)}
            spawnFromAbove={lastNewIdsRef.current.has(candy.id)}
            onPress={handleCandyPress}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  checkerboard: {
    ...StyleSheet.absoluteFillObject,
  },
});
