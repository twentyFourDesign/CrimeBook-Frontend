import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";

const ROUTES = {
  community: "/(citizen)/community",
  createAlert: "/(citizen)/create-alert",
} as const;

/**
 * Pure JS tab bar — no React Navigation bottom tabs (avoids RN Fabric crashes on iOS).
 */
export function CitizenTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const isCommunity =
    pathname.includes("community") && !pathname.includes("create-alert");
  const isCreateAlert = pathname.includes("create-alert");

  const go = (href: (typeof ROUTES)[keyof typeof ROUTES]) => {
    router.replace(href);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Pressable
        style={styles.tab}
        onPress={() => go(ROUTES.community)}
        accessibilityRole="button"
        accessibilityLabel="Home"
      >
        <Text style={styles.emoji}>🏠</Text>
        <Text style={[styles.label, isCommunity && styles.labelActive]}>Home</Text>
      </Pressable>

      <Pressable
        style={[styles.fab, isCreateAlert && styles.fabActive]}
        onPress={() => go(ROUTES.createAlert)}
        accessibilityRole="button"
        accessibilityLabel="Create alert"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={() => go(ROUTES.community)} accessibilityRole="button">
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.label}>Map</Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={() => go(ROUTES.community)} accessibilityRole="button">
        <Text style={styles.emoji}>📄</Text>
        <Text style={styles.label}>Feed</Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={() => go(ROUTES.community)} accessibilityRole="button">
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.label}>Profile</Text>
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
