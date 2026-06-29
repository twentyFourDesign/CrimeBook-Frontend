import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, ViewStyle } from "react-native";

type LoaderSize = "small" | "medium" | "large";

const SIZE_SCALE: Record<LoaderSize, number> = {
  small: 0.45,
  medium: 0.7,
  large: 1,
};

const BAR_WIDTH = 10;
const BAR_GAP = 15;
const BAR_HEIGHT = 50;
const CONTAINER_WIDTH = 75;
const CONTAINER_HEIGHT = 100;

type Props = {
  size?: LoaderSize;
  barColor?: string;
  ballColor?: string;
  style?: ViewStyle;
};

function AnimatedBar({
  index,
  progress,
  barColor,
}: {
  index: number;
  progress: Animated.Value;
  barColor: string;
}) {
  const baseScales = [0.2, 0.4, 0.6, 0.8, 1];
  const base = baseScales[index];

  let inputRange: number[];
  let outputRange: number[];

  if (index === 0) {
    inputRange = [0, 0.4, 0.5, 0.9, 1];
    outputRange = [base, base, 1, 1, base];
  } else if (index === 1) {
    inputRange = [0, 0.4, 0.5, 0.9, 1];
    outputRange = [base, base, 0.8, 0.8, base];
  } else if (index === 2) {
    inputRange = [0, 1];
    outputRange = [base, base];
  } else if (index === 3) {
    inputRange = [0, 0.4, 0.5, 0.9, 1];
    outputRange = [base, base, 0.4, 0.4, base];
  } else {
    inputRange = [0, 0.4, 0.5, 0.9, 1];
    outputRange = [base, base, 0.2, 0.2, base];
  }

  const scaleY = progress.interpolate({
    inputRange,
    outputRange,
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          left: index * BAR_GAP,
          backgroundColor: barColor,
          transform: [
            { translateY: BAR_HEIGHT / 2 },
            { scaleY },
            { translateY: -BAR_HEIGHT / 2 },
          ],
        },
      ]}
    />
  );
}

export function CrimeBookLoader({
  size = "medium",
  barColor = "#0F172A",
  ballColor = "#2C8FFF",
  style,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [progress]);

  const ballX = progress.interpolate({
    inputRange: [0, 0.05, 0.1, 0.17, 0.2, 0.27, 0.3, 0.37, 0.4, 0.5, 0.57, 0.6, 0.67, 0.7, 0.77, 0.8, 0.87, 0.9, 1],
    outputRange: [0, 8, 15, 23, 30, 38, 45, 53, 60, 60, 53, 45, 37, 30, 22, 15, 7, 0, 0],
    extrapolate: "clamp",
  });

  const ballY = progress.interpolate({
    inputRange: [0, 0.05, 0.1, 0.17, 0.2, 0.27, 0.3, 0.37, 0.4, 0.5, 0.57, 0.6, 0.67, 0.7, 0.77, 0.8, 0.87, 0.9, 1],
    outputRange: [0, -14, -10, -24, -20, -34, -30, -44, -40, 0, -14, -10, -24, -20, -34, -30, -44, -40, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.loader, { transform: [{ scale: SIZE_SCALE[size] }] }]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <AnimatedBar key={i} index={i} progress={progress} barColor={barColor} />
        ))}
        <Animated.View
          style={[
            styles.ball,
            {
              backgroundColor: ballColor,
              transform: [{ translateX: ballX }, { translateY: ballY }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    position: "relative",
  },
  bar: {
    position: "absolute",
    bottom: 0,
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: 2,
  },
  ball: {
    position: "absolute",
    bottom: 10,
    left: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
