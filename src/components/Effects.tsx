import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { CANDY_THEME } from '../theme/colors';

const CONFETTI_COLORS = Object.values(CANDY_THEME).map((t) => t.glow);

const PARTICLE_COUNT = 6;

interface DotProps {
  index: number;
  progress: SharedValue<number>;
  color: string;
}

function Dot({ index, progress, color }: DotProps) {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2 + (index % 2 === 0 ? 0.25 : -0.25);
  const distance = 22 + (index % 3) * 9;

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const dist = distance * p;
    return {
      transform: [
        { translateX: Math.cos(angle) * dist },
        { translateY: Math.sin(angle) * dist },
        { scale: 1 - p * 0.65 },
      ],
      opacity: 1 - p,
    };
  });

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

export interface BurstSpec {
  id: number;
  x: number;
  y: number;
  color: string;
}

export function Burst({ x, y, color, onDone }: BurstSpec & { onDone: () => void }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={[styles.burstOrigin, { left: x, top: y }]}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Dot key={i} index={i} progress={progress} color={color} />
      ))}
    </View>
  );
}

export interface RingSpec {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export function RingBurst({ x, y, size, color, onDone }: RingSpec & { onDone: () => void }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const scale = 0.4 + p * 1.6;
    return {
      opacity: 1 - p,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

interface ConfettiPieceSpec {
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotationStart: number;
  fallDistance: number;
}

function ConfettiPiece({ left, color, delay, duration, rotationStart, fallDistance }: ConfettiPieceSpec) {
  const translateY = useSharedValue(-24);
  const rotate = useSharedValue(rotationStart);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 120 }));
    translateY.value = withDelay(delay, withTiming(fallDistance, { duration, easing: Easing.in(Easing.quad) }));
    rotate.value = withDelay(delay, withTiming(rotationStart + 380, { duration }));
    opacity.value = withDelay(delay + duration * 0.55, withTiming(0, { duration: duration * 0.45 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.confettiPiece, { left: `${left}%`, backgroundColor: color }, style]}
    />
  );
}

export function Confetti({ count = 28 }: { count?: number }) {
  const pieces = useMemo<ConfettiPieceSpec[]>(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        left: Math.random() * 96,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 350,
        duration: 1300 + Math.random() * 700,
        rotationStart: Math.random() * 360,
        fallDistance: 240 + Math.random() * 160,
      })),
    [count]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  burstOrigin: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  dot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    left: -3.5,
    top: -3.5,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 13,
    borderRadius: 2,
  },
});
