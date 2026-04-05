import React from "react";
import { Animated, Text, StyleSheet, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

const ROUTE_DASHBOARD = "/(police)/home";
const ROUTE_INCIDENTS = "/(police)/incidents";
const ROUTE_FEED      = "/(police)/community";
const ROUTE_MAP       = "/(police)/map";
const ROUTE_CASES     = "/(police)/cases";

export function PoliceTabBar() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { colors, animValue } = useTheme();
  const leaf = String(segments[segments.length - 1] ?? "");

  const onDashboard = leaf === "home";
  const onIncidents = leaf === "incidents";
  const onFeed      = leaf === "community";
  const onMap       = leaf === "map";
  const onCases     = leaf === "cases";

  const animatedBarBg = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "#141414"],
  });
  const animatedBorder = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E8ECF1", "#2A2A2A"],
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        { 
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: animatedBarBg,
          borderTopColor: animatedBorder,
        },
      ]}
    >
      <View style={styles.row}>
        <TabItem label="Home"      icon="home-outline"         iconFocused="home"            active={onDashboard} onPress={() => router.replace(ROUTE_DASHBOARD)} colors={colors} />
        <TabItem label="Incidents" icon="alert-circle-outline" iconFocused="alert-circle"    active={onIncidents} onPress={() => router.replace(ROUTE_INCIDENTS)} colors={colors} />
        <TabItem label="Map"       icon="map-outline"          iconFocused="map"             active={onMap}       onPress={() => router.replace(ROUTE_MAP)}       colors={colors} />
        <TabItem label="Feed"      icon="newspaper-outline"    iconFocused="newspaper"       active={onFeed}      onPress={() => router.replace(ROUTE_FEED)}      colors={colors} />
        <TabItem label="Cases"     icon="briefcase-outline"    iconFocused="briefcase"       active={onCases}     onPress={() => router.replace(ROUTE_CASES)}     colors={colors} />
      </View>
    </Animated.View>
  );
}

function TabItem({
  label, icon, iconFocused, active, onPress, colors,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconFocused: React.ComponentProps<typeof Ionicons>["name"];
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const color = active ? colors.tabActive : colors.tabInactive;
  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={active ? iconFocused : icon} size={22} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "relative",
    overflow: "visible",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
    zIndex: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    minHeight: 52,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    minHeight: 48,
  },
  label: { fontSize: 10, fontWeight: "600", marginTop: 4 },
});
