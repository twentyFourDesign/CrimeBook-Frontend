import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ROUTE_DASHBOARD = "/(police)/home";
const ROUTE_INCIDENTS = "/(police)/incidents";
const ROUTE_FEED = "/(police)/community";
const ROUTE_MAP = "/(police)/map";
const ROUTE_CASES = "/(police)/cases";

const ACTIVE = "#2563EB";
const INACTIVE = "#94A3B8";

export function PoliceTabBar() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const leaf = String(segments[segments.length - 1] ?? "");

  const onDashboard = leaf === "home";
  const onIncidents = leaf === "incidents";
  const onFeed = leaf === "community";
  const onMap = leaf === "map";
  const onCases = leaf === "cases";

  const goDashboard = () => router.replace(ROUTE_DASHBOARD);
  const goIncidents = () => router.replace(ROUTE_INCIDENTS);
  const goFeed = () => router.replace(ROUTE_FEED);
  const goMap = () => router.replace(ROUTE_MAP);
  const goCases = () => router.replace(ROUTE_CASES);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row}>
        <TabButton
          label="Dashboard"
          icon="home-outline"
          iconFocused="home"
          active={onDashboard}
          onPress={goDashboard}
          a11y="Dashboard"
        />
        <TabButton
          label="Incidents"
          icon="alert-circle-outline"
          iconFocused="alert-circle"
          active={onIncidents}
          onPress={goIncidents}
          a11y="Incidents"
        />
        <TabButton
          label="Map"
          icon="map-outline"
          iconFocused="map"
          active={onMap}
          onPress={goMap}
          a11y="Map"
        />

        <TabButton
          label="Feed"
          icon="newspaper-outline"
          iconFocused="newspaper"
          active={onFeed}
          onPress={goFeed}
          a11y="Feed"
        />
        <TabButton
          label="Cases"
          icon="briefcase-outline"
          iconFocused="briefcase"
          active={onCases}
          onPress={goCases}
          a11y="Cases"
        />
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  iconFocused,
  active,
  onPress,
  a11y,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconFocused: React.ComponentProps<typeof Ionicons>["name"];
  active: boolean;
  onPress: () => void;
  a11y: string;
}) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y}>
      <Ionicons name={active ? iconFocused : icon} size={22} color={color} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "relative",
    overflow: "visible",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E8ECF1",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
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
  label: { fontSize: 10, color: INACTIVE, fontWeight: "600", marginTop: 4 },
  labelActive: { color: ACTIVE },
});
