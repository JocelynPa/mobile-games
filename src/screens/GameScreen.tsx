import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Board from '../components/Board';
import { Confetti } from '../components/Effects';
import { LevelConfig, starsForScore } from '../data/levels';
import { WORLD_THEMES } from '../theme/colors';
import { useGame } from '../hooks/useGame';
import { isSoundEnabled, playSound, toggleSound } from '../audio/sounds';

interface GameScreenProps {
  level: LevelConfig;
  onExit: () => void;
  onLevelComplete: (levelId: number, stars: number, score: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 24, 420);

const AMBIENT_BLOBS: { left: `${number}%`; size: number; top: `${number}%`; duration: number }[] = [
  { left: '6%', size: 90, top: '8%', duration: 5200 },
  { left: '70%', size: 60, top: '18%', duration: 4400 },
  { left: '20%', size: 50, top: '68%', duration: 4800 },
  { left: '78%', size: 80, top: '62%', duration: 5600 },
];

function AmbientBlob({ left, size, top, duration }: (typeof AMBIENT_BLOBS)[number]) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-14, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ambientBlob,
        { left, top, width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

function ComboPopup({ text, amount, popId }: { text: string; amount: number; popId: number }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = 0.6;
    opacity.value = 0;
    translateY.value = 0;
    scale.value = withSequence(withTiming(1.15, { duration: 140 }), withTiming(1, { duration: 100 }));
    opacity.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 500 }));
    translateY.value = withTiming(-30, { duration: 700 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popId]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.comboWrap, style]}>
      <Text style={styles.comboText}>{text}</Text>
      <Text style={styles.comboScore}>+{amount}</Text>
    </Animated.View>
  );
}

export default function GameScreen({ level, onExit, onLevelComplete }: GameScreenProps) {
  const game = useGame(level);
  const [busy, setBusy] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const completedRef = useRef(false);
  const wonSoundRef = useRef(false);
  const world = WORLD_THEMES[level.worldIndex];

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  useEffect(() => {
    if (!busy) game.settleTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  useEffect(() => {
    if (game.status === 'won' && !completedRef.current) {
      completedRef.current = true;
      const stars = starsForScore(level, game.score);
      onLevelComplete(level.id, stars, game.score);
    }
  }, [game.status]);

  useEffect(() => {
    if (game.status !== 'playing' && !wonSoundRef.current) {
      wonSoundRef.current = true;
      playSound(game.status === 'won' ? 'win' : 'lose');
    }
  }, [game.status]);

  useEffect(() => {
    completedRef.current = false;
    wonSoundRef.current = false;
  }, [level.id, game.resetKey]);

  const progressRatio = Math.min(1, game.score / level.targetScore);
  const gameOver = game.status !== 'playing';
  const stars = useMemo(() => starsForScore(level, game.score), [level, game.score]);

  function handleTap(action: () => void) {
    playSound('button');
    action();
  }

  async function handleToggleSound() {
    const next = await toggleSound();
    setSoundOn(next);
    if (next) playSound('button');
  }

  return (
    <LinearGradient colors={world.background} style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {AMBIENT_BLOBS.map((b, i) => (
          <AmbientBlob key={i} {...b} />
        ))}
      </View>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => handleTap(onExit)} hitSlop={12} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>‹</Text>
          </Pressable>
          <Text numberOfLines={1} style={styles.levelTitle}>
            {level.name}
          </Text>
          <View style={styles.headerRight}>
            <Pressable onPress={handleToggleSound} hitSlop={12} style={styles.soundButton}>
              <Text style={styles.soundButtonText}>{soundOn ? '🔊' : '🔇'}</Text>
            </Pressable>
            <View style={styles.movesBadge}>
              <Text style={styles.movesNumber}>{game.movesLeft}</Text>
              <Text style={styles.movesLabel}>coups</Text>
            </View>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: world.panel }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreText, { color: world.accent }]}>{game.score}</Text>
            <Text style={styles.targetText}>/ {level.targetScore}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressRatio * 100}%`, backgroundColor: world.accent },
              ]}
            />
          </View>
        </View>

        <View style={styles.boardArea}>
          <View style={{ width: BOARD_SIZE, height: BOARD_SIZE }}>
            <Board
              level={level}
              size={BOARD_SIZE}
              paused={gameOver}
              onScoreGained={game.onScoreGained}
              onMoveSpent={game.onMoveSpent}
              onBusyChange={setBusy}
              resetKey={game.resetKey}
            />
          </View>
          {game.combo && <ComboPopup text={game.combo.text} amount={game.combo.amount} popId={game.combo.id} />}
        </View>
      </SafeAreaView>

      {gameOver && (
        <View style={styles.overlay}>
          {game.status === 'won' && <Confetti count={32} />}
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {game.status === 'won' ? 'Niveau réussi !' : 'Plus de coups !'}
            </Text>
            {game.status === 'won' && (
              <View style={styles.modalStars}>
                {[0, 1, 2].map((i) => (
                  <Text key={i} style={[styles.modalStar, i < stars && styles.modalStarFilled]}>
                    ★
                  </Text>
                ))}
              </View>
            )}
            <Text style={styles.modalScore}>{game.score} points</Text>
            {game.status !== 'won' && (
              <Text style={styles.modalSubtitle}>Objectif : {level.targetScore}</Text>
            )}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonGhost]}
                onPress={() => handleTap(onExit)}
              >
                <Text style={styles.modalButtonGhostText}>Niveaux</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: world.accent }]}
                onPress={() => handleTap(game.reset)}
              >
                <Text style={styles.modalButtonText}>
                  {game.status === 'won' ? 'Rejouer' : 'Réessayer'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, alignItems: 'center' },
  ambientBlob: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerButtonText: { fontSize: 32, color: '#FFFFFF', fontWeight: '700' },
  levelTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  soundButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  soundButtonText: { fontSize: 18 },
  movesBadge: {
    minWidth: 56,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  movesNumber: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  movesLabel: { fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  panel: {
    width: BOARD_SIZE,
    borderRadius: 16,
    padding: 10,
    marginTop: 12,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  scoreText: { fontSize: 24, fontWeight: '900' },
  targetText: { fontSize: 14, fontWeight: '600', color: '#8B7A9B', marginLeft: 6 },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 6 },
  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  comboWrap: { position: 'absolute', top: '38%', alignSelf: 'center', alignItems: 'center' },
  comboText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  comboScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFE066',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#3A2352' },
  modalStars: { flexDirection: 'row', marginTop: 14 },
  modalStar: { fontSize: 40, color: 'rgba(0,0,0,0.15)', marginHorizontal: 4 },
  modalStarFilled: { color: '#FFC300' },
  modalScore: { fontSize: 18, fontWeight: '700', color: '#3A2352', marginTop: 16 },
  modalSubtitle: { fontSize: 14, color: '#8B7A9B', marginTop: 4 },
  modalButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 16 },
  modalButtonGhost: { backgroundColor: 'rgba(0,0,0,0.06)' },
  modalButtonGhostText: { color: '#3A2352', fontWeight: '700' },
  modalButtonText: { color: '#FFFFFF', fontWeight: '800' },
});
