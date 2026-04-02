import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PoliceShell } from "../../src/components/police/PoliceShell";

export default function PoliceMapScreen() {
  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <View style={styles.hero}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapLabel}>Operations map</Text>
          <Text style={styles.mapHint}>Incident pins and units will appear here.</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Map</Text>
        <Text style={styles.subtitle}>Live overview for your precinct — same layout as the citizen app.</Text>
      </View>
    </PoliceShell>
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
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 8, lineHeight: 22 },
});
