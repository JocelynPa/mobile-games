import {
  ALL_COLORS,
  Candy,
  CandyColor,
  CascadePhase,
  Grid,
  GridCandy,
  Position,
  SpecialKind,
  SwapResult,
} from './types';

const BASE_POINTS = 10;
const SPECIAL_BONUS = 45;

let idCounter = 1;
function nextId(): number {
  return idCounter++;
}

function key(r: number, c: number): string {
  return `${r},${c}`;
}

function parseKey(k: string): Position {
  const [row, col] = k.split(',').map(Number);
  return { row, col };
}

export function randomColor(numColors: number): CandyColor {
  return ALL_COLORS[Math.floor(Math.random() * numColors)];
}

function newCandy(color: CandyColor, special: SpecialKind = 'none'): Candy {
  return { id: nextId(), color, special };
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function toFlat(grid: Grid, rows: number, cols: number): GridCandy[] {
  const out: GridCandy[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell) out.push({ ...cell, row: r, col: c });
    }
  }
  return out;
}

function createsImmediateMatch(
  grid: Grid,
  r: number,
  c: number,
  color: CandyColor
): boolean {
  if (c >= 2 && grid[r][c - 1]?.color === color && grid[r][c - 2]?.color === color) {
    return true;
  }
  if (r >= 2 && grid[r - 1][c]?.color === color && grid[r - 2][c]?.color === color) {
    return true;
  }
  return false;
}

export function generateBoard(
  rows: number,
  cols: number,
  numColors: number
): Grid {
  let grid: Grid;
  let attempt = 0;
  do {
    grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let color: CandyColor;
        let tries = 0;
        do {
          color = randomColor(numColors);
          tries++;
        } while (tries < 30 && createsImmediateMatch(grid, r, c, color));
        grid[r][c] = newCandy(color);
      }
    }
    attempt++;
  } while (attempt < 20 && !hasAnyValidMove(grid, rows, cols));
  return grid;
}

interface Run {
  cells: Position[];
  color: CandyColor;
  dir: 'h' | 'v';
}

function findRuns(grid: Grid, rows: number, cols: number): Run[] {
  const runs: Run[] = [];

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const color = grid[r][c]?.color;
      if (!color) {
        c++;
        continue;
      }
      const start = c;
      while (c < cols && grid[r][c]?.color === color) c++;
      const len = c - start;
      if (len >= 3) {
        const cells: Position[] = [];
        for (let cc = start; cc < c; cc++) cells.push({ row: r, col: cc });
        runs.push({ cells, color, dir: 'h' });
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const color = grid[r][c]?.color;
      if (!color) {
        r++;
        continue;
      }
      const start = r;
      while (r < rows && grid[r][c]?.color === color) r++;
      const len = r - start;
      if (len >= 3) {
        const cells: Position[] = [];
        for (let rr = start; rr < r; rr++) cells.push({ row: rr, col: c });
        runs.push({ cells, color, dir: 'v' });
      }
    }
  }

  return runs;
}

interface MatchPlan {
  removeCells: Set<string>;
  spawns: Map<string, { color: CandyColor; kind: SpecialKind }>;
}

function planMatchResolution(
  grid: Grid,
  rows: number,
  cols: number,
  swapPositions?: [Position, Position]
): MatchPlan | null {
  const runs = findRuns(grid, rows, cols);
  if (runs.length === 0) return null;

  const parent = runs.map((_, i) => i);
  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }
  function union(a: number, b: number) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  const cellRunIndices = new Map<string, number[]>();
  runs.forEach((run, i) => {
    for (const cell of run.cells) {
      const k = key(cell.row, cell.col);
      const arr = cellRunIndices.get(k) ?? [];
      arr.push(i);
      cellRunIndices.set(k, arr);
    }
  });
  for (const indices of cellRunIndices.values()) {
    if (indices.length > 1) {
      for (let i = 1; i < indices.length; i++) union(indices[0], indices[i]);
    }
  }

  const groups = new Map<number, number[]>();
  runs.forEach((_, i) => {
    const root = find(i);
    const arr = groups.get(root) ?? [];
    arr.push(i);
    groups.set(root, arr);
  });

  const removeCells = new Set<string>();
  const spawns = new Map<string, { color: CandyColor; kind: SpecialKind }>();

  for (const runIndices of groups.values()) {
    const groupCells = new Map<string, Position>();
    let hasH = false;
    let hasV = false;
    let longest = runIndices[0];
    for (const idx of runIndices) {
      const run = runs[idx];
      if (run.dir === 'h') hasH = true;
      else hasV = true;
      if (run.cells.length > runs[longest].cells.length) longest = idx;
      for (const cell of run.cells) groupCells.set(key(cell.row, cell.col), cell);
    }
    const color = runs[runIndices[0]].color;
    const isCross = hasH && hasV;
    const longestRun = runs[longest];

    let spawnPos: Position | null = null;
    if (swapPositions) {
      for (const p of swapPositions) {
        if (groupCells.has(key(p.row, p.col))) {
          spawnPos = p;
          break;
        }
      }
    }
    if (!spawnPos) {
      if (isCross) {
        for (const k of groupCells.keys()) {
          if ((cellRunIndices.get(k) ?? []).length > 1) {
            spawnPos = parseKey(k);
            break;
          }
        }
      } else {
        spawnPos = longestRun.cells[Math.floor(longestRun.cells.length / 2)];
      }
    }

    let kind: SpecialKind = 'none';
    if (isCross) kind = 'wrapped';
    else if (longestRun.cells.length >= 5) kind = 'bomb';
    else if (longestRun.cells.length === 4) {
      kind = longestRun.dir === 'h' ? 'stripedH' : 'stripedV';
    }

    const spawnKey = spawnPos ? key(spawnPos.row, spawnPos.col) : null;
    for (const k of groupCells.keys()) {
      if (kind !== 'none' && k === spawnKey) continue;
      removeCells.add(k);
    }
    if (kind !== 'none' && spawnKey) {
      spawns.set(spawnKey, { color, kind });
    }
  }

  return { removeCells, spawns };
}

function blastCellsFor(
  candy: Candy,
  r: number,
  c: number,
  rows: number,
  cols: number,
  grid: Grid
): string[] {
  const cells: string[] = [];
  switch (candy.special) {
    case 'stripedH':
      for (let cc = 0; cc < cols; cc++) cells.push(key(r, cc));
      break;
    case 'stripedV':
      for (let rr = 0; rr < rows; rr++) cells.push(key(rr, c));
      break;
    case 'wrapped':
      for (let rr = r - 1; rr <= r + 1; rr++) {
        for (let cc = c - 1; cc <= c + 1; cc++) {
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) cells.push(key(rr, cc));
        }
      }
      break;
    case 'bomb':
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          if (grid[rr][cc]?.color === candy.color) cells.push(key(rr, cc));
        }
      }
      break;
    default:
      break;
  }
  return cells;
}

function expandBlast(
  grid: Grid,
  rows: number,
  cols: number,
  seed: Set<string>
): Set<string> {
  const visited = new Set(seed);
  const queue = [...seed];
  while (queue.length) {
    const k = queue.shift()!;
    const { row, col } = parseKey(k);
    const candy = grid[row][col];
    if (!candy || candy.special === 'none') continue;
    for (const bk of blastCellsFor(candy, row, col, rows, cols, grid)) {
      if (!visited.has(bk)) {
        visited.add(bk);
        queue.push(bk);
      }
    }
  }
  return visited;
}

function applyGravityAndRefill(
  grid: Grid,
  rows: number,
  cols: number,
  numColors: number
) {
  for (let c = 0; c < cols; c++) {
    const stack: Candy[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (grid[r][c]) stack.push(grid[r][c] as Candy);
    }
    let idx = 0;
    for (let r = rows - 1; r >= 0; r--) {
      if (idx < stack.length) {
        grid[r][c] = stack[idx];
        idx++;
      } else {
        grid[r][c] = newCandy(randomColor(numColors));
      }
    }
  }
}

function runResolutionLoop(
  grid: Grid,
  rows: number,
  cols: number,
  numColors: number,
  firstSeed: Set<string> | null,
  swapPositions: [Position, Position] | undefined
): CascadePhase[] {
  const phases: CascadePhase[] = [];
  let current = grid;
  let cascadeIndex = 0;

  while (true) {
    let seed: Set<string>;
    let spawns: Map<string, { color: CandyColor; kind: SpecialKind }>;

    if (cascadeIndex === 0 && firstSeed) {
      seed = firstSeed;
      spawns = new Map();
    } else {
      const plan = planMatchResolution(
        current,
        rows,
        cols,
        cascadeIndex === 0 ? swapPositions : undefined
      );
      if (!plan) break;
      seed = plan.removeCells;
      spawns = plan.spawns;
    }

    const finalRemoval = expandBlast(current, rows, cols, seed);
    for (const spawnKey of [...spawns.keys()]) {
      if (finalRemoval.has(spawnKey)) spawns.delete(spawnKey);
    }

    const removedIds: number[] = [];
    for (const k of finalRemoval) {
      const { row, col } = parseKey(k);
      const candy = current[row][col];
      if (candy) removedIds.push(candy.id);
    }

    const next = cloneGrid(current);
    for (const k of finalRemoval) {
      const { row, col } = parseKey(k);
      next[row][col] = null;
    }
    for (const [k, { kind }] of spawns) {
      const { row, col } = parseKey(k);
      const existing = next[row][col];
      if (existing) existing.special = kind;
    }
    applyGravityAndRefill(next, rows, cols, numColors);

    const candiesCleared = finalRemoval.size;
    const scoreGained = Math.round(
      (candiesCleared * BASE_POINTS + spawns.size * SPECIAL_BONUS) *
        (1 + cascadeIndex * 0.5)
    );

    phases.push({
      removedIds,
      grid: toFlat(next, rows, cols),
      scoreGained,
      cascadeIndex,
      specialsCreated: spawns.size,
      candiesCleared,
    });

    current = next;
    cascadeIndex++;
  }

  return phases;
}

export function resolveSwap(
  grid: Grid,
  rows: number,
  cols: number,
  posA: Position,
  posB: Position,
  numColors: number
): SwapResult {
  const candyA = grid[posA.row][posA.col];
  const candyB = grid[posB.row][posB.col];
  if (!candyA || !candyB) return { valid: false };

  let phases: CascadePhase[];

  if (candyA.special === 'bomb' || candyB.special === 'bomb') {
    const swapped = cloneGrid(grid);
    swapped[posA.row][posA.col] = candyB;
    swapped[posB.row][posB.col] = candyA;

    let seed: Set<string>;
    if (candyA.special === 'bomb' && candyB.special === 'bomb') {
      seed = new Set<string>();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) seed.add(key(r, c));
      }
    } else {
      const bombIsA = candyA.special === 'bomb';
      const otherColor = (bombIsA ? candyB : candyA).color;
      // after swapping, the bomb candy itself ends up at the other position
      const bombPosAfterSwap = bombIsA ? posB : posA;
      seed = new Set<string>([key(bombPosAfterSwap.row, bombPosAfterSwap.col)]);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (swapped[r][c]?.color === otherColor) seed.add(key(r, c));
        }
      }
    }

    phases = runResolutionLoop(swapped, rows, cols, numColors, seed, undefined);
  } else {
    const swapped = cloneGrid(grid);
    swapped[posA.row][posA.col] = candyB;
    swapped[posB.row][posB.col] = candyA;

    const plan = planMatchResolution(swapped, rows, cols, [posA, posB]);
    if (!plan) return { valid: false };

    phases = runResolutionLoop(swapped, rows, cols, numColors, null, [posA, posB]);
  }

  const totalScore = phases.reduce((sum, p) => sum + p.scoreGained, 0);
  return { valid: true, phases, totalScore, cascadeCount: phases.length };
}

function wouldSwapMatch(
  grid: Grid,
  rows: number,
  cols: number,
  a: Position,
  b: Position
): boolean {
  const A = grid[a.row][a.col];
  const B = grid[b.row][b.col];
  if (!A || !B) return false;
  if (A.special === 'bomb' || B.special === 'bomb') return true;
  const clone = cloneGrid(grid);
  clone[a.row][a.col] = B;
  clone[b.row][b.col] = A;
  return planMatchResolution(clone, rows, cols) !== null;
}

export function hasAnyValidMove(grid: Grid, rows: number, cols: number): boolean {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols && wouldSwapMatch(grid, rows, cols, { row: r, col: c }, { row: r, col: c + 1 })) {
        return true;
      }
      if (r + 1 < rows && wouldSwapMatch(grid, rows, cols, { row: r, col: c }, { row: r + 1, col: c })) {
        return true;
      }
    }
  }
  return false;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function reshuffleBoard(
  grid: Grid,
  rows: number,
  cols: number
): Grid {
  const candies = grid.flat().filter(Boolean) as Candy[];
  let attempt = 0;
  let newGrid: Grid;
  do {
    const shuffled = shuffleArray(candies);
    newGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newGrid[r][c] = shuffled[i++];
      }
    }
    attempt++;
  } while (
    attempt < 60 &&
    (planMatchResolution(newGrid, rows, cols) !== null ||
      !hasAnyValidMove(newGrid, rows, cols))
  );
  return newGrid;
}

export function areAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr + dc === 1;
}
