import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { PoliceShell } from "../../src/components/police/PoliceShell";

export default function PoliceHome() {
  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Police dashboard</Text>
        <Text style={styles.subtitle}>Overview for your shift — use the tabs below like the citizen app.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick status</Text>
          <Text style={styles.cardBody}>No live data wired yet. Map, Feed, and + report use the same layout as citizens.</Text>
        </View>
      </ScrollView>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748B", lineHeight: 22, marginBottom: 20 },
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
