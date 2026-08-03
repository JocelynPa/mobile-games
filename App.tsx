import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import LevelSelectScreen from './src/screens/LevelSelectScreen';
import GameScreen from './src/screens/GameScreen';
import { LEVELS } from './src/data/levels';
import { loadProgress, ProgressMap, saveLevelResult } from './src/data/progress';

type Screen = { name: 'home' } | { name: 'levels' } | { name: 'game'; levelId: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  const handleLevelComplete = useCallback(
    (levelId: number, stars: number, score: number) => {
      setProgress((prev) => {
        saveLevelResult(prev, levelId, stars, score).then(setProgress);
        return prev;
      });
    },
    []
  );

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <View style={styles.flex}>
          {screen.name === 'home' && (
            <HomeScreen onPlay={() => setScreen({ name: 'levels' })} />
          )}
          {screen.name === 'levels' && (
            <LevelSelectScreen
              progress={progress}
              onSelectLevel={(levelId) => setScreen({ name: 'game', levelId })}
              onBack={() => setScreen({ name: 'home' })}
            />
          )}
          {screen.name === 'game' &&
            (() => {
              const level = LEVELS.find((l) => l.id === screen.levelId) ?? LEVELS[0];
              return (
                <GameScreen
                  key={level.id}
                  level={level}
                  onExit={() => setScreen({ name: 'levels' })}
                  onLevelComplete={handleLevelComplete}
                />
              );
            })()}
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
