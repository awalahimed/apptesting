import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

interface AnimatedTruckProps {
  size?: number;
  color?: string;
}

export function AnimatedTruck({ size = 200, color = '#FFFFFF' }: AnimatedTruckProps) {
  const drawProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(drawProgress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 200 120">
      <G>
        {/* Truck Bed/Container */}
        <AnimatedPath
          d="M 90 30 L 170 30 L 170 75 L 90 75 Z"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="240"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0, 0.3],
            outputRange: [240, 0],
          })}
        />

        {/* Truck Cabin */}
        <AnimatedPath
          d="M 30 50 L 30 75 L 90 75 L 90 40 L 70 40 L 60 30 L 30 30 Z"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="280"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0.2, 0.5],
            outputRange: [280, 0],
          })}
        />

        {/* Cabin Window */}
        <AnimatedPath
          d="M 35 35 L 35 48 L 55 48 L 62 35 Z"
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="100"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0.4, 0.6],
            outputRange: [100, 0],
          })}
        />

        {/* Door Line */}
        <AnimatedLine
          x1="70"
          y1="50"
          x2="70"
          y2="75"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="25"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0.5, 0.65],
            outputRange: [25, 0],
          })}
        />

        {/* Container Details */}
        <AnimatedLine
          x1="130"
          y1="30"
          x2="130"
          y2="75"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="45"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0.5, 0.7],
            outputRange: [45, 0],
          })}
        />

        {/* Front Wheel */}
        <AnimatedCircle
          cx="55"
          cy="85"
          r="12"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray="75"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0.6, 0.8],
            outputRange: [75, 0],
          })}
        />

        {/* Front Wheel Inner */}
        <AnimatedCircle
          cx="55"
          cy="85"
          r="5"
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeDasharray="31"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0.7, 0.85],
            outputRange: [31, 0],
          })}
        />

        {/* Rear Wheel */}
        <AnimatedCircle
          cx="145"
          cy="85"
          r="12"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray="75"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0.65, 0.85],
            outputRange: [75, 0],
          })}
        />

        {/* Rear Wheel Inner */}
        <AnimatedCircle
          cx="145"
          cy="85"
          r="5"
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeDasharray="31"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0.75, 0.9],
            outputRange: [31, 0],
          })}
        />

        {/* Ground Line */}
        <AnimatedLine
          x1="20"
          y1="97"
          x2="180"
          y2="97"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="160"
          strokeDashoffset={drawProgress.interpolate({
            inputRange: [0.8, 1],
            outputRange: [160, 0],
          })}
        />
      </G>
    </Svg>
  );
}
