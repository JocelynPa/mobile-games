import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LEVELS } from '../data/levels';
import { isLevelUnlocked, ProgressMap } from '../data/progress';
import { WORLD_THEMES } from '../theme/colors';
import { playSound } from '../audio/sounds';

interface LevelSelectScreenProps {
  progress: ProgressMap;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

function Stars({ count }: { count: number }) {
  return (
    <View style={styles.starsRow}>
      {[0, 1, 2].map((i) => (
        <Text key={i} style={[styles.star, i < count && styles.starFilled]}>
          ★
        </Text>
      ))}
    </View>
  );
}

export default function LevelSelectScreen({
  progress,
  onSelectLevel,
  onBack,
}: LevelSelectScreenProps) {
  return (
    <LinearGradient colors={WORLD_THEMES[3].background} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              playSound('button');
              onBack();
            }}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Niveaux</Text>
          <View style={styles.backButton} />
        </View>
        <ScrollView contentContainerStyle={styles.grid}>
          {LEVELS.map((level) => {
            const unlocked = isLevelUnlocked(progress, level.id);
            const stars = progress[level.id]?.stars ?? 0;
            const world = WORLD_THEMES[level.worldIndex];
            return (
              <Pressable
                key={level.id}
                disabled={!unlocked}
                onPress={() => {
                  playSound('button');
                  onSelectLevel(level.id);
                }}
                style={[styles.card, { backgroundColor: world.panel }, !unlocked && styles.cardLocked]}
              >
                <Text style={styles.levelNumber}>{level.id}</Text>
                <Text numberOfLines={1} style={[styles.levelName, { color: world.accent }]}>
                  {level.name}
                </Text>
                {unlocked ? <Stars count={stars} /> : <Text style={styles.lockIcon}>🔒</Text>}
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const CARD_SIZE = '30%';

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 32, color: '#FFFFFF', fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  card: {
    width: CARD_SIZE,
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLocked: { opacity: 0.55 },
  levelNumber: { fontSize: 26, fontWeight: '900', color: '#3A2352' },
  levelName: { fontSize: 11, fontWeight: '700', marginTop: 2, paddingHorizontal: 6, textAlign: 'center' },
  lockIcon: { fontSize: 18, marginTop: 6 },
  starsRow: { flexDirection: 'row', marginTop: 4 },
  star: { fontSize: 14, color: 'rgba(0,0,0,0.2)', marginHorizontal: 1 },
  starFilled: { color: '#FFC300' },
});
