import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

/**
 * A polished iOS-style toggle button.
 * Drop it anywhere — profile headers, settings, etc.
 */
export function ThemeToggle() {
  const { isDark, toggle, animValue } = useTheme();
  const thumbSlide = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(thumbSlide, {
      toValue: isDark ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isDark]);

  const trackBg = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E2E8F0", "#1E3A5F"],
  });

  const thumbX = thumbSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <Pressable onPress={toggle} accessibilityRole="switch" accessibilityLabel="Toggle dark mode" style={styles.hit}>
      <Animated.View style={[styles.track, { backgroundColor: trackBg }]}>
        {/* Sun icon (light) */}
        <View style={styles.iconLeft}>
          <Ionicons name="sunny" size={11} color={isDark ? "#484F58" : "#F59E0B"} />
        </View>
        {/* Moon icon (dark) */}
        <View style={styles.iconRight}>
          <Ionicons name="moon" size={11} color={isDark ? "#58A6FF" : "#CBD5E1"} />
        </View>
        {/* Thumb */}
        <Animated.View style={[styles.thumb, { transform: [{ translateX: thumbX }] }]}>
          <Ionicons name={isDark ? "moon" : "sunny"} size={12} color={isDark ? "#58A6FF" : "#F59E0B"} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const TRACK_W = 48;
const TRACK_H = 26;
const THUMB = 22;

const styles = StyleSheet.create({
  hit: { padding: 4 },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  iconLeft: { position: "absolute", left: 5 },
  iconRight: { position: "absolute", right: 5 },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    left: 0,
  },
});
