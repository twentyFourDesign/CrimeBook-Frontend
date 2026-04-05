import React from "react";
import { Animated, Text, StyleSheet, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../../report/ReportDraftContext";
import { useTheme } from "../../theme/ThemeContext";

const ROUTE_HOME         = "/(citizen)/home";
const ROUTE_MAP          = "/(citizen)/map";
const ROUTE_FEED         = "/(citizen)/community";
const ROUTE_PROFILE      = "/(citizen)/profile";
const ROUTE_REPORT_START = "/(citizen)/report-step1";

export function CitizenTabBar() {
  const insets = useSafeAreaInsets();
  const { resetDraft } = useReportDraft();
  const segments = useSegments();
  const { colors, animValue } = useTheme();

  const leaf = String(segments[segments.length - 1] ?? "");
  const inReportFlow = leaf.startsWith("report-step") || leaf === "report-success" || leaf === "create-alert";
  const onHome    = leaf === "home"      && !inReportFlow;
  const onMap     = leaf === "map"       && !inReportFlow;
  const onFeed    = leaf === "community" && !inReportFlow;
  const onProfile = leaf === "profile"   && !inReportFlow;
  const fabActive = inReportFlow;

  const goNewReport = () => { resetDraft(); router.push(ROUTE_REPORT_START); };

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
        <TabItem label="Home"    icon="home-outline"      iconFocused="home"       active={onHome}    onPress={() => router.replace(ROUTE_HOME)}    colors={colors} />
        <TabItem label="Map"     icon="map-outline"       iconFocused="map"        active={onMap}     onPress={() => router.replace(ROUTE_MAP)}     colors={colors} />
        <View style={styles.fabPlaceholder} />
        <TabItem label="Feed"    icon="newspaper-outline" iconFocused="newspaper"  active={onFeed}    onPress={() => router.replace(ROUTE_FEED)}    colors={colors} />
        <TabItem label="Profile" icon="person-outline"    iconFocused="person"     active={onProfile} onPress={() => router.replace(ROUTE_PROFILE)} colors={colors} />
      </View>

      <View style={styles.fabOverlay} pointerEvents="box-none">
        <Pressable
          style={[styles.fab, { backgroundColor: colors.accent, shadowColor: colors.accent }, fabActive && styles.fabActive]}
          onPress={goNewReport}
          accessibilityRole="button"
          accessibilityLabel="New report"
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
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
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6, minHeight: 48 },
  fabPlaceholder: { flex: 1, minHeight: 48 },
  fabOverlay: { position: "absolute", left: 0, right: 0, top: -15, alignItems: "center", zIndex: 30 },
  label: { fontSize: 10, fontWeight: "600", marginTop: 4 },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  fabActive: { borderWidth: 3, borderColor: "#93C5FD" },
});
