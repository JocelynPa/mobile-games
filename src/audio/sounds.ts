import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

const SOURCES = {
  swap: require('../../assets/sfx/swap.wav'),
  invalid: require('../../assets/sfx/invalid.wav'),
  pop: require('../../assets/sfx/pop.wav'),
  cascade0: require('../../assets/sfx/cascade0.wav'),
  cascade1: require('../../assets/sfx/cascade1.wav'),
  cascade2: require('../../assets/sfx/cascade2.wav'),
  cascade3: require('../../assets/sfx/cascade3.wav'),
  cascade4: require('../../assets/sfx/cascade4.wav'),
  special: require('../../assets/sfx/special.wav'),
  bomb: require('../../assets/sfx/bomb.wav'),
  win: require('../../assets/sfx/win.wav'),
  lose: require('../../assets/sfx/lose.wav'),
  button: require('../../assets/sfx/button.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const DEFAULT_VOLUME: Partial<Record<SoundName, number>> = {
  button: 0.5,
  swap: 0.8,
  invalid: 0.7,
  win: 0.9,
  lose: 0.8,
};

const STORAGE_KEY = 'candycrush.soundEnabled';

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let enabled = true;
let ready = false;

export async function initSounds(): Promise<boolean> {
  if (ready) return enabled;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored !== null) enabled = stored === '1';
  } catch {
    // ignore, keep default
  }
  try {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
  } catch {
    // best-effort audio session config
  }
  (Object.keys(SOURCES) as SoundName[]).forEach((key) => {
    try {
      players[key] = createAudioPlayer(SOURCES[key]);
    } catch {
      // ignore individual load failures
    }
  });
  ready = true;
  return enabled;
}

export function playSound(name: SoundName, volumeOverride?: number) {
  if (!enabled) return;
  const player = players[name];
  if (!player) return;
  try {
    player.volume = volumeOverride ?? DEFAULT_VOLUME[name] ?? 1;
    player.seekTo(0);
    player.play();
  } catch {
    // ignore native playback errors (e.g. player disposed)
  }
}

export function playCascadeTone(cascadeIndex: number) {
  const clamped = Math.max(0, Math.min(4, cascadeIndex)) as 0 | 1 | 2 | 3 | 4;
  playSound(`cascade${clamped}` as SoundName);
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export async function toggleSound(): Promise<boolean> {
  enabled = !enabled;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // best-effort persistence
  }
  return enabled;
}
