import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CANDY_THEME, WORLD_THEMES } from '../theme/colors';
import { CandyColor } from '../engine/types';
import { playSound } from '../audio/sounds';

const FLOATERS: { color: CandyColor; left: `${number}%`; size: number; delay: number; duration: number }[] = [
  { color: 'red', left: '8%', size: 34, delay: 0, duration: 4200 },
  { color: 'yellow', left: '25%', size: 26, delay: 600, duration: 3600 },
  { color: 'blue', left: '48%', size: 30, delay: 300, duration: 4600 },
  { color: 'purple', left: '68%', size: 24, delay: 900, duration: 3900 },
  { color: 'green', left: '85%', size: 30, delay: 200, duration: 4300 },
  { color: 'orange', left: '58%', size: 20, delay: 1200, duration: 3400 },
];

function Floater({ color, left, size, delay, duration }: (typeof FLOATERS)[number]) {
  const translateY = useSharedValue(-60);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(760, { duration, easing: Easing.linear }), -1, false)
    );
    rotate.value = withRepeat(withTiming(360, { duration: duration * 1.4, easing: Easing.linear }), -1, false);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
  }));

  const theme = CANDY_THEME[color];

  return (
    <Animated.View style={[styles.floater, { left, width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

interface HomeScreenProps {
  onPlay: () => void;
}

export default function HomeScreen({ onPlay }: HomeScreenProps) {
  const titleScale = useSharedValue(0.85);

  useEffect(() => {
    titleScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.97, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const theme = WORLD_THEMES[0];

  return (
    <LinearGradient colors={theme.background} style={styles.root}>
      <View style={styles.floaterLayer} pointerEvents="none">
        {FLOATERS.map((f, i) => (
          <Floater key={i} {...f} />
        ))}
      </View>
      <SafeAreaView style={styles.content}>
        <View style={styles.spacer} />
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>Candy Blast</Text>
          <Text style={styles.subtitle}>Sucré. Explosif. Addictif.</Text>
        </Animated.View>
        <View style={styles.spacer} />
        <Pressable
          style={styles.playButton}
          onPress={() => {
            playSound('button');
            onPlay();
          }}
        >
          <LinearGradient
            colors={['#FF9AD5', '#FF4D9D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.playText}>JOUER</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  floaterLayer: { ...StyleSheet.absoluteFillObject },
  floater: {
    position: 'absolute',
    top: -60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spacer: { flex: 1 },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(150,30,110,0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  playButton: {
    marginBottom: 48,
    width: 220,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B5006B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  playText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
