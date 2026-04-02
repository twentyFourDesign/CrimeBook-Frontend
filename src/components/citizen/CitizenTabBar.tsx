import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../../report/ReportDraftContext";

const ROUTE_HOME = "/(citizen)/home";
const ROUTE_MAP = "/(citizen)/map";
const ROUTE_FEED = "/(citizen)/community";
const ROUTE_PROFILE = "/(citizen)/profile";
const ROUTE_REPORT_START = "/(citizen)/report-step1";

const ACTIVE = "#2563EB";
const INACTIVE = "#94A3B8";

export function CitizenTabBar() {
  const insets = useSafeAreaInsets();
  const { resetDraft } = useReportDraft();
  const segments = useSegments();
  const leaf = String(segments[segments.length - 1] ?? "");

  const inReportFlow =
    leaf.startsWith("report-step") || leaf === "report-success" || leaf === "create-alert";

  const onHome = leaf === "home" && !inReportFlow;
  const onMap = leaf === "map" && !inReportFlow;
  const onFeed = leaf === "community" && !inReportFlow;
  const onProfile = leaf === "profile" && !inReportFlow;
  const fabActive = inReportFlow;

  const goHome = () => router.replace(ROUTE_HOME);
  const goMap = () => router.replace(ROUTE_MAP);
  const goFeed = () => router.replace(ROUTE_FEED);
  const goProfile = () => router.replace(ROUTE_PROFILE);

  const goNewReport = () => {
    resetDraft();
    router.push(ROUTE_REPORT_START);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row}>
        <TabButton
          label="Home"
          icon="home-outline"
          iconFocused="home"
          active={onHome}
          onPress={goHome}
          a11y="Home"
        />
        <TabButton
          label="Map"
          icon="map-outline"
          iconFocused="map"
          active={onMap}
          onPress={goMap}
          a11y="Map"
        />

        {/* Keeps tab spacing; FAB is drawn in overlay below */}
        <View style={styles.fabPlaceholder} />

        <TabButton
          label="Feed"
          icon="newspaper-outline"
          iconFocused="newspaper"
          active={onFeed}
          onPress={goFeed}
          a11y="Feed"
        />
        <TabButton
          label="Profile"
          icon="person-outline"
          iconFocused="person"
          active={onProfile}
          onPress={goProfile}
          a11y="Profile"
        />
      </View>

      <View style={styles.fabOverlay} pointerEvents="box-none">
        <Pressable
          style={[styles.fab, fabActive && styles.fabActive]}
          onPress={goNewReport}
          accessibilityRole="button"
          accessibilityLabel="New report"
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
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
  fabPlaceholder: {
    flex: 1,
    minHeight: 48,
  },
  fabOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    /** Negative top pulls the + above the tab bar (Y axis). Increase magnitude to move it higher. */
    top: -15,
    alignItems: "center",
    zIndex: 30,
  },
  label: { fontSize: 10, color: INACTIVE, fontWeight: "600", marginTop: 4 },
  labelActive: { color: ACTIVE },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACTIVE,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: ACTIVE,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  fabActive: {
    borderWidth: 3,
    borderColor: "#93C5FD",
  },
});
