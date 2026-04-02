import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useSegments } from "expo-router";
import { useReportDraft } from "../../report/ReportDraftContext";

const ROUTE_COMMUNITY = "/(citizen)/community";
const ROUTE_PROFILE = "/(citizen)/profile";
const ROUTE_REPORT_START = "/(citizen)/report-step1";

/**
 * Pure JS tab bar — uses `useSegments` so active state works reliably across Expo Router builds.
 */
export function CitizenTabBar() {
  const insets = useSafeAreaInsets();
  const { resetDraft } = useReportDraft();
  const segments = useSegments();
  const leaf = String(segments[segments.length - 1] ?? "");

  const inReportFlow =
    leaf.startsWith("report-step") || leaf === "report-success" || leaf === "create-alert";

  const onCommunity = leaf === "community" && !inReportFlow;
  const onProfile = leaf === "profile" && !inReportFlow;
  const fabActive = inReportFlow;

  const goCommunity = () => {
    router.replace(ROUTE_COMMUNITY);
  };

  const goNewReport = () => {
    resetDraft();
    router.push(ROUTE_REPORT_START);
  };

  const goProfile = () => {
    router.push(ROUTE_PROFILE);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Pressable
        style={styles.tab}
        onPress={goCommunity}
        accessibilityRole="button"
        accessibilityLabel="Home"
      >
        <Text style={styles.emoji}>🏠</Text>
        <Text style={[styles.label, onCommunity && styles.labelActive]}>Home</Text>
      </Pressable>

      <Pressable
        style={[styles.fab, fabActive && styles.fabActive]}
        onPress={goNewReport}
        accessibilityRole="button"
        accessibilityLabel="New report"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={goCommunity} accessibilityRole="button">
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.label}>Map</Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={goCommunity} accessibilityRole="button">
        <Text style={styles.emoji}>📄</Text>
        <Text style={styles.label}>Feed</Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={goProfile}
        accessibilityRole="button"
        accessibilityLabel="Profile"
      >
        <Text style={styles.emoji}>👤</Text>
        <Text style={[styles.label, onProfile && styles.labelActive]}>Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 8,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    minHeight: 48,
    justifyContent: "center",
  },
  emoji: { fontSize: 20, marginBottom: 2 },
  label: { fontSize: 11, color: "#999", fontWeight: "500" },
  labelActive: { color: "#2563EB", fontWeight: "700" },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2563EB",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabActive: {
    borderWidth: 3,
    borderColor: "#93C5FD",
  },
  fabText: { fontSize: 28, color: "#fff", fontWeight: "300", lineHeight: 32 },
});
