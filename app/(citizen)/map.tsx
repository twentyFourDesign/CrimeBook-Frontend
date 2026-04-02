import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../src/components/citizen/CitizenShell";

/** Placeholder until react-native-maps or similar is wired. */
export default function MapScreen() {
  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <View style={styles.hero}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapLabel}>Map area</Text>
          <Text style={styles.mapHint}>Connect a map provider to show live incident pins</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Safety map</Text>
        <Text style={styles.subtitle}>
          Explore reports and alerts near you. Your location stays private until you choose to share it.
        </Text>
      </View>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 8 },
  mapPlaceholder: {
    height: 220,
    borderRadius: 16,
    backgroundColor: "#E8EEF9",
    borderWidth: 1,
    borderColor: "#C7D7F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  mapLabel: { fontSize: 16, fontWeight: "700", color: "#1E3A5F", marginBottom: 6 },
  mapHint: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 20 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748B", lineHeight: 22 },
});
