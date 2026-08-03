import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GridCandy } from '../engine/types';
import { CANDY_THEME } from '../theme/colors';

const PADDING = 4;

interface CandyViewProps {
  candy: GridCandy;
  cellSize: number;
  popping: boolean;
  selected: boolean;
  shake: boolean;
  spawnFromAbove: boolean;
  onPress: (row: number, col: number) => void;
}

function CandyViewBase({
  candy,
  cellSize,
  popping,
  selected,
  shake,
  spawnFromAbove,
  onPress,
}: CandyViewProps) {
  const targetX = candy.col * cellSize;
  const targetY = candy.row * cellSize;

  const translateX = useSharedValue(targetX);
  const translateY = useSharedValue(spawnFromAbove ? targetY - cellSize * 3 : targetY);
  const scale = useSharedValue(spawnFromAbove ? 1 : 0);
  const opacity = useSharedValue(1);
  const wiggle = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 140 });
    translateY.value = withSpring(targetY, { damping: 12, stiffness: 110 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    translateX.value = withTiming(targetX, { duration: 220, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(targetY, { duration: 220, easing: Easing.out(Easing.quad) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candy.row, candy.col]);

  useEffect(() => {
    if (popping) {
      scale.value = withTiming(1.25, { duration: 90 }, () => {
        scale.value = withTiming(0, { duration: 140 });
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [popping]);

  useEffect(() => {
    if (shake) {
      wiggle.value = withSequence(
        withTiming(-8, { duration: 45 }),
        withTiming(8, { duration: 45 }),
        withTiming(-6, { duration: 45 }),
        withTiming(6, { duration: 45 }),
        withTiming(0, { duration: 45 })
      );
    }
  }, [shake]);

  useEffect(() => {
    if (candy.special === 'bomb') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 500, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candy.special]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { translateX: wiggle.value },
      { scale: scale.value * pulse.value },
    ],
    opacity: opacity.value,
  }));

  const theme = CANDY_THEME[candy.color];
  const size = cellSize - PADDING * 2;
  const isStripedH = candy.special === 'stripedH';
  const isStripedV = candy.special === 'stripedV';
  const isWrapped = candy.special === 'wrapped';
  const isBomb = candy.special === 'bomb';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, { width: cellSize, height: cellSize }, style]}
    >
      <Pressable
        onPress={() => onPress(candy.row, candy.col)}
        style={[
          styles.shape,
          {
            width: size,
            height: size,
            borderRadius: isBomb ? size / 2 : size * 0.32,
          },
          selected && styles.selected,
        ]}
      >
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0.15, y: 0.1 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.shine} />
        {isWrapped && <View style={[styles.wrapRing, { borderRadius: size * 0.32 }]} />}
        {isStripedH && (
          <View style={styles.stripesH}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.stripeBarH} />
            ))}
          </View>
        )}
        {isStripedV && (
          <View style={styles.stripesV}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.stripeBarV} />
            ))}
          </View>
        )}
        <Text style={[styles.glyph, isBomb && styles.glyphBomb]}>
          {isBomb ? '✹' : theme.glyph}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shape: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  shine: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: '35%',
    height: '25%',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ rotate: '-20deg' }],
  },
  wrapRing: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderStyle: 'dashed',
  },
  stripesH: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  stripeBarH: {
    width: '90%',
    height: '14%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 4,
  },
  stripesV: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  stripeBarV: {
    height: '90%',
    width: '14%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 4,
  },
  glyph: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  glyphBomb: {
    fontSize: 22,
    color: '#FFFFFF',
  },
});

export default React.memo(CandyViewBase);
