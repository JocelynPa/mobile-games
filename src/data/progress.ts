import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LevelProgress {
  stars: number;
  bestScore: number;
}

export type ProgressMap = Record<number, LevelProgress>;

const STORAGE_KEY = 'candycrush.progress.v1';

export async function loadProgress(): Promise<ProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export async function saveLevelResult(
  current: ProgressMap,
  levelId: number,
  stars: number,
  score: number
): Promise<ProgressMap> {
  const prev = current[levelId];
  const next: ProgressMap = {
    ...current,
    [levelId]: {
      stars: Math.max(prev?.stars ?? 0, stars),
      bestScore: Math.max(prev?.bestScore ?? 0, score),
    },
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // best-effort persistence; ignore failures
  }
  return next;
}

export function isLevelUnlocked(progress: ProgressMap, levelId: number): boolean {
  if (levelId <= 1) return true;
  return (progress[levelId - 1]?.stars ?? 0) >= 1;
}
