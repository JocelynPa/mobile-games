export type CandyColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple';

export const ALL_COLORS: CandyColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
];

export type SpecialKind = 'none' | 'stripedH' | 'stripedV' | 'wrapped' | 'bomb';

export interface Candy {
  id: number;
  color: CandyColor;
  special: SpecialKind;
}

/** grid[row][col], null = empty cell (mid-resolution only) */
export type Grid = (Candy | null)[][];

export interface Position {
  row: number;
  col: number;
}

export interface GridCandy extends Candy {
  row: number;
  col: number;
}

export type CascadePhase = {
  /** ids removed/consumed during this phase (for pop animation) */
  removedIds: number[];
  /** full board state after removal + gravity + refill + special spawn */
  grid: GridCandy[];
  scoreGained: number;
  cascadeIndex: number;
  specialsCreated: number;
  candiesCleared: number;
};

export type SwapResult =
  | { valid: false }
  | {
      valid: true;
      phases: CascadePhase[];
      totalScore: number;
      cascadeCount: number;
    };
