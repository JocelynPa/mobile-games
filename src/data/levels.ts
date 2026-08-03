export interface LevelConfig {
  id: number;
  name: string;
  worldIndex: number;
  rows: number;
  cols: number;
  numColors: number;
  moves: number;
  targetScore: number;
}

export const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Première Bouchée', worldIndex: 0, rows: 8, cols: 8, numColors: 4, moves: 20, targetScore: 800 },
  { id: 2, name: 'Sentier de Sucre', worldIndex: 0, rows: 8, cols: 8, numColors: 5, moves: 20, targetScore: 1200 },
  { id: 3, name: 'Fontaine de Caramel', worldIndex: 0, rows: 8, cols: 8, numColors: 5, moves: 18, targetScore: 1600 },
  { id: 4, name: 'Vague de Menthe', worldIndex: 1, rows: 8, cols: 8, numColors: 5, moves: 18, targetScore: 2000 },
  { id: 5, name: 'Cascade Glacée', worldIndex: 1, rows: 8, cols: 8, numColors: 5, moves: 17, targetScore: 2400 },
  { id: 6, name: 'Bulles Pétillantes', worldIndex: 1, rows: 8, cols: 8, numColors: 6, moves: 20, targetScore: 2800 },
  { id: 7, name: 'Verger d’Agrumes', worldIndex: 2, rows: 8, cols: 8, numColors: 6, moves: 19, targetScore: 3200 },
  { id: 8, name: 'Soleil de Miel', worldIndex: 2, rows: 8, cols: 8, numColors: 6, moves: 18, targetScore: 3700 },
  { id: 9, name: 'Tempête d’Agrumes', worldIndex: 2, rows: 8, cols: 8, numColors: 6, moves: 17, targetScore: 4200 },
  { id: 10, name: 'Ciel Étoilé', worldIndex: 3, rows: 8, cols: 8, numColors: 6, moves: 20, targetScore: 5000 },
  { id: 11, name: 'Comète Sucrée', worldIndex: 3, rows: 8, cols: 8, numColors: 6, moves: 18, targetScore: 5600 },
  { id: 12, name: 'Galaxie Gourmande', worldIndex: 3, rows: 8, cols: 8, numColors: 6, moves: 16, targetScore: 6200 },
];

export function starsForScore(level: LevelConfig, score: number): 0 | 1 | 2 | 3 {
  if (score >= level.targetScore * 1.6) return 3;
  if (score >= level.targetScore * 1.25) return 2;
  if (score >= level.targetScore) return 1;
  return 0;
}
