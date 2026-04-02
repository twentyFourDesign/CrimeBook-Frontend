import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, usePathname } from "expo-router";

/** Legacy bar — prefer `CitizenTabBar`. Routes kept in sync with main citizen navigation. */
const tabs = [
  { label: "Home", icon: "🏠", route: "/(citizen)/home" },
  { label: "Map", icon: "🗺️", route: "/(citizen)/map" },
  { label: "", icon: "+", route: "/(citizen)/report-step1", isFab: true },
  { label: "Feed", icon: "📄", route: "/(citizen)/community" },
  { label: "Profile", icon: "👤", route: "/(citizen)/profile" },
];

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map((tab, i) => {
        const isActive = pathname.includes(tab.route.replace("/(citizen)/", "").split("/")[0] ?? "");

        if (tab.isFab) {
          return (
            <TouchableOpacity key={i} style={styles.fab} onPress={() => router.push(tab.route as any)}>
              <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={i} style={styles.tab} onPress={() => router.push(tab.route as any)}>
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingBottom: 24,
    paddingTop: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  tab: { alignItems: "center", flex: 1, paddingVertical: 4 },
  icon: { fontSize: 20, marginBottom: 2 },
  label: { fontSize: 11, color: "#999", fontWeight: "500" },
  activeLabel: { color: "#2563EB", fontWeight: "700" },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabIcon: { fontSize: 28, color: "#fff", fontWeight: "300", lineHeight: 32 },
});
