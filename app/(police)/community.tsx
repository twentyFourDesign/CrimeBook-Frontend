import { View, Text, StyleSheet, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PoliceShell } from "../../src/components/police/PoliceShell";

export default function PoliceFeedScreen() {
  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Feed</Text>
        <Text style={styles.subtitle}>Community alerts and public incidents (police view).</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No live feed wired yet</Text>
          <Text style={styles.cardBody}>This tab mirrors the citizen Feed layout — connect your API when ready.</Text>
        </View>
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 6, marginBottom: 20 },
  card: {
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 8 },
  cardBody: { fontSize: 14, color: "#64748B", lineHeight: 22 },
});
