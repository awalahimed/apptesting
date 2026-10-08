import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '@/constants/theme';

const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

interface SplashScreenProps {
  mode?: 'splash' | 'loading';
  onAnimationComplete?: () => void;
}

const TEXT_STROKE_LENGTH = 500;

export function SplashScreenComponent({ mode = 'splash', onAnimationComplete }: SplashScreenProps) {
  const strokeDrawProgress = useRef(new Animated.Value(0)).current;
  const fillOpacity = useRef(new Animated.Value(0)).current;
  const dot1Bounce = useRef(new Animated.Value(0)).current;
  const dot2Bounce = useRef(new Animated.Value(0)).current;
  const dot3Bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {

    // Step 1: Draw stroke animation (0-1.5s)
    Animated.timing(strokeDrawProgress, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Step 2: Fill animation starts after stroke completes (1.5s-2.5s)
    const fillDelay = setTimeout(() => {
      Animated.timing(fillOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 1500);

    // Bouncing dots animation (continuous loop)
    if (mode === 'loading') {
      const createBounce = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: -15,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      createBounce(dot1Bounce, 0).start();
      createBounce(dot2Bounce, 150).start();
      createBounce(dot3Bounce, 300).start();
    }

    // Auto transition after all animations complete
    const timeout = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3000);

    return () => {
      clearTimeout(fillDelay);
      clearTimeout(timeout);
    };
  }, [mode]);

  const strokeDashoffset = strokeDrawProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [TEXT_STROKE_LENGTH, 0],
  });

  return (
    <View style={styles.container}>
      <Svg width="320" height="80" viewBox="0 0 320 80">
        {/* Stroke layer - draws first */}
        <AnimatedSvgText
          x="160"
          y="50"
          fontSize="36"
          fontWeight="900"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          textAnchor="middle"
          letterSpacing="3"
          strokeDasharray={TEXT_STROKE_LENGTH}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          MY TRUCK
        </AnimatedSvgText>

        {/* Fill layer - appears after stroke */}
        <AnimatedSvgText
          x="160"
          y="50"
          fontSize="36"
          fontWeight="900"
          fill="#FFFFFF"
          opacity={fillOpacity}
          textAnchor="middle"
          letterSpacing="3"
        >
          MY TRUCK
        </AnimatedSvgText>
      </Svg>

      {/* Loading dots for loading mode */}
      {mode === 'loading' && (
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingDot, { transform: [{ translateY: dot1Bounce }] }]} />
          <Animated.View style={[styles.loadingDot, { transform: [{ translateY: dot2Bounce }] }]} />
          <Animated.View style={[styles.loadingDot, { transform: [{ translateY: dot3Bounce }] }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: spacing.xxl,
    gap: spacing.sm,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});
